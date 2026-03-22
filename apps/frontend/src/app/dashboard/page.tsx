'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Play, Zap, Star, GitBranch, Clock, Plus, ArrowRight,
  BarChart3, Layers, Terminal, BookOpen, Activity,
  DollarSign, TrendingUp, Lock, Trophy, CheckCircle,
  X, ChevronRight,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserStats {
  promptsCreated: number
  totalRuns: number
  avgRating: number
  collections: number
  followers: number
  following: number
  totalUpvotesReceived: number
}

interface UserProfile {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
  bio: string | null
  website: string | null
  isPremium: boolean
  role: string
  eloRating: number
  totalEarnings: string
  createdAt: string
}

interface Prompt {
  id: string
  title: string
  category: string
  isPublic: boolean
  isPremium: boolean
  upvoteCount: number
  viewCount: number
  forkCount: number
  updatedAt: string
  _count: { executions: number; comments: number }
}

interface Execution {
  id: string
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  cost: string
  success: boolean
  createdAt: string
  prompt: { id: string; title: string } | null
}

// ── Earnings types ─────────────────────────────────────────────────────────────

interface RecentSale {
  id: string
  promptTitle: string
  amount: number
  platformFee: number
  netEarnings: number
  createdAt: string
}

interface TopPrompt {
  promptId: string
  title: string
  revenue: number
  sales: number
}

interface DailyRevenuePoint {
  date: string
  revenue: number | string
  sales: number | string
}

interface EarningsData {
  totalEarnings: number
  pendingPayout: number
  recentSales: RecentSale[]
  topPrompts: TopPrompt[]
  dailyRevenue: DailyRevenuePoint[]
}

// ── Challenge types ────────────────────────────────────────────────────────────

interface ChallengeSubmission {
  id: string
  userId: string
  promptId: string
  votes: number
  createdAt: string
  user: { username: string; displayName: string }
  prompt: { id: string; title: string }
}

interface DailyChallenge {
  id: string
  date: string
  theme: string
  description: string
  category: string
  status: string
}

interface ChallengeData {
  challenge: DailyChallenge & { submissions: ChallengeSubmission[] }
  userSubmission: ChallengeSubmission | null
  timeRemaining: number
  submissionCount: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function formatModel(model: string): string {
  const map: Record<string, string> = {
    CLAUDE_3_5_SONNET: 'Claude 3.5 Sonnet',
    CLAUDE_3_OPUS: 'Claude 3 Opus',
    GPT4O: 'GPT-4o',
    GPT4: 'GPT-4',
    GEMINI_1_5_PRO: 'Gemini 1.5 Pro',
    MISTRAL_LARGE: 'Mistral Large',
  }
  return map[model] ?? model.replace(/_/g, ' ')
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Static config ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
}

const ACTIVITY_COLORS: Record<string, string> = {
  run: 'bg-orange-100 text-forge-orange',
  star: 'bg-amber-100 text-amber-600',
  fork: 'bg-purple-100 text-purple-600',
  version: 'bg-sky-100 text-sky-600',
}

const ACTIVITY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  run: Zap,
  star: Star,
  fork: GitBranch,
  version: Layers,
}

// ── Skeleton components ────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-forge-border bg-white p-5">
      <div className="mb-3 h-9 w-9 animate-pulse rounded-xl bg-gray-200" />
      <div className="mb-1 h-8 w-20 animate-pulse rounded bg-gray-200" />
      <div className="mb-0.5 h-3 w-24 animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
    </div>
  )
}

function PromptRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-8 w-16 animate-pulse rounded-lg bg-gray-200" />
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 px-6 py-3">
      <div className="mt-0.5 h-6 w-6 shrink-0 animate-pulse rounded-full bg-gray-200" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  )
}

// ── Revenue SVG Line Chart (same pattern as AnalyticsDashboard) ───────────────

function RevenueLineChart({ data }: { data: DailyRevenuePoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-forge-muted">
        No revenue data yet
      </div>
    )
  }

  const W = 800
  const H = 160
  const PAD = 20
  const revenues = data.map(d => Number(d.revenue))
  const maxRevenue = Math.max(...revenues, 1)

  const points = data.map((d, i) => ({
    x: PAD + (i / Math.max(data.length - 1, 1)) * (W - 2 * PAD),
    y: H - PAD - (Number(d.revenue) / maxRevenue) * (H - 2 * PAD),
    date: d.date,
    revenue: Number(d.revenue),
  }))

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = points[i - 1]!
    const cp1x = prev.x + (pt.x - prev.x) / 3
    const cp2x = pt.x - (pt.x - prev.x) / 3
    return `${acc} C ${cp1x} ${prev.y} ${cp2x} ${pt.y} ${pt.x} ${pt.y}`
  }, '')

  const areaD = `${pathD} L ${points[points.length - 1]!.x} ${H} L ${points[0]!.x} ${H} Z`

  const yLabels = [0, Math.round(maxRevenue / 2), maxRevenue]

  return (
    <div className="relative w-full" style={{ height: 192 }}>
      <svg
        viewBox={`0 0 ${W} ${H + 32}`}
        className="w-full"
        style={{ height: '100%' }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B2B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FF6B2B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines + labels */}
        {yLabels.map((val) => {
          const y = H - PAD - (val / maxRevenue) * (H - 2 * PAD)
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
                ${val.toFixed(0)}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#revenueAreaGrad)" />

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
              {typeof p.date === 'string' ? p.date.slice(5) : ''}
            </text>
          ))}
      </svg>
    </div>
  )
}

// ── Earnings Tab ───────────────────────────────────────────────────────────────

function EarningsTab({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEarnings() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/marketplace/earnings', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) throw new Error('Failed to load earnings')
        const json: EarningsData = await res.json()
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load earnings')
      } finally {
        setLoading(false)
      }
    }
    fetchEarnings()
  }, [accessToken])

  // Calculate this-month earnings from recentSales
  const thisMonthEarnings = data?.recentSales
    .filter(s => new Date(s.createdAt).getMonth() === new Date().getMonth()
      && new Date(s.createdAt).getFullYear() === new Date().getFullYear())
    .reduce((sum, s) => sum + s.netEarnings, 0) ?? 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border-2 border-forge-border bg-white" />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-2xl border-2 border-forge-border bg-white" />
        <div className="h-48 animate-pulse rounded-2xl border-2 border-forge-border bg-white" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-forge-border p-10 text-center">
        <p className="text-sm text-forge-muted">{error ?? 'No earnings data available.'}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Hero stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Earned */}
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-forge-border bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
            <DollarSign className="h-4 w-4 text-forge-orange" />
          </div>
          <div>
            <div
              className="font-display font-black text-forge-orange"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
            >
              ${data.totalEarnings.toFixed(2)}
            </div>
            <div className="text-xs font-bold text-forge-muted">Total Earned</div>
            <div className="text-[11px] font-bold text-forge-orange">all time</div>
          </div>
        </div>

        {/* This Month */}
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-forge-border bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
            <TrendingUp className="h-4 w-4 text-forge-green" />
          </div>
          <div>
            <div
              className="font-display font-black text-forge-ink"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
            >
              ${thisMonthEarnings.toFixed(2)}
            </div>
            <div className="text-xs font-bold text-forge-muted">This Month</div>
            <div className="text-[11px] font-bold text-forge-green">net earnings</div>
          </div>
        </div>

        {/* Pending Payout */}
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-forge-border bg-white p-5 opacity-60">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
            <Lock className="h-4 w-4 text-forge-muted" />
          </div>
          <div>
            <div
              className="font-display font-black text-forge-muted"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
            >
              —
            </div>
            <div className="text-xs font-bold text-forge-muted">Pending Payout</div>
            <div className="text-[11px] font-bold text-forge-muted">Coming soon</div>
          </div>
        </div>
      </div>

      {/* 30-day Revenue Chart */}
      <div className="rounded-2xl border-2 border-forge-border bg-white p-5">
        <div className="section-label mb-4">Revenue — Last 30 Days</div>
        <RevenueLineChart data={data.dailyRevenue} />
      </div>

      {/* Top Earning Prompts */}
      {data.topPrompts.length > 0 && (
        <div className="rounded-2xl border-2 border-forge-border bg-white">
          <div className="border-b-2 border-forge-border px-6 py-4">
            <h2 className="font-display text-base font-black text-forge-ink">Top Earning Prompts</h2>
          </div>
          <div className="divide-y-2 divide-forge-border">
            {data.topPrompts.map((prompt, i) => (
              <div key={prompt.promptId} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forge-silver font-display text-sm font-black text-forge-ink">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-black text-forge-ink truncate">{prompt.title}</p>
                  <p className="text-xs text-forge-muted">{prompt.sales} sale{prompt.sales !== 1 ? 's' : ''}</p>
                </div>
                <div className="shrink-0 rounded-full bg-forge-black px-3 py-1 font-display text-xs font-black text-white">
                  ${prompt.revenue.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-2xl border-2 border-forge-border bg-white">
        <div className="border-b-2 border-forge-border px-6 py-4">
          <h2 className="font-display text-base font-black text-forge-ink">Recent Transactions</h2>
        </div>

        {data.recentSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <DollarSign className="mb-3 h-10 w-10 text-forge-muted/40" />
            <p className="font-display text-sm font-black text-forge-ink">No sales yet</p>
            <p className="mt-1 text-xs text-forge-muted">List a premium prompt to start earning</p>
            <Link href="/marketplace" className="btn-orange mt-4 text-xs px-4 py-2">
              <ArrowRight className="h-3.5 w-3.5" />
              Start Selling
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-forge-border bg-forge-silver/50">
                  <th className="px-6 py-3 text-left text-xs font-black text-forge-muted uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-forge-muted uppercase tracking-wider">Prompt</th>
                  <th className="px-6 py-3 text-right text-xs font-black text-forge-muted uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-black text-forge-muted uppercase tracking-wider">Fee</th>
                  <th className="px-6 py-3 text-right text-xs font-black text-forge-muted uppercase tracking-wider">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-forge-border">
                {data.recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-forge-silver/30 transition-colors">
                    <td className="px-6 py-4 text-xs text-forge-muted whitespace-nowrap">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-forge-ink max-w-[180px] truncate">
                      {sale.promptTitle}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-forge-muted">
                      ${sale.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-forge-muted">
                      -${sale.platformFee.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-black" style={{ color: '#00C27C' }}>
                      ${sale.netEarnings.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Submit Modal ───────────────────────────────────────────────────────────────

function SubmitModal({
  challengeId,
  userPrompts,
  onClose,
  onSubmit,
}: {
  challengeId: string
  userPrompts: Prompt[]
  onClose: () => void
  onSubmit: (submission: ChallengeSubmission) => void
}) {
  const { accessToken } = useAuthStore()
  const [selectedPromptId, setSelectedPromptId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!selectedPromptId) {
      setError('Please select a prompt')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ promptId: selectedPromptId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')
      onSubmit(json.submission)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg rounded-2xl border-2 border-forge-border bg-white p-6 shadow-[6px_6px_0_#0A0A0A]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-black text-forge-ink">Submit Your Prompt</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-forge-silver transition-colors">
            <X className="h-5 w-5 text-forge-muted" />
          </button>
        </div>

        {userPrompts.length === 0 ? (
          <div className="py-8 text-center">
            <Layers className="mx-auto mb-3 h-10 w-10 text-forge-muted/40" />
            <p className="font-display text-sm font-black text-forge-ink">No prompts yet</p>
            <p className="mt-1 text-xs text-forge-muted">Create a prompt first to submit to challenges</p>
            <Link href="/prompt/new" onClick={onClose} className="btn-orange mt-4 inline-flex text-xs px-4 py-2">
              <Plus className="h-3.5 w-3.5" />
              Create Prompt
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-forge-muted">Select one of your prompts to enter the challenge:</p>
            <div className="mb-5 max-h-64 space-y-2 overflow-y-auto">
              {userPrompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPromptId(p.id)}
                  className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                    selectedPromptId === p.id
                      ? 'border-forge-orange bg-orange-50'
                      : 'border-forge-border hover:border-forge-ink'
                  }`}
                >
                  <p className="font-display text-sm font-black text-forge-ink">{p.title}</p>
                  <p className="text-xs text-forge-muted capitalize">{p.category.toLowerCase()}</p>
                </button>
              ))}
            </div>

            {error && (
              <p className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-forge-border px-4 py-2.5 text-sm font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedPromptId}
                className="btn-orange flex-1 text-sm px-4 py-2.5 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Entry'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ── Submissions Modal ──────────────────────────────────────────────────────────

function SubmissionsModal({
  submissions,
  onClose,
}: {
  submissions: ChallengeSubmission[]
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg rounded-2xl border-2 border-forge-border bg-white p-6 shadow-[6px_6px_0_#0A0A0A]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-black text-forge-ink">Top Submissions</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-forge-silver transition-colors">
            <X className="h-5 w-5 text-forge-muted" />
          </button>
        </div>

        {submissions.length === 0 ? (
          <div className="py-8 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-forge-muted/40" />
            <p className="font-display text-sm font-black text-forge-ink">No submissions yet</p>
            <p className="mt-1 text-xs text-forge-muted">Be the first to submit!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub, i) => (
              <div key={sub.id} className="flex items-center gap-3 rounded-xl border-2 border-forge-border p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forge-silver font-display text-sm font-black text-forge-ink">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/prompt/${sub.prompt.id}`}
                    onClick={onClose}
                    className="font-display text-sm font-black text-forge-ink hover:text-forge-orange transition-colors truncate block"
                  >
                    {sub.prompt.title}
                  </Link>
                  <p className="text-xs text-forge-muted">by {sub.user.displayName}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-forge-muted">
                  <Star className="h-3 w-3 text-amber-500" fill="currentColor" />
                  {sub.votes}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── Daily Challenge Widget ─────────────────────────────────────────────────────

function DailyChallengeWidget({
  accessToken,
  userPrompts,
}: {
  accessToken: string
  userPrompts: Prompt[]
}) {
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false)

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch('/api/challenges/today', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return
      const json: ChallengeData = await res.json()
      setChallengeData(json)
      setCountdown(json.timeRemaining)
    } catch {
      // silently fail — challenge is optional UI
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchChallenge()
  }, [fetchChallenge])

  // Countdown timer
  useEffect(() => {
    if (!challengeData) return
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [challengeData])

  function handleSubmitSuccess(submission: ChallengeSubmission) {
    setShowSubmitModal(false)
    setChallengeData(prev =>
      prev ? { ...prev, userSubmission: submission, submissionCount: prev.submissionCount + 1 } : prev
    )
  }

  if (loading) {
    return (
      <div className="mb-8 h-32 animate-pulse rounded-2xl border-2 border-forge-border bg-forge-black/80" />
    )
  }

  if (!challengeData) return null

  const { challenge, userSubmission, submissionCount } = challengeData

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex overflow-hidden rounded-2xl border-2 border-forge-border bg-forge-black"
      >
        {/* Orange left accent bar */}
        <div className="w-1.5 shrink-0 bg-forge-orange" />

        <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: challenge info */}
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="badge-orange text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Today&apos;s Challenge
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-forge-muted">
                <Trophy className="h-3 w-3" />
                {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-forge-muted">
                <Clock className="h-3 w-3" />
                Ends in {formatCountdown(countdown)}
              </span>
            </div>
            <h3
              className="font-display font-black text-white leading-tight mb-1"
              style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}
            >
              {challenge.theme}
            </h3>
            <p className="text-sm text-forge-muted leading-snug">{challenge.description}</p>
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-3">
            {userSubmission ? (
              <div className="flex items-center gap-2 rounded-xl border-2 border-forge-green/40 bg-forge-green/10 px-4 py-2.5">
                <CheckCircle className="h-4 w-4 text-forge-green" />
                <span className="text-sm font-bold text-forge-green">Submitted!</span>
              </div>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="btn-orange text-sm px-4 py-2.5"
              >
                <Plus className="h-4 w-4" />
                Submit Your Prompt
              </button>
            )}
            <button
              onClick={() => setShowSubmissionsModal(true)}
              className="flex items-center gap-1.5 rounded-xl border-2 border-white/20 px-4 py-2.5 text-sm font-bold text-white transition-all hover:border-white/60 hover:bg-white/10"
            >
              View Submissions
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {showSubmitModal && (
        <SubmitModal
          challengeId={challenge.id}
          userPrompts={userPrompts}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmitSuccess}
        />
      )}

      {showSubmissionsModal && (
        <SubmissionsModal
          submissions={challenge.submissions}
          onClose={() => setShowSubmissionsModal(false)}
        />
      )}
    </>
  )
}

// ── Dashboard Tabs ─────────────────────────────────────────────────────────────

type Tab = 'overview' | 'earnings'

// ── Main component ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const { user: authUser, accessToken } = useAuthStore()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false)

  useEffect(() => {
    if (!authUser || !accessToken) {
      router.replace('/login')
      return
    }

    const headers = { Authorization: `Bearer ${accessToken}` }

    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)

        const [meRes, promptsRes, execRes] = await Promise.all([
          fetch('/api/users/me', { headers }),
          fetch('/api/users/me/prompts?limit=5&sort=popular', { headers }),
          fetch('/api/executions?limit=10', { headers }),
        ])

        if (!meRes.ok) {
          if (meRes.status === 401) {
            router.replace('/login')
            return
          }
          throw new Error(`Failed to load profile (${meRes.status})`)
        }

        const [meData, promptsData, execData] = await Promise.all([
          meRes.json(),
          promptsRes.ok ? promptsRes.json() : { prompts: [] },
          execRes.ok ? execRes.json() : { executions: [] },
        ])

        setUserProfile(meData.user)
        setStats(meData.stats)
        setPrompts(promptsData.prompts ?? [])
        setExecutions(execData.executions ?? [])

        // Show onboarding banner if user hasn't completed onboarding
        // and account is less than 7 days old
        const profile = meData.user as UserProfile & { onboardingCompleted?: boolean }
        if (profile.onboardingCompleted === false) {
          const createdAt = new Date(profile.createdAt).getTime()
          const sevenDays = 7 * 24 * 60 * 60 * 1000
          if (Date.now() - createdAt < sevenDays) {
            setShowOnboardingBanner(true)
          }
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [authUser, accessToken, router])

  // Build stat cards from real data
  const STATS = [
    { label: 'Prompts Created', value: String(stats?.promptsCreated ?? 0), delta: 'total', icon: Layers, color: '#FF6B2B' },
    { label: 'Total Runs', value: (stats?.totalRuns ?? 0).toLocaleString(), delta: 'all time', icon: Zap, color: '#FFB800' },
    { label: 'Avg Rating', value: (stats?.avgRating ?? 0).toFixed(1), delta: 'based on stars', icon: Star, color: '#00C27C' },
    { label: 'Collections', value: String(stats?.collections ?? 0), delta: 'curated sets', icon: BookOpen, color: '#7C3AED' },
  ]

  // Map executions to activity items
  const activity = executions.map((ex) => ({
    type: 'run' as const,
    text: `Ran "${ex.prompt?.title ?? 'unnamed prompt'}" on ${formatModel(ex.model)}`,
    time: timeAgo(ex.createdAt),
  }))

  const displayName = userProfile?.displayName ?? authUser?.displayName ?? 'there'

  const tabs: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
  ]

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      <div className="container-forge pt-28 pb-16">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="section-label mb-2">
              {loading ? 'Your workspace' : `Welcome back, ${displayName}`}
            </div>
            <h1
              className="font-display font-black text-forge-ink"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
            >
              DASHBOARD
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/playground"
              className="flex items-center gap-2 rounded-xl border-2 border-forge-border bg-white px-4 py-2.5 text-sm font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink"
            >
              <Terminal className="h-4 w-4" />
              Playground
            </Link>
            <Link href="/prompt/new" className="btn-orange text-sm px-5 py-2.5">
              <Plus className="h-4 w-4" />
              New Prompt
            </Link>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-8 rounded-2xl border-2 border-red-200 bg-red-50 px-6 py-4 text-sm font-bold text-red-700">
            {error} —{' '}
            <button
              onClick={() => router.refresh()}
              className="underline hover:no-underline"
            >
              try again
            </button>
          </div>
        )}

        {/* Onboarding banner */}
        {showOnboardingBanner && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-forge-orange/30 bg-forge-orange/10 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forge-orange text-white font-black text-lg">
              🎯
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-forge-ink">Complete your setup to get the most out of PromptForge</p>
              <p className="text-xs text-forge-muted mt-0.5">Personalize your experience with a quick 2-minute tour</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/onboarding" className="btn-orange text-xs px-4 py-2">
                Complete Setup →
              </Link>
              <button
                onClick={() => setShowOnboardingBanner(false)}
                className="text-forge-muted hover:text-forge-ink text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Daily Challenge Widget — always at top */}
        {!loading && accessToken && (
          <DailyChallengeWidget accessToken={accessToken} userPrompts={prompts} />
        )}

        {/* Tabs */}
        <div className="mb-8 flex items-center gap-1 rounded-xl border-2 border-forge-border bg-white p-1 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-forge-ink text-white shadow-sm'
                    : 'text-forge-muted hover:text-forge-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <>
            {/* Stats grid */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                : STATS.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-2xl border-2 border-forge-border bg-white p-5 transition-all hover:shadow-[3px_3px_0_#0A0A0A] hover:border-forge-ink"
                      >
                        <div
                          className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${stat.color}18`, color: stat.color }}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div
                          className="font-display font-black leading-none text-forge-ink"
                          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
                        >
                          {stat.value}
                        </div>
                        <div className="mt-1 text-xs font-bold text-forge-muted">{stat.label}</div>
                        <div className="mt-0.5 text-[11px] font-bold" style={{ color: stat.color }}>
                          {stat.delta}
                        </div>
                      </motion.div>
                    )
                  })}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Prompts */}
              <div className="lg:col-span-2 rounded-2xl border-2 border-forge-border bg-white">
                <div className="flex items-center justify-between border-b-2 border-forge-border px-6 py-4">
                  <h2 className="font-display text-base font-black text-forge-ink">My Prompts</h2>
                  <Link href="/browse" className="flex items-center gap-1 text-xs font-bold text-forge-orange hover:underline">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {loading ? (
                  <div className="divide-y-2 divide-forge-border">
                    {Array.from({ length: 5 }).map((_, i) => <PromptRowSkeleton key={i} />)}
                  </div>
                ) : prompts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Layers className="mb-3 h-10 w-10 text-forge-muted/40" />
                    <p className="font-display text-sm font-black text-forge-ink">No prompts yet</p>
                    <p className="mt-1 text-xs text-forge-muted">Create your first prompt to get started</p>
                    <Link href="/prompt/new" className="btn-orange mt-4 text-xs px-4 py-2">
                      <Plus className="h-3.5 w-3.5" />
                      Create Prompt
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-forge-border">
                    {prompts.map((prompt, i) => {
                      const status = prompt.isPublic ? 'published' : 'draft'
                      return (
                        <motion.div
                          key={prompt.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.05 + 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-forge-silver transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-display text-sm font-black text-forge-ink truncate">
                                {prompt.title}
                              </h3>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[status]}`}>
                                {status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-forge-muted">
                              <span className="capitalize">{prompt.category.toLowerCase()}</span>
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />{prompt._count.executions.toLocaleString()} runs
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-500" fill="currentColor" />
                                {prompt.upvoteCount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{timeAgo(prompt.updatedAt)}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/playground?promptId=${prompt.id}`}
                            className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-forge-border px-3 py-1.5 text-xs font-bold text-forge-muted transition-all hover:border-forge-orange hover:text-forge-orange"
                          >
                            <Play className="h-3 w-3" />
                            Run
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                <div className="border-t-2 border-forge-border px-6 py-4">
                  <Link
                    href="/prompt/new"
                    className="flex items-center gap-2 text-sm font-bold text-forge-muted hover:text-forge-orange transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create new prompt
                  </Link>
                </div>
              </div>

              {/* Activity feed */}
              <div className="rounded-2xl border-2 border-forge-border bg-white">
                <div className="flex items-center justify-between border-b-2 border-forge-border px-6 py-4">
                  <h2 className="font-display text-base font-black text-forge-ink">Activity</h2>
                  <Activity className="h-4 w-4 text-forge-muted" />
                </div>

                {loading ? (
                  <div className="divide-y divide-forge-border/50">
                    {Array.from({ length: 6 }).map((_, i) => <ActivitySkeleton key={i} />)}
                  </div>
                ) : activity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Activity className="mb-3 h-10 w-10 text-forge-muted/40" />
                    <p className="font-display text-sm font-black text-forge-ink">No activity yet</p>
                    <p className="mt-1 text-xs text-forge-muted">Run a prompt to see it here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-forge-border/50">
                    {activity.map((item, i) => {
                      const Icon = ACTIVITY_ICONS[item.type] as React.FC<{ className?: string }>
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 + 0.3 }}
                          className="flex items-start gap-3 px-6 py-3"
                        >
                          <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ACTIVITY_COLORS[item.type]}`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-forge-ink leading-snug">{item.text}</p>
                            <p className="mt-0.5 text-[11px] text-forge-muted">{item.time}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: '/playground',  icon: Terminal,  label: 'Open Playground',  desc: 'Test prompts with 6 models',        color: '#FF6B2B' },
                { href: '/browse',      icon: BookOpen,  label: 'Browse Library',    desc: 'Discover community prompts',        color: '#FFB800' },
                { href: authUser?.role === 'ADMIN' ? '/admin' : '/dashboard', icon: BarChart3, label: authUser?.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard Stats', desc: authUser?.role === 'ADMIN' ? 'Site-wide analytics & management' : 'Your usage stats and overview', color: '#00C27C' },
                { href: '/collections', icon: Layers,    label: 'My Collections',    desc: `${stats?.collections ?? 0} curated prompt collections`, color: '#7C3AED' },
              ].map((action, i) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={action.href}
                      className="group flex items-center gap-4 rounded-2xl border-2 border-forge-border bg-white p-4 transition-all hover:border-forge-ink hover:shadow-[3px_3px_0_#0A0A0A]"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${action.color}15`, color: action.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-sm font-black text-forge-ink leading-tight">{action.label}</p>
                        <p className="text-xs text-forge-muted mt-0.5 truncate">{action.desc}</p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-forge-muted transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        {/* Tab: Earnings */}
        {activeTab === 'earnings' && accessToken && (
          <EarningsTab accessToken={accessToken} />
        )}
      </div>
    </div>
  )
}
