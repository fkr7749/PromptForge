import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await prisma.ragWorkspace.findUnique({
    where: { id, userId },
    include: {
      documents: {
        include: { _count: { select: { chunks: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(workspace)
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await prisma.ragWorkspace.findUnique({ where: { id }, select: { userId: true } })
  if (!workspace || workspace.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.ragWorkspace.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
