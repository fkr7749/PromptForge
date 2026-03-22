import { NextRequest } from 'next/server'
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

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
    const messages: Groq.Chat.ChatCompletionMessageParam[] = []

    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
    messages.push({ role: 'user', content: injectVariables(content, variables) })

    const stream = await groq.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Stream error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stream failed'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
