import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
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
  if (!prompt || prompt.authorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const model = (body.model as string) || 'llama-3.3-70b-versatile'
  const versionId = body.versionId as string | undefined

  // Get prompt content
  const version = await prisma.promptVersion.findFirst({
    where: { promptId, ...(versionId ? { id: versionId } : {}) },
    orderBy: { version: 'desc' },
  })
  if (!version) return NextResponse.json({ error: 'No version found' }, { status: 404 })

  const suite = await prisma.evalSuite.findUnique({
    where: { id: suiteId, promptId },
    include: { cases: true },
  })
  if (!suite) return NextResponse.json({ error: 'Suite not found' }, { status: 404 })

  const dimensions = suite.dimensions as Array<{ name: string; weight: number; rubric: string }>
  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0) || 1

  const evalRun = await prisma.evalRun.create({
    data: {
      suiteId,
      versionId: version.id,
      model,
      overallScore: 0,
      passed: 0,
      total: suite.cases.length,
    },
  })

  const results: Record<string, unknown>[] = []
  let totalScore = 0
  let passedCount = 0

  for (const evalCase of suite.cases) {
    const caseInput = evalCase.input as Record<string, string>
    const filledContent = version.content.replace(/\{\{(\w+)\}\}/g, (_, k) => caseInput[k] ?? '')

    let output = ''
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: filledContent }],
        max_tokens: 1024,
        temperature: 0.7,
      })
      output = completion.choices[0]?.message?.content ?? ''
    } catch {
      output = '[execution failed]'
    }

    // LLM judge
    let scores: Record<string, number> = {}
    let reasoning = ''
    let passed = false

    try {
      const judgePrompt = `Output to evaluate:\n${output}\n\nExpected pattern (if any): ${evalCase.expected ?? 'None'}`
      const dimDesc = dimensions.map(d => `${d.name} (weight:${d.weight}): ${d.rubric}`).join('\n')
      const judgeCompletion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a prompt output evaluator. Score the output on these dimensions:\n${dimDesc}\n\nReturn ONLY valid JSON: {"scores": {"dimensionName": 0-10}, "reasoning": "brief", "passed": true/false}`,
          },
          { role: 'user', content: judgePrompt },
        ],
        max_tokens: 512,
        temperature: 0.1,
      })
      const raw = judgeCompletion.choices[0]?.message?.content ?? '{}'
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
      scores = parsed.scores ?? {}
      reasoning = parsed.reasoning ?? ''
      passed = parsed.passed ?? false
    } catch {
      scores = Object.fromEntries(dimensions.map(d => [d.name, 5]))
      reasoning = 'Evaluation failed'
      passed = false
    }

    const overallScore =
      dimensions.reduce((s, d) => s + (scores[d.name] ?? 5) * d.weight, 0) / totalWeight
    passed = passed || overallScore >= 6

    const result = await prisma.evalResult.create({
      data: { runId: evalRun.id, caseId: evalCase.id, output, scores, overallScore, passed, reasoning },
    })
    results.push(result as Record<string, unknown>)
    totalScore += overallScore
    if (passed) passedCount++
  }

  const finalScore = suite.cases.length > 0 ? totalScore / suite.cases.length : 0
  const updatedRun = await prisma.evalRun.update({
    where: { id: evalRun.id },
    data: { overallScore: finalScore, passed: passedCount },
    include: { results: { include: { case: true } } },
  })

  return NextResponse.json(updatedRun)
}
