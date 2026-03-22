import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import Groq from 'groq-sdk'

interface RouteContext { params: Promise<{ id: string }> }

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dataset = await prisma.dataset.findUnique({ where: { id, userId } })
  if (!dataset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const model = (body.model as string) || 'llama-3.3-70b-versatile'

  const rows = dataset.rows as Array<Record<string, string>>
  if (rows.length === 0) return NextResponse.json({ error: 'Dataset has no rows' }, { status: 400 })

  // Sample up to 10 representative rows
  const sample = rows.length <= 10 ? rows : rows.sort(() => Math.random() - 0.5).slice(0, 10)
  const columns = Object.keys(sample[0] || {})

  const examplesText = sample.map((row, i) =>
    `Example ${i + 1}:\n${columns.map(col => `${col}: ${row[col] ?? ''}`).join('\n')}`
  ).join('\n\n')

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are an expert prompt engineer. Given sample data rows, create a generalized prompt template that captures the pattern.
Use {{variable_name}} syntax for the parts that vary between examples.
The template should work for any similar input to produce consistent outputs.
Return ONLY the prompt template text, no explanations.`,
      },
      {
        role: 'user',
        content: `Create a prompt template for this dataset. Columns: ${columns.join(', ')}\n\n${examplesText}`,
      },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  })

  const generatedPrompt = completion.choices[0]?.message?.content ?? ''

  // Extract variables from the generated prompt
  const variables = [...generatedPrompt.matchAll(/\{\{(\w+)\}\}/g)].map(m => ({
    name: m[1], description: `Variable from dataset column: ${m[1]}`, default: ''
  }))

  const trainingRun = await prisma.trainingRun.create({
    data: { datasetId: id, generatedPrompt, variables, model },
  })

  return NextResponse.json({ ...trainingRun, variables })
}
