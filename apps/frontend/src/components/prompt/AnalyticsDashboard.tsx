'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Clock, DollarSign, Zap, TrendingUp } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  timeSeries: Array<{ date: string; count: number }>
  modelDistribution: Array<{ model: string; count: number; pct: number }>
  latencyPercentiles: { p50: number; p95: number; p99: number }
  totals: { executions: number; cost: string; avgLatencyMs: number; totalTokens: number }
}

interface Props { promptId: string }

// ── Model Colors ───────────────────────────────────────────────────────────────
const MODEL_COLORS: Record<string, string> = {
  GPT4O:             '#FF6B2B',
  GPT4:              '#FFB800',
  CLAUDE_3_5_SONNET: '#7C3AED',
  CLAUDE_3_OPUS:     '#E84040',
  GEMINI_1_5_PRO:    '#00C27C',
  MISTRAL_LARGE:     '#0EA5E9',
}

const PALETTE = ['#FF6B2B', '#FFB800', '#7C3AED', '#00C27C', '#0EA5E9', '#E84040']

function modelColor(model: string, idx: number): string {
  return MODEL_COLORS[model] ?? PALETTE[idx % PALETTE.length] ?? '#6B6B6B'
}

// ── SVG Line Chart ─────────────────────────────────────────────────────────────
function LineChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-forge-muted">
        No execution data yet
      </div>
    )
  }

  const W = 800
  const H = 160
  const PAD = 20
  const maxCount = Math.max(...data.map(d => d.count), 1)

  const points = data.map((d, i) => ({
    x: PAD + (i / Math.max(data.length - 1, 1)) * (W - 2 * PAD),
    y: H - PAD - (d.count / maxCount) * (H - 2 * PAD),
    date: d.date,
    count: d.count,
  }))

  // Build smooth path with cubic bezier
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = points[i - 1]!
    const cp1x = prev.x + (pt.x - prev.x) / 3
    const cp2x = pt.x - (pt.x - prev.x) / 3
    return `${acc} C ${cp1x} ${prev.y} ${cp2x} ${pt.y} ${pt.x} ${pt.y}`
  }, '')

  const areaD = `${pathD} L ${points[points.length - 1]!.x} ${H} L ${points[0]!.x} ${H} Z`

  // Y-axis labels
  const yLabels = [0, Math.round(maxCount / 2), maxCount]

  return (
    <div className="relative w-full" style={{ height: 192 }}>
      <svg
        viewBox={`0 0 ${W} ${H + 32}`}
        className="w-full"
        style={{ height: '100%' }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B2B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FF6B2B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines + labels */}
        {yLabels.map((val) => {
          const y = H - PAD - (val / maxCount) * (H - 2 * PAD)
          return (
            <g key={val}>
              <line
                x1={PAD}
                y1={y}
                x2={W - PAD}
                y2={y}
                stroke="#D4D4D0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={0} y={y + 4} fontSize="10" fill="#6B6B6B" textAnchor="start">
                {val}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#lineAreaGrad)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#FF6B2B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots at every 5th point */}
        {points
          .filter((_, i) => i % 5 === 0 || i === points.length - 1)
          .map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#FF6B2B" />
          ))}

        {/* X-axis labels every 5th */}
        {points
          .filter((_, i) => i % 5 === 0)
          .map((p, i) => (
            <text key={i} x={p.x} y={H + 20} textAnchor="middle" fontSize="9" fill="#6B6B6B">
              {p.date.slice(5)}
            </text>
          ))}
      </svg>
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border-2 border-forge-border bg-white p-5" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl border-2 border-forge-border bg-white p-5" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-48 animate-pulse rounded-2xl border-2 border-forge-border bg-white p-5" />
        <div className="h-48 animate-pulse rounded-2xl border-2 border-forge-border bg-white p-5" />
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ promptId }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/prompts/${promptId}/analytics`)
        if (!res.ok) throw new Error('Failed to load analytics')
        const json: AnalyticsData = await res.json()
        setData(json)
      } catch (e) {
        setError('Failed to load analytics data.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [promptId])

  if (loading) return <AnalyticsSkeleton />

  if (error || !data) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-forge-border p-10 text-center">
        <p className="text-sm text-forge-muted">{error ?? 'No analytics data available.'}</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Executions',
      value: data.totals.executions.toLocaleString(),
      icon: Zap,
      color: 'text-forge-orange',
      bg: 'bg-orange-50',
    },
    {
      label: 'Total Cost',
      value: `$${data.totals.cost}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Avg Response Time',
      value: `${data.totals.avgLatencyMs}ms`,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'Total Tokens',
      value: data.totals.totalTokens.toLocaleString(),
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  const maxLatency = Math.max(
    data.latencyPercentiles.p50,
    data.latencyPercentiles.p95,
    data.latencyPercentiles.p99,
    1,
  )

  const latencyBars = [
    { label: 'P50', value: data.latencyPercentiles.p50, color: '#00C27C' },
    { label: 'P95', value: data.latencyPercentiles.p95, color: '#FFB800' },
    { label: 'P99', value: data.latencyPercentiles.p99, color: '#E84040' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="flex flex-col gap-3 rounded-2xl border-2 border-forge-border bg-white p-5"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <div className="font-display text-xl font-black text-forge-ink">{value}</div>
              <div className="text-xs font-semibold text-forge-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Usage Over Time */}
      <div className="rounded-2xl border-2 border-forge-border bg-white p-5">
        <div className="section-label mb-4">Usage Over Time — Last 30 Days</div>
        <LineChart data={data.timeSeries} />
      </div>

      {/* Row 3: Model Distribution + Latency Percentiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Model Distribution */}
        <div className="rounded-2xl border-2 border-forge-border bg-white p-5">
          <div className="section-label mb-4">Model Distribution</div>
          {data.modelDistribution.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-forge-muted">
              No model usage data yet
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.modelDistribution.map(({ model, count, pct }, idx) => (
                <div key={model} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-forge-ink">{model.replace(/_/g, ' ')}</span>
                    <span className="text-forge-muted">
                      {count} run{count !== 1 ? 's' : ''} &bull; {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-forge-silver">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: modelColor(model, idx),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latency Percentiles */}
        <div className="rounded-2xl border-2 border-forge-border bg-white p-5">
          <div className="section-label mb-4">Latency Percentiles</div>
          {maxLatency === 1 ? (
            <div className="flex items-center justify-center py-8 text-sm text-forge-muted">
              No latency data yet
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {latencyBars.map(({ label, value, color }) => (
                <div key={label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-forge-ink">{label}</span>
                    <span style={{ color }}>{value}ms</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-forge-silver">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(value / maxLatency) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
