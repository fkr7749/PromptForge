import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

type RouteContext = { params: Promise<{ id: string }> }

// ── GET /api/prompts/[id]/comments ──────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const comments = await prisma.comment.findMany({
      where: { promptId: id, parentId: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        upvotes: true,
        createdAt: true,
        author: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('GET /api/prompts/[id]/comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST /api/prompts/[id]/comments ─────────────────────────────────────────
export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    // Auth check
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify prompt exists
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Parse body
    let body: { content?: string; parentId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { content, parentId } = body

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const trimmed = content.trim()

    if (trimmed.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be 2000 characters or fewer' },
        { status: 400 },
      )
    }

    // Validate parentId if provided
    if (parentId !== undefined) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, promptId: true },
      })
      if (!parent || parent.promptId !== id) {
        return NextResponse.json(
          { error: 'Parent comment not found on this prompt' },
          { status: 404 },
        )
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: trimmed,
        promptId: id,
        authorId: userId,
        ...(parentId ? { parentId } : {}),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    })

    // Notify prompt author about the new comment
    const promptForNotif = await prisma.prompt.findUnique({
      where: { id },
      select: { authorId: true, title: true },
    })
    if (promptForNotif && promptForNotif.authorId !== userId) {
      createNotification({
        userId: promptForNotif.authorId,
        type: 'COMMENT',
        title: 'New comment',
        message: `Someone commented on "${promptForNotif.title}"`,
        data: { promptId: id, commentId: comment.id },
      }).catch(() => {})
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('POST /api/prompts/[id]/comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
