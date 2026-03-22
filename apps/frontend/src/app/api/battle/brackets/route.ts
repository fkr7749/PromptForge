import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  // Return active bracket tournaments: group sessions by bracketId
  const sessions = await prisma.battleSession.findMany({
    where: { bracketId: { not: null } },
    include: {
      promptA: { select: { id: true, title: true, upvoteCount: true } },
      promptB: { select: { id: true, title: true, upvoteCount: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Group by bracketId
  const brackets = new Map<string, typeof sessions>()
  for (const s of sessions) {
    if (!s.bracketId) continue
    if (!brackets.has(s.bracketId)) brackets.set(s.bracketId, [])
    brackets.get(s.bracketId)!.push(s)
  }

  return NextResponse.json(
    [...brackets.entries()].map(([id, sessions]) => ({ id, sessions, matchCount: sessions.length }))
  )
}
