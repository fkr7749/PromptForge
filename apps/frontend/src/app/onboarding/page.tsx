'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Loader2,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

// ── Types ──────────────────────────────────────────────────────────────────────
type UserType = 'developer' | 'writer' | 'explorer'

interface SuggestedPrompt {
  id: string
  title: string
  description: string
  category: string
  upvoteCount: number
}

interface SuggestedCreator {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────
const USER_TYPES = [
  {
    id: 'developer' as UserType,
    emoji: '🛠️',
    title: 'Developer',
    desc: 'I build AI-powered apps and tools',
  },
  {
    id: 'writer' as UserType,
    emoji: '✍️',
    title: 'Writer & Marketer',
    desc: 'I create content, copy, and campaigns',
  },
  {
    id: 'explorer' as UserType,
    emoji: '🔭',
    title: 'Explorer',
    desc: "I'm curious about AI and prompt engineering",
  },
]

const INTEREST_CHIPS = [
  'Code Generation',
  'Content Writing',
  'Data Analysis',
  'Customer Support',
  'Research & Summarization',
  'Education & Tutoring',
  'Creative Writing',
  'Image Prompts',
  'Business Automation',
]

const STARTER_PROMPTS: Record<UserType, { content: string; label: string }> = {
  developer: {
    label: 'Code Review Prompt',
    content:
      'Review the following code for bugs, performance issues, and best practices. Provide specific suggestions for improvement:\n\n```python\ndef calculate_total(items):\n    total = 0\n    for i in range(len(items)):\n        total = total + items[i][\'price\'] * items[i][\'qty\']\n    return total\n```',
  },
  writer: {
    label: 'Blog Post Prompt',
    content:
      'Write a compelling 300-word introduction for a blog post about the future of AI in creative work. The tone should be optimistic but grounded in real examples. Hook the reader with a surprising insight.',
  },
  explorer: {
    label: 'Explain AI Prompt',
    content:
      'Explain how large language models (LLMs) work to someone who has never studied computer science. Use a simple analogy and avoid jargon. Keep it engaging and under 200 words.',
  },
}

const CATEGORY_BY_TYPE: Record<UserType, string> = {
  developer: 'CODING',
  writer: 'WRITING',
  explorer: 'RESEARCH',
}

// ── Confetti Dot ───────────────────────────────────────────────────────────────
function ConfettiDot({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute top-0 h-3 w-3 rounded-full"
      style={{ left: `${x}%`, backgroundColor: color }}
      initial={{ y: -20, opacity: 1, scale: 0 }}
      animate={{
        y: [0, -80, 120],
        opacity: [0, 1, 0],
        scale: [0, 1, 0.5],
        rotate: [0, 180, 360],
      }}
      transition={{ duration: 2.5, delay, ease: 'easeInOut' }}
    />
  )
}

function ConfettiField() {
  const dots = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1.5,
    x: Math.random() * 100,
    color: (['#FF6B2B', '#EBEBEB', '#1A1A1A', '#FFD700', '#4ADE80', '#60A5FA'] as string[])[
      Math.floor(Math.random() * 6)
    ] ?? '#FF6B2B',
  }))
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <ConfettiDot key={d.id} delay={d.delay} x={d.x} color={d.color} />
      ))}
    </div>
  )
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

// ── Main Onboarding Page ───────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { user, accessToken } = useAuthStore()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const TOTAL_STEPS = 4

  // Step 1
  const [userType, setUserType] = useState<UserType | null>(null)

  // Step 2
  const [interests, setInterests] = useState<string[]>([])

  // Step 3
  const [runOutput, setRunOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [runDone, setRunDone] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  // Step 4
  const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>([])
  const [suggestedCreators, setSuggestedCreators] = useState<SuggestedCreator[]>([])
  const [step4Loading, setStep4Loading] = useState(false)

  // Completing
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  // Fetch step 4 data when entering step 4
  useEffect(() => {
    if (step !== 4) return
    const category = userType ? CATEGORY_BY_TYPE[userType] : 'CODING'
    setStep4Loading(true)

    Promise.all([
      fetch(`/api/prompts?category=${category}&sort=popular&limit=3`).then((r) =>
        r.ok ? r.json() : { prompts: [] }
      ),
      fetch(`/api/users?sort=popular&limit=3`).then((r) =>
        r.ok ? r.json() : { users: [] }
      ),
    ])
      .then(([promptsData, usersData]) => {
        setSuggestedPrompts((promptsData as { prompts: SuggestedPrompt[] }).prompts ?? [])
        setSuggestedCreators((usersData as { users: SuggestedCreator[] }).users ?? [])
      })
      .catch(console.error)
      .finally(() => setStep4Loading(false))
  }, [step, userType])

  const handleRunPrompt = async () => {
    if (!userType) return
    const { content } = STARTER_PROMPTS[userType]
    setRunning(true)
    setRunOutput('')
    setRunDone(false)

    try {
      const res = await fetch('/api/playground/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          maxTokens: 512,
        }),
      })

      if (!res.ok || !res.body) {
        setRunOutput('Something went wrong. Please try again.')
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // SSE: lines starting with "data: "
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') break
            try {
              const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> }
              const token = parsed.choices?.[0]?.delta?.content ?? ''
              accumulated += token
              setRunOutput(accumulated)
              if (outputRef.current) {
                outputRef.current.scrollTop = outputRef.current.scrollHeight
              }
            } catch {
              // non-JSON line, skip
            }
          }
        }
      }

      setRunDone(true)
    } catch {
      setRunOutput('An error occurred while running the prompt.')
    } finally {
      setRunning(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return userType !== null
    if (step === 2) return interests.length > 0
    return true
  }

  const handleNext = () => {
    if (!canProceed()) return
    if (step < TOTAL_STEPS) setStep((s) => s + 1)
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ onboardingCompleted: true, userType }),
      })
    } catch {
      // proceed anyway
    }
    router.push('/dashboard')
  }

  const handleSkip = async () => {
    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ onboardingCompleted: true }),
      })
    } catch {
      // proceed anyway
    }
    router.push('/dashboard')
  }

  if (!user) return null

  const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="relative flex min-h-screen flex-col bg-forge-black">
      {/* Progress bar */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-white/10">
        <motion.div
          className="h-full bg-forge-orange"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Skip button */}
      <div className="absolute right-6 top-4 z-10">
        <button
          onClick={handleSkip}
          className="text-xs font-bold text-white/40 transition-colors hover:text-white/70"
        >
          Skip setup →
        </button>
      </div>

      {/* Step indicator */}
      <div className="absolute left-6 top-4 flex items-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i + 1 <= step ? 'bg-forge-orange w-6' : 'bg-white/20 w-4'
            }`}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <AnimatePresence mode="wait">
          {/* ── STEP 1: Who are you? ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl text-center"
            >
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-forge-orange">
                Step 1 of {TOTAL_STEPS}
              </div>
              <h1
                className="mb-3 font-display font-black text-white"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
              >
                WELCOME TO
                <br />
                <span className="text-forge-orange">PROMPTFORGE</span>
              </h1>
              <p className="mb-10 text-base text-white/50">
                {"Let's personalize your experience"}
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {USER_TYPES.map((type) => {
                  const selected = userType === type.id
                  return (
                    <button
                      key={type.id}
                      onClick={() => setUserType(type.id)}
                      className={`rounded-2xl border-2 p-6 text-left transition-all duration-200 ${
                        selected
                          ? 'border-forge-orange bg-forge-orange/10 shadow-[0_0_20px_rgba(255,107,43,0.3)]'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="mb-3 text-3xl">{type.emoji}</div>
                      <div className="mb-1 font-display text-base font-black text-white">
                        {type.title}
                      </div>
                      <div className="text-sm leading-relaxed text-white/50">{type.desc}</div>
                      {selected && (
                        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-forge-orange">
                          <Check className="h-3.5 w-3.5" />
                          Selected
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: What do you want to build? ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl text-center"
            >
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-forge-orange">
                Step 2 of {TOTAL_STEPS}
              </div>
              <h2
                className="mb-3 font-display font-black text-white"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
              >
                WHAT BRINGS
                <br />
                YOU HERE?
              </h2>
              <p className="mb-8 text-sm text-white/50">
                Select all that apply — we{"'"}ll surface the best prompts for you.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {INTEREST_CHIPS.map((chip) => {
                  const selected = interests.includes(chip)
                  return (
                    <button
                      key={chip}
                      onClick={() =>
                        setInterests((prev) =>
                          selected ? prev.filter((i) => i !== chip) : [...prev, chip]
                        )
                      }
                      className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-200 ${
                        selected
                          ? 'border-forge-orange bg-forge-orange text-white shadow-[0_0_12px_rgba(255,107,43,0.4)]'
                          : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      {selected && <Check className="mr-1 inline-block h-3.5 w-3.5" />}
                      {chip}
                    </button>
                  )
                })}
              </div>

              {interests.length > 0 && (
                <p className="mt-6 text-xs text-forge-orange">
                  {interests.length} selected
                </p>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: Try it now ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl"
            >
              <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-forge-orange">
                Step 3 of {TOTAL_STEPS}
              </div>
              <h2
                className="mb-3 text-center font-display font-black text-white"
                style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
              >
                SEE THE MAGIC
                <br />
                <span className="text-forge-orange">HAPPEN</span>
              </h2>
              <p className="mb-8 text-center text-sm text-white/50">
                Run a pre-loaded prompt and watch AI respond in real time.
              </p>

              {/* Mini playground */}
              <div className="rounded-2xl border-2 border-white/10 bg-white/5 p-6">
                {/* Prompt label */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-forge-orange/20 px-3 py-1 text-xs font-bold text-forge-orange">
                    {userType ? STARTER_PROMPTS[userType].label : 'Sample Prompt'}
                  </span>
                </div>

                {/* Prompt content */}
                <div className="mb-4 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-white/70">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {userType ? STARTER_PROMPTS[userType].content : ''}
                  </pre>
                </div>

                {/* Run button */}
                <button
                  onClick={handleRunPrompt}
                  disabled={running}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-forge-orange px-6 py-3.5 font-display font-black text-white shadow-[0_4px_20px_rgba(255,107,43,0.4)] transition-all hover:bg-orange-500 disabled:opacity-60"
                >
                  {running ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      RUN IT →
                    </>
                  )}
                </button>

                {/* Output area */}
                {(runOutput || running) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-forge-orange" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                        Output
                      </span>
                      {runDone && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="ml-auto flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-400"
                        >
                          <Check className="h-3 w-3" />
                          Your first AI execution!
                        </motion.span>
                      )}
                    </div>
                    <div
                      ref={outputRef}
                      className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-relaxed text-white/80"
                    >
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {runOutput}
                        {running && (
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-forge-orange" />
                        )}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Skip link */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStep(4)}
                  className="text-sm text-white/30 transition-colors hover:text-white/60"
                >
                  {"I'll try later →"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: You're ready ── */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl text-center"
            >
              <ConfettiField />

              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-forge-orange">
                Step 4 of {TOTAL_STEPS}
              </div>
              <h2
                className="mb-3 font-display font-black text-white"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
              >
                {"YOU'RE"}
                <br />
                <span className="text-forge-orange">ALL SET!</span>
              </h2>
              <p className="mb-10 text-sm text-white/50">
                {"Here's what we found for you"}
              </p>

              {step4Loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-forge-orange" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Suggested prompts */}
                  {suggestedPrompts.length > 0 && (
                    <div>
                      <div className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                        Prompts you'll love
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {suggestedPrompts.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-xl border border-white/10 bg-white/5 p-4 text-left"
                          >
                            <div className="mb-1 font-display text-sm font-black text-white line-clamp-1">
                              {p.title}
                            </div>
                            <div className="text-xs leading-relaxed text-white/40 line-clamp-2">
                              {p.description}
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-white/30">
                              <span>♥ {p.upvoteCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested creators */}
                  {suggestedCreators.length > 0 && (
                    <div>
                      <div className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                        3 creators to follow
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-4">
                        {suggestedCreators.map((creator) => (
                          <div
                            key={creator.id}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                          >
                            {creator.avatarUrl ? (
                              <img
                                src={creator.avatarUrl}
                                alt={creator.username}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${avatarColor(creator.username)}`}
                              >
                                {initials(creator.displayName || creator.username)}
                              </div>
                            )}
                            <div className="text-left">
                              <div className="text-sm font-bold text-white">
                                {creator.displayName}
                              </div>
                              <div className="text-xs text-white/40">@{creator.username}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleComplete}
                disabled={completing}
                className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-forge-orange px-8 py-4 font-display text-lg font-black text-white shadow-[0_4px_30px_rgba(255,107,43,0.5)] transition-all hover:bg-orange-500 hover:shadow-[0_4px_40px_rgba(255,107,43,0.7)] disabled:opacity-60"
              >
                {completing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    ENTER PROMPTFORGE →
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {step < 4 && (
        <div className="flex items-center justify-between px-8 pb-10">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="text-sm font-bold text-white/30 transition-colors hover:text-white/60 disabled:invisible"
          >
            ← Back
          </button>

          <button
            onClick={step === 3 ? () => setStep(4) : handleNext}
            disabled={!canProceed()}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-display font-black transition-all ${
              canProceed()
                ? 'bg-forge-orange text-white shadow-[0_4px_20px_rgba(255,107,43,0.4)] hover:bg-orange-500'
                : 'cursor-not-allowed bg-white/10 text-white/30'
            }`}
          >
            {step === 3 ? 'Continue' : step === TOTAL_STEPS - 1 ? "See What's Next" : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
