import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id: promptId } = await ctx.params

  // Try to get this prompt's embedding
  const embeddingRow = await prisma.$queryRaw<Array<{ embedding: string }>>`
    SELECT embedding::text FROM prompt_embeddings WHERE "promptId" = ${promptId}::uuid
  `

  const firstRow = embeddingRow[0]
  if (embeddingRow.length > 0 && firstRow?.embedding) {
    const embeddingStr = firstRow.embedding
    // Semantic similarity search
    const similar = await prisma.$queryRaw<Array<{
      id: string; title: string; description: string; category: string;
      upvoteCount: number; username: string; displayName: string; avatarUrl: string | null;
      similarity: number
    }>>`
      SELECT p.id, p.title, p.description, p.category, p."upvoteCount",
             u.username, u."displayName", u."avatarUrl",
             1 - (pe.embedding <=> ${embeddingStr}::vector) as similarity
      FROM prompt_embeddings pe
      JOIN prompts p ON p.id = pe."promptId"
      JOIN users u ON u.id = p."authorId"
      WHERE p."isPublic" = true AND p.id != ${promptId}::uuid
      ORDER BY pe.embedding <=> ${embeddingStr}::vector
      LIMIT 8
    `
    return NextResponse.json({ prompts: similar, mode: 'semantic' })
  }

  // Fallback: same category prompts
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: { category: true },
  })
  if (!prompt) return NextResponse.json({ prompts: [] })

  const fallback = await prisma.prompt.findMany({
    where: { isPublic: true, category: prompt.category, id: { not: promptId } },
    orderBy: { upvoteCount: 'desc' },
    take: 8,
    select: {
      id: true, title: true, description: true, category: true, upvoteCount: true,
      author: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  })
  return NextResponse.json({ prompts: fallback.map(p => ({ ...p, ...p.author, similarity: null })), mode: 'category' })
}
