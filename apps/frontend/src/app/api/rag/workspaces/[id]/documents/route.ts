import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

interface RouteContext { params: Promise<{ id: string }> }

function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20)
  const chunks: string[] = []
  for (const para of paragraphs) {
    if (para.length <= 500) {
      chunks.push(para.trim())
      continue
    }
    const sentences = para.split(/(?<=[.!?])\s+/)
    let current = ''
    for (const s of sentences) {
      if ((current + s).length > 500 && current) {
        chunks.push(current.trim())
        current = s
      } else {
        current += (current ? ' ' : '') + s
      }
    }
    if (current.trim()) chunks.push(current.trim())
  }
  return chunks.filter(c => c.length > 10)
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id: workspaceId } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await prisma.ragWorkspace.findUnique({ where: { id: workspaceId }, select: { userId: true } })
  if (!workspace || workspace.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const documents = await prisma.ragDocument.findMany({
    where: { workspaceId },
    include: { _count: { select: { chunks: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(documents)
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id: workspaceId } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await prisma.ragWorkspace.findUnique({ where: { id: workspaceId }, select: { userId: true } })
  if (!workspace || workspace.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, content } = await req.json()
  if (!name?.trim() || !content?.trim()) return NextResponse.json({ error: 'Name and content required' }, { status: 400 })

  const truncatedContent = (content as string).slice(0, 50000)
  const chunks = chunkText(truncatedContent)

  const document = await prisma.ragDocument.create({
    data: {
      workspaceId,
      name: name.trim(),
      content: truncatedContent,
      chunkCount: chunks.length,
      chunks: {
        create: chunks.map((c, i) => ({ content: c, chunkIndex: i })),
      },
    },
    include: { _count: { select: { chunks: true } } },
  })
  return NextResponse.json(document, { status: 201 })
}
