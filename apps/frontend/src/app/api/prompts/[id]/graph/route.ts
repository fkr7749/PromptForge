import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id: promptId } = await ctx.params

  const [prompt, versions, forks] = await Promise.all([
    prisma.prompt.findUnique({
      where: { id: promptId },
      select: { id: true, title: true, forkedFromId: true, upvoteCount: true, currentVersionId: true, author: { select: { username: true } } },
    }),
    prisma.promptVersion.findMany({
      where: { promptId },
      select: { id: true, version: true, changelog: true, createdAt: true },
      orderBy: { version: 'asc' },
    }),
    prisma.prompt.findMany({
      where: { forkedFromId: promptId },
      select: { id: true, title: true, upvoteCount: true, author: { select: { username: true } } },
      take: 20,
    }),
  ])

  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const nodes: any[] = []
  const edges: any[] = []

  // Add current prompt node
  nodes.push({ id: promptId, label: prompt.title, type: 'prompt', upvoteCount: prompt.upvoteCount, author: prompt.author.username, isCurrent: true })

  // Add version nodes
  for (const v of versions) {
    const vNodeId = `v_${v.id}`
    nodes.push({ id: vNodeId, label: `v${v.version}`, type: 'version', changelog: v.changelog, date: v.createdAt, isCurrent: v.id === prompt.currentVersionId })
    edges.push({ source: promptId, target: vNodeId, type: 'version' })
  }

  // Add fork nodes
  for (const fork of forks) {
    nodes.push({ id: fork.id, label: fork.title, type: 'fork', upvoteCount: fork.upvoteCount, author: fork.author.username, isCurrent: false })
    edges.push({ source: promptId, target: fork.id, type: 'fork' })
  }

  // Add ancestor
  if (prompt.forkedFromId) {
    const parent = await prisma.prompt.findUnique({
      where: { id: prompt.forkedFromId },
      select: { id: true, title: true, upvoteCount: true, author: { select: { username: true } } },
    })
    if (parent) {
      nodes.push({ id: parent.id, label: parent.title, type: 'parent', upvoteCount: parent.upvoteCount, author: parent.author.username, isCurrent: false })
      edges.push({ source: parent.id, target: promptId, type: 'fork' })
    }
  }

  return NextResponse.json({ nodes, edges, promptId })
}
