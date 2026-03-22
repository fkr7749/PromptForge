import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserRoleFromRequest } from '@/lib/admin'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? 'active'

    const sessions = await prisma.battleSession.findMany({
      where: { status },
      include: {
        promptA: {
          select: {
            id: true,
            title: true,
            category: true,
            upvoteCount: true,
            author: { select: { username: true, displayName: true } },
          },
        },
        promptB: {
          select: {
            id: true,
            title: true,
            category: true,
            upvoteCount: true,
            author: { select: { username: true, displayName: true } },
          },
        },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const now = Date.now()
    const enriched = sessions.map((s) => ({
      ...s,
      timeRemainingMs: Math.max(0, new Date(s.expiresAt).getTime() - now),
    }))

    const completed = await prisma.battleSession.findMany({
      where: { status: 'completed' },
      include: {
        promptA: { select: { id: true, title: true } },
        promptB: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({ sessions: enriched, completed })
  } catch (error) {
    console.error('GET /api/battle/sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const adminInfo = getUserRoleFromRequest(request)
    if (!adminInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (adminInfo.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { promptAId, promptBId, theme, durationHours } = body

    if (!promptAId || !promptBId) {
      return NextResponse.json({ error: 'promptAId and promptBId are required' }, { status: 400 })
    }

    // Auto-seed if no sessions exist
    const existingCount = await prisma.battleSession.count()
    if (existingCount === 0) {
      const topPrompts = await prisma.prompt.findMany({
        where: { isPublic: true },
        orderBy: { upvoteCount: 'desc' },
        take: 10,
        select: { id: true },
      })
      const seedExpiry = new Date(Date.now() + 48 * 3_600_000)
      const pairs = Math.min(5, Math.floor(topPrompts.length / 2))
      for (let i = 0; i < pairs; i++) {
        const a = topPrompts[i * 2]
        const b = topPrompts[i * 2 + 1]
        if (a && b && a.id !== promptAId) {
          await prisma.battleSession.create({
            data: {
              promptAId: a.id,
              promptBId: b.id,
              status: 'active',
              votesA: 0,
              votesB: 0,
              expiresAt: seedExpiry,
            },
          })
        }
      }
    }

    const expiresAt = new Date(Date.now() + (durationHours ?? 24) * 3_600_000)

    const session = await prisma.battleSession.create({
      data: {
        promptAId,
        promptBId,
        theme: theme ?? null,
        status: 'active',
        votesA: 0,
        votesB: 0,
        expiresAt,
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('POST /api/battle/sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
