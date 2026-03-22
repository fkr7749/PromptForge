import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: promptId } = await context.params

    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the prompt exists
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { id: true, upvoteCount: true },
    })
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Check if the user has already upvoted
    const existingUpvote = await prisma.upvote.findUnique({
      where: { userId_promptId: { userId, promptId } },
    })

    let upvoted: boolean
    let updatedPrompt: { upvoteCount: number }

    if (existingUpvote) {
      // Remove upvote and decrement count atomically
      ;[, updatedPrompt] = await prisma.$transaction([
        prisma.upvote.delete({
          where: { userId_promptId: { userId, promptId } },
        }),
        prisma.prompt.update({
          where: { id: promptId },
          data: { upvoteCount: { decrement: 1 } },
          select: { upvoteCount: true },
        }),
      ])
      upvoted = false
    } else {
      // Create upvote and increment count atomically
      ;[, updatedPrompt] = await prisma.$transaction([
        prisma.upvote.create({
          data: { userId, promptId },
        }),
        prisma.prompt.update({
          where: { id: promptId },
          data: { upvoteCount: { increment: 1 } },
          select: { upvoteCount: true },
        }),
      ])
      upvoted = true

      // Notify prompt author about the upvote
      const promptForNotif = await prisma.prompt.findUnique({
        where: { id: promptId },
        select: { authorId: true, title: true },
      })
      if (promptForNotif && promptForNotif.authorId !== userId) {
        createNotification({
          userId: promptForNotif.authorId,
          type: 'UPVOTE',
          title: 'New upvote',
          message: `Your prompt "${promptForNotif.title}" received an upvote`,
          data: { promptId },
        }).catch(() => {}) // fire and forget
      }
    }

    return NextResponse.json({
      upvoted,
      upvoteCount: updatedPrompt.upvoteCount,
    })
  } catch (error) {
    console.error('POST /api/prompts/[id]/upvote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
