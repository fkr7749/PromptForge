import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PromptCategory, Prisma } from '@promptforge/database'

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 50

// GET: list premium prompts
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl

    const categoryParam = searchParams.get('category')
    const sort = searchParams.get('sort') ?? 'popular'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limitRaw = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)
    const limit = Math.min(isNaN(limitRaw) ? DEFAULT_LIMIT : limitRaw, MAX_LIMIT)

    const where: Prisma.PromptWhereInput = {
      isPremium: true,
      price: { gt: 0 },
      isPublic: true,
    }

    // Category filter
    if (categoryParam && categoryParam in PromptCategory) {
      where.category = categoryParam as PromptCategory
    }

    // Sort order
    let orderBy: Prisma.PromptOrderByWithRelationInput
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'popular':
      default:
        orderBy = { upvoteCount: 'desc' }
        break
    }

    const skip = (page - 1) * limit

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isPremium: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              upvotes: true,
              comments: true,
              forks: true,
              executions: true,
            },
          },
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            select: {
              content: true,
            },
          },
        },
      }),
      prisma.prompt.count({ where }),
    ])

    // Shape response — truncate content preview
    const shaped = prompts.map((prompt) => {
      const { versions, ...rest } = prompt
      const preview = versions.length > 0 ? versions[0]!.content.slice(0, 200) : null
      return { ...rest, preview }
    })

    return NextResponse.json({
      prompts: shaped,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/marketplace error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
