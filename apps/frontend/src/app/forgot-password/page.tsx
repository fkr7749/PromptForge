'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return }

    setLoading(true)
    setError('')
    // Simulate API call — in production this would hit /api/auth/forgot-password
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-forge-silver flex items-center justify-center pt-16 pb-16">
        <div className="w-full max-w-md px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-hard rounded-2xl bg-white p-8"
          >
            {!submitted ? (
              <>
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-forge-black">
                    <Mail className="h-7 w-7 text-forge-orange" />
                  </div>
                  <h1 className="font-display text-2xl font-black uppercase tracking-tight text-forge-ink">
                    Reset Password
                  </h1>
                  <p className="mt-2 text-sm text-forge-muted">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-forge-ink">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forge-muted" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border-2 border-forge-border bg-forge-silver py-2.5 pl-10 pr-4 text-sm font-medium text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-orange w-full py-3 text-sm disabled:opacity-60"
                  >
                    {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-forge-muted hover:text-forge-ink transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-forge-ink mb-2">
                  Check Your Email
                </h2>
                <p className="text-sm text-forge-muted mb-1">
                  We sent a password reset link to
                </p>
                <p className="text-sm font-bold text-forge-ink mb-6">{email}</p>
                <p className="text-xs text-forge-muted mb-8">
                  Didn&apos;t receive it? Check your spam folder or{' '}
                  <button
                    onClick={() => setSubmitted(false)}
                    className="font-bold text-forge-orange hover:underline"
                  >
                    try again
                  </button>.
                </p>
                <Link href="/login" className="btn-ghost text-sm inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </>
  )
}
