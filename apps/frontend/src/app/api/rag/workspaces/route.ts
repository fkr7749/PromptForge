import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaces = await prisma.ragWorkspace.findMany({
    where: { userId },
    include: { _count: { select: { documents: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(workspaces)
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const workspace = await prisma.ragWorkspace.create({
    data: { userId, name: name.trim(), description: description?.trim() },
  })
  return NextResponse.json(workspace, { status: 201 })
}
