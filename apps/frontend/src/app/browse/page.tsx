'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, TrendingUp, GitFork, Eye, Heart, Star, Play,
  Code2, PenTool, BarChart3, Briefcase, GraduationCap,
  Lightbulb, FlaskConical, HelpCircle, Loader2, X, ArrowRight,
  Zap, Sparkles,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import PromptDNA from '@/components/ui/PromptDNA'
import TrendingTags from '@/components/browse/TrendingTags'

// ── Types ──────────────────────────────────────────────────────────────────────
interface PromptAuthor {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  isPremium: boolean
}

interface PromptItem {
  id: string
  title: string
  description: string
  category: string
  isPublic: boolean
  isPremium: boolean
  upvoteCount: number
  viewCount: number
  forkCount: number
  downloadCount: number
  createdAt: string
  author: PromptAuthor
  tags: Array<{ tag: { id: string; name: string; slug: string } }>
  _count: { upvotes: number; comments: number; forks: number; executions: number }
  latestVersion: {
    content: string
    variables: Array<{ name: string; description: string; default?: string }>
  } | null
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
  { id: 'popular',  label: 'Popular' },
  { id: 'newest',   label: 'Newest' },
  { id: 'trending', label: 'Trending' },
  { id: 'forked',   label: 'Most Forked' },
]

const CATEGORY_COLORS: Record<string, string> = {
  CODING:     'bg-blue-100 text-blue-700',
  WRITING:    'bg-green-100 text-green-700',
  BUSINESS:   'bg-purple-100 text-purple-700',
  ANALYSIS:   'bg-yellow-100 text-yellow-700',
  EDUCATION:  'bg-pink-100 text-pink-700',
  CREATIVITY: 'bg-orange-100 text-forge-orange',
  RESEARCH:   'bg-cyan-100 text-cyan-700',
  ROLEPLAY:   'bg-rose-100 text-rose-700',
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
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Format runs count ──────────────────────────────────────────────────────────
function formatRuns(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

// ── Bookmark helpers ───────────────────────────────────────────────────────────
function getBookmarks(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('pf-bookmarks') ?? '[]')
  } catch {
    return []
  }
}

function toggleBookmark(id: string): boolean {
  const current = getBookmarks()
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
  localStorage.setItem('pf-bookmarks', JSON.stringify(next))
  return next.includes(id)
}

// ── PromptCard ─────────────────────────────────────────────────────────────────
function PromptCard({ prompt, index }: { prompt: PromptItem; index: number }) {
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    setBookmarked(getBookmarks().includes(prompt.id))
  }, [prompt.id])

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    setBookmarked(toggleBookmark(prompt.id))
  }

  const catColor = CATEGORY_COLORS[prompt.category] ?? 'bg-gray-100 text-gray-700'
  const visibleTags = prompt.tags.slice(0, 3)
  const extraTagCount = prompt.tags.length - 3

  // DNA content: prefer latestVersion content, fall back to description + title
  const dnaContent = prompt.latestVersion?.content
    ? prompt.latestVersion.content.slice(0, 200)
    : (prompt.description || prompt.title)

  const runCount = prompt._count?.executions ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col rounded-2xl border-2 border-forge-border bg-white transition-all duration-200 hover:border-forge-ink hover:shadow-[4px_4px_0_#1A1A1A]"
    >
      <div className="flex flex-col gap-3 p-5">
        {/* Author + category badge + DNA */}
        <div className="flex items-center justify-between gap-2">
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
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${catColor}`}>
              {prompt.category}
            </span>
            <PromptDNA
              content={dnaContent}
              category={prompt.category}
              size={28}
              title={`Prompt DNA for "${prompt.title}"`}
            />
          </div>
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
          {runCount > 0 && (
            <span className="flex items-center gap-1 text-forge-orange">
              <Zap className="h-3 w-3" />
              {formatRuns(runCount)} runs
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleBookmark}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            className={`rounded-lg p-1.5 transition-colors ${
              bookmarked
                ? 'text-forge-orange'
                : 'text-forge-muted hover:text-forge-orange'
            }`}
          >
            <Star className="h-3.5 w-3.5" fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
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
        <div className="h-5 w-20 animate-pulse rounded-full bg-forge-silver" />
      </div>
      <div className="mt-2 flex items-center justify-between border-t-2 border-forge-border pt-3">
        <div className="flex gap-3">
          <div className="h-3 w-8 animate-pulse rounded-full bg-forge-border" />
          <div className="h-3 w-8 animate-pulse rounded-full bg-forge-border" />
          <div className="h-3 w-8 animate-pulse rounded-full bg-forge-border" />
        </div>
        <div className="h-6 w-12 animate-pulse rounded-lg bg-forge-border" />
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BrowsePage() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sort, setSort] = useState('popular')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [enhancedResults, setEnhancedResults] = useState<PromptItem[]>([])
  const [enhancedLoading, setEnhancedLoading] = useState(false)
  const [semanticMode, setSemanticMode] = useState(false)
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setDebouncedQuery(searchQuery)
      setPage(1)

      if (searchQuery.length > 2) {
        setEnhancedLoading(true)
        try {
          const mode = semanticMode ? 'semantic' : 'text'
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=6&mode=${mode}`)
          if (res.ok) {
            const data = await res.json()
            setEnhancedResults(data.prompts ?? [])
          }
        } catch {
          // silently ignore enhanced search errors
        } finally {
          setEnhancedLoading(false)
        }
      } else {
        setEnhancedResults([])
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, semanticMode])

  const fetchPrompts = useCallback(
    async (pageNum: number, append = false) => {
      if (append) setLoadingMore(true)
      else setLoading(true)

      try {
        const params = new URLSearchParams()
        if (selectedCategory) params.set('category', selectedCategory)
        params.set('sort', sort)
        if (debouncedQuery) params.set('q', debouncedQuery)
        if (activeTag) params.set('tags', activeTag)
        params.set('page', String(pageNum))
        params.set('limit', '9')

        const res = await fetch(`/api/prompts?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()

        setPrompts((prev) => (append ? [...prev, ...data.prompts] : data.prompts))
        setTotal(data.total)
        setPages(data.pages)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [selectedCategory, sort, debouncedQuery, activeTag],
  )

  useEffect(() => {
    fetchPrompts(1, false)
    setPage(1)
  }, [fetchPrompts])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPrompts(next, true)
  }

  const handleCategoryChange = (id: string) => {
    setSelectedCategory(id)
    setPage(1)
  }

  const handleSortChange = (id: string) => {
    setSort(id)
    setPage(1)
  }

  const handleTagClick = (tagName: string) => {
    setActiveTag(prev => prev === tagName ? undefined : tagName)
    setPage(1)
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSort('popular')
    setSearchQuery('')
    setDebouncedQuery('')
    setPage(1)
    setEnhancedResults([])
    setActiveTag(undefined)
  }

  const hasActiveFilters = selectedCategory !== '' || debouncedQuery !== '' || activeTag !== undefined

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      {/* Page header */}
      <div className="border-b-2 border-forge-border bg-white pt-24 pb-8">
        <div className="container-forge">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-label mb-2">Community Library</div>
              <h1
                className="font-display font-black text-forge-ink"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                EXPLORE
                <br />
                <span className="text-gradient">
                  {loading && prompts.length === 0
                    ? '···'
                    : `${total.toLocaleString()} PROMPTS`}
                </span>
              </h1>
            </div>

            {/* Search + semantic toggle */}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forge-muted" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-2 border-forge-border bg-forge-silver py-2.5 pl-9 pr-9 text-sm font-medium text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-muted hover:text-forge-ink transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {/* Semantic search toggle */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setSemanticMode(prev => !prev)}
                  className={`flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-[11px] font-bold transition-all ${
                    semanticMode
                      ? 'border-forge-orange bg-forge-orange/10 text-forge-orange'
                      : 'border-forge-border bg-white text-forge-muted hover:border-forge-ink hover:text-forge-ink'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  Semantic Search
                </button>
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all
                    ${
                      active
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
        {/* Sort + results bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSortChange(opt.id)}
                className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all
                  ${
                    sort === opt.id
                      ? 'border-forge-orange bg-forge-orange text-white'
                      : 'border-forge-border bg-white text-forge-muted hover:border-forge-ink hover:text-forge-ink'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!loading && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-forge-muted">
                  {total.toLocaleString()} prompts
                </span>
                {semanticMode && debouncedQuery.length > 2 && (
                  <span className="flex items-center gap-1 rounded-full bg-forge-orange/10 px-2 py-0.5 text-[10px] font-black text-forge-orange">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI-powered
                  </span>
                )}
              </div>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg border-2 border-forge-border bg-white px-3 py-1.5 text-xs font-bold text-forge-muted transition-all hover:border-forge-orange hover:text-forge-orange"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Active tag pill */}
        {activeTag && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-forge-muted">Filtering by tag:</span>
            <button
              onClick={() => setActiveTag(undefined)}
              className="flex items-center gap-1 rounded-full border border-forge-orange/30 bg-forge-orange/10 px-3 py-1 text-xs font-bold text-forge-orange hover:bg-forge-orange/20 transition-colors"
            >
              #{activeTag}
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Two-column layout: main grid + sidebar */}
        <div className="flex gap-6">
          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Top Matches (enhanced semantic search) */}
            {debouncedQuery.length > 2 && (enhancedLoading || enhancedResults.length > 0) && (
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <div className="section-label">Top Matches</div>
                  {semanticMode && (
                    <span className="flex items-center gap-1 rounded-full bg-forge-orange/10 px-2 py-0.5 text-[10px] font-black text-forge-orange">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI-powered
                    </span>
                  )}
                  {enhancedLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-forge-muted" />
                  )}
                </div>
                {enhancedLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {enhancedResults.map((prompt, i) => (
                      <PromptCard key={prompt.id} prompt={prompt} index={i} />
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* Grid */}
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
                  {Array.from({ length: 9 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </motion.div>
              ) : prompts.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {prompts.map((prompt, i) => (
                    <PromptCard key={prompt.id} prompt={prompt} index={i} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-6 py-24 text-center"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-forge-border bg-white">
                    <Search className="h-8 w-8 text-forge-border" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-black text-forge-ink">
                      No prompts found
                    </h3>
                    <p className="mt-2 text-sm text-forge-muted">
                      {hasActiveFilters
                        ? 'Try adjusting your filters or search query.'
                        : 'No public prompts have been published yet.'}
                    </p>
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="btn-orange">
                      Clear Filters <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Appended load-more skeletons */}
            {loadingMore && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Load More button */}
            {!loading && !loadingMore && page < pages && (
              <div className="mt-10 flex justify-center">
                <button onClick={handleLoadMore} className="btn-ghost flex items-center gap-2">
                  <Loader2 className="h-4 w-4" />
                  Load More Prompts
                </button>
              </div>
            )}
          </div>

          {/* Right sidebar — Trending Tags (desktop only) */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-24">
              <TrendingTags onTagClick={handleTagClick} activeTag={activeTag} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
