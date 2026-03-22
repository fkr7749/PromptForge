import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const datasets = await prisma.dataset.findMany({
    where: { userId },
    include: { _count: { select: { trainings: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(datasets)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, description, rows } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const dataset = await prisma.dataset.create({
    data: { userId, name: name.trim(), description, rows: rows ?? [], rowCount: Array.isArray(rows) ? rows.length : 0 },
  })
  return NextResponse.json(dataset, { status: 201 })
}
