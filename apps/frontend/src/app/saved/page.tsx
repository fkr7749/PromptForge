'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  X,
  Play,
  Heart,
  GitFork,
  Eye,
  TrendingUp,
  Code2,
  PenTool,
  Briefcase,
  BarChart3,
  GraduationCap,
  Lightbulb,
  FlaskConical,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'

// ── Types ──────────────────────────────────────────────────────────────────────
interface SavedPrompt {
  id: string
  title: string
  description: string
  category: string
  upvoteCount: number
  viewCount: number
  forkCount: number
  createdAt: string
  author: { username: string; displayName: string }
  tags: Array<{ tag: { id: string; name: string; slug: string } }>
  _count: { executions: number; upvotes: number; forks: number }
}

interface SavedItem {
  id: string
  addedAt: string
  prompt: SavedPrompt
}

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: '',           label: 'All',        icon: TrendingUp },
  { id: 'CODING',     label: 'Coding',     icon: Code2 },
  { id: 'WRITING',    label: 'Writing',    icon: PenTool },
  { id: 'BUSINESS',   label: 'Business',   icon: Briefcase },
  { id: 'ANALYSIS',   label: 'Analysis',   icon: BarChart3 },
  { id: 'EDUCATION',  label: 'Education',  icon: GraduationCap },
  { id: 'CREATIVITY', label: 'Creativity', icon: Lightbulb },
  { id: 'RESEARCH',   label: 'Research',   icon: FlaskConical },
  { id: 'OTHER',      label: 'Other',      icon: HelpCircle },
]

const SORT_OPTIONS = [
  { id: 'saved',    label: 'Recently Saved' },
  { id: 'upvotes',  label: 'Most Upvoted' },
  { id: 'newest',   label: 'Newest' },
]

const CATEGORY_COLORS: Record<string, string> = {
  CODING:     'bg-blue-100 text-blue-700',
  WRITING:    'bg-green-100 text-green-700',
  BUSINESS:   'bg-purple-100 text-purple-700',
  ANALYSIS:   'bg-yellow-100 text-yellow-700',
  EDUCATION:  'bg-pink-100 text-pink-700',
  CREATIVITY: 'bg-orange-100 text-forge-orange',
  RESEARCH:   'bg-cyan-100 text-cyan-700',
  OTHER:      'bg-gray-100 text-gray-700',
}

// ── Avatar helpers ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
]
function avatarColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Skeleton card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-forge-border bg-white p-5">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 animate-pulse rounded-full bg-forge-border" />
        <div className="h-3 w-24 animate-pulse rounded-full bg-forge-border" />
        <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-forge-border" />
      </div>
      <div className="h-5 w-3/4 animate-pulse rounded-lg bg-forge-border" />
      <div className="space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded-full bg-forge-silver" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-forge-silver" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-16 animate-pulse rounded-full bg-forge-silver" />
        <div className="h-5 w-14 animate-pulse rounded-full bg-forge-silver" />
      </div>
      <div className="mt-2 flex items-center justify-between border-t-2 border-forge-border pt-3">
        <div className="flex gap-3">
          <div className="h-3 w-8 animate-pulse rounded-full bg-forge-border" />
          <div className="h-3 w-8 animate-pulse rounded-full bg-forge-border" />
          <div className="h-3 w-8 animate-pulse rounded-full bg-forge-border" />
        </div>
        <div className="h-7 w-24 animate-pulse rounded-lg bg-forge-border" />
      </div>
    </div>
  )
}

// ── SavedCard ──────────────────────────────────────────────────────────────────
interface SavedCardProps {
  item: SavedItem
  index: number
  collections: Array<{ id: string; name: string }>
  accessToken: string
  onRemove: (promptId: string) => void
}

function SavedCard({ item, index, collections, accessToken, onRemove }: SavedCardProps) {
  const { prompt } = item
  const [removing, setRemoving] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [movingTo, setMovingTo] = useState<string | null>(null)

  const catColor = CATEGORY_COLORS[prompt.category] ?? 'bg-gray-100 text-gray-700'
  const visibleTags = prompt.tags.slice(0, 3)
  const extraTagCount = prompt.tags.length - 3

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await fetch('/api/users/me/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ promptId: prompt.id, action: 'remove' }),
      })
      onRemove(prompt.id)
    } catch {
      setRemoving(false)
    }
  }

  const handleMoveToCollection = async (collectionId: string) => {
    setMovingTo(collectionId)
    setDropdownOpen(false)
    try {
      await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ promptId: prompt.id }),
      })
    } catch {
      // silently ignore
    } finally {
      setMovingTo(null)
    }
  }

  // Other collections (exclude "Saved")
  const otherCollections = collections.filter((c) => c.name !== 'Saved')

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col rounded-2xl border-2 border-forge-border bg-white transition-all duration-200 hover:border-forge-ink hover:shadow-[4px_4px_0_#1A1A1A]"
    >
      {/* Remove button */}
      <button
        onClick={handleRemove}
        disabled={removing}
        title="Remove from saved"
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg border-2 border-forge-border bg-white text-forge-muted opacity-0 transition-all group-hover:opacity-100 hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
      >
        {removing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="flex flex-col gap-3 p-5">
        {/* Author + category badge */}
        <div className="flex items-center justify-between gap-2 pr-8">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${avatarColor(prompt.author.username)}`}
            >
              {initials(prompt.author.displayName || prompt.author.username)}
            </div>
            <span className="text-xs font-semibold text-forge-muted">
              @{prompt.author.username}
            </span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${catColor}`}>
            {prompt.category}
          </span>
        </div>

        {/* Title */}
        <Link href={`/prompt/${prompt.id}`}>
          <h3 className="font-display text-base font-black leading-tight text-forge-ink transition-colors group-hover:text-forge-orange">
            {prompt.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="line-clamp-2 text-sm leading-relaxed text-forge-muted">
          {prompt.description}
        </p>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full border border-forge-border bg-forge-silver px-2 py-0.5 text-[11px] font-bold text-forge-muted"
              >
                #{tag.name}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="rounded-full border border-forge-border bg-forge-silver px-2 py-0.5 text-[11px] font-bold text-forge-muted">
                +{extraTagCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t-2 border-forge-border px-5 py-3">
        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-forge-muted">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {prompt.upvoteCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {prompt.forkCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {prompt.viewCount > 999
              ? `${(prompt.viewCount / 1000).toFixed(1)}k`
              : prompt.viewCount}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Move to collection dropdown */}
          {otherCollections.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                disabled={movingTo !== null}
                className="flex items-center gap-1 rounded-lg border-2 border-forge-border px-2 py-1 text-[11px] font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink"
              >
                {movingTo ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    Move
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full right-0 mb-1 z-20 min-w-[140px] rounded-xl border-2 border-forge-border bg-white shadow-lg"
                  >
                    <div className="p-1">
                      {otherCollections.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => handleMoveToCollection(col.id)}
                          className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-forge-ink hover:bg-forge-silver"
                        >
                          {col.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <Link
            href={`/playground?promptId=${prompt.id}`}
            className="flex items-center gap-1 rounded-lg border-2 border-forge-border px-2.5 py-1 text-[11px] font-bold text-forge-muted transition-all hover:border-forge-orange hover:bg-orange-50 hover:text-forge-orange"
          >
            <Play className="h-3 w-3" />
            Try
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SavedPage() {
  const { user, accessToken } = useAuthStore()
  const router = useRouter()

  const [items, setItems] = useState<SavedItem[]>([])
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sort, setSort] = useState('saved')

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Fetch saved items and user collections
  const fetchData = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const [savedRes, collectionsRes] = await Promise.all([
        fetch('/api/users/me/saved', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/collections', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])

      if (savedRes.ok) {
        const data = await savedRes.json() as { items: SavedItem[] }
        setItems(data.items)
      }
      if (collectionsRes.ok) {
        const data = await collectionsRes.json() as { collections: Array<{ id: string; name: string }> }
        setCollections(data.collections)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (user && accessToken) fetchData()
  }, [user, accessToken, fetchData])

  const handleRemove = (promptId: string) => {
    setItems((prev) => prev.filter((item) => item.prompt.id !== promptId))
  }

  // Filter + sort
  const filteredItems = items
    .filter((item) => !selectedCategory || item.prompt.category === selectedCategory)
    .sort((a, b) => {
      if (sort === 'saved') return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      if (sort === 'upvotes') return b.prompt.upvoteCount - a.prompt.upvoteCount
      if (sort === 'newest') return new Date(b.prompt.createdAt).getTime() - new Date(a.prompt.createdAt).getTime()
      return 0
    })

  if (!user) return null

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      {/* Page header */}
      <div className="border-b-2 border-forge-border bg-white pt-24 pb-8">
        <div className="container-forge">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-label mb-2">Your Collection</div>
              <h1
                className="flex items-center gap-3 font-display font-black text-forge-ink"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
              >
                SAVED PROMPTS
                {!loading && (
                  <span className="inline-flex items-center rounded-full bg-forge-orange px-3 py-1 font-display text-base font-black text-white">
                    {items.length}
                  </span>
                )}
              </h1>
              <p className="mt-2 text-sm text-forge-muted">
                Your curated collection of prompts to revisit
              </p>
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSort(opt.id)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all
                    ${sort === opt.id
                      ? 'border-forge-orange bg-forge-orange text-white'
                      : 'border-forge-border bg-white text-forge-muted hover:border-forge-ink hover:text-forge-ink'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter chips */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all
                    ${active
                      ? 'border-forge-ink bg-forge-ink text-white shadow-[2px_2px_0_#FF6B2B]'
                      : 'border-forge-border bg-white text-forge-muted hover:border-forge-ink hover:text-forge-ink'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="container-forge py-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : filteredItems.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence>
                {filteredItems.map((item, i) => (
                  <SavedCard
                    key={item.prompt.id}
                    item={item}
                    index={i}
                    collections={collections}
                    accessToken={accessToken ?? ''}
                    onRemove={handleRemove}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : items.length === 0 ? (
            /* Empty state — nothing saved at all */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6 py-24 text-center"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-forge-border bg-white">
                <Bookmark className="h-10 w-10 text-forge-orange" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-black text-forge-ink">
                  Nothing saved yet
                </h3>
                <p className="mt-2 max-w-xs text-sm text-forge-muted">
                  Discover prompts and save them here to build your personal toolkit.
                </p>
              </div>
              <Link href="/browse" className="btn-orange">
                Browse Prompts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            /* Filtered empty state */
            <motion.div
              key="filtered-empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6 py-24 text-center"
            >
              <div>
                <h3 className="font-display text-2xl font-black text-forge-ink">
                  No prompts in this category
                </h3>
                <p className="mt-2 text-sm text-forge-muted">
                  Try a different filter or save more prompts.
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory('')}
                className="btn-orange"
              >
                Show All Saved
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
