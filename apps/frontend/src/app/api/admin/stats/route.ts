import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserRoleFromRequest, isAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const info = getUserRoleFromRequest(request)
  if (!info) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isAdmin(info.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [
      totalUsers,
      totalPrompts,
      totalExecutions,
      totalComments,
      newUsersThisWeek,
      topPrompts,
      categoryDistribution,
      recentExecutions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.prompt.count(),
      prisma.promptExecution.count(),
      prisma.comment.count(),
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.prompt.findMany({
        orderBy: { upvoteCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          upvoteCount: true,
          author: { select: { username: true } },
        },
      }),
      prisma.prompt.groupBy({
        by: ['category'],
        _count: true,
      }),
      prisma.promptExecution.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          model: true,
          createdAt: true,
          success: true,
          user: { select: { username: true } },
          prompt: { select: { title: true } },
        },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalPrompts,
      totalExecutions,
      totalComments,
      newUsersThisWeek,
      topPrompts,
      categoryDistribution,
      recentExecutions,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
