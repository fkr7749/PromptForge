'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, GitBranch, Users, Zap, Crown, Medal, ChevronUp, Sparkles } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────
interface PromptEntry {
  id: string
  title: string
  category: string
  upvoteCount: number
  author: {
    id: string
    username: string
    displayName: string | null
    eloRating: number
  }
  tags: { tag: { name: string; slug: string } }[]
  _count: { executions: number; forks: number }
}

interface CreatorEntry {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  eloRating: number
  isPremium: boolean
  totalUpvotes?: number
  _count: { prompts: number; followers: number }
}

interface CategoryChampion {
  category: string
  prompt: {
    id: string
    title: string
    upvoteCount: number
    author: { username: string; displayName: string | null }
  } | null
}

interface LeaderboardData {
  topPrompts: PromptEntry[]
  topCreators: CreatorEntry[]
  categoryChampions: CategoryChampion[]
}

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  CODING:     { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'   },
  WRITING:    { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  ANALYSIS:   { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200'   },
  CREATIVITY: { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200'   },
  EDUCATION:  { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200'  },
  BUSINESS:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'  },
  RESEARCH:   { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200'   },
  ROLEPLAY:   { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  OTHER:      { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200'   },
}

const AVATAR_COLORS = [
  '#FF6B2B', '#00C27C', '#7C3AED', '#FFB800',
  '#E84040', '#0EA5E9', '#EC4899', '#14B8A6',
]

function getAvatarColor(username: string) {
  return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length] ?? '#FF6B2B'
}

function rankStyle(i: number) {
  if (i === 0) return 'text-amber-500'
  if (i === 1) return 'text-slate-400'
  if (i === 2) return 'text-amber-700'
  return 'text-forge-muted'
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 0) return <Medal className="h-5 w-5 text-amber-500" />
  if (rank === 1) return <Medal className="h-5 w-5 text-slate-400" />
  if (rank === 2) return <Medal className="h-5 w-5 text-amber-700" />
  return null
}

// ── Tab: Top Prompts ───────────────────────────────────────────────────────
function TopPromptsTab({ prompts }: { prompts: PromptEntry[] }) {
  return (
    <div className="rounded-2xl border-2 border-forge-border bg-white shadow-[4px_4px_0_#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[52px_1fr_110px_130px_80px_80px_80px] px-5 py-3 border-b-2 border-forge-border bg-forge-silver/50">
        {['#', 'Prompt', 'Category', 'Author', 'Votes', 'ELO', 'Forks'].map((h) => (
          <div key={h} className="text-[10px] font-black text-forge-muted uppercase tracking-wider text-right first:text-left">
            {h === 'Votes' ? (
              <span className="flex items-center justify-end gap-0.5"><ChevronUp className="h-3 w-3" />{h}</span>
            ) : h === 'ELO' ? (
              <span className="flex items-center justify-end gap-0.5"><Zap className="h-3 w-3" />{h}</span>
            ) : h === 'Forks' ? (
              <span className="flex items-center justify-end gap-0.5"><GitBranch className="h-3 w-3" />{h}</span>
            ) : (
              h
            )}
          </div>
        ))}
      </div>

      {prompts.map((p, i) => {
        const style = (CATEGORY_STYLES[p.category] ?? CATEGORY_STYLES.OTHER) as { bg: string; text: string; border: string }
        const isFirst = i === 0
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={[
              'grid grid-cols-[52px_1fr] md:grid-cols-[52px_1fr_110px_130px_80px_80px_80px] px-5 py-4',
              'transition-colors hover:bg-forge-silver/30 cursor-pointer',
              i < prompts.length - 1 ? 'border-b border-forge-border/50' : '',
              isFirst ? 'bg-orange-50/60 border-l-4 border-l-forge-orange' : '',
            ].join(' ')}
          >
            {/* Rank */}
            <div className="flex items-center">
              {i < 3 ? (
                <MedalIcon rank={i} />
              ) : (
                <span className={`font-display font-black text-xl ${rankStyle(i)}`}>{i + 1}</span>
              )}
            </div>

            {/* Title + tags */}
            <div className="flex flex-col justify-center min-w-0 pr-4">
              <Link
                href={`/prompt/${p.id}`}
                className="font-bold text-forge-ink text-sm hover:text-forge-orange transition-colors truncate"
              >
                {p.title}
              </Link>
              {p.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {p.tags.slice(0, 2).map((t) => (
                    <span
                      key={t.tag.slug}
                      className="text-[10px] font-semibold text-forge-muted bg-forge-silver rounded px-1.5 py-0.5"
                    >
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div className="hidden md:flex items-center">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
                {p.category}
              </span>
            </div>

            {/* Author */}
            <div className="hidden md:flex items-center min-w-0">
              <Link
                href={`/profile/${p.author.username}`}
                className="text-xs font-semibold text-forge-muted hover:text-forge-orange transition-colors truncate"
              >
                @{p.author.username}
              </Link>
            </div>

            {/* Upvotes */}
            <div className="hidden md:flex items-center justify-end">
              <span className="text-sm font-black text-forge-ink">
                {p.upvoteCount.toLocaleString()}
              </span>
            </div>

            {/* ELO */}
            <div className="hidden lg:flex items-center justify-end">
              <span className="text-sm font-bold text-forge-muted">{p.author.eloRating}</span>
            </div>

            {/* Forks */}
            <div className="hidden lg:flex items-center justify-end">
              <span className="text-sm font-bold text-forge-muted">{p._count.forks}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Tab: Top Creators ──────────────────────────────────────────────────────
function TopCreatorsTab({ creators }: { creators: CreatorEntry[] }) {
  return (
    <div className="rounded-2xl border-2 border-forge-border bg-white shadow-[4px_4px_0_#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[52px_1fr_80px_80px_100px] px-5 py-3 border-b-2 border-forge-border bg-forge-silver/50">
        {['#', 'Creator', 'Prompts', 'Followers', 'ELO'].map((h) => (
          <div key={h} className={`text-[10px] font-black text-forge-muted uppercase tracking-wider ${h === '#' || h === 'Creator' ? '' : 'text-right'}`}>
            {h}
          </div>
        ))}
      </div>

      {creators.map((u, i) => (
        <motion.div
          key={u.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={[
            'grid grid-cols-[52px_1fr_80px_80px_100px] px-5 py-4',
            'transition-colors hover:bg-forge-silver/30',
            i < creators.length - 1 ? 'border-b border-forge-border/50' : '',
          ].join(' ')}
        >
          {/* Rank */}
          <div className="flex items-center">
            {i < 3 ? (
              <MedalIcon rank={i} />
            ) : (
              <span className={`font-display font-black text-xl ${rankStyle(i)}`}>{i + 1}</span>
            )}
          </div>

          {/* Creator info */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
              style={{ backgroundColor: getAvatarColor(u.username) }}
            >
              {(u.displayName ?? u.username).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link
                href={`/profile/${u.username}`}
                className="flex items-center gap-1.5 font-bold text-forge-ink text-sm hover:text-forge-orange transition-colors"
              >
                {u.displayName ?? u.username}
                {u.isPremium && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
              </Link>
              <p className="text-xs text-forge-muted truncate">@{u.username}</p>
            </div>
          </div>

          {/* Prompts */}
          <div className="flex items-center justify-end">
            <span className="text-sm font-black text-forge-ink">{u._count.prompts}</span>
          </div>

          {/* Followers */}
          <div className="flex items-center justify-end">
            <span className="text-sm font-bold text-forge-muted">
              {u._count.followers.toLocaleString()}
            </span>
          </div>

          {/* ELO */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1 rounded-lg bg-forge-black px-2.5 py-1">
              <Zap className="h-3 w-3 text-forge-orange fill-forge-orange" />
              <span className="text-sm font-black text-white">{u.eloRating}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Tab: Category Champions ────────────────────────────────────────────────
function CategoryChampionsTab({ champions }: { champions: CategoryChampion[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {champions.map((c, i) => {
        const style = (CATEGORY_STYLES[c.category] ?? CATEGORY_STYLES.OTHER) as { bg: string; text: string; border: string }
        return (
          <motion.div
            key={c.category}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-2xl border-2 p-5 ${style.bg} ${style.border} shadow-[3px_3px_0_#0A0A0A]`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
                {c.category}
              </span>
              <Crown className="h-4 w-4 text-amber-500" />
            </div>

            {c.prompt ? (
              <>
                <Link
                  href={`/prompt/${c.prompt.id}`}
                  className="font-display font-black text-forge-ink text-base leading-tight hover:text-forge-orange transition-colors line-clamp-2 block mb-3"
                >
                  {c.prompt.title}
                </Link>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/profile/${c.prompt.author.username}`}
                    className="text-xs font-semibold text-forge-muted hover:text-forge-orange transition-colors truncate"
                  >
                    by {c.prompt.author.displayName ?? c.prompt.author.username}
                  </Link>
                  <div className="flex items-center gap-1 text-xs font-bold text-forge-muted shrink-0">
                    <ChevronUp className="h-3.5 w-3.5" />
                    {c.prompt.upvoteCount.toLocaleString()}
                  </div>
                </div>
                <Link
                  href={`/browse?category=${c.category}`}
                  className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${style.text} hover:underline`}
                >
                  Browse {c.category} <span>→</span>
                </Link>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-forge-muted text-sm">
                  <Sparkles className="h-4 w-4" />
                  No champion yet
                </div>
                <Link
                  href={`/browse?category=${c.category}`}
                  className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${style.text} hover:underline`}
                >
                  Browse {c.category} <span>→</span>
                </Link>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'prompts' | 'creators' | 'champions'>('prompts')

  useEffect(() => {
    fetch('/api/battle/leaderboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const tabs = [
    { id: 'prompts'   as const, label: 'Top Prompts',        icon: Trophy  },
    { id: 'creators'  as const, label: 'Top Creators',       icon: Users   },
    { id: 'champions' as const, label: 'Category Champions', icon: Crown   },
  ]

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-forge-black text-white pt-24 pb-16 text-center relative overflow-hidden">
        {/* Background glows */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 50%, #FF6B2B 0%, transparent 60%), radial-gradient(circle at 70% 50%, #7C3AED 0%, transparent 60%)',
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 px-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-forge-orange/30 bg-forge-orange/10 px-4 py-1.5 text-forge-orange text-xs font-black uppercase tracking-widest mb-6">
            <Trophy className="h-3.5 w-3.5" />
            Community Rankings
          </div>

          <h1
            className="font-display font-black text-white leading-none"
            style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', letterSpacing: '-0.04em' }}
          >
            LEADER
            <br />
            <span className="text-forge-orange">BOARD</span>
          </h1>

          <p className="mt-6 text-white/60 max-w-lg mx-auto text-base leading-relaxed">
            The best prompts, top creators, and category champions — all ranked by the community.
          </p>

          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link href="/battle" className="btn-orange">
              <Zap className="h-4 w-4" />
              Battle Arena
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-5 py-2.5 text-sm font-black text-white transition-all hover:border-white/40 hover:bg-white/10"
            >
              Browse Prompts
            </Link>
          </div>
        </motion.div>

        {/* Quick stats */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 mt-12 flex justify-center gap-10 flex-wrap px-6"
          >
            {[
              { label: 'Ranked Prompts',  value: data.topPrompts.length },
              { label: 'Top Creators',    value: data.topCreators.length },
              { label: 'Categories',      value: data.categoryChampions.filter((c) => c.prompt).length },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display font-black text-3xl text-white leading-none">{s.value}</div>
                <div className="text-xs text-white/40 font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Tab nav ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-forge-border sticky top-16 z-30">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                  active ? 'text-forge-ink' : 'text-forge-muted hover:text-forge-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-forge-orange"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-white border-2 border-forge-border animate-pulse"
              />
            ))}
          </div>
        ) : data ? (
          <>
            {activeTab === 'prompts' && (
              <TopPromptsTab prompts={data.topPrompts} />
            )}
            {activeTab === 'creators' && (
              <TopCreatorsTab creators={data.topCreators} />
            )}
            {activeTab === 'champions' && (
              <CategoryChampionsTab champions={data.categoryChampions} />
            )}
          </>
        ) : (
          <div className="text-center py-16 text-forge-muted">
            Failed to load leaderboard data.
          </div>
        )}
      </div>
    </div>
  )
}
