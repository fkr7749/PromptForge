import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

function injectVariables(content: string, variables: Record<string, string> = {}): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`)
}

async function executeOne(
  groq: Groq,
  model: string,
  content: string,
  systemPrompt?: string,
  temperature = 0.7,
  maxTokens = 2048
) {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content })

  const start = Date.now()
  const response = await groq.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  })

  const output = response.choices[0]?.message?.content ?? ''
  const inputTokens = response.usage?.prompt_tokens ?? 0
  const outputTokens = response.usage?.completion_tokens ?? 0
  const latencyMs = Date.now() - start
  const cost = ((inputTokens + outputTokens) * 0.0001) / 1_000_000

  return { model, output, inputTokens, outputTokens, cost, latencyMs, success: true }
}

export async function POST(req: NextRequest) {
  try {
    const { content, models, systemPrompt, variables, temperature = 0.7, maxTokens = 2048 } =
      await req.json() as {
        content: string
        models: string[]
        systemPrompt?: string
        variables?: Record<string, string>
        temperature?: number
        maxTokens?: number
      }

    if (!content || !models?.length) {
      return NextResponse.json({ error: 'content and models[] are required' }, { status: 400 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
    const injected = injectVariables(content, variables)

    const results = await Promise.allSettled(
      models.map((model) =>
        executeOne(groq, model, injected, systemPrompt, temperature, maxTokens)
      )
    )

    const response = results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { model: models[i], success: false, error: r.reason instanceof Error ? r.reason.message : 'Error' }
    )

    return NextResponse.json(response)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Comparison failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
