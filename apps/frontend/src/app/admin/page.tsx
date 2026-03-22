'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, FileText, Zap, MessageSquare, TrendingUp,
  Search, ChevronLeft, ChevronRight, Trash2, Shield,
  Crown, Star, Eye, EyeOff, Clock, BarChart3, Activity,
  AlertTriangle, X,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number
  totalPrompts: number
  totalExecutions: number
  totalComments: number
  newUsersThisWeek: number
  topPrompts: {
    id: string
    title: string
    upvoteCount: number
    author: { username: string }
  }[]
  categoryDistribution: {
    category: string
    _count: number
  }[]
  recentExecutions: {
    id: string
    model: string
    createdAt: string
    success: boolean
    user: { username: string } | null
    prompt: { title: string } | null
  }[]
}

interface AdminUser {
  id: string
  email: string
  username: string
  displayName: string
  role: string
  isPremium: boolean
  createdAt: string
  _count: { prompts: number; followers: number }
}

interface AdminPrompt {
  id: string
  title: string
  description: string
  category: string
  isPublic: boolean
  isPremium: boolean
  upvoteCount: number
  createdAt: string
  author: { username: string; email: string }
  _count: { upvotes: number; comments: number }
}

type Tab = 'overview' | 'users' | 'prompts'

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

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-orange-100 text-forge-orange border-orange-200',
  MODERATOR: 'bg-violet-100 text-violet-700 border-violet-200',
  CREATOR: 'bg-green-100 text-green-700 border-green-200',
  USER: 'bg-gray-100 text-gray-600 border-gray-200',
}

const CATEGORY_COLORS: Record<string, string> = {
  CODING: '#FF6B2B',
  WRITING: '#7C3AED',
  ANALYSIS: '#00C27C',
  CREATIVITY: '#FFB800',
  EDUCATION: '#3B82F6',
  BUSINESS: '#EF4444',
  RESEARCH: '#06B6D4',
  ROLEPLAY: '#EC4899',
  OTHER: '#6B7280',
}

const VALID_ROLES = ['USER', 'CREATOR', 'MODERATOR', 'ADMIN']

// ── Skeleton components ────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
      <div className="mb-3 h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
      <div className="mb-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
    </div>
  )
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  )
}

// ── Confirmation Dialog ────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4 w-full max-w-md rounded-2xl border-2 border-forge-border bg-white p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg font-black text-forge-ink">{title}</h3>
        </div>
        <p className="mb-6 text-sm text-forge-muted">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border-2 border-forge-border px-4 py-2 text-sm font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()

  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Overview state
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersRoleFilter, setUsersRoleFilter] = useState('')
  const usersSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Prompts state
  const [prompts, setPrompts] = useState<AdminPrompt[]>([])
  const [promptsTotal, setPromptsTotal] = useState(0)
  const [promptsPage, setPromptsPage] = useState(1)
  const [promptsTotalPages, setPromptsTotalPages] = useState(1)
  const [promptsLoading, setPromptsLoading] = useState(true)
  const [promptsSearch, setPromptsSearch] = useState('')
  const promptsSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AdminPrompt | null>(null)

  // Auth guard
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [user, router])

  const headers = { Authorization: `Bearer ${accessToken}` }

  // ── Data fetchers ──────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/admin/stats', { headers })
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (e) {
      console.error('Failed to fetch stats', e)
    } finally {
      setStatsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const fetchUsers = useCallback(async (page: number, search: string, role: string) => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('q', search)
      if (role) params.set('role', role)
      const res = await fetch(`/api/admin/users?${params}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setUsersTotal(data.total)
        setUsersPage(data.page)
        setUsersTotalPages(data.totalPages)
      }
    } catch (e) {
      console.error('Failed to fetch users', e)
    } finally {
      setUsersLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const fetchPrompts = useCallback(async (page: number, search: string) => {
    setPromptsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('q', search)
      const res = await fetch(`/api/admin/prompts?${params}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setPrompts(data.prompts)
        setPromptsTotal(data.total)
        setPromptsPage(data.page)
        setPromptsTotalPages(data.totalPages)
      }
    } catch (e) {
      console.error('Failed to fetch prompts', e)
    } finally {
      setPromptsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  // ── Load data on tab switch ────────────────────────────────────────────────

  useEffect(() => {
    if (!accessToken) return
    if (activeTab === 'overview') fetchStats()
    if (activeTab === 'users') fetchUsers(1, usersSearch, usersRoleFilter)
    if (activeTab === 'prompts') fetchPrompts(1, promptsSearch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accessToken])

  // ── Debounced search ───────────────────────────────────────────────────────

  function handleUsersSearch(val: string) {
    setUsersSearch(val)
    if (usersSearchTimer.current) clearTimeout(usersSearchTimer.current)
    usersSearchTimer.current = setTimeout(() => {
      fetchUsers(1, val, usersRoleFilter)
    }, 400)
  }

  function handleUsersRoleFilter(val: string) {
    setUsersRoleFilter(val)
    fetchUsers(1, usersSearch, val)
  }

  function handlePromptsSearch(val: string) {
    setPromptsSearch(val)
    if (promptsSearchTimer.current) clearTimeout(promptsSearchTimer.current)
    promptsSearchTimer.current = setTimeout(() => {
      fetchPrompts(1, val)
    }, 400)
  }

  // ── Role change ────────────────────────────────────────────────────────────

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
      }
    } catch (e) {
      console.error('Failed to update role', e)
    }
  }

  // ── Delete prompt ──────────────────────────────────────────────────────────

  async function handleDeletePrompt() {
    if (!deleteTarget) return
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId: deleteTarget.id }),
      })
      if (res.ok || res.status === 204) {
        setPrompts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        setPromptsTotal((t) => t - 1)
      }
    } catch (e) {
      console.error('Failed to delete prompt', e)
    } finally {
      setDeleteTarget(null)
    }
  }

  // ── Guard render ───────────────────────────────────────────────────────────

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forge-silver">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-forge-orange border-t-transparent" />
      </div>
    )
  }

  // ── Category bar max ───────────────────────────────────────────────────────

  const maxCategoryCount = stats
    ? Math.max(...stats.categoryDistribution.map((c) => c._count), 1)
    : 1

  // ── Tab config ─────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'prompts', label: 'Prompts', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      <div className="container-forge pt-28 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="section-label mb-2">Administration</div>
          <h1
            className="font-display font-black text-forge-ink"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
          >
            ADMIN PANEL
          </h1>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex items-center gap-1 rounded-2xl border-2 border-forge-border bg-white p-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-forge-ink text-white shadow-sm'
                    : 'text-forge-muted hover:text-forge-ink hover:bg-forge-silver'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {/* ── Overview Tab ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Stat cards */}
              <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {statsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                ) : (
                  [
                    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: '#FF6B2B' },
                    { label: 'Total Prompts', value: stats?.totalPrompts ?? 0, icon: FileText, color: '#7C3AED' },
                    { label: 'Total Executions', value: stats?.totalExecutions ?? 0, icon: Zap, color: '#00C27C' },
                    { label: 'New This Week', value: stats?.newUsersThisWeek ?? 0, icon: TrendingUp, color: '#3B82F6' },
                  ].map((card, i) => {
                    const Icon = card.icon
                    return (
                      <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-2xl border-2 border-forge-border bg-white p-6 transition-all hover:shadow-[3px_3px_0_#0A0A0A] hover:border-forge-ink"
                        style={{ borderLeftColor: card.color, borderLeftWidth: 4 }}
                      >
                        <div
                          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${card.color}18`, color: card.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div
                          className="font-display font-black leading-none text-forge-ink"
                          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
                        >
                          {card.value.toLocaleString()}
                        </div>
                        <div className="mt-1 text-xs font-bold text-forge-muted">{card.label}</div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Top Prompts */}
                <div className="lg:col-span-1 rounded-2xl border-2 border-forge-border bg-white">
                  <div className="flex items-center justify-between border-b-2 border-forge-border px-6 py-4">
                    <h2 className="font-display text-base font-black text-forge-ink">Top Prompts</h2>
                    <Star className="h-4 w-4 text-amber-500" />
                  </div>
                  {statsLoading ? (
                    <div className="space-y-3 p-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-forge-border/50">
                      {(stats?.topPrompts ?? []).map((prompt, i) => (
                        <div key={prompt.id} className="flex items-center gap-3 px-6 py-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forge-silver text-xs font-black text-forge-muted">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-bold text-forge-ink">{prompt.title}</p>
                            <p className="text-xs text-forge-muted">by {prompt.author.username}</p>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                            <Star className="h-3 w-3" fill="currentColor" />
                            {prompt.upvoteCount}
                          </div>
                        </div>
                      ))}
                      {(stats?.topPrompts ?? []).length === 0 && (
                        <p className="px-6 py-8 text-center text-sm text-forge-muted">No prompts yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Category Distribution */}
                <div className="lg:col-span-1 rounded-2xl border-2 border-forge-border bg-white">
                  <div className="flex items-center justify-between border-b-2 border-forge-border px-6 py-4">
                    <h2 className="font-display text-base font-black text-forge-ink">Categories</h2>
                    <BarChart3 className="h-4 w-4 text-forge-muted" />
                  </div>
                  {statsLoading ? (
                    <div className="space-y-3 p-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 p-6">
                      {(stats?.categoryDistribution ?? []).map((cat) => {
                        const pct = Math.round((cat._count / maxCategoryCount) * 100)
                        const color = CATEGORY_COLORS[cat.category] ?? '#6B7280'
                        return (
                          <div key={cat.category}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-bold text-forge-ink capitalize">
                                {cat.category.toLowerCase()}
                              </span>
                              <span className="font-bold text-forge-muted">{cat._count}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      {(stats?.categoryDistribution ?? []).length === 0 && (
                        <p className="text-center text-sm text-forge-muted">No data</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-1 rounded-2xl border-2 border-forge-border bg-white">
                  <div className="flex items-center justify-between border-b-2 border-forge-border px-6 py-4">
                    <h2 className="font-display text-base font-black text-forge-ink">Recent Activity</h2>
                    <Activity className="h-4 w-4 text-forge-muted" />
                  </div>
                  {statsLoading ? (
                    <div className="space-y-3 p-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-forge-border/50 max-h-[400px] overflow-y-auto">
                      {(stats?.recentExecutions ?? []).map((exec) => (
                        <div key={exec.id} className="flex items-start gap-3 px-6 py-3">
                          <div
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                              exec.success
                                ? 'bg-green-100 text-green-600'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            <Zap className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs text-forge-ink leading-snug">
                              <span className="font-bold">{exec.user?.username ?? 'anon'}</span>
                              {' ran '}
                              <span className="font-bold">{exec.prompt?.title ?? 'unnamed'}</span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-forge-muted">
                              {formatModel(exec.model)} &middot; {timeAgo(exec.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(stats?.recentExecutions ?? []).length === 0 && (
                        <p className="px-6 py-8 text-center text-sm text-forge-muted">No executions yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Extra stats row */}
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display text-2xl font-black text-forge-ink">
                        {statsLoading ? '...' : (stats?.totalComments ?? 0).toLocaleString()}
                      </div>
                      <div className="text-xs font-bold text-forge-muted">Total Comments</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display text-2xl font-black text-forge-ink">
                        {statsLoading ? '...' : (stats?.newUsersThisWeek ?? 0).toLocaleString()}
                      </div>
                      <div className="text-xs font-bold text-forge-muted">New Users This Week</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Users Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Search & filter bar */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forge-muted" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or username..."
                    value={usersSearch}
                    onChange={(e) => handleUsersSearch(e.target.value)}
                    className="w-full rounded-xl border-2 border-forge-border bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-forge-ink placeholder:text-forge-muted/60 transition-all focus:border-forge-ink focus:outline-none"
                  />
                  {usersSearch && (
                    <button
                      onClick={() => handleUsersSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-muted hover:text-forge-ink"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <select
                  value={usersRoleFilter}
                  onChange={(e) => handleUsersRoleFilter(e.target.value)}
                  className="rounded-xl border-2 border-forge-border bg-white px-4 py-2.5 text-sm font-bold text-forge-ink transition-all focus:border-forge-ink focus:outline-none"
                >
                  <option value="">All Roles</option>
                  {VALID_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Users count */}
              <div className="mb-4 text-sm font-bold text-forge-muted">
                {usersTotal.toLocaleString()} user{usersTotal !== 1 ? 's' : ''} found
              </div>

              {/* Users table */}
              <div className="overflow-hidden rounded-2xl border-2 border-forge-border bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-forge-border bg-forge-silver/50">
                        <th className="px-4 py-3 text-left font-display text-xs font-black uppercase text-forge-muted">Username</th>
                        <th className="px-4 py-3 text-left font-display text-xs font-black uppercase text-forge-muted">Email</th>
                        <th className="px-4 py-3 text-left font-display text-xs font-black uppercase text-forge-muted">Role</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-black uppercase text-forge-muted">Prompts</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-black uppercase text-forge-muted">Followers</th>
                        <th className="px-4 py-3 text-left font-display text-xs font-black uppercase text-forge-muted">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forge-border/50">
                      {usersLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-forge-muted">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-forge-silver/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-forge-ink">{u.username}</span>
                                {u.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                              </div>
                              <span className="text-xs text-forge-muted">{u.displayName}</span>
                            </td>
                            <td className="px-4 py-3 text-forge-muted">{u.email}</td>
                            <td className="px-4 py-3">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                disabled={u.id === user.id}
                                className={`rounded-lg border px-2 py-1 text-xs font-bold transition-all focus:outline-none ${ROLE_BADGE[u.role] ?? ROLE_BADGE.USER} ${u.id === user.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                              >
                                {VALID_ROLES.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-forge-ink">{u._count.prompts}</td>
                            <td className="px-4 py-3 text-center font-bold text-forge-ink">{u._count.followers}</td>
                            <td className="px-4 py-3 text-xs text-forge-muted">{timeAgo(u.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {usersTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t-2 border-forge-border px-4 py-3">
                    <span className="text-xs font-bold text-forge-muted">
                      Page {usersPage} of {usersTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchUsers(usersPage - 1, usersSearch, usersRoleFilter)}
                        disabled={usersPage <= 1}
                        className="flex items-center gap-1 rounded-lg border-2 border-forge-border px-3 py-1.5 text-xs font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3 w-3" /> Prev
                      </button>
                      <button
                        onClick={() => fetchUsers(usersPage + 1, usersSearch, usersRoleFilter)}
                        disabled={usersPage >= usersTotalPages}
                        className="flex items-center gap-1 rounded-lg border-2 border-forge-border px-3 py-1.5 text-xs font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Prompts Tab ───────────────────────────────────────────────── */}
          {activeTab === 'prompts' && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Search bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forge-muted" />
                  <input
                    type="text"
                    placeholder="Search prompts by title or description..."
                    value={promptsSearch}
                    onChange={(e) => handlePromptsSearch(e.target.value)}
                    className="w-full rounded-xl border-2 border-forge-border bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-forge-ink placeholder:text-forge-muted/60 transition-all focus:border-forge-ink focus:outline-none"
                  />
                  {promptsSearch && (
                    <button
                      onClick={() => handlePromptsSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-muted hover:text-forge-ink"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Prompts count */}
              <div className="mb-4 text-sm font-bold text-forge-muted">
                {promptsTotal.toLocaleString()} prompt{promptsTotal !== 1 ? 's' : ''} found
              </div>

              {/* Prompts table */}
              <div className="overflow-hidden rounded-2xl border-2 border-forge-border bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-forge-border bg-forge-silver/50">
                        <th className="px-4 py-3 text-left font-display text-xs font-black uppercase text-forge-muted">Title</th>
                        <th className="px-4 py-3 text-left font-display text-xs font-black uppercase text-forge-muted">Author</th>
                        <th className="px-4 py-3 text-left font-display text-xs font-black uppercase text-forge-muted">Category</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-black uppercase text-forge-muted">Upvotes</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-black uppercase text-forge-muted">Comments</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-black uppercase text-forge-muted">Visibility</th>
                        <th className="px-4 py-3 text-left font-display text-xs font-black uppercase text-forge-muted">Created</th>
                        <th className="px-4 py-3 text-center font-display text-xs font-black uppercase text-forge-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forge-border/50">
                      {promptsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
                      ) : prompts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-forge-muted">
                            No prompts found
                          </td>
                        </tr>
                      ) : (
                        prompts.map((p) => (
                          <tr key={p.id} className="hover:bg-forge-silver/30 transition-colors">
                            <td className="px-4 py-3">
                              <Link
                                href={`/prompt/${p.id}`}
                                className="font-bold text-forge-ink hover:text-forge-orange transition-colors"
                              >
                                {p.title}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-forge-ink">{p.author.username}</span>
                              <br />
                              <span className="text-xs text-forge-muted">{p.author.email}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                                style={{ backgroundColor: CATEGORY_COLORS[p.category] ?? '#6B7280' }}
                              >
                                {p.category.toLowerCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-forge-ink">
                              {p.upvoteCount}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-forge-ink">
                              {p._count.comments}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {p.isPublic ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                                  <Eye className="h-3 w-3" /> Public
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-forge-muted">
                                  <EyeOff className="h-3 w-3" /> Private
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-forge-muted">{timeAgo(p.createdAt)}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setDeleteTarget(p)}
                                className="inline-flex items-center gap-1 rounded-lg border-2 border-red-200 px-2.5 py-1 text-xs font-bold text-red-600 transition-all hover:bg-red-50 hover:border-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {promptsTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t-2 border-forge-border px-4 py-3">
                    <span className="text-xs font-bold text-forge-muted">
                      Page {promptsPage} of {promptsTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchPrompts(promptsPage - 1, promptsSearch)}
                        disabled={promptsPage <= 1}
                        className="flex items-center gap-1 rounded-lg border-2 border-forge-border px-3 py-1.5 text-xs font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3 w-3" /> Prev
                      </button>
                      <button
                        onClick={() => fetchPrompts(promptsPage + 1, promptsSearch)}
                        disabled={promptsPage >= promptsTotalPages}
                        className="flex items-center gap-1 rounded-lg border-2 border-forge-border px-3 py-1.5 text-xs font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Prompt"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone. The author will be notified.`}
        onConfirm={handleDeletePrompt}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
