export interface ModelInfo {
  id: string
  name: string
  provider: string
  contextWindow: number
  description: string
  badge: string
  color: string
  /** Cost per 1,000 input tokens in USD (approximate Groq pricing) */
  costPer1kInputTokens: number
  /** Cost per 1,000 output tokens in USD (approximate Groq pricing) */
  costPer1kOutputTokens: number
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'Meta · Groq',
    contextWindow: 128_000,
    description: 'Best all-around — fast, capable, versatile',
    badge: 'Recommended',
    color: '#FF6B2B',
    // ~$0.59/$0.79 per 1M tokens
    costPer1kInputTokens: 0.00059,
    costPer1kOutputTokens: 0.00079,
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    provider: 'Meta · Groq',
    contextWindow: 512_000,
    description: 'Latest Llama 4 — massive context, excellent reasoning',
    badge: 'Latest',
    color: '#FFB800',
    // ~$0.11/$0.34 per 1M tokens
    costPer1kInputTokens: 0.00011,
    costPer1kOutputTokens: 0.00034,
  },
  {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2',
    provider: 'Moonshot AI · Groq',
    contextWindow: 131_072,
    description: 'High throughput — great for batch prompt testing',
    badge: 'Fast',
    color: '#00C27C',
    // ~$0.14/$0.28 per 1M tokens (estimated)
    costPer1kInputTokens: 0.00014,
    costPer1kOutputTokens: 0.00028,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    provider: 'OpenAI · Groq',
    contextWindow: 128_000,
    description: 'Largest model — best for complex analysis',
    badge: 'Powerful',
    color: '#7C3AED',
    // ~$0.90/$1.20 per 1M tokens (estimated for 120B)
    costPer1kInputTokens: 0.0009,
    costPer1kOutputTokens: 0.0012,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'OpenAI · Groq',
    contextWindow: 128_000,
    description: 'Efficient and fast for quick iterations',
    badge: 'Efficient',
    color: '#0EA5E9',
    // ~$0.20/$0.40 per 1M tokens (estimated for 20B)
    costPer1kInputTokens: 0.0002,
    costPer1kOutputTokens: 0.0004,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'Meta · Groq',
    contextWindow: 128_000,
    description: 'Ultra-fast — perfect for rapid prototyping',
    badge: 'Lightning',
    color: '#E84040',
    // ~$0.05/$0.08 per 1M tokens
    costPer1kInputTokens: 0.00005,
    costPer1kOutputTokens: 0.00008,
  },
]
