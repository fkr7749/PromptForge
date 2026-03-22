import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totalEarnings, recentSales, topPrompts, dailyRevenue] = await Promise.all([
    // Total earnings
    prisma.purchase.aggregate({
      where: { sellerId: userId, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    // Recent 20 transactions
    prisma.purchase.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        prompt: { select: { id: true, title: true } },
      },
    }),
    // Top earning prompts
    prisma.purchase.groupBy({
      by: ['promptId'],
      where: { sellerId: userId, status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    }),
    // Daily revenue for last 30 days
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, SUM(amount) as revenue, COUNT(*) as sales
      FROM purchases
      WHERE "sellerId" = ${userId}::uuid
        AND status = 'COMPLETED'
        AND "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ])

  // Get prompt titles for top prompts
  const promptIds = topPrompts.map(p => p.promptId)
  const promptTitles = await prisma.prompt.findMany({
    where: { id: { in: promptIds } },
    select: { id: true, title: true },
  })

  const topPromptsWithTitles = topPrompts.map(p => ({
    ...p,
    title: promptTitles.find(pt => pt.id === p.promptId)?.title ?? 'Unknown',
    revenue: Number(p._sum.amount ?? 0),
    sales: p._count.id,
  }))

  return NextResponse.json({
    totalEarnings: Number(totalEarnings._sum.amount ?? 0),
    pendingPayout: 0, // Stripe Connect not yet integrated
    recentSales: recentSales.map(s => ({
      id: s.id,
      promptTitle: s.prompt.title,
      amount: Number(s.amount),
      platformFee: Number(s.platformFee),
      netEarnings: Number(s.amount) - Number(s.platformFee),
      createdAt: s.createdAt,
    })),
    topPrompts: topPromptsWithTitles,
    dailyRevenue,
  })
}
