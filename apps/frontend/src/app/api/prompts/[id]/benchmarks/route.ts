import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { id: promptId } = await ctx.params
  const suites = await prisma.benchmarkSuite.findMany({
    where: { promptId },
    include: { runs: { orderBy: { createdAt: 'desc' }, take: 3 } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(suites)
}

export async function POST(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { id: promptId } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prompt = await prisma.prompt.findUnique({ where: { id: promptId }, select: { authorId: true } })
  if (!prompt || prompt.authorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, cases } = await req.json() as { name: string; cases: Array<{ input: Record<string, string>; expectedPattern: string }> }

  const suite = await prisma.benchmarkSuite.create({
    data: { promptId, name, cases },
  })
  return NextResponse.json(suite, { status: 201 })
}
