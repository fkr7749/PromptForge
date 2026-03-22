'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Database,
  Plus,
  Trash2,
  FileText,
  Send,
  Bot,
  User,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

// ── Types ──────────────────────────────────────────────────────────────────

interface Workspace {
  id: string
  name: string
  description?: string
  updatedAt: string
  _count: { documents: number }
}

interface RagDocument {
  id: string
  name: string
  chunkCount: number
  createdAt: string
  _count: { chunks: number }
}

interface Citation {
  documentName: string
  chunkContent: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  model?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B' },
  { value: 'llama-3.1-8b-instant', label: 'LLaMA 3.1 8B' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
]

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

// ── Add Document Modal ─────────────────────────────────────────────────────

function AddDocumentModal({
  workspaceId,
  accessToken,
  onClose,
  onAdded,
}: {
  workspaceId: string
  accessToken: string
  onClose: () => void
  onAdded: (doc: RagDocument) => void
}) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !content.trim()) {
      setError('Both name and content are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/rag/workspaces/${workspaceId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, content }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to add document')
        return
      }
      const doc = await res.json()
      onAdded(doc)
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-hard w-full max-w-lg rounded-2xl p-6">
        <h3 className="text-lg font-black text-forge-ink mb-1">Add Document</h3>
        <p className="text-sm text-forge-muted mb-5">
          Paste or type the document content. It will be chunked automatically.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-forge-muted mb-1.5 uppercase tracking-wider">
              Document Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Product Docs v2"
              className="w-full rounded-xl border-2 border-forge-border bg-forge-silver/30 px-4 py-2.5 text-sm text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-forge-muted mb-1.5 uppercase tracking-wider">
              Content
              <span className="ml-1 normal-case text-forge-muted/60">(max 50,000 chars)</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste document text here..."
              rows={10}
              className="w-full rounded-xl border-2 border-forge-border bg-forge-silver/30 px-4 py-3 text-sm text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:outline-none transition-colors resize-none font-mono"
            />
            <p className="text-xs text-forge-muted mt-1 text-right">
              {content.length.toLocaleString()} / 50,000
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-forge-border px-5 py-2.5 text-sm font-bold text-forge-muted hover:border-forge-ink hover:text-forge-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-orange rounded-xl px-5 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── New Workspace Form ─────────────────────────────────────────────────────

function NewWorkspaceForm({
  accessToken,
  onCreated,
  onCancel,
}: {
  accessToken: string
  onCreated: (ws: Workspace) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rag/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create workspace')
        return
      }
      const ws = await res.json()
      onCreated(ws)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card-hard rounded-xl p-4 mb-2 flex flex-col gap-3"
    >
      <p className="text-xs font-black text-forge-muted uppercase tracking-wider">New Workspace</p>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Workspace name"
        className="w-full rounded-lg border-2 border-forge-border bg-forge-silver/30 px-3 py-2 text-sm text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:outline-none transition-colors"
      />
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full rounded-lg border-2 border-forge-border bg-forge-silver/30 px-3 py-2 text-sm text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:outline-none transition-colors"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-orange flex-1 rounded-lg py-2 text-sm disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border-2 border-forge-border py-2 text-sm text-forge-muted hover:border-forge-ink hover:text-forge-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function RagPage() {
  const { accessToken } = useAuthStore()

  // Workspace state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [wsLoading, setWsLoading] = useState(true)
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null)

  // Document state
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [showNewWs, setShowNewWs] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [model, setModel] = useState(MODELS[0]?.value ?? 'llama-3.3-70b-versatile')
  const [sending, setSending] = useState(false)
  const [queryError, setQueryError] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)

  // ── Fetch workspaces ──
  useEffect(() => {
    if (!accessToken) { setWsLoading(false); return }
    setWsLoading(true)
    fetch('/api/rag/workspaces', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => setWorkspaces(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setWsLoading(false))
  }, [accessToken])

  // ── Fetch documents when workspace changes ──
  useEffect(() => {
    if (!selectedWs || !accessToken) {
      setDocuments([])
      return
    }
    setDocsLoading(true)
    fetch(`/api/rag/workspaces/${selectedWs.id}/documents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setDocsLoading(false))
  }, [selectedWs, accessToken])

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Select workspace ──
  function selectWorkspace(ws: Workspace) {
    setSelectedWs(ws)
    setMessages([])
    setQueryError('')
    setInput('')
  }

  // ── Create workspace ──
  function handleWsCreated(ws: Workspace) {
    setWorkspaces(prev => [{ ...ws, _count: { documents: 0 } }, ...prev])
    setShowNewWs(false)
    selectWorkspace({ ...ws, _count: { documents: 0 } })
  }

  // ── Delete workspace ──
  async function deleteWorkspace(ws: Workspace, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete workspace "${ws.name}" and all its documents?`)) return
    try {
      await fetch(`/api/rag/workspaces/${ws.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setWorkspaces(prev => prev.filter(w => w.id !== ws.id))
      if (selectedWs?.id === ws.id) {
        setSelectedWs(null)
        setMessages([])
        setDocuments([])
      }
    } catch {
      // silent
    }
  }

  // ── Add document ──
  function handleDocAdded(doc: RagDocument) {
    setDocuments(prev => [doc, ...prev])
    if (selectedWs) {
      setWorkspaces(prev =>
        prev.map(w =>
          w.id === selectedWs.id
            ? { ...w, _count: { documents: w._count.documents + 1 } }
            : w
        )
      )
    }
  }

  // ── Send query ──
  async function sendQuery() {
    if (!input.trim() || !selectedWs || sending) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    setQueryError('')

    try {
      const res = await fetch(`/api/rag/workspaces/${selectedWs.id}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query: userMsg.content, model }),
      })
      if (!res.ok) {
        const data = await res.json()
        setQueryError(data.error ?? 'Query failed')
        return
      }
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          citations: data.citations,
          model: data.model,
        },
      ])
    } catch {
      setQueryError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendQuery()
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-forge-silver pt-16 overflow-hidden">

      {/* ── Left Sidebar ── */}
      <aside className="w-72 shrink-0 flex flex-col border-r-2 border-forge-border bg-forge-silver overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-6 pb-4 border-b-2 border-forge-border">
          <div className="flex items-center gap-2.5 mb-1">
            <Database className="h-5 w-5 text-forge-orange" />
            <h1 className="text-lg font-black text-forge-ink">RAG Workspaces</h1>
          </div>
          <div className="h-0.5 w-12 rounded-full bg-forge-orange mt-2" />
        </div>

        {/* Workspace List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">

          {/* New Workspace toggle */}
          {!showNewWs ? (
            <button
              onClick={() => setShowNewWs(true)}
              className="flex items-center gap-2 w-full rounded-xl border-2 border-dashed border-forge-border px-3 py-2.5 text-sm font-bold text-forge-muted hover:border-forge-orange hover:text-forge-orange transition-colors mb-1"
            >
              <Plus className="h-4 w-4" />
              New Workspace
            </button>
          ) : (
            <NewWorkspaceForm
              accessToken={accessToken!}
              onCreated={handleWsCreated}
              onCancel={() => setShowNewWs(false)}
            />
          )}

          {wsLoading ? (
            <div className="flex flex-col gap-2 mt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-xl bg-forge-border/40 animate-pulse" />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Database className="h-8 w-8 text-forge-border" />
              <p className="text-sm text-forge-muted">No workspaces yet.</p>
              <p className="text-xs text-forge-muted/60">Create one to get started.</p>
            </div>
          ) : (
            workspaces.map(ws => {
              const isActive = selectedWs?.id === ws.id
              return (
                <div
                  key={ws.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectWorkspace(ws)}
                  onKeyDown={e => e.key === 'Enter' && selectWorkspace(ws)}
                  className={`group w-full text-left rounded-xl border-2 px-3 py-3 transition-all cursor-pointer ${
                    isActive
                      ? 'border-forge-orange bg-forge-orange/10'
                      : 'border-forge-border hover:border-forge-muted'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-forge-orange' : 'text-forge-ink'}`}>
                        {ws.name}
                      </p>
                      {ws.description && (
                        <p className="text-xs text-forge-muted truncate mt-0.5">{ws.description}</p>
                      )}
                      <p className="text-xs text-forge-muted/60 mt-1">
                        {ws._count.documents} doc{ws._count.documents !== 1 ? 's' : ''} · {timeAgo(ws.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isActive && <ChevronRight className="h-3.5 w-3.5 text-forge-orange" />}
                      <button
                        onClick={e => deleteWorkspace(ws, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-forge-muted hover:text-red-400 transition-all"
                        title="Delete workspace"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Documents Panel (visible when workspace selected) */}
        {selectedWs && (
          <div className="border-t-2 border-forge-border">
            <div className="px-4 py-3 flex items-center justify-between">
              <p className="text-xs font-black text-forge-muted uppercase tracking-wider">Documents</p>
              <button
                onClick={() => setShowAddDoc(true)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-forge-orange hover:bg-forge-orange/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto px-3 pb-3 flex flex-col gap-1">
              {docsLoading ? (
                <div className="flex flex-col gap-1.5">
                  {[1, 2].map(i => (
                    <div key={i} className="h-10 rounded-lg bg-forge-border/40 animate-pulse" />
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 py-4 text-center">
                  <FileText className="h-6 w-6 text-forge-border" />
                  <p className="text-xs text-forge-muted">No documents yet</p>
                </div>
              ) : (
                documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 rounded-lg border border-forge-border px-3 py-2"
                  >
                    <FileText className="h-3.5 w-3.5 text-forge-muted shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-forge-ink truncate">{doc.name}</p>
                      <p className="text-[10px] text-forge-muted/60">
                        {doc._count.chunks} chunk{doc._count.chunks !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ── Right Chat Area ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!selectedWs ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-forge-border bg-forge-silver">
              <Database className="h-9 w-9 text-forge-border" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-forge-ink mb-2">Select a Workspace</h2>
              <p className="text-sm text-forge-muted max-w-sm">
                Choose a RAG workspace from the sidebar to start querying your documents with AI.
              </p>
            </div>
            <button
              onClick={() => setShowNewWs(true)}
              className="btn-orange rounded-xl px-6 py-3 text-sm"
            >
              <Plus className="h-4 w-4 mr-2 inline-block" />
              Create First Workspace
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-forge-border bg-forge-silver shrink-0">
              <div>
                <h2 className="text-base font-black text-forge-ink">{selectedWs.name}</h2>
                {selectedWs.description && (
                  <p className="text-xs text-forge-muted mt-0.5">{selectedWs.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {messages.length > 0 && (
                  <button
                    onClick={() => { setMessages([]); setQueryError('') }}
                    className="rounded-lg border border-forge-border px-3 py-1.5 text-xs font-bold text-forge-muted hover:border-forge-ink hover:text-forge-ink transition-colors"
                  >
                    Clear Chat
                  </button>
                )}
                {/* Model selector */}
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="rounded-lg border-2 border-forge-border bg-forge-silver px-3 py-1.5 text-xs font-bold text-forge-ink focus:border-forge-orange focus:outline-none transition-colors cursor-pointer"
                >
                  {MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <Bot className="h-10 w-10 text-forge-border" />
                  <div>
                    <p className="text-base font-bold text-forge-ink mb-1">Ask anything about your documents</p>
                    <p className="text-sm text-forge-muted">
                      The AI will search through{' '}
                      <span className="text-forge-orange font-bold">{selectedWs._count.documents}</span>{' '}
                      document{selectedWs._count.documents !== 1 ? 's' : ''} to answer your questions.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-forge-orange'
                      : 'border-2 border-forge-border bg-forge-silver'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="h-4 w-4 text-forge-ink" />
                      : <Bot className="h-4 w-4 text-forge-muted" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col gap-2 max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-forge-orange text-forge-ink rounded-tr-sm'
                        : 'card-hard text-forge-ink rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, ci) => (
                          <div
                            key={ci}
                            title={c.chunkContent}
                            className="flex items-center gap-1.5 rounded-full border border-forge-border bg-forge-silver/60 px-2.5 py-1 text-[10px] font-bold text-forge-muted hover:border-forge-orange hover:text-forge-orange transition-colors cursor-default"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            [{ci + 1}] {c.documentName}
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.model && (
                      <p className="text-[10px] text-forge-muted/50 px-1">
                        {MODELS.find(m => m.value === msg.model)?.label ?? msg.model}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Sending indicator */}
              {sending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-forge-border bg-forge-silver">
                    <Bot className="h-4 w-4 text-forge-muted" />
                  </div>
                  <div className="card-hard rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-forge-orange animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-forge-orange animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-forge-orange animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* Query error */}
              {queryError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {queryError}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t-2 border-forge-border bg-forge-silver px-6 py-4">
              {documents.length === 0 && (
                <p className="text-xs text-amber-400/80 mb-2 text-center">
                  Add at least one document to this workspace before querying.
                </p>
              )}
              <div className="flex gap-3 items-end">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your documents... (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  disabled={sending || documents.length === 0}
                  className="flex-1 rounded-xl border-2 border-forge-border bg-forge-silver/30 px-4 py-3 text-sm text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:outline-none transition-colors resize-none disabled:opacity-50"
                />
                <button
                  onClick={sendQuery}
                  disabled={sending || !input.trim() || documents.length === 0}
                  className="btn-orange flex h-12 w-12 shrink-0 items-center justify-center rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add Document Modal */}
      {showAddDoc && selectedWs && (
        <AddDocumentModal
          workspaceId={selectedWs.id}
          accessToken={accessToken!}
          onClose={() => setShowAddDoc(false)}
          onAdded={handleDocAdded}
        />
      )}
    </div>
  )
}
