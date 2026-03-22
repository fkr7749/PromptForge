import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            prompts: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Sum upvoteCounts across the user's public prompts
    const agg = await prisma.prompt.aggregate({
      where: { authorId: user.id, isPublic: true },
      _sum: { upvoteCount: true },
    })

    const totalUpvotes = agg._sum.upvoteCount ?? 0

    // Top 12 public prompts sorted by upvoteCount
    const prompts = await prisma.prompt.findMany({
      where: { authorId: user.id, isPublic: true },
      orderBy: { upvoteCount: 'desc' },
      take: 12,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        isPremium: true,
        upvoteCount: true,
        viewCount: true,
        forkCount: true,
        createdAt: true,
        _count: {
          select: { executions: true, comments: true },
        },
      },
    })

    const { _count, ...userFields } = user

    return NextResponse.json({
      user: {
        id: userFields.id,
        username: userFields.username,
        displayName: userFields.displayName,
        bio: userFields.bio,
        website: userFields.website,
        avatarUrl: userFields.avatarUrl,
        isPremium: userFields.isPremium,
        createdAt: userFields.createdAt,
      },
      stats: {
        promptsCount: _count.prompts,
        totalUpvotes,
        followers: _count.followers,
        following: _count.following,
      },
      prompts,
    })
  } catch (error) {
    console.error('GET /api/users/[username] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
