import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { choice, explanation, scores } = body as { choice: 'A' | 'B'; explanation?: string; scores?: Record<string, number> }

    if (choice !== 'A' && choice !== 'B') {
      return NextResponse.json({ error: 'choice must be A or B' }, { status: 400 })
    }

    // Verify session exists and is active
    const session = await prisma.battleSession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 })
    }

    // Check if user already voted
    const existing = await prisma.battleVote.findUnique({
      where: { sessionId_voterId: { sessionId: id, voterId: userId } },
    })
    if (existing) {
      const existingChoice = existing.winnerId === session.promptAId ? 'A' : 'B'
      return NextResponse.json(
        { error: 'Already voted', userVote: existingChoice },
        { status: 409 }
      )
    }

    const winnerId = choice === 'A' ? session.promptAId : session.promptBId
    const loserId  = choice === 'A' ? session.promptBId : session.promptAId

    // Use a transaction: create vote + increment count atomically
    const [, updatedSession] = await prisma.$transaction([
      prisma.battleVote.create({
        data: { sessionId: id, voterId: userId, winnerId, loserId, explanation: explanation ?? undefined, scores: scores ?? undefined },
      }),
      prisma.battleSession.update({
        where: { id },
        data: { [choice === 'A' ? 'votesA' : 'votesB']: { increment: 1 } },
      }),
    ])

    const votesA = updatedSession.votesA
    const votesB = updatedSession.votesB
    const totalVotes = votesA + votesB

    // Finalize if expired
    if (new Date() > session.expiresAt) {
      const winnerPromptId = votesA >= votesB ? session.promptAId : session.promptBId
      const loserPromptId  = votesA >= votesB ? session.promptBId : session.promptAId

      await prisma.battleSession.update({
        where: { id },
        data: { status: 'completed', winnerId: winnerPromptId },
      })

      // ELO updates
      const [winnerPrompt, loserPrompt] = await Promise.all([
        prisma.prompt.findUnique({ where: { id: winnerPromptId }, select: { authorId: true } }),
        prisma.prompt.findUnique({ where: { id: loserPromptId }, select: { authorId: true } }),
      ])

      await Promise.all([
        winnerPrompt?.authorId
          ? prisma.user.update({
              where: { id: winnerPrompt.authorId },
              data: { eloRating: { increment: 16 } },
            })
          : null,
        loserPrompt?.authorId
          ? prisma.user.update({
              where: { id: loserPrompt.authorId },
              data: { eloRating: { decrement: 16 } },
            })
          : null,
      ])
    }

    return NextResponse.json({ success: true, votesA, votesB, userVote: choice, totalVotes })
  } catch (error) {
    console.error('POST /api/battle/sessions/[id]/vote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
