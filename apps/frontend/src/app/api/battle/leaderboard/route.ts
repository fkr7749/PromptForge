import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CATEGORIES = [
  'CODING', 'WRITING', 'ANALYSIS', 'CREATIVITY',
  'EDUCATION', 'BUSINESS', 'RESEARCH', 'ROLEPLAY', 'OTHER',
]

export async function GET(): Promise<NextResponse> {
  try {
    // Top prompts by upvotes
    const topPrompts = await prisma.prompt.findMany({
      where: { isPublic: true },
      orderBy: [{ upvoteCount: 'desc' }],
      take: 20,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            eloRating: true,
          },
        },
        tags: {
          include: { tag: { select: { name: true, slug: true } } },
          take: 3,
        },
        _count: { select: { executions: true, forks: true } },
      },
    })

    // Top creators by ELO
    const topCreators = await prisma.user.findMany({
      take: 10,
      include: { _count: { select: { prompts: true, followers: true } } },
      orderBy: { eloRating: 'desc' },
      where: { prompts: { some: { isPublic: true } } },
    })

    // Total upvotes per user
    const upvoteAggs = await prisma.prompt.groupBy({
      by: ['authorId'],
      _sum: { upvoteCount: true },
      orderBy: { _sum: { upvoteCount: 'desc' } },
      take: 10,
    })

    const upvoteMap: Record<string, number> = {}
    for (const agg of upvoteAggs) {
      upvoteMap[agg.authorId] = agg._sum.upvoteCount ?? 0
    }

    const topCreatorsEnriched = topCreators.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      eloRating: u.eloRating,
      isPremium: u.isPremium,
      totalUpvotes: upvoteMap[u.id] ?? 0,
      _count: u._count,
    }))

    // Category champions: top prompt per category
    const champions = await Promise.all(
      CATEGORIES.map((cat) =>
        prisma.prompt.findFirst({
          where: { category: cat as any, isPublic: true },
          orderBy: { upvoteCount: 'desc' },
          include: { author: { select: { username: true, displayName: true } } },
        })
      )
    )

    const categoryChampions = CATEGORIES.map((cat, i) => ({
      category: cat,
      prompt: champions[i] ?? null,
    }))

    return NextResponse.json({ topPrompts, topCreators: topCreatorsEnriched, categoryChampions })
  } catch (error) {
    console.error('GET /api/battle/leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
