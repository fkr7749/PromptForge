import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { Prisma } from '@promptforge/database'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status') ?? 'all'
    const sort = searchParams.get('sort') ?? 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limitRaw = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)
    const limit = Math.min(isNaN(limitRaw) ? DEFAULT_LIMIT : limitRaw, MAX_LIMIT)

    const where: Prisma.PromptWhereInput = { authorId: userId }

    // Filter by status: published = isPublic true, draft = isPublic false
    if (status === 'published') {
      where.isPublic = true
    } else if (status === 'draft') {
      where.isPublic = false
    }
    // 'all' — no isPublic filter

    let orderBy: Prisma.PromptOrderByWithRelationInput
    switch (sort) {
      case 'popular':
        orderBy = { upvoteCount: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const skip = (page - 1) * limit

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          category: true,
          isPublic: true,
          isPremium: true,
          upvoteCount: true,
          viewCount: true,
          forkCount: true,
          updatedAt: true,
          _count: {
            select: {
              executions: true,
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
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/users/me/prompts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
