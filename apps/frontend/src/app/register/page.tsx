'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Github, ArrowUpRight, Eye, EyeOff, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    sub: 'forever',
    features: ['50 AI executions/mo', '10 saved prompts', 'Public library access'],
  },
  {
    id: 'creator',
    name: 'Creator',
    price: '$19',
    sub: '/month',
    features: ['2,000 AI executions/mo', 'All 6 Groq models', 'Prompt versioning', 'Marketplace access'],
    popular: true,
  },
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<'starter' | 'creator'>('starter')
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.name,
          username: form.username || form.name.toLowerCase().replace(/\s+/g, '_'),
          email: form.email,
          password: form.password,
        }),
      })
      const data = await res.json() as { user?: { id: string; email: string; username: string; displayName: string; role: string }; accessToken?: string; message?: string }
      if (!res.ok) throw new Error(data.message ?? 'Registration failed')
      setAuth(data.user!, data.accessToken!)
      router.push('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
          style={{ fontSize: 'clamp(6rem, 14vw, 14rem)', letterSpacing: '-0.06em' }}
        >
          <span
            className="block font-display font-black"
            style={{ WebkitTextStroke: '1px rgba(255,255,255,0.05)', color: 'transparent' }}
          >
            START
            <br />
            FREE.
          </span>
        </div>

        {/* Orange top accent */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-forge-orange" />

        {/* Logo */}
        <Link href="/" className="relative z-10 inline-flex items-center gap-3">
          <div className="text-forge-orange"><Logo size={40} variant="filled" /></div>
          <span className="font-display text-xl font-black text-white tracking-tight">
            PROMPT<span className="text-forge-orange">FORGE</span>
          </span>
        </Link>

        {/* Center */}
        <div className="relative z-10">
          <h1
            className="mb-6 font-display font-black text-white"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
          >
            BUILD BETTER
            <br />
            AI WITH THE
            <br />
            <span className="text-forge-orange">RIGHT TOOLS.</span>
          </h1>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: '12K+', label: 'Builders' },
              { val: '6', label: 'Models' },
              { val: '$2.4K', label: 'Top creator/mo' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border-2 border-white/10 bg-white/5 p-3 text-center">
                <div className="font-display text-2xl font-black text-forge-orange">{s.val}</div>
                <div className="text-xs text-white/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan picker */}
        <div className="relative z-10 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-white/40">Choose your plan</div>
          {PLANS.map(p => (
            <button
              key={p.id}
              onClick={() => setPlan(p.id as typeof plan)}
              className={cn(
                'w-full rounded-xl border-2 p-4 text-left transition-all',
                plan === p.id
                  ? 'border-forge-orange bg-forge-orange/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-black text-white">{p.name}</span>
                    {p.popular && (
                      <span className="rounded-full bg-forge-orange px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display text-xl font-black text-forge-orange">{p.price}</span>
                    <span className="text-xs text-white/40">{p.sub}</span>
                  </div>
                </div>
                <div className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  plan === p.id ? 'border-forge-orange bg-forge-orange' : 'border-white/20'
                )}>
                  {plan === p.id && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-white/50">
                    <div className="h-1 w-1 rounded-full bg-forge-orange" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {/* Right — form */}
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
              <div className="section-label mb-3">Free forever</div>
              <h2
                className="font-display font-black text-forge-ink"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
              >
                CREATE YOUR
                <br />
                <span className="text-gradient">FORGE ACCOUNT.</span>
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

            <div className="relative mb-6 flex items-center">
              <div className="flex-1 border-t-2 border-forge-border" />
              <span className="mx-4 text-xs font-bold uppercase tracking-wider text-forge-muted">or</span>
              <div className="flex-1 border-t-2 border-forge-border" />
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-forge-muted">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Alex Johnson"
                    className="w-full rounded-xl border-2 border-forge-border bg-white px-4 py-3 text-sm text-forge-ink placeholder-forge-subtle outline-none transition-colors focus:border-forge-orange"
                  />
                </div>
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-forge-muted">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="alex_dev"
                    className="w-full rounded-xl border-2 border-forge-border bg-white px-4 py-3 text-sm text-forge-ink placeholder-forge-subtle outline-none transition-colors focus:border-forge-orange"
                  />
                </div>
              </div>

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
                <label htmlFor="password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-forge-muted">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 8 characters"
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
                {/* Password strength indicator */}
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-all duration-300',
                        form.password.length === 0 ? 'bg-forge-border' :
                        form.password.length < 6 && i === 0 ? 'bg-red-400' :
                        form.password.length < 8 && i <= 1 ? 'bg-forge-amber' :
                        form.password.length >= 8 && i <= 2 ? 'bg-forge-green' :
                        form.password.length >= 12 && i <= 3 ? 'bg-forge-green' :
                        'bg-forge-border'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile plan selector */}
              <div className="lg:hidden">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-forge-muted">Plan</div>
                <div className="flex gap-2">
                  {PLANS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p.id as typeof plan)}
                      className={cn(
                        'flex-1 rounded-xl border-2 py-2.5 text-xs font-black transition-all',
                        plan === p.id
                          ? 'border-forge-orange bg-forge-orange text-white'
                          : 'border-forge-border text-forge-muted hover:border-forge-ink'
                      )}
                    >
                      {p.name}
                      <br />
                      <span className="font-mono">{p.price}</span>
                    </button>
                  ))}
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
                    Creating account…
                  </span>
                ) : (
                  <>
                    Create Free Account
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-forge-subtle">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-forge-orange hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-forge-orange hover:underline">Privacy Policy</Link>.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-forge-muted">
              Already have an account?{' '}
              <Link href="/login" className="font-black text-forge-orange hover:underline">
                Sign in →
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
