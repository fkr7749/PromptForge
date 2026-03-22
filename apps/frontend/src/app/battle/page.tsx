'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Zap, Trophy, Timer, Play, ChevronRight, Star,
  Clock, ArrowLeft, ArrowRight, Check, Crown, Users, ChevronUp, RotateCcw,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'
import { useLiveBattle } from '@/hooks/useLiveBattle'

// ── Types ──────────────────────────────────────────────────────────────────
interface PromptRef {
  id: string
  title: string
  category: string
  upvoteCount: number
  author: { username: string; displayName: string | null }
}

interface RubricDimension {
  name: string
  description: string
}

interface BattleSession {
  id: string
  promptAId: string
  promptBId: string
  theme: string | null
  status: string
  votesA: number
  votesB: number
  winnerId: string | null
  createdAt: string
  expiresAt: string
  timeRemainingMs?: number
  promptA: PromptRef
  promptB: PromptRef
  _count: { votes: number }
  isAnonymous?: boolean
  rubric?: RubricDimension[]
  bracketId?: string | null
}

interface CompletedSession {
  id: string
  promptAId: string
  promptBId: string
  votesA: number
  votesB: number
  winnerId: string | null
  promptA: { id: string; title: string }
  promptB: { id: string; title: string }
}

interface PromptOutput {
  outputA?: string
  outputB?: string
  loading: boolean
  error?: string
}

interface LeaderEntry {
  id: string
  username: string
  displayName: string | null
  eloRating: number
  isPremium: boolean
  _count: { prompts: number; followers: number }
}

interface TopPrompt {
  id: string
  title: string
  category: string
  upvoteCount: number
  author: { username: string; displayName: string | null }
}

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  CODING:     'bg-blue-100 text-blue-700 border-blue-200',
  WRITING:    'bg-purple-100 text-purple-700 border-purple-200',
  ANALYSIS:   'bg-teal-100 text-teal-700 border-teal-200',
  CREATIVITY: 'bg-pink-100 text-pink-700 border-pink-200',
  EDUCATION:  'bg-green-100 text-green-700 border-green-200',
  BUSINESS:   'bg-amber-100 text-amber-700 border-amber-200',
  RESEARCH:   'bg-cyan-100 text-cyan-700 border-cyan-200',
  ROLEPLAY:   'bg-violet-100 text-violet-700 border-violet-200',
  OTHER:      'bg-gray-100 text-gray-600 border-gray-200',
}

// ── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Ended'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setRemaining(`${h}h ${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return remaining
}

// ── Battle Card ────────────────────────────────────────────────────────────
function BattleCard({
  session,
  userVote,
  output,
  onVote,
  onRunAndJudge,
}: {
  session: BattleSession
  userVote: 'A' | 'B' | undefined
  output: PromptOutput | undefined
  onVote: (sessionId: string, choice: 'A' | 'B', explanation?: string, scores?: Record<string, number>) => void
  onRunAndJudge: (session: BattleSession) => void
}) {
  const countdown = useCountdown(session.expiresAt)
  const totalVotes = (session.votesA ?? 0) + (session.votesB ?? 0)
  const pctA = totalVotes > 0 ? Math.round((session.votesA / totalVotes) * 100) : 50
  const pctB = 100 - pctA

  const isLoading = output?.loading ?? false
  const hasOutputs = !!(output?.outputA && output?.outputB)
  const hasVoted = !!userVote

  const [voteExplanation, setVoteExplanation] = useState('')
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({})

  const titleA = session.isAnonymous ? 'Prompt A' : session.promptA.title
  const titleB = session.isAnonymous ? 'Prompt B' : session.promptB.title

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border-2 border-forge-border bg-white shadow-[4px_4px_0_#0A0A0A] overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 bg-forge-black border-b-2 border-forge-border">
        <div className="flex items-center gap-2">
          {session.theme ? (
            <span className="text-xs font-black text-forge-orange uppercase tracking-widest">
              {session.theme}
            </span>
          ) : (
            <span className="text-xs font-black text-white/40 uppercase tracking-widest">
              Open Battle
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-white/60 text-xs font-semibold">
          <Clock className="h-3 w-3" />
          {countdown}
        </div>
      </div>

      {/* Rubric scoring (shown before voting if rubric exists) */}
      {!hasVoted && session.rubric && session.rubric.length > 0 && (
        <div className="px-5 py-4 border-t-2 border-forge-border bg-forge-silver/10">
          <p className="text-[10px] font-black text-forge-orange uppercase tracking-widest mb-3">Score by Rubric</p>
          <div className="space-y-3">
            {session.rubric.map(dim => (
              <div key={dim.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-forge-ink">{dim.name}</span>
                  <span className="text-xs text-forge-muted">{rubricScores[dim.name] ?? 5}/10</span>
                </div>
                {dim.description && <p className="text-[10px] text-forge-muted mb-1">{dim.description}</p>}
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rubricScores[dim.name] ?? 5}
                  onChange={e => setRubricScores(prev => ({ ...prev, [dim.name]: Number(e.target.value) }))}
                  className="w-full accent-forge-orange"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VS layout */}
      <div className="grid grid-cols-[1fr_auto_1fr]">
        {/* Prompt A */}
        <div
          className={`p-5 transition-colors ${
            userVote === 'A'
              ? 'bg-orange-50 ring-2 ring-inset ring-forge-orange/30'
              : 'hover:bg-forge-silver/30'
          }`}
        >
          <div className="flex flex-col items-center h-full gap-3 text-center">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                CATEGORY_COLORS[session.promptA.category] ?? CATEGORY_COLORS.OTHER
              }`}
            >
              {session.promptA.category}
            </span>
            <h3 className="font-display font-black text-forge-ink text-base leading-tight line-clamp-3">
              {titleA}
            </h3>
            <div className="mt-auto flex flex-col items-center gap-1">
              {!session.isAnonymous && (
                <p className="text-xs text-forge-muted">
                  by{' '}
                  <Link
                    href={`/profile/${session.promptA.author.username}`}
                    className="font-bold text-forge-ink hover:text-forge-orange"
                  >
                    {session.promptA.author.displayName ?? session.promptA.author.username}
                  </Link>
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-forge-muted">
                <ChevronUp className="h-3.5 w-3.5" />
                {session.promptA.upvoteCount.toLocaleString()} upvotes
              </div>
            </div>
          </div>
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center justify-center px-3 py-5 border-x-2 border-forge-border bg-forge-silver/40 gap-3 min-w-[56px]">
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-forge-orange shadow-[2px_2px_0_#0A0A0A]"
          >
            <Zap className="h-5 w-5 text-white fill-white" />
          </motion.div>
          <span className="font-display font-black text-xl text-forge-ink">VS</span>
          <span className="text-[10px] font-bold text-forge-muted text-center whitespace-nowrap">
            {totalVotes} votes
          </span>
        </div>

        {/* Prompt B */}
        <div
          className={`p-5 transition-colors ${
            userVote === 'B'
              ? 'bg-orange-50 ring-2 ring-inset ring-forge-orange/30'
              : 'hover:bg-forge-silver/30'
          }`}
        >
          <div className="flex flex-col items-center h-full gap-3 text-center">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                CATEGORY_COLORS[session.promptB.category] ?? CATEGORY_COLORS.OTHER
              }`}
            >
              {session.promptB.category}
            </span>
            <h3 className="font-display font-black text-forge-ink text-base leading-tight line-clamp-3">
              {titleB}
            </h3>
            <div className="mt-auto flex flex-col items-center gap-1">
              {!session.isAnonymous && (
                <p className="text-xs text-forge-muted">
                  by{' '}
                  <Link
                    href={`/profile/${session.promptB.author.username}`}
                    className="font-bold text-forge-ink hover:text-forge-orange"
                  >
                    {session.promptB.author.displayName ?? session.promptB.author.username}
                  </Link>
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-forge-muted">
                <ChevronUp className="h-3.5 w-3.5" />
                {session.promptB.upvoteCount.toLocaleString()} upvotes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated vote bars */}
      <div className="px-5 py-3 border-t-2 border-forge-border bg-forge-silver/20">
        <div className="flex items-center gap-2 text-xs font-bold mb-1.5">
          <span className="w-8 text-left text-forge-orange">{pctA}%</span>
          <div className="flex-1 h-2.5 rounded-full bg-forge-border overflow-hidden flex">
            <motion.div
              className="h-full bg-forge-orange rounded-l-full"
              initial={{ width: '50%' }}
              animate={{ width: `${pctA}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="h-full bg-forge-muted/40 rounded-r-full"
              initial={{ width: '50%' }}
              animate={{ width: `${pctB}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="w-8 text-right text-forge-muted">{pctB}%</span>
        </div>
        <div className="flex justify-between text-[10px] text-forge-muted font-semibold">
          <span>{session.votesA} votes</span>
          <span>{session.votesB} votes</span>
        </div>
      </div>

      {/* Prompt content outputs */}
      <AnimatePresence>
        {hasOutputs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-0 border-t-2 border-forge-border"
          >
            <div className="p-4 border-r-2 border-forge-border">
              <p className="text-[10px] font-black text-forge-orange uppercase tracking-wider mb-2">
                Prompt A Content
              </p>
              <p className="text-xs text-forge-muted leading-relaxed line-clamp-6 font-mono">
                {output!.outputA}
              </p>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-black text-forge-orange uppercase tracking-wider mb-2">
                Prompt B Content
              </p>
              <p className="text-xs text-forge-muted leading-relaxed line-clamp-6 font-mono">
                {output!.outputB}
              </p>
            </div>
          </motion.div>
        )}
        {output?.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-5 py-3 border-t-2 border-forge-border bg-red-50 text-xs text-red-600 font-semibold"
          >
            {output.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action row */}
      <div className="flex flex-col gap-3 px-5 py-4 border-t-2 border-forge-border bg-white">
        {!hasVoted && (
          <input
            type="text"
            placeholder="Explain your vote (optional)..."
            value={voteExplanation}
            onChange={e => setVoteExplanation(e.target.value)}
            className="w-full border border-forge-border rounded-lg px-3 py-2 text-sm text-forge-ink placeholder-forge-muted focus:outline-none focus:border-forge-orange"
          />
        )}
        <div className="flex items-center gap-2 flex-wrap">
        {hasVoted ? (
          <div className="flex items-center gap-2 text-sm font-bold text-green-600 flex-1">
            <Check className="h-4 w-4" />
            You voted for Prompt {userVote}
          </div>
        ) : (
          <>
            <button
              onClick={() => onVote(session.id, 'A', voteExplanation || undefined, Object.keys(rubricScores).length > 0 ? rubricScores : undefined)}
              className="flex items-center gap-1.5 rounded-xl border-2 border-forge-border bg-white px-4 py-2.5 text-sm font-black text-forge-ink transition-all hover:border-forge-orange hover:bg-orange-50 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Vote A
            </button>
            <button
              onClick={() => onVote(session.id, 'B', voteExplanation || undefined, Object.keys(rubricScores).length > 0 ? rubricScores : undefined)}
              className="flex items-center gap-1.5 rounded-xl border-2 border-forge-border bg-white px-4 py-2.5 text-sm font-black text-forge-ink transition-all hover:border-forge-orange hover:bg-orange-50 active:scale-95"
            >
              Vote B
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          onClick={() => onRunAndJudge(session)}
          disabled={isLoading}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-forge-black px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-forge-ink active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
              />
              Loading…
            </>
          ) : hasOutputs ? (
            <>
              <RotateCcw className="h-4 w-4" />
              Reload
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run &amp; Judge
            </>
          )}
        </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Live Battle Card ───────────────────────────────────────────────────────
function LiveBattleCard({
  session,
  userVote,
  output,
  onVote,
  onRunAndJudge,
}: {
  session: BattleSession
  userVote: 'A' | 'B' | undefined
  output: PromptOutput | undefined
  onVote: (sessionId: string, choice: 'A' | 'B', explanation?: string, scores?: Record<string, number>) => void
  onRunAndJudge: (session: BattleSession) => void
}) {
  const { data, connected } = useLiveBattle(session.id)
  const [voteExplanation, setVoteExplanation] = useState('')
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({})
  const liveTitleA = session.isAnonymous ? 'Prompt A' : session.promptA.title
  const liveTitleB = session.isAnonymous ? 'Prompt B' : session.promptB.title

  const votesA = data?.votesA ?? session.votesA
  const votesB = data?.votesB ?? session.votesB
  const percentA = data?.percentA ?? (votesA + votesB > 0 ? Math.round((votesA / (votesA + votesB)) * 100) : 50)
  const percentB = data?.percentB ?? (100 - percentA)
  const timeRemaining = data?.timeRemaining ?? Math.max(0, new Date(session.expiresAt).getTime() - Date.now())
  const totalVotes = data?.totalVotes ?? (votesA + votesB)

  // Viewer count simulation based on session ID hash
  const [viewers, setViewers] = useState(() => {
    const seed = session.id.charCodeAt(0) + (session.id.charCodeAt(1) ?? 0)
    return 50 + (seed % 150)
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setViewers((v) => Math.max(10, v + Math.floor(Math.random() * 7) - 3))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000)
    const mins = Math.floor(secs / 60)
    const hours = Math.floor(mins / 60)
    if (hours > 0) return `${hours}h ${mins % 60}m`
    if (mins > 0) return `${mins}m ${secs % 60}s`
    return `${secs}s`
  }

  const isEnding = timeRemaining < 60000      // less than 1 minute
  const isAlmostDone = timeRemaining < 300000 // less than 5 minutes
  const isOver = timeRemaining === 0 || data?.status === 'completed'

  const timerColor = isEnding
    ? 'bg-red-500 text-white'
    : isAlmostDone
    ? 'bg-amber-400 text-amber-900'
    : 'bg-green-500 text-white'

  const hasVoted = !!userVote
  const isLoading = output?.loading ?? false
  const hasOutputs = !!(output?.outputA && output?.outputB)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border-2 border-forge-border bg-white shadow-[4px_4px_0_#0A0A0A] overflow-hidden"
    >
      {/* ── Card header ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-forge-black border-b-2 border-forge-border">
        <div className="flex items-center gap-3">
          {session.theme ? (
            <span className="text-xs font-black text-forge-orange uppercase tracking-widest">
              {session.theme}
            </span>
          ) : (
            <span className="text-xs font-black text-white/40 uppercase tracking-widest">
              Open Battle
            </span>
          )}
          {/* Viewer count */}
          <span className="flex items-center gap-1 text-[10px] font-bold text-white/50 bg-white/10 rounded-full px-2 py-0.5">
            👥 {viewers} watching
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* LIVE indicator */}
          {connected && !isOver && (
            <span className="flex items-center gap-1.5 text-[10px] font-black text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              LIVE
            </span>
          )}

          {/* Timer badge */}
          {isOver ? (
            <span className="rounded-full bg-forge-muted/30 px-2.5 py-1 text-[10px] font-black text-white/60 uppercase tracking-wider">
              Completed
            </span>
          ) : (
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${timerColor} ${
                isEnding && timeRemaining < 30000 ? 'animate-pulse' : ''
              }`}
            >
              <Clock className="h-2.5 w-2.5" />
              {formatTime(timeRemaining)}
            </span>
          )}
        </div>
      </div>

      {/* ── VS Layout ── */}
      <div className="grid grid-cols-[1fr_auto_1fr]">
        {/* Prompt A */}
        <div
          className={`p-5 transition-colors ${
            userVote === 'A'
              ? 'bg-orange-50 ring-2 ring-inset ring-forge-orange/30'
              : 'hover:bg-forge-silver/30'
          }`}
        >
          <div className="flex flex-col items-center h-full gap-3 text-center">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                CATEGORY_COLORS[session.promptA.category] ?? CATEGORY_COLORS.OTHER
              }`}
            >
              {session.promptA.category}
            </span>
            <h3 className="font-display font-black text-forge-ink text-base leading-tight line-clamp-3">
              {liveTitleA}
            </h3>
            <div className="mt-auto flex flex-col items-center gap-1">
              {!session.isAnonymous && (
                <p className="text-xs text-forge-muted">
                  by{' '}
                  <Link
                    href={`/profile/${session.promptA.author.username}`}
                    className="font-bold text-forge-ink hover:text-forge-orange"
                  >
                    {session.promptA.author.displayName ?? session.promptA.author.username}
                  </Link>
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-forge-muted">
                <ChevronUp className="h-3.5 w-3.5" />
                {session.promptA.upvoteCount.toLocaleString()} upvotes
              </div>
            </div>
          </div>
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center justify-center px-3 py-5 border-x-2 border-forge-border bg-forge-silver/40 gap-3 min-w-[56px]">
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-forge-orange shadow-[2px_2px_0_#0A0A0A]"
          >
            <Zap className="h-5 w-5 text-white fill-white" />
          </motion.div>
          <span className="font-display font-black text-xl text-forge-ink">VS</span>
          <span className="text-[10px] font-bold text-forge-muted text-center whitespace-nowrap">
            {totalVotes} votes
          </span>
        </div>

        {/* Prompt B */}
        <div
          className={`p-5 transition-colors ${
            userVote === 'B'
              ? 'bg-blue-50 ring-2 ring-inset ring-blue-400/30'
              : 'hover:bg-forge-silver/30'
          }`}
        >
          <div className="flex flex-col items-center h-full gap-3 text-center">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                CATEGORY_COLORS[session.promptB.category] ?? CATEGORY_COLORS.OTHER
              }`}
            >
              {session.promptB.category}
            </span>
            <h3 className="font-display font-black text-forge-ink text-base leading-tight line-clamp-3">
              {liveTitleB}
            </h3>
            <div className="mt-auto flex flex-col items-center gap-1">
              {!session.isAnonymous && (
                <p className="text-xs text-forge-muted">
                  by{' '}
                  <Link
                    href={`/profile/${session.promptB.author.username}`}
                    className="font-bold text-forge-ink hover:text-forge-orange"
                  >
                    {session.promptB.author.displayName ?? session.promptB.author.username}
                  </Link>
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-forge-muted">
                <ChevronUp className="h-3.5 w-3.5" />
                {session.promptB.upvoteCount.toLocaleString()} upvotes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Animated vote bars ── */}
      <div className="px-5 py-4 border-t-2 border-forge-border bg-forge-silver/20">
        <div className="relative h-5 rounded-full overflow-hidden bg-forge-border flex">
          <motion.div
            className="h-full bg-forge-orange"
            animate={{ width: `${percentA}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <motion.div
            className="h-full bg-blue-500"
            animate={{ width: `${percentB}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs font-black">
          <span className="text-forge-orange">{percentA}% · {votesA} votes</span>
          <span className="text-blue-500">{percentB}% · {votesB} votes</span>
        </div>
      </div>

      {/* ── Prompt content outputs (run & judge) ── */}
      <AnimatePresence>
        {hasOutputs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-0 border-t-2 border-forge-border"
          >
            <div className="p-4 border-r-2 border-forge-border">
              <p className="text-[10px] font-black text-forge-orange uppercase tracking-wider mb-2">
                Prompt A Content
              </p>
              <p className="text-xs text-forge-muted leading-relaxed line-clamp-6 font-mono">
                {output!.outputA}
              </p>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-2">
                Prompt B Content
              </p>
              <p className="text-xs text-forge-muted leading-relaxed line-clamp-6 font-mono">
                {output!.outputB}
              </p>
            </div>
          </motion.div>
        )}
        {output?.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-5 py-3 border-t-2 border-forge-border bg-red-50 text-xs text-red-600 font-semibold"
          >
            {output.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rubric scoring ── */}
      {!hasVoted && !isOver && session.rubric && session.rubric.length > 0 && (
        <div className="px-5 py-4 border-t-2 border-forge-border bg-forge-silver/10">
          <p className="text-[10px] font-black text-forge-orange uppercase tracking-widest mb-3">Score by Rubric</p>
          <div className="space-y-3">
            {session.rubric.map(dim => (
              <div key={dim.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-forge-ink">{dim.name}</span>
                  <span className="text-xs text-forge-muted">{rubricScores[dim.name] ?? 5}/10</span>
                </div>
                {dim.description && <p className="text-[10px] text-forge-muted mb-1">{dim.description}</p>}
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rubricScores[dim.name] ?? 5}
                  onChange={e => setRubricScores(prev => ({ ...prev, [dim.name]: Number(e.target.value) }))}
                  className="w-full accent-forge-orange"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vote explanation ── */}
      {!hasVoted && !isOver && (
        <div className="px-5 pt-3 border-t-2 border-forge-border bg-white">
          <input
            type="text"
            placeholder="Explain your vote (optional)..."
            value={voteExplanation}
            onChange={e => setVoteExplanation(e.target.value)}
            className="w-full border border-forge-border rounded-lg px-3 py-2 text-sm text-forge-ink placeholder-forge-muted focus:outline-none focus:border-forge-orange"
          />
        </div>
      )}

      {/* ── Vote buttons ── */}
      <div className="border-t-2 border-forge-border">
        {hasVoted ? (
          <div className="flex">
            <div
              className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-black transition-colors ${
                userVote === 'A'
                  ? 'bg-orange-50 text-forge-orange border-r-2 border-forge-border'
                  : 'bg-forge-silver/30 text-forge-muted border-r-2 border-forge-border'
              }`}
            >
              {userVote === 'A' && <Check className="h-4 w-4" />}
              <ArrowLeft className="h-4 w-4" />
              A is Better
            </div>
            <div
              className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-black transition-colors ${
                userVote === 'B'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-forge-silver/30 text-forge-muted'
              }`}
            >
              B is Better
              <ArrowRight className="h-4 w-4" />
              {userVote === 'B' && <Check className="h-4 w-4" />}
            </div>
          </div>
        ) : isOver ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm font-black text-forge-muted">
            <Crown className="h-4 w-4 text-amber-500" />
            {data?.winnerId === session.promptAId
              ? 'Prompt A won!'
              : data?.winnerId === session.promptBId
              ? 'Prompt B won!'
              : 'Battle completed'}
          </div>
        ) : (
          <div className="flex">
            <button
              onClick={() => onVote(session.id, 'A', voteExplanation || undefined, Object.keys(rubricScores).length > 0 ? rubricScores : undefined)}
              className="flex flex-1 items-center justify-center gap-2 py-4 min-h-[56px] text-sm font-black text-forge-ink border-r-2 border-forge-border bg-white transition-all hover:bg-orange-50 hover:text-forge-orange active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              A is Better
            </button>
            <button
              onClick={() => onVote(session.id, 'B', voteExplanation || undefined, Object.keys(rubricScores).length > 0 ? rubricScores : undefined)}
              className="flex flex-1 items-center justify-center gap-2 py-4 min-h-[56px] text-sm font-black text-forge-ink bg-white transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-95"
            >
              B is Better
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Run & Judge button ── */}
      <div className="flex items-center justify-end px-5 py-3 border-t-2 border-forge-border bg-forge-silver/10">
        <button
          onClick={() => onRunAndJudge(session)}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl bg-forge-black px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-forge-ink active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
              />
              Loading…
            </>
          ) : hasOutputs ? (
            <>
              <RotateCcw className="h-4 w-4" />
              Reload
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run &amp; Judge
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BattleArenaPage() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()

  const [sessions, setSessions] = useState<BattleSession[]>([])
  const [completed, setCompleted] = useState<CompletedSession[]>([])
  const [topPrompts, setTopPrompts] = useState<TopPrompt[]>([])
  const [topCreators, setTopCreators] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [outputs, setOutputs] = useState<Record<string, PromptOutput>>({})
  const [userVotes, setUserVotes] = useState<Record<string, 'A' | 'B'>>({})

  // Load data on mount
  useEffect(() => {
    async function load() {
      try {
        const [battleRes, leaderRes] = await Promise.all([
          fetch('/api/battle/sessions').then((r) => r.json()),
          fetch('/api/battle/leaderboard').then((r) => r.json()),
        ])
        setSessions(battleRes.sessions ?? [])
        setCompleted(battleRes.completed ?? [])
        setTopPrompts(leaderRes.topPrompts?.slice(0, 5) ?? [])
        setTopCreators((leaderRes.topCreators ?? leaderRes.topUsers ?? []).slice(0, 5))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSeed = useCallback(async () => {
    if (!accessToken) { router.push('/login'); return }
    setSeeding(true)
    try {
      const res = await fetch('/api/battle/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.sessions) {
        // Reload sessions
        const battleRes = await fetch('/api/battle/sessions').then((r) => r.json())
        setSessions(battleRes.sessions ?? [])
        setCompleted(battleRes.completed ?? [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSeeding(false)
    }
  }, [accessToken, router])

  const handleRunAndJudge = useCallback(async (session: BattleSession) => {
    setOutputs((prev) => ({ ...prev, [session.id]: { loading: true } }))
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/prompts/${session.promptAId}`).then((r) => r.json()),
        fetch(`/api/prompts/${session.promptBId}`).then((r) => r.json()),
      ])
      // Get latest version content or fall back to title
      const contentA: string =
        resA.prompt?.versions?.slice(-1)[0]?.content ??
        resA.versions?.slice(-1)[0]?.content ??
        resA.prompt?.content ??
        session.promptA.title
      const contentB: string =
        resB.prompt?.versions?.slice(-1)[0]?.content ??
        resB.versions?.slice(-1)[0]?.content ??
        resB.prompt?.content ??
        session.promptB.title

      setOutputs((prev) => ({
        ...prev,
        [session.id]: { outputA: contentA, outputB: contentB, loading: false },
      }))
    } catch {
      setOutputs((prev) => ({
        ...prev,
        [session.id]: { loading: false, error: 'Failed to load prompt content' },
      }))
    }
  }, [])

  const handleVote = useCallback(
    async (sessionId: string, choice: 'A' | 'B', explanation?: string, scores?: Record<string, number>) => {
      if (!accessToken) {
        router.push('/login')
        return
      }
      const res = await fetch(`/api/battle/sessions/${sessionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ choice, explanation: explanation ?? null, scores: scores ?? null }),
      })
      const data = await res.json()
      if (data.success) {
        setUserVotes((prev) => ({ ...prev, [sessionId]: choice }))
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, votesA: data.votesA, votesB: data.votesB }
              : s
          )
        )
      } else if (data.error === 'Already voted' && data.userVote) {
        setUserVotes((prev) => ({ ...prev, [sessionId]: data.userVote }))
      }
    },
    [accessToken, router]
  )

  const totalVotesCast = sessions.reduce((a, s) => a + (s.votesA ?? 0) + (s.votesB ?? 0), 0)

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-forge-black text-white pt-24 pb-20 text-center relative overflow-hidden">
        {/* Background radial glow */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, #FF6B2B 0%, transparent 70%)',
          }}
        />
        {/* Grid pattern */}
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
          {/* Swords icon animated */}
          <motion.div
            animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-forge-orange/20 border border-forge-orange/30 mb-6 mx-auto"
          >
            <Swords className="h-7 w-7 text-forge-orange" />
          </motion.div>

          {/* Giant BATTLE heading with outline effect */}
          <h1
            className="font-display font-black leading-none select-none"
            style={{ fontSize: 'clamp(4rem, 14vw, 10rem)', letterSpacing: '-0.04em' }}
          >
            <span
              className="block text-transparent"
              style={{ WebkitTextStroke: '2px rgba(255,107,43,0.5)' }}
            >
              BATTLE
            </span>
            <span className="block text-forge-orange -mt-4" style={{ fontSize: '0.55em' }}>
              ARENA
            </span>
          </h1>

          <p className="mt-6 text-white/60 max-w-md mx-auto text-lg leading-relaxed font-semibold">
            Two prompts. One winner. You decide.
          </p>

          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link href="/leaderboard" className="btn-orange">
              <Trophy className="h-4 w-4" />
              View Leaderboard
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-5 py-2.5 text-sm font-black text-white transition-all hover:border-white/40 hover:bg-white/10"
            >
              Browse Prompts
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Floating stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative z-10 mt-14 flex justify-center gap-10 flex-wrap px-6"
        >
          {[
            { label: 'Active Battles',  value: loading ? '—' : String(sessions.length) },
            { label: 'Total Votes',     value: loading ? '—' : totalVotesCast.toLocaleString() },
            { label: 'Top ELO Rating',  value: topCreators[0] ? String(topCreators[0].eloRating) : '—' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display font-black text-3xl text-white leading-none">
                {stat.value}
              </div>
              <div className="text-xs text-white/40 font-semibold mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Active Battles ────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-black text-forge-orange uppercase tracking-widest mb-1">
              Live Now
            </div>
            <h2 className="font-display font-black text-forge-ink text-4xl leading-none">
              ACTIVE BATTLES
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-1.5 rounded-xl border-2 border-forge-border bg-white px-4 py-2.5 text-sm font-black text-forge-muted transition-all hover:border-forge-orange hover:text-forge-orange disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="h-4 w-4 rounded-full border-2 border-forge-muted/30 border-t-forge-orange"
                    />
                    Seeding…
                  </>
                ) : (
                  <>
                    <Swords className="h-4 w-4" />
                    Seed Battles
                  </>
                )}
              </button>
            )}
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 text-sm font-bold text-forge-orange hover:underline"
            >
              Full Leaderboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-white border-2 border-forge-border animate-pulse"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-forge-border bg-white p-16 text-center shadow-[4px_4px_0_#0A0A0A]"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Swords className="h-14 w-14 text-forge-border mx-auto mb-5" />
            </motion.div>
            <h3 className="font-display font-black text-forge-ink text-2xl mb-2">
              No Active Battles
            </h3>
            <p className="text-forge-muted text-sm mb-6">
              The arena is quiet. Check back soon, or seed new battles if you are an admin.
            </p>
            {user?.role === 'ADMIN' && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="btn-orange mx-auto"
              >
                <Swords className="h-4 w-4" />
                {seeding ? 'Seeding…' : 'Seed Battle Sessions'}
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {sessions.map((session) => (
              <LiveBattleCard
                key={session.id}
                session={session}
                userVote={userVotes[session.id]}
                output={outputs[session.id]}
                onVote={handleVote}
                onRunAndJudge={handleRunAndJudge}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Winners ────────────────────────────────────────────────── */}
      {completed.length > 0 && (
        <div className="bg-white border-y-2 border-forge-border">
          <div className="max-w-[1200px] mx-auto px-6 py-14">
            <div className="mb-8">
              <div className="text-[10px] font-black text-forge-orange uppercase tracking-widest mb-1">
                Concluded
              </div>
              <h2 className="font-display font-black text-forge-ink text-4xl leading-none">
                RECENT WINNERS
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completed.map((s, i) => {
                const winnerIsA = s.winnerId === s.promptAId
                const total = (s.votesA ?? 0) + (s.votesB ?? 0)
                const winnerVotes = winnerIsA ? s.votesA : s.votesB
                const winnerPct = total > 0 ? Math.round((winnerVotes / total) * 100) : 0
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-xl border-2 border-forge-border bg-white p-4 shadow-[2px_2px_0_#0A0A0A] flex flex-col gap-3"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-[10px] font-black text-forge-ink uppercase tracking-wider">
                        Battle Complete
                      </span>
                    </div>

                    {/* Winner */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="text-sm font-black text-forge-ink truncate">
                        {winnerIsA ? s.promptA.title : s.promptB.title}
                      </span>
                    </div>

                    {/* Defeated label */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-forge-border" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-forge-muted px-1">
                        defeated
                      </span>
                      <div className="flex-1 h-px bg-forge-border" />
                    </div>

                    {/* Loser */}
                    <div className="px-3 py-2 flex items-center gap-2 opacity-50">
                      <span className="text-sm font-semibold text-forge-ink line-through truncate">
                        {winnerIsA ? s.promptB.title : s.promptA.title}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-[11px] text-forge-muted font-semibold border-t border-forge-border pt-3 mt-auto">
                      <span className="text-forge-orange font-black">{winnerPct}% of votes</span>
                      <span>{total} total votes</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard Preview ───────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Top Prompts */}
          {topPrompts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[10px] font-black text-forge-orange uppercase tracking-widest mb-1">
                    Rankings
                  </div>
                  <h2 className="font-display font-black text-forge-ink text-2xl leading-none">
                    TOP PROMPTS
                  </h2>
                </div>
                <Link
                  href="/leaderboard"
                  className="text-sm font-bold text-forge-orange hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="rounded-2xl border-2 border-forge-border bg-white shadow-[4px_4px_0_#0A0A0A] overflow-hidden">
                {topPrompts.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-forge-silver/30 ${
                      i < topPrompts.length - 1 ? 'border-b-2 border-forge-border' : ''
                    } ${i === 0 ? 'bg-orange-50/50 border-l-4 border-l-forge-orange' : ''}`}
                  >
                    <span
                      className={`w-7 text-center font-display font-black text-lg leading-none ${
                        i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-forge-muted'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/prompt/${p.id}`}
                        className="font-bold text-forge-ink text-sm hover:text-forge-orange transition-colors truncate block"
                      >
                        {p.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                            CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.OTHER
                          }`}
                        >
                          {p.category}
                        </span>
                        <span className="text-xs text-forge-muted">by @{p.author.username}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black text-forge-ink">
                      <ChevronUp className="h-4 w-4 text-forge-orange" />
                      {p.upvoteCount.toLocaleString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Top Creators */}
          {topCreators.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[10px] font-black text-forge-orange uppercase tracking-widest mb-1">
                    Rankings
                  </div>
                  <h2 className="font-display font-black text-forge-ink text-2xl leading-none">
                    TOP CREATORS
                  </h2>
                </div>
                <Link
                  href="/leaderboard?tab=creators"
                  className="text-sm font-bold text-forge-orange hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="rounded-2xl border-2 border-forge-border bg-white shadow-[4px_4px_0_#0A0A0A] overflow-hidden">
                {topCreators.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-forge-silver/30 ${
                      i < topCreators.length - 1 ? 'border-b-2 border-forge-border' : ''
                    }`}
                  >
                    <span
                      className={`w-7 text-center font-display font-black text-lg leading-none ${
                        i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-forge-muted'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white bg-forge-orange">
                      {(u.displayName ?? u.username).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${u.username}`}
                        className="font-bold text-forge-ink text-sm hover:text-forge-orange transition-colors truncate flex items-center gap-1.5"
                      >
                        {u.displayName ?? u.username}
                        {u.isPremium && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-forge-muted mt-0.5">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {u._count.followers}
                        </span>
                        <span>{u._count.prompts} prompts</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-forge-black px-2.5 py-1.5">
                      <Zap className="h-3.5 w-3.5 text-forge-orange fill-forge-orange" />
                      <span className="font-black text-white text-sm">{u.eloRating}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
