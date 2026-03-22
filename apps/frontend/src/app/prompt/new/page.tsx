'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Save, Globe, Lock, Zap, Upload } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'

const CATEGORIES = [
  { value: 'CODING', label: 'Coding', color: 'bg-blue-100 text-blue-700' },
  { value: 'WRITING', label: 'Writing', color: 'bg-green-100 text-green-700' },
  { value: 'BUSINESS', label: 'Business', color: 'bg-purple-100 text-purple-700' },
  { value: 'ANALYSIS', label: 'Analysis', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'EDUCATION', label: 'Education', color: 'bg-pink-100 text-pink-700' },
  { value: 'CREATIVITY', label: 'Creativity', color: 'bg-orange-100 text-orange-700' },
  { value: 'RESEARCH', label: 'Research', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'ROLEPLAY', label: 'Roleplay', color: 'bg-rose-100 text-rose-700' },
  { value: 'OTHER', label: 'Other', color: 'bg-gray-100 text-gray-700' },
]

interface Variable {
  name: string
  description: string
  default: string
}

function detectVariables(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))]
}

export default function NewPromptPage() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'CODING',
    content: '',
    systemPrompt: '',
    isPublic: true,
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [variables, setVariables] = useState<Variable[]>([])
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [loading, setLoading] = useState<'draft' | 'publish' | null>(null)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const tagSuggestions = useRef<string[]>([])

  // Redirect if not logged in
  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  // Fetch tag suggestions
  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.json())
      .then(d => { tagSuggestions.current = (d.tags ?? []).map((t: { slug: string }) => t.slug) })
      .catch(() => {})
  }, [])

  // Auto-detect variables from content
  useEffect(() => {
    const detected = detectVariables(form.content)
    setVariables(prev => {
      const existing = new Map(prev.map(v => [v.name, v]))
      return detected.map(name => existing.get(name) ?? { name, description: '', default: '' })
    })
  }, [form.content])

  const addTag = (tag: string) => {
    const clean = tag.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (clean && !tags.includes(clean) && tags.length < 5) {
      setTags(prev => [...prev, clean])
    }
    setTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const updateVariable = (name: string, field: 'description' | 'default', value: string) => {
    setVariables(prev => prev.map(v => v.name === name ? { ...v, [field]: value } : v))
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        let data: Record<string, unknown>
        const text = ev.target?.result as string
        try {
          data = JSON.parse(text)
        } catch {
          // Simple YAML parsing for key: value format
          data = {}
          text.split('\n').forEach(line => {
            const m = line.match(/^(\w+):\s*"?(.+?)"?\s*$/)
            if (m) data[m[1]!] = m[2]
          })
        }
        // Pre-fill form
        if (data.title) setForm(f => ({ ...f, title: data.title as string }))
        if (data.description) setForm(f => ({ ...f, description: data.description as string }))
        if (data.category) setForm(f => ({ ...f, category: data.category as string }))
        const versions = data.versions as Array<{ content: string }> | undefined
        if (versions?.[0]?.content) setForm(f => ({ ...f, content: versions[0]!.content }))
        const importedTags = data.tags as string[] | undefined
        if (importedTags?.length) setTags(importedTags)
      } catch {
        alert('Failed to parse file')
      }
      setImporting(false)
    }
    reader.onerror = () => setImporting(false)
    reader.readAsText(file)
  }

  const handleSubmit = async (isPublic: boolean) => {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.description.trim()) { setError('Description is required'); return }
    if (!form.content.trim()) { setError('Prompt content is required'); return }
    if (!form.category) { setError('Please select a category'); return }

    setLoading(isPublic ? 'publish' : 'draft')
    setError('')

    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          content: form.content,
          variables,
          tags,
          isPublic,
          systemPrompt: form.systemPrompt || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create prompt')
      router.push(`/prompt/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  if (!user) return null

  const selectedCategory = CATEGORIES.find(c => c.value === form.category)
  const charCount = { title: form.title.length, desc: form.description.length }

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      <div className="container-forge pt-28 pb-16">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <Link
              href="/browse"
              className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-forge-muted transition-colors hover:text-forge-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Browse
            </Link>
            <div className="section-label mb-2">Create prompt</div>
            <h1
              className="font-display font-black text-forge-ink"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
            >
              NEW PROMPT
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Form (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Import */}
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm text-forge-muted">Start from scratch or import</span>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-forge-border px-4 py-2 text-sm font-bold text-forge-muted hover:border-forge-orange hover:text-forge-orange">
                <Upload className="h-4 w-4" />
                {importing ? 'Importing...' : 'Import YAML/JSON'}
                <input type="file" accept=".yaml,.yml,.json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            {/* Title */}
            <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-forge-muted">Title *</label>
                <span className={`text-xs font-bold ${charCount.title > 90 ? 'text-red-500' : 'text-forge-subtle'}`}>
                  {charCount.title}/100
                </span>
              </div>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value.slice(0, 100) }))}
                placeholder="e.g. Code Reviewer Pro"
                className="w-full rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-3 text-sm font-bold text-forge-ink placeholder-forge-subtle outline-none transition-colors focus:border-forge-orange focus:bg-white"
              />
            </div>

            {/* Description */}
            <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-forge-muted">Description *</label>
                <span className={`text-xs font-bold ${charCount.desc > 450 ? 'text-red-500' : 'text-forge-subtle'}`}>
                  {charCount.desc}/500
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 500) }))}
                placeholder="What does this prompt do? Who is it for? What problem does it solve?"
                rows={3}
                className="w-full resize-none rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-3 text-sm text-forge-ink placeholder-forge-subtle outline-none transition-colors focus:border-forge-orange focus:bg-white"
              />
            </div>

            {/* Category */}
            <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
              <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-forge-muted">Category *</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    className={`rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all ${
                      form.category === cat.value
                        ? 'border-forge-orange bg-forge-orange text-white'
                        : 'border-forge-border text-forge-muted hover:border-forge-ink hover:text-forge-ink'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-forge-muted">Tags (max 5)</label>
                <span className="text-xs text-forge-subtle">{tags.length}/5</span>
              </div>
              <div className="flex flex-wrap gap-2 rounded-xl border-2 border-forge-border bg-forge-silver p-3 focus-within:border-forge-orange focus-within:bg-white transition-colors">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-forge-orange px-2.5 py-1 text-xs font-bold text-white">
                    {tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => tagInput && addTag(tagInput)}
                    placeholder={tags.length === 0 ? "Type a tag and press Enter..." : "Add more..."}
                    className="flex-1 min-w-24 bg-transparent text-sm text-forge-ink placeholder-forge-subtle outline-none"
                  />
                )}
              </div>
              <p className="mt-1.5 text-xs text-forge-subtle">Press Enter or comma to add. Use slugs like "gpt-4", "coding", "productivity".</p>
            </div>

            {/* Prompt Content */}
            <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-forge-muted">Prompt Content *</label>
                <span className="text-xs text-forge-subtle">Use {'{{variable}}'} for dynamic inputs</span>
              </div>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={`You are an expert {{role}}. Help the user with {{task}}.\n\nContext: {{context}}\n\nProvide a detailed response...`}
                rows={12}
                className="w-full resize-none rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-3 font-mono text-sm text-forge-ink placeholder-forge-subtle outline-none transition-colors focus:border-forge-orange focus:bg-white"
              />

              {/* Detected variables */}
              {variables.length > 0 && (
                <div className="mt-4">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider text-forge-muted">
                    Detected Variables ({variables.length})
                  </div>
                  <div className="space-y-3">
                    {variables.map(v => (
                      <div key={v.name} className="grid grid-cols-3 gap-3 rounded-xl border-2 border-forge-border bg-forge-silver p-3">
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase text-forge-muted">Variable</div>
                          <div className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                            {`{{${v.name}}}`}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase text-forge-muted">Description</div>
                          <input
                            type="text"
                            value={v.description}
                            onChange={e => updateVariable(v.name, 'description', e.target.value)}
                            placeholder="What is this for?"
                            className="w-full rounded-lg border border-forge-border bg-white px-2 py-1 text-xs text-forge-ink placeholder-forge-subtle outline-none focus:border-forge-orange"
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase text-forge-muted">Default</div>
                          <input
                            type="text"
                            value={v.default}
                            onChange={e => updateVariable(v.name, 'default', e.target.value)}
                            placeholder="Optional default"
                            className="w-full rounded-lg border border-forge-border bg-white px-2 py-1 text-xs text-forge-ink placeholder-forge-subtle outline-none focus:border-forge-orange"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* System Prompt (collapsible) */}
            <div className="rounded-2xl border-2 border-forge-border bg-white">
              <button
                type="button"
                onClick={() => setShowSystemPrompt(s => !s)}
                className="flex w-full items-center justify-between p-6"
              >
                <div>
                  <div className="text-sm font-bold text-forge-ink">System Prompt</div>
                  <div className="text-xs text-forge-muted">Optional: set context/persona before the user message</div>
                </div>
                {showSystemPrompt ? <ChevronUp className="h-4 w-4 text-forge-muted" /> : <ChevronDown className="h-4 w-4 text-forge-muted" />}
              </button>
              <AnimatePresence>
                {showSystemPrompt && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t-2 border-forge-border p-6 pt-0 mt-0">
                      <div className="pt-4">
                        <textarea
                          value={form.systemPrompt}
                          onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
                          placeholder="You are a helpful assistant with expertise in..."
                          rows={5}
                          className="w-full resize-none rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-3 font-mono text-sm text-forge-ink placeholder-forge-subtle outline-none transition-colors focus:border-forge-orange focus:bg-white"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Visibility */}
            <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
              <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-forge-muted">Visibility</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isPublic: true }))}
                  className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                    form.isPublic ? 'border-forge-orange bg-orange-50' : 'border-forge-border hover:border-forge-ink'
                  }`}
                >
                  <Globe className={`h-5 w-5 ${form.isPublic ? 'text-forge-orange' : 'text-forge-muted'}`} />
                  <div className="text-left">
                    <div className="text-sm font-bold text-forge-ink">Public</div>
                    <div className="text-xs text-forge-muted">Visible to everyone in the library</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isPublic: false }))}
                  className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                    !form.isPublic ? 'border-forge-orange bg-orange-50' : 'border-forge-border hover:border-forge-ink'
                  }`}
                >
                  <Lock className={`h-5 w-5 ${!form.isPublic ? 'text-forge-orange' : 'text-forge-muted'}`} />
                  <div className="text-left">
                    <div className="text-sm font-bold text-forge-ink">Private</div>
                    <div className="text-xs text-forge-muted">Only you can see this prompt</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={!!loading}
                className="flex items-center gap-2 rounded-xl border-2 border-forge-border bg-white px-6 py-3.5 text-sm font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:opacity-60"
              >
                {loading === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={!!loading}
                className="btn-orange flex-1 justify-center py-3.5 text-sm disabled:opacity-60"
              >
                {loading === 'publish' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</>
                ) : (
                  <><Zap className="h-4 w-4" /> Publish Prompt</>
                )}
              </button>
            </div>
          </div>

          {/* Right: Preview (1/3) */}
          <div className="space-y-4">
            <div className="sticky top-28">
              {/* Preview card */}
              <div className="mb-4 text-xs font-bold uppercase tracking-wider text-forge-muted">Live Preview</div>
              <div className="rounded-2xl border-2 border-forge-border bg-white p-5 transition-all hover:border-forge-orange hover:shadow-[3px_3px_0_#FF6B2B]">
                {/* Author */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-forge-orange text-[10px] font-black text-white">
                    {user.displayName?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                  <span className="text-xs font-bold text-forge-muted">@{user.username}</span>
                  {selectedCategory && (
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${selectedCategory.color}`}>
                      {selectedCategory.label}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-display text-base font-black text-forge-ink leading-tight mb-2">
                  {form.title || 'Your Prompt Title'}
                </h3>

                {/* Description */}
                <p className="text-xs text-forge-muted line-clamp-2 mb-3">
                  {form.description || 'Your prompt description will appear here...'}
                </p>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {tags.slice(0, 3).map(tag => (
                      <span key={tag} className="rounded-full border border-forge-border px-2 py-0.5 text-[10px] font-bold text-forge-muted">
                        {tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-[10px] font-bold text-forge-muted">+{tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Variables detected */}
                {variables.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {variables.map(v => (
                      <span key={v.name} className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {`{{${v.name}}}`}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 border-t border-forge-border pt-3 text-xs text-forge-muted">
                  <span>♥ 0</span>
                  <span>⑂ 0</span>
                  <span>👁 0</span>
                  <button className="ml-auto rounded-lg border border-forge-border px-3 py-1 text-xs font-bold transition-all hover:border-forge-orange hover:text-forge-orange">
                    Try →
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="mt-4 rounded-2xl border-2 border-forge-border bg-white p-5">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-forge-muted">Tips for great prompts</div>
                <ul className="space-y-2 text-xs text-forge-muted">
                  {[
                    'Use {{variables}} for reusable inputs',
                    'Add a role: "You are an expert in..."',
                    'Specify output format (markdown, JSON, etc.)',
                    'Give examples of good responses',
                    'Include constraints and edge cases',
                  ].map(tip => (
                    <li key={tip} className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forge-orange" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
