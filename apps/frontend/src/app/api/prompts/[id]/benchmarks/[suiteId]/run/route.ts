import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { AVAILABLE_MODELS } from '@/lib/models'
import Groq from 'groq-sdk'

interface RouteContext { params: Promise<{ id: string; suiteId: string }> }

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { id: promptId, suiteId } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: { authorId: true, currentVersionId: true },
  })
  if (!prompt || prompt.authorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const suite = await prisma.benchmarkSuite.findUnique({ where: { id: suiteId, promptId } })
  if (!suite) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const version = await prisma.promptVersion.findFirst({
    where: { promptId },
    orderBy: { version: 'desc' },
  })
  if (!version) return NextResponse.json({ error: 'No version' }, { status: 404 })

  const cases = suite.cases as Array<{ input: Record<string, string>; expectedPattern: string }>

  // Run all models in parallel
  const modelResults = await Promise.allSettled(
    AVAILABLE_MODELS.map(async (modelInfo) => {
      const casesResults = await Promise.allSettled(
        cases.map(async (c) => {
          const filledContent = version.content.replace(/\{\{(\w+)\}\}/g, (_, k) => c.input[k] ?? '')
          const start = Date.now()
          try {
            const completion = await groq.chat.completions.create({
              model: modelInfo.id,
              messages: [{ role: 'user', content: filledContent }],
              max_tokens: 512,
              temperature: 0.7,
            })
            const output = completion.choices[0]?.message?.content ?? ''
            const latencyMs = Date.now() - start
            const inputTokens = completion.usage?.prompt_tokens ?? 0
            const outputTokens = completion.usage?.completion_tokens ?? 0
            const cost = (inputTokens * modelInfo.costPer1kInputTokens + outputTokens * modelInfo.costPer1kOutputTokens) / 1000

            // Check if output matches expected pattern
            let passed = false
            try {
              if (c.expectedPattern.startsWith('/') && c.expectedPattern.endsWith('/')) {
                const regex = new RegExp(c.expectedPattern.slice(1, -1), 'i')
                passed = regex.test(output)
              } else {
                passed = output.toLowerCase().includes(c.expectedPattern.toLowerCase())
              }
            } catch { passed = false }

            return { input: JSON.stringify(c.input), output: output.slice(0, 500), latencyMs, cost, passed }
          } catch (_e) {
            return { input: JSON.stringify(c.input), output: '', latencyMs: Date.now() - start, cost: 0, passed: false }
          }
        })
      )
      const caseResults = casesResults.map(r => r.status === 'fulfilled' ? r.value : { input: '', output: '', latencyMs: 0, cost: 0, passed: false })
      const passRate = caseResults.filter(c => c.passed).length / (caseResults.length || 1)
      const avgLatency = caseResults.reduce((s, c) => s + c.latencyMs, 0) / (caseResults.length || 1)
      const avgCost = caseResults.reduce((s, c) => s + c.cost, 0) / (caseResults.length || 1)
      return { model: modelInfo.id, modelName: modelInfo.name, passRate, avgLatency: Math.round(avgLatency), avgCost, cases: caseResults }
    })
  )

  const results = modelResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)

  const run = await prisma.benchmarkRun.create({
    data: { suiteId, versionId: version.id, results },
  })
  return NextResponse.json({ ...run, modelResults: results })
}
