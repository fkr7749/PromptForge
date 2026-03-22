'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Star,
  ChevronUp,
  Tag,
  User,
  Lock,
  Sparkles,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketplacePrompt {
  id: string
  title: string
  description: string | null
  price: number | null
  category: string
  upvoteCount: number
  preview: string | null
  author: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    isPremium: boolean
  }
  tags: { tag: { id: string; name: string; slug: string } }[]
  _count: { upvotes: number; comments: number; forks: number; executions: number }
}

type SortOption = 'popular' | 'price_asc' | 'price_desc'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: '',           label: 'All Categories' },
  { id: 'CODING',     label: 'Coding'         },
  { id: 'WRITING',    label: 'Writing'        },
  { id: 'ANALYSIS',   label: 'Analysis'       },
  { id: 'CREATIVITY', label: 'Creativity'     },
  { id: 'EDUCATION',  label: 'Education'      },
  { id: 'BUSINESS',   label: 'Business'       },
  { id: 'RESEARCH',   label: 'Research'       },
  { id: 'ROLEPLAY',   label: 'Roleplay'       },
  { id: 'OTHER',      label: 'Other'          },
]

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'popular',    label: 'Most Popular'  },
  { id: 'price_asc',  label: 'Price: Low → High' },
  { id: 'price_desc', label: 'Price: High → Low' },
]

const CATEGORY_COLORS: Record<string, string> = {
  CODING:     'bg-blue-100 text-blue-700',
  WRITING:    'bg-green-100 text-green-700',
  ANALYSIS:   'bg-yellow-100 text-yellow-700',
  CREATIVITY: 'bg-orange-100 text-forge-orange',
  EDUCATION:  'bg-pink-100 text-pink-700',
  BUSINESS:   'bg-purple-100 text-purple-700',
  RESEARCH:   'bg-cyan-100 text-cyan-700',
  ROLEPLAY:   'bg-rose-100 text-rose-700',
  OTHER:      'bg-gray-100 text-gray-700',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number | null | unknown): string {
  const n = Number(price)
  if (price === null || isNaN(n) || n === 0) return 'Free'
  return `$${n.toFixed(2)}`
}

const AVATAR_BG = [
  '#FF6B2B', '#00C27C', '#7C3AED', '#FFB800',
  '#E84040', '#0EA5E9', '#EC4899', '#14B8A6',
]

function avatarBg(username: string): string {
  return AVATAR_BG[username.charCodeAt(0) % AVATAR_BG.length] ?? '#FF6B2B'
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string
  onClose: () => void
}

function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2"
    >
      <div className="flex items-center gap-3 rounded-2xl border-2 border-forge-amber bg-forge-ink px-5 py-4 shadow-[4px_4px_0_#FFB800]">
        <Sparkles className="h-5 w-5 shrink-0 text-forge-amber" />
        <p className="max-w-sm text-sm font-bold text-white">{message}</p>
        <button
          onClick={onClose}
          className="ml-1 text-white/50 transition-colors hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-forge-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 animate-pulse rounded-lg bg-forge-border" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-forge-border" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-forge-silver" />
      </div>
      <div className="h-5 w-4/5 animate-pulse rounded-lg bg-forge-border" />
      <div className="space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded-full bg-forge-silver" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-forge-silver" />
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-forge-silver" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-14 animate-pulse rounded-full bg-forge-silver" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-forge-silver" />
      </div>
      <div className="mt-auto flex items-center justify-between border-t-2 border-forge-border pt-3">
        <div className="h-6 w-12 animate-pulse rounded-lg bg-forge-border" />
        <div className="h-8 w-24 animate-pulse rounded-xl bg-forge-border" />
      </div>
    </div>
  )
}

// ── Prompt Card ───────────────────────────────────────────────────────────────

interface PromptCardProps {
  prompt: MarketplacePrompt
  index: number
  isPurchased: boolean
  isPurchasing: boolean
  onPurchase: (promptId: string) => void
}

function PromptCard({ prompt, index, isPurchased, isPurchasing, onPurchase }: PromptCardProps) {
  const isFeatured = prompt.upvoteCount > 10
  const isFree = !prompt.price || prompt.price === 0
  const catColor = CATEGORY_COLORS[prompt.category] ?? 'bg-gray-100 text-gray-700'
  const visibleTags = prompt.tags.slice(0, 2)
  const authorName = prompt.author.displayName || prompt.author.username
  const bg = avatarBg(prompt.author.username)

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative flex flex-col rounded-2xl border-2 border-forge-border bg-white transition-all duration-200 hover:border-forge-ink hover:shadow-[4px_4px_0_#1A1A1A]"
    >
      {/* Featured badge */}
      {isFeatured && (
        <div className="absolute -top-3 left-4 z-10 flex items-center gap-1 rounded-full bg-forge-amber px-3 py-0.5 shadow-[2px_2px_0_#0A0A0A]">
          <Star className="h-3 w-3 fill-forge-ink text-forge-ink" />
          <span className="text-[10px] font-black uppercase tracking-wide text-forge-ink">
            Featured
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 p-5 pb-4">
        {/* Author row + category badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {prompt.author.avatarUrl ? (
              <img
                src={prompt.author.avatarUrl}
                alt={authorName}
                className="h-6 w-6 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white"
                style={{ backgroundColor: bg }}
              >
                {initials(authorName)}
              </div>
            )}
            <span className="flex items-center gap-1 text-xs font-semibold text-forge-muted">
              <User className="h-3 w-3" />
              @{prompt.author.username}
              {prompt.author.isPremium && (
                <Sparkles className="h-3 w-3 text-forge-amber" />
              )}
            </span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${catColor}`}>
            {prompt.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-black leading-tight text-forge-ink transition-colors group-hover:text-forge-orange line-clamp-2">
          {prompt.title}
        </h3>

        {/* Description */}
        {prompt.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-forge-muted">
            {prompt.description}
          </p>
        )}

        {/* Preview teaser if locked */}
        {!isFree && !isPurchased && prompt.preview && (
          <div className="relative overflow-hidden rounded-xl border border-forge-border bg-forge-silver p-3">
            <p className="line-clamp-2 text-xs text-forge-muted opacity-60">
              {prompt.preview}
            </p>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[2px]">
              <div className="flex items-center gap-1.5 rounded-lg border-2 border-forge-border bg-white px-3 py-1.5">
                <Lock className="h-3.5 w-3.5 text-forge-muted" />
                <span className="text-xs font-bold text-forge-muted">Preview locked</span>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="h-3 w-3 text-forge-muted/60" />
            {visibleTags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full border border-forge-border bg-forge-silver px-2 py-0.5 text-[11px] font-bold text-forge-muted"
              >
                #{tag.name}
              </span>
            ))}
            {prompt.tags.length > 2 && (
              <span className="text-[11px] font-bold text-forge-muted/60">
                +{prompt.tags.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="mt-auto flex items-center justify-between border-t-2 border-forge-border px-5 py-3">
        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-forge-muted">
          <span className="flex items-center gap-1">
            <ChevronUp className="h-3.5 w-3.5" />
            {prompt.upvoteCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            {prompt._count.executions.toLocaleString()} runs
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center gap-2">
          {/* Price badge */}
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-black ${
              isFree
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-forge-orange text-white shadow-[2px_2px_0_#0A0A0A]'
            }`}
          >
            {formatPrice(prompt.price)}
          </span>

          {isPurchased ? (
            <span className="flex items-center gap-1 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
              <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
              Owned
            </span>
          ) : (
            <button
              onClick={() => onPurchase(prompt.id)}
              disabled={isPurchasing}
              className="flex items-center gap-1.5 rounded-xl border-2 border-forge-orange bg-forge-orange px-3 py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#0A0A0A] transition-all hover:bg-[#e85e22] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={isFree ? 'Get for free' : `Purchase for ${formatPrice(prompt.price)}`}
            >
              {isPurchasing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShoppingBag className="h-3.5 w-3.5" />
              )}
              {isFree ? 'Get Free' : 'Purchase'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { user, accessToken } = useAuthStore()

  // Filters & pagination
  const [category, setCategory] = useState<string>('')
  const [sort, setSort] = useState<SortOption>('popular')
  const [page, setPage] = useState<number>(1)

  // Data
  const [prompts, setPrompts] = useState<MarketplacePrompt[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)

  // Purchase state
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  const dismissToast = useCallback(() => setToast(null), [])

  // ── Fetch prompts ────────────────────────────────────────────────────────────

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      params.set('sort', sort)
      params.set('page', String(page))

      const res = await fetch(`/api/marketplace?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch marketplace prompts')

      const data: { prompts: MarketplacePrompt[]; total: number; page: number; pages: number } =
        await res.json()

      setPrompts(data.prompts ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.pages ?? 1)
    } catch (err) {
      console.error(err)
      setPrompts([])
    } finally {
      setLoading(false)
    }
  }, [category, sort, page])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  // Reset to page 1 when filters change
  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  const handleSortChange = (s: SortOption) => {
    setSort(s)
    setPage(1)
  }

  // ── Purchase handler ─────────────────────────────────────────────────────────

  const handlePurchase = useCallback(
    async (promptId: string) => {
      if (!user || !accessToken) {
        setToast('Please sign in to purchase prompts.')
        return
      }

      setPurchasing(promptId)
      try {
        const res = await fetch('/api/marketplace/purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ promptId }),
        })

        const data: { success?: boolean; requiresStripe?: boolean; message?: string } =
          await res.json()

        if (data.requiresStripe) {
          setToast(
            'Payment coming soon — this feature uses Stripe which will be configured soon. Stay tuned!'
          )
          return
        }

        if (res.ok && data.success) {
          setPurchasedIds((prev) => new Set([...prev, promptId]))
          setToast('Prompt unlocked successfully! Find it in your dashboard.')
        } else {
          setToast(data.message ?? 'Something went wrong. Please try again.')
        }
      } catch {
        setToast('Unable to complete purchase. Please check your connection and try again.')
      } finally {
        setPurchasing(null)
      }
    },
    [user, accessToken]
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-forge-ink pt-24 pb-16">
        {/* Background texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)',
          }}
        />
        {/* Glow orb */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-forge-orange opacity-10 blur-[100px]" />

        <div className="container-forge relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-5 text-center"
          >
            {/* Eyebrow label */}
            <div className="flex items-center gap-2 rounded-full border border-forge-orange/30 bg-forge-orange/10 px-4 py-1.5">
              <ShoppingBag className="h-4 w-4 text-forge-orange" />
              <span className="text-xs font-black uppercase tracking-widest text-forge-orange">
                Marketplace
              </span>
            </div>

            {/* Heading */}
            <h1
              className="font-display font-black text-white"
              style={{
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              Premium Prompts
              <br />
              <span style={{ color: '#FF6B2B' }}>Marketplace</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-lg text-base font-medium text-white/60">
              Hand-crafted, battle-tested prompts from top creators. Unlock
              capabilities that transform your AI workflow.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-6 pt-2">
              {[
                { icon: Sparkles, label: 'Curated Prompts', value: '500+' },
                { icon: Star,     label: 'Top Creators',   value: '120+' },
                { icon: ChevronUp,label: 'Community Votes', value: '50k+' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-forge-amber" />
                    <span className="font-display text-xl font-black text-white">{value}</span>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Coming Soon payment banner ── */}
      <div className="border-b-2 border-forge-amber/40 bg-forge-amber/10">
        <div className="container-forge flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-forge-amber" />
            <p className="text-sm font-bold text-forge-ink">
              <span className="text-forge-amber">Payments launching soon</span>
              {' '}— Stripe integration is being configured. Free prompts are available now!
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex shrink-0 items-center gap-1 text-xs font-black text-forge-amber transition-colors hover:text-forge-orange"
          >
            Learn more
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-16 z-30 border-b-2 border-forge-border bg-white/96 backdrop-blur-sm">
        <div className="container-forge py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category dropdown */}
            <div className="relative">
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="appearance-none rounded-xl border-2 border-forge-border bg-forge-silver py-2 pl-3 pr-8 text-sm font-bold text-forge-ink transition-colors focus:border-forge-orange focus:outline-none"
                aria-label="Filter by category"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronUp className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-180 text-forge-muted" />
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="appearance-none rounded-xl border-2 border-forge-border bg-forge-silver py-2 pl-3 pr-8 text-sm font-bold text-forge-ink transition-colors focus:border-forge-orange focus:outline-none"
                aria-label="Sort prompts"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronUp className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-180 text-forge-muted" />
            </div>

            {/* Result count */}
            {!loading && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-auto text-sm font-semibold text-forge-muted"
              >
                {total.toLocaleString()} {total === 1 ? 'prompt' : 'prompts'}
              </motion.span>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="container-forge py-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
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
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {prompts.map((prompt, i) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  index={i}
                  isPurchased={purchasedIds.has(prompt.id)}
                  isPurchasing={purchasing === prompt.id}
                  onPurchase={handlePurchase}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-6 py-28 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-forge-border bg-white">
                <ShoppingBag className="h-9 w-9 text-forge-border" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-black text-forge-ink">
                  No prompts found
                </h3>
                <p className="mt-2 text-sm text-forge-muted">
                  {category
                    ? 'No marketplace prompts in this category yet. Check back soon!'
                    : 'The marketplace is warming up. Premium prompts are on their way.'}
                </p>
              </div>
              {category && (
                <button
                  onClick={() => handleCategoryChange('')}
                  className="btn-orange flex items-center gap-2"
                >
                  View All Categories
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="mt-12 flex items-center justify-center gap-2"
          >
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-forge-border bg-white text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('...')
                }
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-sm text-forge-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all ${
                      page === p
                        ? 'border-forge-orange bg-forge-orange text-white shadow-[2px_2px_0_#0A0A0A]'
                        : 'border-forge-border bg-white text-forge-muted hover:border-forge-ink hover:text-forge-ink'
                    }`}
                    aria-label={`Go to page ${p}`}
                    aria-current={page === p ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-forge-border bg-white text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* ── CTA for unauthenticated users ── */}
        {!user && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-14 rounded-2xl border-2 border-forge-border bg-forge-ink p-8 text-center card-hard"
          >
            <div className="mb-3 flex justify-center">
              <Lock className="h-8 w-8 text-forge-orange" />
            </div>
            <h3 className="font-display text-xl font-black text-white">
              Sign in to Purchase Prompts
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">
              Create a free PromptForge account to access, purchase, and unlock
              premium prompts from top creators.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/register" className="btn-orange flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border-2 border-white/20 bg-white/5 px-5 py-2.5 text-sm font-black text-white transition-all hover:border-white/40 hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast} onClose={dismissToast} />}
      </AnimatePresence>
    </div>
  )
}
