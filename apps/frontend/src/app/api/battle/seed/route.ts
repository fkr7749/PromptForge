import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserRoleFromRequest } from '@/lib/admin'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const adminInfo = getUserRoleFromRequest(request)
    if (!adminInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (adminInfo.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get 10 most popular public prompts
    const prompts = await prisma.prompt.findMany({
      where: { isPublic: true },
      orderBy: { upvoteCount: 'desc' },
      take: 10,
      select: { id: true, title: true },
    })

    if (prompts.length < 2) {
      return NextResponse.json(
        { error: 'Not enough public prompts to create battle sessions' },
        { status: 400 }
      )
    }

    const expiresAt = new Date(Date.now() + 48 * 3_600_000)

    // Pair them up into 5 battles (indices 0-1, 2-3, 4-5, 6-7, 8-9)
    const sessionsToCreate: { promptA: { id: string; title: string }; promptB: { id: string; title: string } }[] = []
    const available = prompts.slice(0, Math.min(prompts.length, 10))
    const pairs = Math.min(5, Math.floor(available.length / 2))

    for (let i = 0; i < pairs; i++) {
      const promptA = available[i * 2]
      const promptB = available[i * 2 + 1]
      if (promptA && promptB) {
        sessionsToCreate.push({ promptA, promptB })
      }
    }

    const created = await Promise.all(
      sessionsToCreate.map(({ promptA, promptB }) =>
        prisma.battleSession.create({
          data: {
            promptAId: promptA.id,
            promptBId: promptB.id,
            status: 'active',
            votesA: 0,
            votesB: 0,
            expiresAt,
          },
        })
      )
    )

    return NextResponse.json({ created: created.length, sessions: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/battle/seed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
