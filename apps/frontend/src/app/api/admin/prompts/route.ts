import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserRoleFromRequest, isModerator } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const info = getUserRoleFromRequest(request)
  if (!info) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isModerator(info.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)))
    const q = searchParams.get('q') ?? ''

    const where: Record<string, unknown> = {}

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          isPublic: true,
          isPremium: true,
          upvoteCount: true,
          createdAt: true,
          author: {
            select: {
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              upvotes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.prompt.count({ where }),
    ])

    return NextResponse.json({
      prompts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Admin prompts list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const info = getUserRoleFromRequest(request)
  if (!info) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isModerator(info.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { promptId, reason } = body as { promptId?: string; reason?: string }

    if (!promptId) {
      return NextResponse.json({ error: 'promptId is required' }, { status: 400 })
    }

    // Fetch the prompt to get the author
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { id: true, authorId: true, title: true },
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Notify the author
    try {
      const { createNotification } = await import('@/lib/notifications')
      await createNotification({
        userId: prompt.authorId,
        type: 'COMMENT',
        title: 'Prompt removed',
        message: reason || 'Your prompt has been removed by a moderator',
      })
    } catch {
      // Notification module may not exist yet — continue
      console.warn('Could not send notification for prompt removal')
    }

    // Delete the prompt
    await prisma.prompt.delete({ where: { id: promptId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Admin prompt delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
