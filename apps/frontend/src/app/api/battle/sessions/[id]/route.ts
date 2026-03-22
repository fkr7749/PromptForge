import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params

    let session = await prisma.battleSession.findUnique({
      where: { id },
      include: {
        promptA: {
          select: {
            id: true,
            title: true,
            category: true,
            upvoteCount: true,
            description: true,
            author: { select: { id: true, username: true, displayName: true } },
          },
        },
        promptB: {
          select: {
            id: true,
            title: true,
            category: true,
            upvoteCount: true,
            description: true,
            author: { select: { id: true, username: true, displayName: true } },
          },
        },
        votes: {
          select: {
            id: true,
            voterId: true,
            winnerId: true,
            loserId: true,
            createdAt: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Auto-complete if expired
    if (session.status === 'active' && new Date(session.expiresAt) < new Date()) {
      const winnerId =
        session.votesA >= session.votesB ? session.promptAId : session.promptBId
      session = await prisma.battleSession.update({
        where: { id },
        data: { status: 'completed', winnerId },
        include: {
          promptA: {
            select: {
              id: true,
              title: true,
              category: true,
              upvoteCount: true,
              description: true,
              author: { select: { id: true, username: true, displayName: true } },
            },
          },
          promptB: {
            select: {
              id: true,
              title: true,
              category: true,
              upvoteCount: true,
              description: true,
              author: { select: { id: true, username: true, displayName: true } },
            },
          },
          votes: {
            select: {
              id: true,
              voterId: true,
              winnerId: true,
              loserId: true,
              createdAt: true,
            },
          },
        },
      }) as typeof session
    }

    const totalVotes = session.votes.length

    // Check if the authenticated user already voted
    let userVote: 'A' | 'B' | null = null
    const userId = getUserIdFromRequest(request)
    if (userId) {
      const existingVote = session.votes.find((v) => v.voterId === userId)
      if (existingVote) {
        userVote = existingVote.winnerId === session.promptAId ? 'A' : 'B'
      }
    }

    return NextResponse.json({ session, userVote, totalVotes })
  } catch (error) {
    console.error('GET /api/battle/sessions/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
