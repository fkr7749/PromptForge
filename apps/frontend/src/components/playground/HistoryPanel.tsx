'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Clock, Pin, X, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PlaygroundSession {
  id: string
  title: string | null
  promptContent: string
  systemPrompt: string | null
  variableValues: Record<string, string>
  selectedModels: string[]
  temperature: number
  maxTokens: number
  pinned: boolean
  createdAt: string
  updatedAt: string
}

interface HistoryPanelProps {
  currentPrompt: string
  currentSystemPrompt: string
  currentVariables: Record<string, string>
  currentModels: string[]
  currentTemperature: number
  currentMaxTokens: number
  accessToken: string | null
  onRestore: (session: {
    promptContent: string
    systemPrompt: string
    variableValues: Record<string, string>
    selectedModels: string[]
    temperature: number
    maxTokens: number
  }) => void
  isOpen?: boolean
  onToggle?: () => void
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function HistoryPanel({
  currentPrompt,
  currentSystemPrompt,
  currentVariables,
  currentModels,
  currentTemperature,
  currentMaxTokens,
  accessToken,
  onRestore,
  isOpen: isOpenProp,
  onToggle,
}: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessions, setSessions] = useState<PlaygroundSession[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Support controlled mode (isOpenProp from parent)
  const expanded = isOpenProp !== undefined ? isOpenProp : isOpen
  const toggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setIsOpen((v) => !v)
    }
  }

  // Fetch sessions when panel opens
  useEffect(() => {
    if (!expanded || !accessToken) return
    setLoading(true)
    fetch('/api/playground/sessions', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [expanded, accessToken])

  // Auto-save with debounce
  const saveSession = useCallback(() => {
    if (!accessToken || !currentPrompt.trim()) return
    fetch('/api/playground/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        id: sessionId ?? undefined,
        promptContent: currentPrompt,
        systemPrompt: currentSystemPrompt,
        variableValues: currentVariables,
        selectedModels: currentModels,
        temperature: currentTemperature,
        maxTokens: currentMaxTokens,
        title: currentPrompt.slice(0, 50).trim() || 'Untitled',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.session?.id && !sessionId) {
          setSessionId(data.session.id)
        }
        // Refresh list if open
        if (expanded) {
          setSessions((prev) => {
            const updated = data.session as PlaygroundSession
            const exists = prev.find((s) => s.id === updated.id)
            if (exists) {
              return prev.map((s) => (s.id === updated.id ? updated : s))
            }
            return [updated, ...prev]
          })
        }
      })
      .catch(console.error)
  }, [accessToken, currentPrompt, currentSystemPrompt, currentVariables, currentModels, currentTemperature, currentMaxTokens, sessionId, expanded])

  useEffect(() => {
    if (!currentPrompt.trim()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(saveSession, 1500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [currentPrompt, currentSystemPrompt, currentVariables, currentModels, currentTemperature, currentMaxTokens])

  const handlePin = async (session: PlaygroundSession, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!accessToken) return
    const newPinned = !session.pinned
    setSessions((prev) =>
      prev
        .map((s) => (s.id === session.id ? { ...s, pinned: newPinned } : s))
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    )
    await fetch(`/api/playground/sessions/${session.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ pinned: newPinned }),
    }).catch(console.error)
  }

  const handleDelete = async (session: PlaygroundSession, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!accessToken) return
    setSessions((prev) => prev.filter((s) => s.id !== session.id))
    if (sessionId === session.id) setSessionId(null)
    await fetch(`/api/playground/sessions/${session.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(console.error)
  }

  const handleRestore = (session: PlaygroundSession) => {
    setSessionId(session.id)
    onRestore({
      promptContent: session.promptContent,
      systemPrompt: session.systemPrompt ?? '',
      variableValues: (session.variableValues as Record<string, string>) ?? {},
      selectedModels: session.selectedModels,
      temperature: session.temperature,
      maxTokens: session.maxTokens,
    })
  }

  const handleNewSession = () => {
    setSessionId(null)
    onRestore({
      promptContent: '',
      systemPrompt: '',
      variableValues: {},
      selectedModels: ['llama-3.3-70b-versatile'],
      temperature: 0.7,
      maxTokens: 2048,
    })
  }

  return (
    <div className="border-b-2 border-forge-border">
      {/* Header toggle */}
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-wider text-forge-muted hover:text-forge-ink transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>History</span>
          {sessions.length > 0 && (
            <span className="rounded-full bg-forge-orange px-1.5 py-0.5 text-[9px] text-white font-bold leading-none">
              {sessions.length}
            </span>
          )}
        </div>
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-forge-orange border-t-transparent" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-forge-muted">
                  No history yet — run a prompt to start
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleRestore(session)}
                    onMouseEnter={() => setHoveredId(session.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                      session.pinned
                        ? 'border-forge-orange/30 bg-orange-50'
                        : sessionId === session.id
                        ? 'border-forge-orange bg-orange-50'
                        : 'border-forge-border bg-forge-silver hover:border-forge-ink'
                    }`}
                  >
                    {/* Prompt preview */}
                    <p className="text-[11px] font-mono text-forge-ink leading-snug mb-1.5 pr-10 line-clamp-2">
                      {session.promptContent.slice(0, 80)}
                      {session.promptContent.length > 80 ? '…' : ''}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-forge-muted">{timeAgo(session.updatedAt)}</span>
                      {session.selectedModels[0] && (
                        <span className="rounded-full bg-forge-border px-1.5 py-0.5 text-[9px] font-bold text-forge-muted">
                          {session.selectedModels[0].split('-').slice(0, 2).join('-')}
                        </span>
                      )}
                      {session.pinned && (
                        <span className="text-[9px] font-black text-forge-orange uppercase">Pinned</span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <button
                        onClick={(e) => handlePin(session, e)}
                        title={session.pinned ? 'Unpin' : 'Pin'}
                        className={`rounded p-0.5 transition-colors ${
                          session.pinned
                            ? 'text-forge-orange'
                            : 'text-forge-border hover:text-forge-muted'
                        }`}
                      >
                        <Pin className="h-3 w-3" fill={session.pinned ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(session, e)}
                        title="Delete"
                        className={`rounded p-0.5 text-forge-border hover:text-red-500 transition-colors ${
                          hoveredId === session.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* New session button */}
              <button
                onClick={handleNewSession}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-forge-border py-2 text-[11px] font-bold text-forge-muted hover:border-forge-orange hover:text-forge-orange transition-colors"
              >
                <Plus className="h-3 w-3" />
                New Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
