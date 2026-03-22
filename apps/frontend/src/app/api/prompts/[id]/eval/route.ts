import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { id: promptId } = await ctx.params
  const suites = await prisma.evalSuite.findMany({
    where: { promptId },
    include: { cases: true, runs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(suites)
}

export async function POST(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { id: promptId } = await ctx.params
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prompt = await prisma.prompt.findUnique({ where: { id: promptId }, select: { authorId: true } })
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (prompt.authorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, dimensions, cases } = body as {
    name: string
    dimensions: Array<{ name: string; weight: number; rubric: string }>
    cases: Array<{ input: Record<string, string>; expected?: string }>
  }

  const suite = await prisma.evalSuite.create({
    data: {
      promptId,
      name,
      dimensions,
      cases: { create: cases.map(c => ({ input: c.input, expected: c.expected })) },
    },
    include: { cases: true },
  })
  return NextResponse.json(suite, { status: 201 })
}
