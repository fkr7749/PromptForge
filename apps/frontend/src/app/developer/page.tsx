'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key, Plus, Trash2, Copy, Check, Code, Terminal, Zap, Shield,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  createdAt: string
  expiresAt: string | null
}

interface CreatedKeyResponse {
  id: string
  name: string
  prefix: string
  key: string
  createdAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

// ── Code snippet data ─────────────────────────────────────────────────────

const curlSnippets = [
  {
    label: 'List Prompts',
    code: `curl -X GET https://promptforge.dev/api/prompts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  },
  {
    label: 'Execute Prompt',
    code: `curl -X POST https://promptforge.dev/api/playground/execute \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "promptId": "clx1234abc",
    "model": "gpt-4o",
    "variables": {
      "topic": "AI safety"
    }
  }'`,
  },
]

const jsSnippets = [
  {
    label: 'List Prompts',
    code: `const response = await fetch('https://promptforge.dev/api/prompts', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
});

const { prompts } = await response.json();
console.log(prompts);`,
  },
  {
    label: 'Execute Prompt',
    code: `const response = await fetch('https://promptforge.dev/api/playground/execute', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    promptId: 'clx1234abc',
    model: 'gpt-4o',
    variables: { topic: 'AI safety' },
  }),
});

const { result } = await response.json();
console.log(result);`,
  },
]

const rateLimits = [
  { plan: 'Free',       requests: '100 req / day',    burst: '10 req / min',  color: '#EBEBEB',  textColor: '#1A1A1A' },
  { plan: 'Pro',        requests: '10,000 req / day', burst: '100 req / min', color: '#FF6B2B',  textColor: '#ffffff' },
  { plan: 'Enterprise', requests: 'Unlimited',        burst: 'Custom',        color: '#0A0A0A',  textColor: '#ffffff' },
]

// ── Animation variants ────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function DeveloperPage() {
  const { user, accessToken } = useAuthStore()

  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [creating, setCreating] = useState<boolean>(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'curl' | 'js'>('curl')
  const [activeSnippet, setActiveSnippet] = useState<number>(0)
  const [snippetCopied, setSnippetCopied] = useState<boolean>(false)

  // ── Fetch keys ───────────────────────────────────────────────────────────

  const fetchKeys = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/developer/keys', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data: { keys: ApiKey[] } = await res.json()
        setKeys(data.keys ?? [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (user && accessToken) {
      fetchKeys()
    }
  }, [user, accessToken, fetchKeys])

  // ── Create key ───────────────────────────────────────────────────────────

  async function handleCreateKey(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!accessToken || !newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (res.ok) {
        const data: CreatedKeyResponse = await res.json()
        setNewlyCreatedKey(data.key)
        setNewKeyName('')
        await fetchKeys()
      }
    } catch {
      // silently fail
    } finally {
      setCreating(false)
    }
  }

  // ── Revoke key ───────────────────────────────────────────────────────────

  async function handleRevokeKey(id: string) {
    if (!accessToken) return
    setRevokingId(id)
    try {
      const res = await fetch(`/api/developer/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id))
      }
    } catch {
      // silently fail
    } finally {
      setRevokingId(null)
    }
  }

  // ── Copy helpers ─────────────────────────────────────────────────────────

  function copyKey() {
    if (!newlyCreatedKey) return
    navigator.clipboard.writeText(newlyCreatedKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function copySnippet() {
    const snippets = activeTab === 'curl' ? curlSnippets : jsSnippets
    const code = snippets[activeSnippet]?.code ?? ''
    navigator.clipboard.writeText(code).then(() => {
      setSnippetCopied(true)
      setTimeout(() => setSnippetCopied(false), 2000)
    })
  }

  const currentSnippets = activeTab === 'curl' ? curlSnippets : jsSnippets

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forge-black pt-24 pb-20">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Orange glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-forge-orange/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 md:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-bold text-white/60 backdrop-blur-sm"
          >
            <Terminal className="h-3.5 w-3.5 text-forge-orange" />
            Developer Hub
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-black text-5xl md:text-6xl text-white leading-[1.05] tracking-tight mb-5"
          >
            Build with{' '}
            <span className="text-forge-orange">Developer API</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-2xl text-lg text-white/50 leading-relaxed mb-10"
          >
            Integrate PromptForge's powerful prompt library and AI execution engine
            directly into your applications. Programmatic access to thousands of
            community-vetted prompts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap justify-center gap-6 text-sm font-bold text-white/40"
          >
            {[
              { icon: Zap,     label: 'Fast & Reliable'  },
              { icon: Shield,  label: 'Secure by Default' },
              { icon: Code,    label: 'RESTful API'       },
              { icon: Key,     label: 'API Key Auth'      },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-forge-orange" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 md:px-10 py-16 space-y-12">

        {/* ── API Keys section ─────────────────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forge-black">
              <Key className="h-5 w-5 text-forge-orange" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-forge-ink">API Keys</h2>
              <p className="text-sm text-forge-muted">Manage your personal API credentials</p>
            </div>
          </div>

          {!user ? (
            /* Unauthenticated state */
            <div className="card-hard rounded-2xl border-2 border-forge-border bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-forge-silver">
                <Key className="h-8 w-8 text-forge-muted" />
              </div>
              <h3 className="font-display font-black text-xl text-forge-ink mb-2">
                Sign in to manage API keys
              </h3>
              <p className="text-forge-muted mb-6 max-w-sm mx-auto">
                Create and manage your API keys to start building with PromptForge.
              </p>
              <Link href="/login" className="btn-orange inline-flex">
                Sign In
              </Link>
            </div>
          ) : (
            <div className="card-hard rounded-2xl border-2 border-forge-border bg-white overflow-hidden">

              {/* One-time key display */}
              <AnimatePresence>
                {newlyCreatedKey && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-b-2 border-forge-amber/40 bg-amber-50 p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-forge-amber shrink-0 mt-0.5" />
                          <div>
                            <p className="font-black text-forge-ink text-sm">API Key Created</p>
                            <p className="text-xs text-forge-muted font-semibold">
                              ⚠ This key will never be shown again. Copy it now.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-xl border-2 border-forge-amber/40 bg-white px-4 py-2.5 font-mono text-sm text-forge-ink overflow-x-auto whitespace-nowrap">
                          {newlyCreatedKey}
                        </code>
                        <button
                          onClick={copyKey}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-forge-amber/40 bg-white transition-all hover:bg-forge-amber/10"
                          aria-label="Copy key"
                        >
                          {copied
                            ? <Check className="h-4 w-4 text-green-600" />
                            : <Copy className="h-4 w-4 text-forge-muted" />
                          }
                        </button>
                        <button
                          onClick={() => setNewlyCreatedKey(null)}
                          className="rounded-xl border-2 border-forge-amber/40 bg-white px-4 py-2 text-xs font-black text-forge-ink transition-all hover:bg-forge-amber/10 whitespace-nowrap"
                        >
                          I&apos;ve saved it
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keys list */}
              <div className="divide-y divide-forge-border">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-forge-orange"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, delay: i * 0.12, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                ) : keys.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Key className="h-10 w-10 text-forge-border" />
                    <p className="font-bold text-forge-muted">No API keys yet</p>
                    <p className="text-sm text-forge-muted/70">Create your first key below to get started</p>
                  </div>
                ) : (
                  keys.map((apiKey, i) => (
                    <motion.div
                      key={apiKey.id}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-forge-silver/40 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forge-black/5">
                          <Key className="h-4 w-4 text-forge-muted" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-forge-ink truncate">
                              {apiKey.name}
                            </span>
                            <code className="rounded-lg bg-forge-black px-2 py-0.5 font-mono text-xs text-forge-orange">
                              {apiKey.prefix}...
                            </code>
                          </div>
                          <div className="flex gap-3 mt-0.5 text-xs text-forge-muted font-medium">
                            <span>Created {formatDate(apiKey.createdAt)}</span>
                            <span>&bull;</span>
                            <span>Last used: {timeAgo(apiKey.lastUsedAt)}</span>
                            {apiKey.expiresAt && (
                              <>
                                <span>&bull;</span>
                                <span>Expires {formatDate(apiKey.expiresAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeKey(apiKey.id)}
                        disabled={revokingId === apiKey.id}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-600 transition-all hover:border-red-400 hover:bg-red-100 disabled:opacity-50"
                        aria-label={`Revoke ${apiKey.name}`}
                      >
                        {revokingId === apiKey.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </motion.div>
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Revoke
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Create key form */}
              <div className="border-t-2 border-forge-border bg-forge-silver/30 px-5 py-4">
                <p className="text-xs font-bold text-forge-muted uppercase tracking-wider mb-3">
                  Create New Key
                </p>
                <form onSubmit={handleCreateKey} className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. My App, Production, Testing..."
                    className="flex-1 rounded-xl border-2 border-forge-border bg-white px-4 py-2.5 text-sm font-semibold text-forge-ink placeholder:text-forge-muted/50 outline-none transition-all focus:border-forge-orange"
                    disabled={creating}
                  />
                  <button
                    type="submit"
                    disabled={creating || !newKeyName.trim()}
                    className="btn-orange flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      >
                        <Plus className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {creating ? 'Creating...' : 'Create Key'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── API Reference section ─────────────────────────────────────── */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forge-black">
              <Code className="h-5 w-5 text-forge-orange" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-forge-ink">API Reference</h2>
              <p className="text-sm text-forge-muted">Quick-start examples to integrate in minutes</p>
            </div>
          </div>

          <div className="card-hard rounded-2xl border-2 border-forge-border bg-white overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center border-b-2 border-forge-border">
              {/* Language tabs */}
              <div className="flex">
                {(['curl', 'js'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setActiveSnippet(0); setSnippetCopied(false) }}
                    className={`px-5 py-3 text-sm font-black transition-all border-b-2 -mb-[2px] ${
                      activeTab === tab
                        ? 'border-forge-orange text-forge-ink bg-white'
                        : 'border-transparent text-forge-muted hover:text-forge-ink'
                    }`}
                  >
                    {tab === 'curl' ? 'cURL' : 'JavaScript'}
                  </button>
                ))}
              </div>

              {/* Endpoint selector */}
              <div className="ml-auto flex items-center gap-1 px-3">
                {currentSnippets.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => { setActiveSnippet(i); setSnippetCopied(false) }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      activeSnippet === i
                        ? 'bg-forge-black text-white'
                        : 'text-forge-muted hover:bg-forge-silver hover:text-forge-ink'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code block */}
            <div className="relative bg-forge-black">
              <button
                onClick={copySnippet}
                className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60 transition-all hover:border-white/20 hover:text-white z-10"
              >
                {snippetCopied
                  ? <><Check className="h-3.5 w-3.5 text-green-400" /> Copied!</>
                  : <><Copy className="h-3.5 w-3.5" /> Copy</>
                }
              </button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${activeSnippet}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <pre className="overflow-x-auto p-6 pt-12 text-sm leading-relaxed">
                    <code className="text-green-400 font-mono">
                      {currentSnippets[activeSnippet]?.code}
                    </code>
                  </pre>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Response hint */}
            <div className="border-t-2 border-forge-border bg-forge-silver/30 px-6 py-4 flex items-center gap-3">
              <Terminal className="h-4 w-4 text-forge-muted shrink-0" />
              <p className="text-xs font-semibold text-forge-muted">
                All API responses are JSON. Authentication via{' '}
                <code className="rounded bg-forge-black/8 px-1.5 py-0.5 font-mono text-forge-ink">
                  Authorization: Bearer &lt;key&gt;
                </code>{' '}
                header.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Rate limits section ───────────────────────────────────────── */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forge-black">
              <Zap className="h-5 w-5 text-forge-orange" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-forge-ink">Rate Limits</h2>
              <p className="text-sm text-forge-muted">Usage limits by plan tier</p>
            </div>
          </div>

          <div className="card-hard rounded-2xl border-2 border-forge-border bg-white overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-3 border-b-2 border-forge-border bg-forge-silver/50 px-6 py-3">
              {['Plan', 'Requests', 'Burst Limit'].map((h) => (
                <span key={h} className="text-xs font-black uppercase tracking-wider text-forge-muted">
                  {h}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {rateLimits.map((row, i) => (
              <motion.div
                key={row.plan}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-3 items-center border-b border-forge-border/60 px-6 py-4 last:border-b-0 hover:bg-forge-silver/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex rounded-lg px-2.5 py-1 text-xs font-black"
                    style={{ backgroundColor: row.color, color: row.textColor }}
                  >
                    {row.plan}
                  </span>
                </div>
                <span className="font-bold text-sm text-forge-ink">{row.requests}</span>
                <span className="font-bold text-sm text-forge-muted">{row.burst}</span>
              </motion.div>
            ))}

            <div className="border-t-2 border-forge-border bg-forge-silver/30 px-6 py-4 flex items-start gap-3">
              <Shield className="h-4 w-4 text-forge-muted shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-forge-muted leading-relaxed">
                Rate limits are applied per API key. Exceeding limits returns HTTP 429.
                Headers <code className="rounded bg-forge-black/8 px-1 py-0.5 font-mono text-forge-ink">X-RateLimit-Remaining</code> and{' '}
                <code className="rounded bg-forge-black/8 px-1 py-0.5 font-mono text-forge-ink">X-RateLimit-Reset</code> are included in all responses.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Upgrade CTA (for unauthenticated or free users) ──────────── */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border-2 border-forge-orange/30 bg-gradient-to-br from-forge-orange/5 to-forge-amber/5 p-8 text-center"
        >
          <Zap className="mx-auto h-10 w-10 text-forge-orange mb-3" />
          <h3 className="font-display font-black text-2xl text-forge-ink mb-2">
            Need higher limits?
          </h3>
          <p className="text-forge-muted mb-6 max-w-sm mx-auto">
            Upgrade to Pro for 10,000 requests per day and priority support.
          </p>
          <Link href="/pricing" className="btn-orange inline-flex">
            View Pricing
          </Link>
        </motion.div>

      </div>
    </div>
  )
}
