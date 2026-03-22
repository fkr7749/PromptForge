'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Heart, GitFork, Eye, Download, Copy, Check, Play,
  ChevronDown, ChevronUp, Share2, ExternalLink, Loader2,
  MessageSquare, Clock, User, Star, GitBranch, Tag, Wand2,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'
import { AVAILABLE_MODELS } from '@/lib/models'
import AnalyticsDashboard from '@/components/prompt/AnalyticsDashboard'
import DiffViewer from '@/components/prompt/DiffViewer'
import RemixPanel from '@/components/prompt/RemixPanel'
import ShareButton from '@/components/ui/ShareButton'
import EvalHarness from '@/components/prompt/EvalHarness'
import ReleaseTimeline from '@/components/prompt/ReleaseTimeline'
import BenchmarkMatrix from '@/components/prompt/BenchmarkMatrix'
import LintPanel from '@/components/prompt/LintPanel'

// ── Types ──────────────────────────────────────────────────────────────────────
interface PromptVersion {
  id: string
  version: number
  content: string
  changelog: string | null
  variables: Array<{ name: string; description: string; default?: string }>
  createdAt: string
  author: { username: string; displayName: string }
}

interface PromptComment {
  id: string
  content: string
  upvotes: number
  createdAt: string
  author: { username: string; displayName: string; avatarUrl: null }
  _count: { replies: number }
}

interface PromptDetail {
  id: string
  title: string
  description: string
  category: string
  isPublic: boolean
  isPremium: boolean
  price: string | null
  upvoteCount: number
  viewCount: number
  forkCount: number
  downloadCount: number
  createdAt: string
  updatedAt: string
  authorId: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: null
    bio: string | null
    isPremium: boolean
    _count: { prompts: number; followers: number }
  }
  versions: PromptVersion[]
  tags: Array<{ tag: { name: string; slug: string } }>
  _count: { upvotes: number; comments: number; forks: number; executions: number }
  forkedFrom: { id: string; title: string; author: { username: string } } | null
  comments: PromptComment[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
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

const AVATAR_BG = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
]

function avatarBg(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_BG[Math.abs(hash) % AVATAR_BG.length]
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function detectVariables(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g) ?? []
  return [...new Set(matches.map((m) => m.slice(2, -2).trim()))]
}

function renderContentWithVars(content: string) {
  const parts = content.split(/(\{\{[^}]+\}\})/g)
  return parts.map((part, i) => {
    if (/^\{\{[^}]+\}\}$/.test(part)) {
      const name = part.slice(2, -2).trim()
      return (
        <span
          key={i}
          className="rounded px-1 py-0.5 font-bold text-forge-orange bg-orange-50 border border-orange-200"
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="container-forge pt-28 pb-16">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-6 w-24 animate-pulse rounded-full bg-forge-border" />
          <div className="h-12 w-3/4 animate-pulse rounded-xl bg-forge-border" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-full bg-forge-silver" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-forge-silver" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-forge-ink/20" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-40 animate-pulse rounded-2xl bg-forge-border" />
          <div className="h-32 animate-pulse rounded-2xl bg-forge-border" />
          <div className="h-24 animate-pulse rounded-2xl bg-forge-border" />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PromptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken } = useAuthStore()
  const id = params.id as string

  const [prompt, setPrompt] = useState<PromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'prompt' | 'analytics' | 'eval' | 'releases' | 'benchmark' | 'lint'>('prompt')

  // Selected version
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0)

  // Copy button
  const [copied, setCopied] = useState(false)

  // Upvote
  const [upvoted, setUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)
  const [upvoting, setUpvoting] = useState(false)

  // Follow
  const [following, setFollowing] = useState(false)

  // Check follow status
  useEffect(() => {
    if (!accessToken || !prompt?.author?.id) return
    fetch(`/api/follow/${prompt.author.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => setFollowing(data.following ?? false))
      .catch(() => {})
  }, [prompt?.author?.id, accessToken])

  // Fork
  const [forking, setForking] = useState(false)

  // Link copy
  const [linkCopied, setLinkCopied] = useState(false)

  // Export menu
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Try prompt: inline run
  const [tryOpen, setTryOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]?.id ?? 'llama-3.3-70b-versatile')
  const [varInputs, setVarInputs] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)

  // Comment
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [localComments, setLocalComments] = useState<PromptComment[]>([])

  // Safety score
  const [safetyScore, setSafetyScore] = useState<number | null>(null)

  // Compare versions (DiffViewer)
  const [showDiff, setShowDiff] = useState(false)
  const [diffFromIdx, setDiffFromIdx] = useState(0)
  const [diffToIdx, setDiffToIdx] = useState(0)

  // Remix panel
  const [showRemix, setShowRemix] = useState(false)

  // Fetch prompt
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/prompts/${id}`)
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error('Failed to load prompt')
        const data: PromptDetail = await res.json()
        setPrompt(data)
        setUpvoteCount(data.upvoteCount)
        setLocalComments(data.comments)
        // Latest version is last in array (sorted asc)
        setSelectedVersionIdx(data.versions.length - 1)
      } catch (e) {
        setError('Something went wrong loading this prompt.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Fetch safety score for latest version
  useEffect(() => {
    if (!prompt?.versions?.[0]?.content) return
    const content = prompt.versions[prompt.versions.length - 1]?.content ?? ''
    fetch('/api/playground/safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
      .then(r => r.json())
      .then(d => { if (d.overallScore !== undefined) setSafetyScore(d.overallScore) })
      .catch(() => {})
  }, [prompt?.id])

  const currentVersion = prompt?.versions[selectedVersionIdx] ?? null
  const detectedVars = currentVersion ? detectVariables(currentVersion.content) : []

  // Populate var inputs when version changes
  useEffect(() => {
    if (!currentVersion) return
    const vars = detectVariables(currentVersion.content)
    const inputs: Record<string, string> = {}
    vars.forEach((v) => {
      const varDef = currentVersion.variables?.find((vd) => vd.name === v)
      inputs[v] = varDef?.default ?? ''
    })
    setVarInputs(inputs)
  }, [selectedVersionIdx, currentVersion])

  const handleCopy = async () => {
    if (!currentVersion) return
    await navigator.clipboard.writeText(currentVersion.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpvote = async () => {
    if (!user || !accessToken) { router.push('/login'); return }
    if (upvoting) return
    setUpvoting(true)
    try {
      const res = await fetch(`/api/prompts/${id}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUpvoted(data.upvoted)
        setUpvoteCount(data.upvoteCount)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpvoting(false)
    }
  }

  const handleFork = async () => {
    if (!user || !accessToken) { router.push('/login'); return }
    if (forking) return
    setForking(true)
    try {
      const res = await fetch(`/api/prompts/${id}/fork`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/prompt/${data.id}`)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setForking(false)
    }
  }

  const handleFollow = async () => {
    if (!accessToken) {
      router.push('/login')
      return
    }
    try {
      const res = await fetch(`/api/follow/${prompt!.author.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      setFollowing(data.following)
    } catch {}
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleRun = async () => {
    if (!currentVersion) return
    setRunning(true)
    setOutput('')
    setTryOpen(true)

    // Build filled content
    let filled = currentVersion.content
    Object.entries(varInputs).forEach(([k, v]) => {
      filled = filled.replaceAll(`{{${k}}}`, v || `[${k}]`)
    })

    try {
      const res = await fetch('/api/playground/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, prompt: filled }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const chunk = line.slice(6)
            if (chunk === '[DONE]') break
            try {
              const parsed = JSON.parse(chunk)
              const token = parsed.choices?.[0]?.delta?.content ?? ''
              setOutput((prev) => prev + token)
              if (outputRef.current) {
                outputRef.current.scrollTop = outputRef.current.scrollHeight
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (e) {
      setOutput('Error: Failed to run prompt. Please try again.')
      console.error(e)
    } finally {
      setRunning(false)
    }
  }

  const handlePostComment = async () => {
    if (!user || !accessToken || !commentText.trim()) return
    setPostingComment(true)
    try {
      const res = await fetch(`/api/prompts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: commentText.trim() }),
      })
      if (res.ok) {
        const newComment = await res.json()
        setLocalComments((prev) => [newComment, ...prev])
        setCommentText('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPostingComment(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-forge-silver">
        <Navigation />
        <DetailSkeleton />
      </div>
    )
  }

  if (notFound || !prompt) {
    return (
      <div className="min-h-screen bg-forge-silver">
        <Navigation />
        <div className="container-forge flex flex-col items-center gap-6 py-40 text-center">
          <div className="text-6xl font-display font-black text-forge-border">404</div>
          <h2 className="font-display text-3xl font-black text-forge-ink">Prompt Not Found</h2>
          <p className="text-forge-muted">
            {error ?? 'This prompt may have been deleted or made private.'}
          </p>
          <Link href="/browse" className="btn-orange">
            <ArrowLeft className="h-4 w-4" /> Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  const catColor = CATEGORY_COLORS[prompt.category] ?? 'bg-gray-100 text-gray-700'
  const isOwner = !!user && user.id === prompt.authorId

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="border-b-2 border-forge-border bg-white pt-24 pb-8">
        <div className="container-forge">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4"
          >
            {/* Back button */}
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forge-muted transition-colors hover:text-forge-ink w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Browse
            </Link>

            {/* Category + forked-from */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${catColor}`}>
                {prompt.category}
              </span>
              {prompt.forkedFrom && (
                <Link
                  href={`/prompt/${prompt.forkedFrom.id}`}
                  className="flex items-center gap-1 rounded-full border border-forge-border bg-forge-silver px-3 py-1 text-xs font-semibold text-forge-muted transition-colors hover:text-forge-orange"
                >
                  <GitBranch className="h-3 w-3" />
                  Forked from {prompt.forkedFrom.title} by @{prompt.forkedFrom.author.username}
                </Link>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-display font-black text-forge-ink max-w-3xl"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 3rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
            >
              {prompt.title}
            </h1>

            {/* Description */}
            <p className="text-base leading-relaxed text-forge-muted max-w-2xl">{prompt.description}</p>

            {/* Tags */}
            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map(({ tag }) => (
                  <span
                    key={tag.slug}
                    className="flex items-center gap-1 rounded-full border border-forge-border bg-forge-silver px-3 py-1 text-xs font-bold text-forge-muted"
                  >
                    <Tag className="h-3 w-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="container-forge py-10 pb-24">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── LEFT: Tabs + Content (2/3) ────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-wrap gap-1 border-b-2 border-forge-border">
                {((['prompt', 'analytics', ...(isOwner ? ['eval', 'benchmark', 'releases', 'lint'] : [])] as const) as Array<'prompt' | 'analytics' | 'eval' | 'benchmark' | 'releases' | 'lint'>).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-black uppercase tracking-wider transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-forge-orange -mb-[2px] text-forge-orange'
                        : 'text-forge-muted hover:text-forge-ink'
                    }`}
                  >
                    {tab === 'prompt' ? 'Prompt' : tab === 'analytics' ? 'Analytics' : tab === 'eval' ? 'Eval' : tab === 'benchmark' ? 'Benchmark' : tab === 'releases' ? 'Releases' : 'Lint'}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <AnalyticsDashboard promptId={prompt.id} />
            )}

            {/* Eval Tab */}
            {activeTab === 'eval' && isOwner && (
              <EvalHarness promptId={prompt.id} versionId={currentVersion?.id ?? ''} />
            )}

            {/* Benchmark Tab */}
            {activeTab === 'benchmark' && isOwner && (
              <BenchmarkMatrix promptId={prompt.id} versionId={currentVersion?.id ?? ''} />
            )}

            {/* Releases Tab */}
            {activeTab === 'releases' && isOwner && (
              <ReleaseTimeline promptId={prompt.id} versions={prompt.versions.map(v => ({ id: v.id, version: v.version, changelog: v.changelog }))} />
            )}

            {/* Lint Tab */}
            {activeTab === 'lint' && isOwner && currentVersion && (
              <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
                <div className="section-label mb-4">Prompt Linter</div>
                <LintPanel content={currentVersion.content} variables={currentVersion.variables} />
              </div>
            )}

            {/* Section 2: Prompt Content */}
            {activeTab === 'prompt' && currentVersion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="section-label">Prompt Template</div>
                  <div className="flex items-center gap-2">
                    {/* Version selector */}
                    {prompt.versions.length > 1 && (
                      <select
                        value={selectedVersionIdx}
                        onChange={(e) => setSelectedVersionIdx(Number(e.target.value))}
                        className="rounded-lg border-2 border-forge-border bg-white px-3 py-1.5 text-xs font-bold text-forge-ink focus:border-forge-orange focus:outline-none"
                      >
                        {prompt.versions.map((v, idx) => (
                          <option key={v.id} value={idx}>
                            v{v.version}{idx === prompt.versions.length - 1 ? ' (latest)' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {/* Compare versions button */}
                    {prompt.versions.length > 1 && (
                      <button
                        onClick={() => {
                          setShowDiff(v => !v)
                          setDiffFromIdx(0)
                          setDiffToIdx(prompt.versions.length - 1)
                        }}
                        className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                          showDiff
                            ? 'border-forge-orange bg-orange-50 text-forge-orange'
                            : 'border-forge-border text-forge-muted hover:border-forge-orange hover:text-forge-orange'
                        }`}
                      >
                        Compare Versions
                      </button>
                    )}
                  </div>
                </div>

                {/* DiffViewer panel */}
                <AnimatePresence>
                  {showDiff && prompt.versions.length > 1 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border-2 border-forge-border bg-white p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider text-forge-muted">Compare</span>
                          <select
                            value={diffFromIdx}
                            onChange={e => setDiffFromIdx(Number(e.target.value))}
                            className="rounded-lg border-2 border-forge-border bg-forge-silver px-3 py-1.5 text-xs font-bold text-forge-ink focus:border-forge-orange focus:outline-none"
                          >
                            {prompt.versions.map((v, idx) => (
                              <option key={v.id} value={idx}>v{v.version}</option>
                            ))}
                          </select>
                          <span className="text-xs font-black uppercase tracking-wider text-forge-muted">with</span>
                          <select
                            value={diffToIdx}
                            onChange={e => setDiffToIdx(Number(e.target.value))}
                            className="rounded-lg border-2 border-forge-border bg-forge-silver px-3 py-1.5 text-xs font-bold text-forge-ink focus:border-forge-orange focus:outline-none"
                          >
                            {prompt.versions.map((v, idx) => (
                              <option key={v.id} value={idx}>v{v.version}</option>
                            ))}
                          </select>
                        </div>
                        <DiffViewer
                          oldText={prompt.versions[diffFromIdx]?.content ?? ''}
                          newText={prompt.versions[diffToIdx]?.content ?? ''}
                          oldLabel={`v${prompt.versions[diffFromIdx]?.version ?? ''}`}
                          newLabel={`v${prompt.versions[diffToIdx]?.version ?? ''}`}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Code block */}
                <div className="relative rounded-2xl bg-forge-ink p-6">
                  <pre className="font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-wrap overflow-auto max-h-96">
                    <code>{renderContentWithVars(currentVersion.content)}</code>
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 transition-all hover:bg-white/20 hover:text-white"
                  >
                    {copied ? (
                      <><Check className="h-3.5 w-3.5 text-green-400" /> Copied!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copy</>
                    )}
                  </button>
                </div>

                {/* Detected variables */}
                {detectedVars.length > 0 && (
                  <div className="rounded-xl border-2 border-forge-border bg-white p-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-forge-muted">
                      Detected Variables
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {detectedVars.map((v) => (
                        <span
                          key={v}
                          className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-forge-orange"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Section 3: Inline Run */}
            {activeTab === 'prompt' && currentVersion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border-2 border-forge-border bg-white overflow-hidden"
              >
                <button
                  onClick={() => setTryOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-6 py-4 hover:bg-forge-silver/50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-display text-base font-black text-forge-ink">
                    <Play className="h-4 w-4 text-forge-orange" />
                    Try This Prompt
                  </div>
                  {tryOpen ? (
                    <ChevronUp className="h-4 w-4 text-forge-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-forge-muted" />
                  )}
                </button>

                <AnimatePresence>
                  {tryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t-2 border-forge-border px-6 py-5 flex flex-col gap-5">
                        {/* Model selector */}
                        <div>
                          <p className="mb-2 text-xs font-black uppercase tracking-wider text-forge-muted">
                            Select Model
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_MODELS.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setSelectedModel(m.id)}
                                className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                                  selectedModel === m.id
                                    ? 'border-forge-orange bg-forge-orange text-white'
                                    : 'border-forge-border text-forge-muted hover:border-forge-orange hover:text-forge-orange'
                                }`}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Variable inputs */}
                        {detectedVars.length > 0 && (
                          <div>
                            <p className="mb-3 text-xs font-black uppercase tracking-wider text-forge-muted">
                              Fill Variables
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {detectedVars.map((v) => {
                                const varDef = currentVersion.variables?.find((vd) => vd.name === v)
                                return (
                                  <div key={v} className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-forge-ink">
                                      {`{{${v}}}`}
                                      {varDef?.description && (
                                        <span className="ml-1 font-normal text-forge-muted">
                                          — {varDef.description}
                                        </span>
                                      )}
                                    </label>
                                    <input
                                      type="text"
                                      value={varInputs[v] ?? ''}
                                      onChange={(e) =>
                                        setVarInputs((prev) => ({ ...prev, [v]: e.target.value }))
                                      }
                                      placeholder={varDef?.default ?? `Enter ${v}...`}
                                      className="rounded-xl border-2 border-forge-border bg-forge-silver px-3 py-2 text-sm text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Run button */}
                        <button
                          onClick={handleRun}
                          disabled={running}
                          className="btn-orange self-start disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {running ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Running...</>
                          ) : (
                            <><Play className="h-4 w-4" /> Run Prompt</>
                          )}
                        </button>

                        {/* Output */}
                        {(output || running) && (
                          <div className="rounded-xl bg-forge-ink overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                              <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                                Output
                              </span>
                              {running && (
                                <span className="flex items-center gap-1 text-xs text-forge-orange">
                                  <span className="h-1.5 w-1.5 rounded-full bg-forge-orange animate-pulse" />
                                  Streaming
                                </span>
                              )}
                            </div>
                            <div
                              ref={outputRef}
                              className="max-h-72 overflow-auto p-4 font-mono text-sm text-slate-200 leading-relaxed whitespace-pre-wrap"
                            >
                              {output || <span className="text-white/30">Waiting for response...</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Section 4: Version History */}
            {activeTab === 'prompt' && prompt.versions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4"
              >
                <div className="section-label">Version History</div>
                <div className="flex flex-col gap-3">
                  {[...prompt.versions].reverse().map((v, i) => (
                    <div
                      key={v.id}
                      className={`flex items-start gap-4 rounded-xl border-2 p-4 transition-all ${
                        prompt.versions.indexOf(v) === selectedVersionIdx
                          ? 'border-forge-orange bg-orange-50'
                          : 'border-forge-border bg-white hover:border-forge-ink'
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forge-ink text-xs font-black text-white">
                        v{v.version}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-forge-ink">
                            {v.changelog ?? `Version ${v.version}`}
                          </span>
                          {i === 0 && (
                            <span className="rounded-full bg-forge-orange/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-forge-orange">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-forge-muted">
                          <User className="h-3 w-3" />
                          {v.author.displayName || v.author.username}
                          <Clock className="h-3 w-3" />
                          {timeAgo(v.createdAt)}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedVersionIdx(prompt.versions.indexOf(v))}
                        className={`shrink-0 rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                          prompt.versions.indexOf(v) === selectedVersionIdx
                            ? 'border-forge-orange bg-forge-orange text-white'
                            : 'border-forge-border text-forge-muted hover:border-forge-orange hover:text-forge-orange'
                        }`}
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Section 5: Comments */}
            {activeTab === 'prompt' && <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="section-label">Discussion</div>
                <span className="rounded-full bg-forge-silver border border-forge-border px-2 py-0.5 text-xs font-bold text-forge-muted">
                  {localComments.length} comment{localComments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Add comment */}
              {user ? (
                <div className="rounded-2xl border-2 border-forge-border bg-white p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${avatarBg(user.username)}`}>
                      {initials(user.displayName || user.username)}
                    </div>
                    <span className="text-sm font-semibold text-forge-ink">@{user.username}</span>
                  </div>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts on this prompt..."
                    rows={3}
                    className="w-full resize-none rounded-xl border-2 border-forge-border bg-forge-silver p-3 text-sm text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={!commentText.trim() || postingComment}
                    className="btn-orange self-end disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2 px-4"
                  >
                    {postingComment ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Posting...</>
                    ) : (
                      <><MessageSquare className="h-3.5 w-3.5" /> Post Comment</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-forge-border p-6 text-center">
                  <p className="text-sm text-forge-muted mb-3">
                    Sign in to join the discussion
                  </p>
                  <Link href="/login" className="btn-orange text-sm py-2 px-4">
                    Sign In
                  </Link>
                </div>
              )}

              {/* Comment list */}
              {localComments.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {localComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-2xl border-2 border-forge-border bg-white p-4 flex gap-3"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${avatarBg(comment.author.username)}`}
                      >
                        {initials(comment.author.displayName || comment.author.username)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-forge-ink">
                            {comment.author.displayName}
                          </span>
                          <span className="text-xs text-forge-muted">@{comment.author.username}</span>
                          <span className="text-xs text-forge-muted ml-auto">
                            {timeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-forge-muted leading-relaxed">
                          {comment.content}
                        </p>
                        {(comment.upvotes > 0 || comment._count.replies > 0) && (
                          <div className="mt-2 flex items-center gap-3 text-xs text-forge-muted">
                            {comment.upvotes > 0 && (
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {comment.upvotes}
                              </span>
                            )}
                            {comment._count.replies > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {comment._count.replies} repl{comment._count.replies === 1 ? 'y' : 'ies'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-forge-border p-8 text-center">
                  <MessageSquare className="h-8 w-8 text-forge-border mx-auto mb-2" />
                  <p className="text-sm text-forge-muted">No comments yet. Start the discussion!</p>
                </div>
              )}
            </motion.div>}

          </div>

          {/* ── RIGHT: Sidebar (1/3) ─────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Card 1: Author */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border-2 border-forge-border bg-white p-5"
            >
              <div className="section-label mb-4">Author</div>
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white ${avatarBg(prompt.author.username)}`}
                >
                  {initials(prompt.author.displayName || prompt.author.username)}
                </div>
                <div>
                  <div className="font-display text-lg font-black text-forge-ink">
                    {prompt.author.displayName}
                  </div>
                  <div className="text-sm text-forge-muted">@{prompt.author.username}</div>
                </div>
                {prompt.author.bio && (
                  <p className="text-xs leading-relaxed text-forge-muted">{prompt.author.bio}</p>
                )}
                <div className="flex gap-4 text-center">
                  <div>
                    <div className="font-display text-xl font-black text-forge-ink">
                      {prompt.author._count.prompts}
                    </div>
                    <div className="text-xs text-forge-muted">Prompts</div>
                  </div>
                  <div className="w-px bg-forge-border" />
                  <div>
                    <div className="font-display text-xl font-black text-forge-ink">
                      {prompt.author._count.followers}
                    </div>
                    <div className="text-xs text-forge-muted">Followers</div>
                  </div>
                </div>
                <button
                  onClick={handleFollow}
                  className={`w-full rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                    following
                      ? 'border-forge-ink bg-forge-ink text-white'
                      : 'border-forge-border text-forge-muted hover:border-forge-ink hover:text-forge-ink'
                  }`}
                >
                  {following ? 'Following' : '+ Follow'}
                </button>
              </div>
            </motion.div>

            {/* Card 2: Stats + Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border-2 border-forge-border bg-white p-5"
            >
              <div className="section-label mb-4">Stats</div>

              {/* Upvote button */}
              <button
                onClick={handleUpvote}
                disabled={upvoting}
                className={`mb-4 flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 font-bold transition-all disabled:opacity-60 ${
                  upvoted
                    ? 'border-red-300 bg-red-50 text-red-500'
                    : 'border-forge-border text-forge-muted hover:border-red-300 hover:bg-red-50 hover:text-red-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4" fill={upvoted ? 'currentColor' : 'none'} />
                  {upvoted ? 'Upvoted' : 'Upvote'}
                </span>
                <span className="font-display text-lg font-black">{upvoteCount.toLocaleString()}</span>
              </button>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                {[
                  { icon: GitFork, label: 'Forks', value: prompt.forkCount },
                  { icon: Eye, label: 'Views', value: prompt.viewCount },
                  { icon: Download, label: 'Downloads', value: prompt.downloadCount },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border-2 border-forge-border p-2">
                    <Icon className="h-4 w-4 text-forge-muted mx-auto mb-1" />
                    <div className="font-display text-base font-black text-forge-ink">
                      {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
                    </div>
                    <div className="text-[10px] text-forge-muted">{label}</div>
                  </div>
                ))}
              </div>

              {/* Fork button */}
              <button
                onClick={handleFork}
                disabled={forking}
                className="w-full btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {forking ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Forking...</>
                ) : (
                  <><GitFork className="h-4 w-4" /> Fork This Prompt</>
                )}
              </button>

              {/* Remix button */}
              <button
                onClick={() => setShowRemix(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-forge-border px-4 py-2.5 text-sm font-bold text-forge-muted transition-all hover:border-forge-orange hover:text-forge-orange"
              >
                <Wand2 className="h-4 w-4" /> Remix Prompt
              </button>

              {/* Share button */}
              <div className="flex justify-center">
                <ShareButton
                  promptId={prompt.id}
                  title={prompt.title}
                  upvotes={upvoteCount}
                  forks={prompt.forkCount}
                  runs={prompt._count.executions}
                />
              </div>

              {/* Dependency graph link */}
              <Link
                href={`/prompt/${prompt.id}/graph`}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-2.5 text-sm font-bold text-forge-muted transition-colors hover:border-forge-orange hover:text-forge-orange"
              >
                <GitBranch className="h-4 w-4" />
                View Dependency Graph
              </Link>
            </motion.div>

            {/* Card 3: Tags / Model hints */}
            {prompt.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border-2 border-forge-border bg-white p-5"
              >
                <div className="section-label mb-4">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map(({ tag }) => (
                    <span
                      key={tag.slug}
                      className="rounded-full border border-forge-border bg-forge-silver px-3 py-1 text-xs font-bold text-forge-muted"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Card 4: Share */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border-2 border-forge-border bg-white p-5"
            >
              <div className="section-label mb-4">Share</div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-between rounded-xl border-2 border-forge-border px-4 py-3 text-sm font-bold text-forge-muted transition-all hover:border-forge-orange hover:text-forge-orange"
                >
                  <span className="flex items-center gap-2">
                    {linkCopied ? (
                      <><Check className="h-4 w-4 text-green-500" /> Link Copied!</>
                    ) : (
                      <><Share2 className="h-4 w-4" /> Copy Link</>
                    )}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-40" />
                </button>
                <Link
                  href={`/playground?promptId=${prompt.id}`}
                  className="flex items-center justify-between rounded-xl border-2 border-forge-orange bg-orange-50 px-4 py-3 text-sm font-bold text-forge-orange transition-all hover:bg-orange-100"
                >
                  <span className="flex items-center gap-2">
                    <Play className="h-4 w-4" /> Open in Playground
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(s => !s)}
                    className="flex w-full items-center gap-1.5 rounded-xl border-2 border-forge-border bg-white px-4 py-2 text-sm font-bold text-forge-ink hover:border-forge-orange hover:text-forge-orange"
                  >
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border-2 border-forge-border bg-white py-2 shadow-hard z-20">
                      <a href={`/api/prompts/${prompt.id}/export?format=yaml`} download className="block px-4 py-2 text-sm hover:bg-forge-silver">Export YAML</a>
                      <a href={`/api/prompts/${prompt.id}/export?format=json`} download className="block px-4 py-2 text-sm hover:bg-forge-silver">Export JSON</a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Metadata */}
            <div className="rounded-xl border border-forge-border bg-white/50 p-4 text-xs text-forge-muted space-y-1.5">
              {safetyScore !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-forge-muted font-medium">Safety Score</span>
                  <span className={`font-black text-sm px-2 py-0.5 rounded-full ${
                    safetyScore >= 70 ? 'bg-green-100 text-green-700' :
                    safetyScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {safetyScore}/100
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Created</span>
                <span className="font-semibold text-forge-ink">
                  {new Date(prompt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span className="font-semibold text-forge-ink">
                  {timeAgo(prompt.updatedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Versions</span>
                <span className="font-semibold text-forge-ink">{prompt.versions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Visibility</span>
                <span className={`font-semibold ${prompt.isPublic ? 'text-green-600' : 'text-forge-muted'}`}>
                  {prompt.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RemixPanel modal */}
      <AnimatePresence>
        {showRemix && currentVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowRemix(false) }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl rounded-2xl border-2 border-forge-border bg-white p-6 shadow-[8px_8px_0_#0A0A0A]"
            >
              <RemixPanel
                content={currentVersion.content}
                onUse={(variant) => {
                  router.push(`/playground?prompt=${encodeURIComponent(variant)}`)
                  setShowRemix(false)
                }}
                onClose={() => setShowRemix(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
