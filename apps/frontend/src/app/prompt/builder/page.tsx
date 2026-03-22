'use client'
import { useState, useCallback } from 'react'
import { motion, Reorder, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, GripVertical, Play, Save, Copy, Download, ChevronRight, Check } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Link from 'next/link'

// ── Block type system ─────────────────────────────────────────────────────────

type BlockType = 'SYSTEM' | 'CONTEXT' | 'INSTRUCTION' | 'EXAMPLE' | 'OUTPUT_FORMAT' | 'VARIABLE'

interface Block {
  id: string
  type: BlockType
  content: string
}

const BLOCK_CONFIG: Record<BlockType, {
  label: string
  color: string
  bg: string
  icon: string
  description: string
  placeholder: string
}> = {
  SYSTEM: {
    label: 'System',
    color: '#7C3AED',
    bg: 'bg-violet-50',
    icon: '⚙️',
    description: 'Set AI behavior and persona',
    placeholder: 'You are a helpful assistant specialized in...',
  },
  CONTEXT: {
    label: 'Context',
    color: '#0EA5E9',
    bg: 'bg-sky-50',
    icon: '📚',
    description: 'Background information',
    placeholder: 'Here is relevant context about...',
  },
  INSTRUCTION: {
    label: 'Instruction',
    color: '#FF6B2B',
    bg: 'bg-orange-50',
    icon: '📋',
    description: 'Main task or instruction',
    placeholder: 'Your task is to...',
  },
  EXAMPLE: {
    label: 'Example',
    color: '#00C27C',
    bg: 'bg-green-50',
    icon: '💡',
    description: 'Input/output example',
    placeholder: 'Input: ...\nOutput: ...',
  },
  OUTPUT_FORMAT: {
    label: 'Output Format',
    color: '#FFB800',
    bg: 'bg-amber-50',
    icon: '📐',
    description: 'Specify the desired format',
    placeholder: 'Return your response as a JSON object with keys: ...',
  },
  VARIABLE: {
    label: 'Variable',
    color: '#6B6B6B',
    bg: 'bg-gray-50',
    icon: '{}',
    description: 'Insert a {{variable}} placeholder',
    placeholder: '{{variable_name}}',
  },
}

const CATEGORIES = [
  'CODING', 'WRITING', 'ANALYSIS', 'CREATIVITY',
  'EDUCATION', 'BUSINESS', 'RESEARCH', 'ROLEPLAY', 'OTHER',
]

// ── Variable detection ────────────────────────────────────────────────────────

function detectVariables(blocks: Block[]): string[] {
  const all = blocks.map(b => b.content).join('\n')
  const matches = all.match(/\{\{([^}]+)\}\}/g) ?? []
  const names = matches.map(m => m.slice(2, -2).trim())
  return [...new Set(names)]
}

// ── Assembled prompt ──────────────────────────────────────────────────────────

function assemblePrompt(blocks: Block[], varValues: Record<string, string>): string {
  const result = blocks
    .map(b => {
      const cfg = BLOCK_CONFIG[b.type]
      const header = b.type !== 'VARIABLE' ? `## ${cfg.label}\n` : ''
      let content = b.content
      // Replace variables with their values
      Object.entries(varValues).forEach(([k, v]) => {
        content = content.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `{{${k}}}`)
      })
      return header + content
    })
    .filter(s => s.trim())
    .join('\n\n')
  return result
}

// ── Block Card ────────────────────────────────────────────────────────────────

function BlockCard({
  block,
  onUpdate,
  onDelete,
}: {
  block: Block
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
}) {
  const cfg = BLOCK_CONFIG[block.type]

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      className="group"
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
    >
      <div
        className={`relative flex gap-3 rounded-xl border-2 border-forge-border ${cfg.bg} p-3 transition-all hover:border-forge-ink/20`}
        style={{ borderLeftColor: cfg.color, borderLeftWidth: 4 }}
      >
        {/* Drag handle */}
        <div className="flex flex-col items-center justify-start pt-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-forge-muted opacity-40 group-hover:opacity-80 transition-opacity" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Block header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base leading-none">{cfg.icon}</span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black text-white"
              style={{ backgroundColor: cfg.color }}
            >
              {cfg.label}
            </span>
            <span className="text-xs text-forge-muted">{cfg.description}</span>
          </div>

          {/* Textarea */}
          <textarea
            value={block.content}
            onChange={e => onUpdate(block.id, e.target.value)}
            placeholder={cfg.placeholder}
            rows={3}
            className="w-full resize-none rounded-lg border border-forge-border bg-white/70 px-3 py-2 text-sm text-forge-ink placeholder:text-forge-muted/50 focus:border-forge-ink focus:outline-none focus:ring-0 transition-colors"
            style={{ minHeight: 72 }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
          />
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(block.id)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-forge-muted opacity-0 group-hover:opacity-100 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all mt-0.5"
          aria-label="Delete block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </Reorder.Item>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PromptBuilderPage() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()

  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', type: 'INSTRUCTION', content: '' },
  ])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('CODING')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [varValues, setVarValues] = useState<Record<string, string>>({})

  // Computed values
  const assembled = assemblePrompt(blocks, varValues)
  const detectedVars = detectVariables(blocks)

  const addBlock = useCallback((type: BlockType) => {
    setBlocks(prev => [
      ...prev,
      { id: Date.now().toString(), type, content: '' },
    ])
  }, [])

  const updateBlock = useCallback((id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
  }, [])

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(assembled)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportJSON = () => {
    const data = { title, description, category, blocks, assembled }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'prompt'}-builder.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    if (!accessToken || !title.trim()) {
      setSaveError(!accessToken ? 'Sign in to save prompts.' : 'Title is required.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          description: description || 'Created with Prompt Builder',
          category,
          content: assembled,
        }),
      })
      const data = await res.json()
      if (data.id) {
        router.push(`/prompt/${data.id}`)
      } else {
        setSaveError(data.error || 'Failed to save.')
      }
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestInPlayground = () => {
    router.push(`/playground?content=${encodeURIComponent(assembled)}`)
  }

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      <div className="pt-24 pb-12">
        {/* Page Header */}
        <div className="mx-auto max-w-[1380px] px-6 md:px-10 pt-8 pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-forge-muted text-sm font-semibold">
              <Link href="/browse" className="hover:text-forge-ink transition-colors">Browse</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-forge-ink">Builder</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-forge-ink leading-none tracking-tight">
              PROMPT <span className="text-gradient">BUILDER</span>
            </h1>
            <p className="text-forge-muted text-base mt-1">
              Compose prompts visually with drag-and-drop blocks
            </p>
          </div>
        </div>

        {/* Three-column layout */}
        <div className="mx-auto max-w-[1380px] px-6 md:px-10 flex flex-col xl:flex-row gap-6 items-start">

          {/* ── Left Panel: Block Palette ── */}
          <div className="w-full xl:w-72 shrink-0">
            <div className="sticky top-24 card-hard rounded-2xl p-4 bg-white">
              <p className="section-label mb-4">BLOCK PALETTE</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(BLOCK_CONFIG) as BlockType[]).map(type => {
                  const cfg = BLOCK_CONFIG[type]
                  return (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => addBlock(type)}
                      className={`relative flex flex-col gap-1.5 rounded-xl border-2 border-forge-border ${cfg.bg} p-3 text-left transition-all hover:border-opacity-80 hover:shadow-sm`}
                      style={{ borderLeftColor: cfg.color, borderLeftWidth: 3 }}
                    >
                      <span className="text-xl leading-none">{cfg.icon}</span>
                      <span className="text-xs font-black text-forge-ink leading-tight">{cfg.label}</span>
                      <span className="text-[10px] text-forge-muted leading-tight line-clamp-2">
                        {cfg.description}
                      </span>
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/80 shadow-sm">
                        <Plus className="h-3 w-3 text-forge-muted" />
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-xl bg-forge-silver/60 px-3 py-2.5">
                <p className="text-xs font-bold text-forge-muted">
                  Click a block to add it to the canvas. Drag blocks to reorder them.
                </p>
              </div>
            </div>
          </div>

          {/* ── Center Panel: Canvas ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Prompt metadata */}
            <div className="card-hard rounded-2xl p-5 bg-white">
              <p className="section-label mb-3">PROMPT DETAILS</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-black text-forge-ink mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="My Awesome Prompt"
                    className="w-full rounded-xl border-2 border-forge-border bg-forge-silver/40 px-4 py-2.5 text-sm font-semibold text-forge-ink placeholder:text-forge-muted/60 focus:border-forge-ink focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-black text-forge-ink mb-1.5">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="What does this prompt do?"
                      className="w-full rounded-xl border-2 border-forge-border bg-forge-silver/40 px-4 py-2.5 text-sm text-forge-ink placeholder:text-forge-muted/60 focus:border-forge-ink focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="w-40">
                    <label className="block text-xs font-black text-forge-ink mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full rounded-xl border-2 border-forge-border bg-forge-silver/40 px-3 py-2.5 text-sm font-semibold text-forge-ink focus:border-forge-ink focus:outline-none transition-colors"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="card-hard rounded-2xl p-5 bg-white">
              <div className="flex items-center justify-between mb-4">
                <p className="section-label">CANVAS</p>
                <span className="text-xs text-forge-muted font-semibold">
                  {blocks.length} block{blocks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-xl border-2 border-dashed border-forge-border">
                  <span className="text-4xl">🧩</span>
                  <p className="text-sm font-bold text-forge-muted">
                    Click blocks from the palette to get started
                  </p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={blocks}
                  onReorder={setBlocks}
                  className="flex flex-col gap-3"
                >
                  {blocks.map(block => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      onUpdate={updateBlock}
                      onDelete={deleteBlock}
                    />
                  ))}
                </Reorder.Group>
              )}

              {/* Quick add row */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(Object.keys(BLOCK_CONFIG) as BlockType[]).map(type => {
                  const cfg = BLOCK_CONFIG[type]
                  return (
                    <button
                      key={type}
                      onClick={() => addBlock(type)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-forge-border bg-forge-silver/60 px-3 py-1.5 text-xs font-bold text-forge-muted transition-all hover:border-forge-ink/30 hover:text-forge-ink"
                    >
                      <Plus className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Right Panel: Preview ── */}
          <div className="w-full xl:w-80 shrink-0 flex flex-col gap-4">
            {/* Preview */}
            <div className="card-hard rounded-2xl overflow-hidden bg-white">
              <div className="px-5 pt-5 pb-3 border-b-2 border-forge-border">
                <p className="section-label">PREVIEW</p>
              </div>
              <div className="p-4">
                <pre className="whitespace-pre-wrap break-words text-xs text-green-400 bg-forge-black rounded-xl p-4 overflow-x-auto min-h-[120px] max-h-80 overflow-y-auto leading-relaxed">
                  {assembled || (
                    <span className="text-forge-muted/40">
                      Your assembled prompt will appear here...
                    </span>
                  )}
                </pre>
              </div>

              {/* Detected variables */}
              {detectedVars.length > 0 && (
                <div className="px-4 pb-4">
                  <p className="text-xs font-black text-forge-ink mb-2">DETECTED VARIABLES</p>
                  <div className="flex flex-col gap-2">
                    {detectedVars.map(varName => (
                      <div key={varName} className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-forge-violet bg-violet-50 rounded px-2 py-0.5 shrink-0">
                          {`{{${varName}}}`}
                        </span>
                        <input
                          type="text"
                          value={varValues[varName] ?? ''}
                          onChange={e => setVarValues(prev => ({ ...prev, [varName]: e.target.value }))}
                          placeholder="value..."
                          className="flex-1 min-w-0 rounded-lg border border-forge-border bg-forge-silver/40 px-2 py-1 text-xs text-forge-ink placeholder:text-forge-muted/50 focus:border-forge-ink focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="card-hard rounded-2xl p-4 bg-white flex flex-col gap-2">
              <p className="section-label mb-1">ACTIONS</p>

              {saveError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
                  {saveError}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTestInPlayground}
                disabled={!assembled.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-forge-ink bg-forge-black px-4 py-3 text-sm font-black text-white transition-all hover:bg-forge-ink disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                Test in Playground
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving || !assembled.trim()}
                className="btn-orange flex w-full items-center justify-center gap-2 py-3 text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save as Prompt'}
              </motion.button>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopy}
                  disabled={!assembled.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-forge-border bg-forge-silver/60 px-3 py-2.5 text-sm font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? <Check className="h-4 w-4 text-forge-green" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportJSON}
                  disabled={blocks.length === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-forge-border bg-forge-silver/60 px-3 py-2.5 text-sm font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  Export
                </motion.button>
              </div>

              {!user && (
                <div className="mt-1 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700 font-semibold text-center">
                  <Link href="/login" className="underline hover:no-underline">Sign in</Link>{' '}
                  to save prompts to your library.
                </div>
              )}
            </div>

            {/* Stats */}
            {assembled && (
              <div className="card-hard rounded-2xl p-4 bg-white">
                <p className="section-label mb-3">STATS</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Blocks', value: blocks.length },
                    { label: 'Variables', value: detectedVars.length },
                    { label: 'Characters', value: assembled.length },
                    { label: 'Words', value: assembled.split(/\s+/).filter(Boolean).length },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-forge-silver/60 px-3 py-2.5 text-center">
                      <p className="text-xl font-black text-forge-ink">{value}</p>
                      <p className="text-[10px] font-bold text-forge-muted uppercase tracking-wide">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
