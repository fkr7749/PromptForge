'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Github, ArrowUpRight, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { useAuthStore } from '@/store/auth'

const FEATURES = [
  'Test prompts across 6+ frontier models',
  'Version control every prompt change',
  'Publish to the prompt marketplace',
  'Earn from your best prompts',
]

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@promptforge.dev', color: 'bg-forge-orange text-white' },
  { label: 'Creator', email: 'alex@promptforge.dev', color: 'bg-forge-black text-white' },
  { label: 'User', email: 'elena@promptforge.dev', color: 'bg-forge-silver text-forge-ink border-2 border-forge-border' },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json() as { user?: { id: string; email: string; username: string; displayName: string; role: string }; accessToken?: string; message?: string }
      if (!res.ok) throw new Error(data.message ?? 'Login failed')
      setAuth(data.user!, data.accessToken!)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — editorial brand panel */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-forge-black p-14 lg:flex">
        {/* Giant background text */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 select-none leading-none"
          style={{ fontSize: 'clamp(8rem, 16vw, 16rem)', letterSpacing: '-0.06em' }}
        >
          <span
            className="block font-display font-black"
            style={{ WebkitTextStroke: '1px rgba(255,255,255,0.05)', color: 'transparent' }}
          >
            LOG
            <br />
            IN.
          </span>
        </div>

        {/* Orange top accent */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-forge-orange" />

        {/* Logo */}
        <div>
          <Link href="/" className="group inline-flex items-center gap-3">
            <div className="text-forge-orange">
              <Logo size={40} variant="filled" />
            </div>
            <span className="font-display text-xl font-black text-white tracking-tight">
              PROMPT<span className="text-forge-orange">FORGE</span>
            </span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-forge-green animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">12,000+ builders active</span>
          </div>
          <h1
            className="mb-6 font-display font-black text-white"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
          >
            WHERE GREAT
            <br />
            PROMPTS ARE
            <br />
            <span className="text-forge-orange">FORGED.</span>
          </h1>
          <ul className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 text-sm text-white/70"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-forge-orange">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {f}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Bottom testimonial card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative z-10 rounded-2xl border-2 border-white/10 bg-white/5 p-5"
        >
          <p className="mb-3 text-sm leading-relaxed text-white/80">
            "PromptForge turned my prompt engineering skills into $2,400/month. It's the platform I've been waiting for."
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-forge-orange bg-forge-orange font-black text-xs text-white">
              PN
            </div>
            <div>
              <div className="text-xs font-bold text-white">Priya Nair</div>
              <div className="text-xs text-white/40">Freelance AI Consultant</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col bg-forge-silver">
        {/* Mobile logo */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="text-forge-black"><Logo size={32} variant="filled" /></div>
            <span className="font-display text-lg font-black text-forge-ink">PROMPTFORGE</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-forge-muted transition-colors hover:text-forge-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="mb-8">
              <div className="section-label mb-3">Welcome back</div>
              <h2
                className="font-display font-black text-forge-ink"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
              >
                SIGN IN TO
                <br />
                <span className="text-gradient">YOUR FORGE.</span>
              </h2>
            </div>

            {/* GitHub OAuth */}
            <a
              href="/api/auth/github"
              className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-forge-black bg-forge-black px-6 py-3.5 text-sm font-black text-white transition-all hover:bg-forge-orange hover:border-forge-orange"
              style={{ boxShadow: '4px 4px 0px #0A0A0A' }}
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </a>

            {/* Divider */}
            <div className="relative mb-6 flex items-center">
              <div className="flex-1 border-t-2 border-forge-border" />
              <span className="mx-4 text-xs font-bold uppercase tracking-wider text-forge-muted">or</span>
              <div className="flex-1 border-t-2 border-forge-border" />
            </div>

            {/* Demo accounts */}
            <div className="mb-6 rounded-2xl border-2 border-dashed border-forge-border bg-white p-4">
              <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-forge-muted">
                Quick Demo Access
              </p>
              <div className="flex gap-2">
                {DEMO_ACCOUNTS.map(({ label, email, color }) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => setForm({ email, password: 'Password123!' })}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-black transition-all hover:scale-[1.03] active:scale-95 ${color}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-forge-subtle">
                Click a role to fill credentials, then hit Sign In
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Email/Password form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-forge-muted">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border-2 border-forge-border bg-white px-4 py-3 text-sm text-forge-ink placeholder-forge-subtle outline-none transition-colors focus:border-forge-orange"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-forge-muted">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-forge-orange hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full rounded-xl border-2 border-forge-border bg-white px-4 py-3 pr-12 text-sm text-forge-ink placeholder-forge-subtle outline-none transition-colors focus:border-forge-orange"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-forge-muted transition-colors hover:text-forge-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-orange w-full justify-center py-3.5 text-sm disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-forge-muted">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-black text-forge-orange hover:underline">
                Start for free →
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
