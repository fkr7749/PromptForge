import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

function injectVariables(content: string, variables: Record<string, string> = {}): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`)
}

export async function POST(req: NextRequest) {
  try {
    const { content, model, systemPrompt, variables, temperature = 0.7, maxTokens = 2048 } =
      await req.json() as {
        content: string
        model: string
        systemPrompt?: string
        variables?: Record<string, string>
        temperature?: number
        maxTokens?: number
      }

    if (!content || !model) {
      return NextResponse.json({ error: 'content and model are required' }, { status: 400 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
    const messages: Groq.Chat.ChatCompletionMessageParam[] = []

    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
    messages.push({ role: 'user', content: injectVariables(content, variables) })

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

    return NextResponse.json({ output, inputTokens, outputTokens, cost, latencyMs, model })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Execution failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
