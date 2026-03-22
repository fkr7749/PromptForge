import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

let openaiClient: OpenAI | null = null

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openaiClient
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = getClient()
  if (!client) return null
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    })
    return response.data[0]?.embedding ?? null
  } catch (e) {
    console.error('Embedding generation failed:', e)
    return null
  }
}

export async function upsertPromptEmbedding(promptId: string, text: string): Promise<void> {
  const embedding = await generateEmbedding(text)
  if (!embedding) return
  const vectorString = '[' + embedding.join(',') + ']'
  await prisma.$executeRaw`
    INSERT INTO prompt_embeddings (id, "promptId", embedding, model, "createdAt")
    VALUES (gen_random_uuid(), ${promptId}::uuid, ${vectorString}::vector, 'text-embedding-3-small', NOW())
    ON CONFLICT ("promptId") DO UPDATE SET embedding = ${vectorString}::vector
  `
}
