import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

interface RouteContext { params: Promise<{ id: string; releaseId: string }> }

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id: promptId, releaseId } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prompt = await prisma.prompt.findUnique({ where: { id: promptId }, select: { authorId: true } })
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Allow prompt owner to approve
  if (prompt.authorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { environment, notes } = await req.json()
  const updated = await prisma.promptRelease.update({
    where: { id: releaseId },
    data: {
      ...(environment ? { environment } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(environment === 'approved' || environment === 'production' ? { approvedBy: userId } : {}),
    },
  })
  return NextResponse.json(updated)
}
