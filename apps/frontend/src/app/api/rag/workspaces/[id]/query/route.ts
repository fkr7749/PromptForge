import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import Groq from 'groq-sdk'
import { Prisma } from '@promptforge/database'

interface RouteContext { params: Promise<{ id: string }> }

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id: workspaceId } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await prisma.ragWorkspace.findUnique({ where: { id: workspaceId }, select: { userId: true } })
  if (!workspace || workspace.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { query, model = 'llama-3.3-70b-versatile' } = await req.json()
  if (!query?.trim()) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  // Find relevant chunks using pg_trgm similarity
  let chunks: Array<{ content: string; documentName: string; chunkIndex: number }> = []
  try {
    chunks = await prisma.$queryRaw<typeof chunks>`
      SELECT rc.content, rc."chunkIndex", rd.name as "documentName"
      FROM rag_chunks rc
      JOIN rag_documents rd ON rd.id = rc."documentId"
      WHERE rd."workspaceId" = ${workspaceId}::uuid
        AND similarity(rc.content, ${query}) > 0.05
      ORDER BY similarity(rc.content, ${query}) DESC
      LIMIT 5
    `
  } catch {
    // Fallback: first 5 chunks from workspace
    const docs = await prisma.ragDocument.findMany({
      where: { workspaceId },
      include: { chunks: { take: 2, orderBy: { chunkIndex: 'asc' } } },
      take: 3,
    })
    chunks = docs.flatMap(d => d.chunks.map(c => ({ content: c.content, documentName: d.name, chunkIndex: c.chunkIndex })))
  }

  if (chunks.length === 0) {
    return NextResponse.json({ answer: 'No relevant content found in this workspace for your query.', citations: [], model })
  }

  const context = chunks.map((c, i) => `[${i + 1}] ${c.documentName}:\n${c.content}`).join('\n\n---\n\n')

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant. Answer questions using ONLY the provided context. If the context doesn't contain enough information, say so clearly. Cite sources using [1], [2], etc.\n\nContext:\n${context}`,
      },
      { role: 'user', content: query },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  })

  const answer = completion.choices[0]?.message?.content ?? 'No answer generated.'
  const citations = chunks.map(c => ({ documentName: c.documentName, chunkContent: c.content.slice(0, 150) + '...' }))

  return NextResponse.json({ answer, citations, model })
}
