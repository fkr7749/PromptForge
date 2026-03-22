'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'

interface ObservabilityData {
  totals: {
    runs: number
    cost: string
    avgLatency: number
    errorRate: string
  }
  costTrend: Array<{ date: string; count: number; totalCost: number; avgLatency: number }>
  modelStats: Array<{ model: string; count: number; avgLatency: number; totalCost: number; successRate: number }>
  failures: Array<{ errorMessage: string; count: number }>
  drift: { latencyChange: number; hasAlert: boolean }
}

function LineChart({ data, valueKey, color = '#FF6B2B' }: { data: any[]; valueKey: string; color?: string }) {
  if (data.length === 0)
    return (
      <div className="h-40 flex items-center justify-center text-gray-500">No data</div>
    )
  const values = data.map(d => d[valueKey] as number)
  const max = Math.max(...values, 0.001)
  const width = 600
  const height = 120
  const pad = 20
  const points = values.map((v, i) => [
    pad + (i / (values.length - 1 || 1)) * (width - 2 * pad),
    height - pad - (v / max) * (height - 2 * pad),
  ])
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} />
      ))}
    </svg>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#161618] border border-[#2A2A2E] rounded-xl p-6 flex flex-col gap-1">
      <span className="text-xs text-[#888890] font-bold uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-black text-[#E8E8EC]">{value}</span>
      {sub && <span className="text-xs text-[#555560]">{sub}</span>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#161618] border border-[#2A2A2E] rounded-xl p-6 animate-pulse">
      <div className="h-3 bg-[#2A2A2E] rounded w-24 mb-4" />
      <div className="h-8 bg-[#2A2A2E] rounded w-16" />
    </div>
  )
}

export default function ObservabilityPage() {
  const [data, setData] = useState<ObservabilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { accessToken } = useAuthStore()

  useEffect(() => {
    if (!accessToken) {
      setError('Please log in to view observability data')
      setLoading(false)
      return
    }
    fetch('/api/observability', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load observability data')
        return res.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [accessToken])

  const maxFailureCount = data?.failures.length ? Math.max(...data.failures.map(f => f.count)) : 1

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Observability</h1>
          <p className="text-gray-400 mt-1">
            Monitor performance, cost, and reliability across all your executions.
          </p>
        </div>

        {/* Drift Alert */}
        {data?.drift.hasAlert && (
          <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-600/50 rounded-lg px-5 py-3 text-amber-300">
            <span className="text-lg">⚠</span>
            <span className="font-medium">
              Latency Drift Detected: +{data.drift.latencyChange}% vs last week
            </span>
          </div>
        )}

        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <div className="col-span-4 text-red-400 bg-[#161618] border border-red-500/30 rounded-xl p-6">{error}</div>
          ) : data ? (
            <>
              <StatCard label="Total Runs" value={data.totals.runs.toLocaleString()} sub="all time" />
              <StatCard label="Total Cost" value={`$${data.totals.cost}`} sub="all time" />
              <StatCard label="Avg Latency" value={`${data.totals.avgLatency} ms`} sub="all time" />
              <StatCard label="Error Rate" value={`${data.totals.errorRate}%`} sub="of all runs" />
            </>
          ) : null}
        </div>

        {/* Cost Trend Chart */}
        <div className="bg-[#161618] border border-[#2A2A2E] rounded-xl p-6">
          <h2 className="text-base font-black text-[#E8E8EC] mb-4">Cost Trend (Last 30 Days)</h2>
          {loading ? (
            <div className="h-32 bg-[#2A2A2E] animate-pulse rounded-lg" />
          ) : data ? (
            <>
              <LineChart data={data.costTrend} valueKey="totalCost" color="#FF6B2B" />
              {data.costTrend.length > 0 && (
                <div className="flex justify-between text-xs text-[#555560] mt-1 px-1">
                  <span>{data.costTrend[0]?.date}</span>
                  <span>{data.costTrend[data.costTrend.length - 1]?.date}</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Model Performance Table */}
        <div className="bg-[#161618] border border-[#2A2A2E] rounded-xl p-6">
          <h2 className="text-base font-black text-[#E8E8EC] mb-4">Model Performance</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 bg-[#2A2A2E] animate-pulse rounded-lg" />
              ))}
            </div>
          ) : data && data.modelStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#666670] border-b border-[#2A2A2E]">
                    <th className="text-left py-2 pr-4 font-medium">Model</th>
                    <th className="text-right py-2 pr-4 font-medium">Runs</th>
                    <th className="text-right py-2 pr-4 font-medium">Avg Latency</th>
                    <th className="text-right py-2 pr-4 font-medium">Total Cost</th>
                    <th className="text-right py-2 font-medium">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.modelStats.map((m, i) => (
                    <tr key={i} className="border-b border-[#1E1E22] hover:bg-[#1E1E22] transition-colors text-[#C8C8CC]">
                      <td className="py-3 pr-4 font-mono text-forge-orange">{m.model}</td>
                      <td className="py-3 pr-4 text-right">{m.count.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-right">{m.avgLatency} ms</td>
                      <td className="py-3 pr-4 text-right">${m.totalCost.toFixed(4)}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          m.successRate >= 90 ? 'bg-emerald-500/20 text-emerald-400'
                          : m.successRate >= 70 ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                        }`}>
                          {m.successRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#555560] text-sm">No model data available.</p>
          )}
        </div>

        {/* Error Taxonomy */}
        <div className="bg-[#161618] border border-[#2A2A2E] rounded-xl p-6">
          <h2 className="text-base font-black text-[#E8E8EC] mb-4">Top Errors</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 bg-[#2A2A2E] animate-pulse rounded-lg" />
              ))}
            </div>
          ) : data && data.failures.length > 0 ? (
            <div className="space-y-3">
              {data.failures.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#C8C8CC] truncate mb-1">{f.errorMessage}</div>
                    <div className="relative h-1.5 bg-[#2A2A2E] rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-red-500 rounded-full"
                        style={{ width: `${(f.count / maxFailureCount) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm text-[#888890] tabular-nums w-10 text-right shrink-0">{f.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#555560] text-sm">No failures recorded. Great work!</p>
          )}
        </div>
      </div>
    </div>
  )
}
