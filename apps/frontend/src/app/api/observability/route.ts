import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { Prisma } from '@promptforge/database'

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [totals, recent, costTrend, modelStats, failures, prevWeek] = await Promise.all([
    // All-time totals
    prisma.promptExecution.aggregate({
      where: { userId },
      _count: { _all: true },
      _sum: { cost: true },
      _avg: { latencyMs: true },
    }),
    // Recent 30 days
    prisma.promptExecution.aggregate({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      _sum: { cost: true },
    }),
    // Daily cost trend (30 days) — use raw SQL for date grouping
    prisma.$queryRaw<Array<{ date: string; count: bigint; totalCost: string; avgLatency: number }>>`
      SELECT DATE("createdAt")::text as date, COUNT(*)::bigint as count,
             SUM(cost)::text as "totalCost", AVG("latencyMs") as "avgLatency"
      FROM prompt_executions
      WHERE "userId" = ${userId}::uuid AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `,
    // Model performance stats
    prisma.$queryRaw<Array<{ model: string; count: bigint; avgLatency: number; totalCost: string; successRate: number }>>`
      SELECT model, COUNT(*)::bigint as count,
             AVG("latencyMs") as "avgLatency",
             SUM(cost)::text as "totalCost",
             AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as "successRate"
      FROM prompt_executions
      WHERE "userId" = ${userId}::uuid
      GROUP BY model
      ORDER BY count DESC
    `,
    // Failure taxonomy
    prisma.$queryRaw<Array<{ errorMessage: string; count: bigint }>>`
      SELECT COALESCE("errorMessage", 'Unknown error') as "errorMessage", COUNT(*)::bigint as count
      FROM prompt_executions
      WHERE "userId" = ${userId}::uuid AND success = false
      GROUP BY "errorMessage"
      ORDER BY count DESC
      LIMIT 10
    `,
    // Previous week for drift detection
    prisma.promptExecution.aggregate({
      where: { userId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      _avg: { latencyMs: true },
      _count: { _all: true },
    }),
  ])

  const currentWeek = await prisma.promptExecution.aggregate({
    where: { userId, createdAt: { gte: sevenDaysAgo } },
    _avg: { latencyMs: true },
    _count: { _all: true },
  })

  // Drift detection: >20% latency increase
  const prevAvgLatency = prevWeek._avg.latencyMs ?? 0
  const currAvgLatency = currentWeek._avg.latencyMs ?? 0
  const latencyDrift = prevAvgLatency > 0
    ? ((currAvgLatency - prevAvgLatency) / prevAvgLatency) * 100
    : 0

  const errorRate = totals._count._all > 0
    ? ((await prisma.promptExecution.count({ where: { userId, success: false } })) / totals._count._all) * 100
    : 0

  return NextResponse.json({
    totals: {
      runs: totals._count._all,
      cost: Number(totals._sum.cost ?? 0).toFixed(4),
      avgLatency: Math.round(totals._avg.latencyMs ?? 0),
      errorRate: errorRate.toFixed(1),
    },
    costTrend: costTrend.map(d => ({
      date: d.date,
      count: Number(d.count),
      totalCost: parseFloat(d.totalCost || '0'),
      avgLatency: Math.round(d.avgLatency),
    })),
    modelStats: modelStats.map(m => ({
      model: m.model,
      count: Number(m.count),
      avgLatency: Math.round(m.avgLatency),
      totalCost: parseFloat(m.totalCost || '0'),
      successRate: Math.round(m.successRate * 100),
    })),
    failures: failures.map(f => ({ errorMessage: f.errorMessage, count: Number(f.count) })),
    drift: {
      latencyChange: Math.round(latencyDrift),
      hasAlert: latencyDrift > 20,
    },
  })
}
