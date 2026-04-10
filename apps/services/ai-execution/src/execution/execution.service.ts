import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Groq from 'groq-sdk'

// ─── Groq model IDs ────────────────────────────────────────────────────────
export type GroqModel =
  | 'llama-3.3-70b-versatile'
  | 'meta-llama/llama-4-scout-17b-16e-instruct'
  | 'moonshotai/kimi-k2-instruct'
  | 'openai/gpt-oss-120b'
  | 'openai/gpt-oss-20b'
  | 'llama-3.1-8b-instant'

export const AVAILABLE_MODELS = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'Meta (via Groq)',
    contextWindow: 128_000,
    description: 'Best all-around model — fast, capable, versatile',
    badge: 'Recommended',
    rpmLimit: 30,
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    provider: 'Meta (via Groq)',
    contextWindow: 512_000,
    description: 'Latest Llama 4 — massive context, excellent reasoning',
    badge: 'Latest',
    rpmLimit: 30,
  },
  {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2',
    provider: 'Moonshot AI (via Groq)',
    contextWindow: 131_072,
    description: 'High throughput — great for batch prompt testing',
    badge: 'Fast',
    rpmLimit: 60,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    provider: 'OpenAI (via Groq)',
    contextWindow: 128_000,
    description: 'Largest model — best for complex analysis',
    badge: 'Powerful',
    rpmLimit: 30,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'OpenAI (via Groq)',
    contextWindow: 128_000,
    description: 'Efficient and fast for quick iterations',
    badge: 'Efficient',
    rpmLimit: 30,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'Meta (via Groq)',
    contextWindow: 128_000,
    description: 'Ultra-fast — perfect for rapid prototyping',
    badge: 'Lightning',
    rpmLimit: 30,
  },
]

export interface ExecuteOptions {
  model: GroqModel
  content: string
  systemPrompt?: string
  variables?: Record<string, string>
  temperature?: number
  maxTokens?: number
}

@Injectable()
export class ExecutionService {
  private readonly groq: Groq

  constructor(private readonly config: ConfigService) {
    this.groq = new Groq({
      apiKey: config.getOrThrow<string>('GROQ_API_KEY'),
    })
  }

  // ─── Variable injection ───────────────────────────────────────────────────
  private injectVariables(content: string, variables: Record<string, string> = {}): string {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`)
  }

  // ─── Cost estimation (Groq is mostly free / very cheap) ──────────────────
  private estimateCost(inputTokens: number, outputTokens: number): number {
    // Groq free tier — approximate cost if paid
    const rate = 0.0001 // ~$0.10 per 1M tokens blended
    return ((inputTokens + outputTokens) * rate) / 1_000_000
  }

  // ─── Streaming execution ──────────────────────────────────────────────────
  async *executeStream(opts: ExecuteOptions): AsyncGenerator<string> {
    const content = this.injectVariables(opts.content, opts.variables)
    const messages: Groq.Chat.ChatCompletionMessageParam[] = []

    if (opts.systemPrompt) {
      messages.push({ role: 'system', content: opts.systemPrompt })
    }
    messages.push({ role: 'user', content })

    const stream = await this.groq.chat.completions.create({
      model: opts.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      stream: true,
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content
      if (text) yield text
    }
  }

  // ─── Sync execution ───────────────────────────────────────────────────────
  async execute(opts: ExecuteOptions): Promise<{
    output: string
    inputTokens: number
    outputTokens: number
    cost: number
    latencyMs: number
    model: string
  }> {
    const start = Date.now()
    const content = this.injectVariables(opts.content, opts.variables)
    const messages: Groq.Chat.ChatCompletionMessageParam[] = []

    if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt })
    messages.push({ role: 'user', content })

    const response = await this.groq.chat.completions.create({
      model: opts.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      stream: false,
    })

    const output = response.choices[0]?.message?.content ?? ''
    const inputTokens = response.usage?.prompt_tokens ?? Math.ceil(content.length / 4)
    const outputTokens = response.usage?.completion_tokens ?? Math.ceil(output.length / 4)
    const latencyMs = Date.now() - start
    const cost = this.estimateCost(inputTokens, outputTokens)

    return { output, inputTokens, outputTokens, cost, latencyMs, model: opts.model }
  }

  // ─── Compare multiple models ───────────────────────────────────────────────
  async compareModels(
    opts: Omit<ExecuteOptions, 'model'>,
    models: GroqModel[]
  ) {
    const results = await Promise.allSettled(
      models.map((model) => this.execute({ ...opts, model }))
    )

    return results.map((result, i) =>
      result.status === 'fulfilled'
        ? { success: true, ...result.value }
        : {
            success: false,
            model: models[i],
            error: result.reason instanceof Error ? result.reason.message : 'Error',
          }
    )
  }

  getAvailableModels() {
    return AVAILABLE_MODELS
  }
}
