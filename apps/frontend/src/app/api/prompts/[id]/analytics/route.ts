import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params

  // Verify prompt exists
  const prompt = await prisma.prompt.findUnique({ where: { id }, select: { id: true } })
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [executions, allExecutions] = await Promise.all([
    // Recent 30 days for time series
    prisma.promptExecution.findMany({
      where: { promptId: id, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, model: true, latencyMs: true, cost: true, inputTokens: true, outputTokens: true, success: true },
      orderBy: { createdAt: 'asc' },
    }),
    // All time for totals
    prisma.promptExecution.aggregate({
      where: { promptId: id },
      _count: true,
      _sum: { cost: true, inputTokens: true, outputTokens: true },
      _avg: { latencyMs: true },
    }),
  ])

  // Build daily time series (last 30 days)
  const dailyMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    dailyMap.set(d.toISOString().slice(0, 10), 0)
  }
  for (const e of executions) {
    const day = e.createdAt.toISOString().slice(0, 10)
    if (dailyMap.has(day)) dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1)
  }
  const timeSeries = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }))

  // Model distribution
  const modelMap = new Map<string, number>()
  for (const e of executions) {
    modelMap.set(e.model, (modelMap.get(e.model) ?? 0) + 1)
  }
  const modelDistribution = Array.from(modelMap.entries())
    .map(([model, count]) => ({ model, count, pct: Math.round(count / executions.length * 100) }))
    .sort((a, b) => b.count - a.count)

  // Latency percentiles
  const latencies = executions.map(e => e.latencyMs).sort((a, b) => a - b)
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0
  const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0

  return NextResponse.json({
    timeSeries,
    modelDistribution,
    latencyPercentiles: { p50, p95, p99 },
    totals: {
      executions: allExecutions._count,
      cost: Number(allExecutions._sum.cost ?? 0).toFixed(4),
      avgLatencyMs: Math.round(allExecutions._avg.latencyMs ?? 0),
      totalTokens: (allExecutions._sum.inputTokens ?? 0) + (allExecutions._sum.outputTokens ?? 0),
    },
  })
}
