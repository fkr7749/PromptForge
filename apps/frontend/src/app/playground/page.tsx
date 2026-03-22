'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Play, LayoutGrid, Zap, Trash2, RotateCcw, BookOpen, SlidersHorizontal,
  Sparkles, Shield, Languages, FileText, ChevronDown, ChevronUp,
  Terminal, Square, Hash, Timer, DollarSign, Cpu, PanelLeft,
  PanelLeftClose, Check, AlertCircle, X, ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '@/components/ui/Logo'
import OutputPanel, { type ModelResult } from '@/components/playground/OutputPanel'
import VariableBadge from '@/components/playground/VariableBadge'
import OptimizerPanel from '@/components/playground/OptimizerPanel'
import SafetyPanel from '@/components/playground/SafetyPanel'
import TranslationPanel from '@/components/playground/TranslationPanel'
import HistoryPanel from '@/components/playground/HistoryPanel'
import KeyboardShortcuts from '@/components/playground/KeyboardShortcuts'
import { AVAILABLE_MODELS } from '@/lib/models'
import { useAuthStore } from '@/store/auth'

// ─── Costs per 1k output tokens ──────────────────────────────────────────────
const MODEL_COST_PER_1K: Record<string, number> = {
  'llama-3.3-70b-versatile': 0.0006,
  'meta-llama/llama-4-scout-17b-16e-instruct': 0.0003,
  'moonshotai/kimi-k2-instruct': 0.0005,
  'openai/gpt-oss-120b': 0.0012,
  'openai/gpt-oss-20b': 0.0004,
  'llama-3.1-8b-instant': 0.0001,
}

function detectVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))]
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4)
}

const DEFAULT_PROMPT = `Write a concise explanation of {{topic}} for a {{audience}}.

Requirements:
- Use simple, clear language
- Include one practical example
- Keep it under 150 words`

export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#0C0C0E]">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-forge-orange animate-pulse" />
          <span className="text-sm font-bold text-[#888890]">Loading playground…</span>
        </div>
      </div>
    }>
      <PlaygroundInner />
    </Suspense>
  )
}

type ToolTab = 'optimizer' | 'safety' | 'translate' | 'context' | null

function PlaygroundInner() {
  const searchParams = useSearchParams()
  const promptIdParam = searchParams.get('promptId')
  const { accessToken } = useAuthStore()

  // UI
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileTab, setMobileTab] = useState<'prompt' | 'output'>('prompt')
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>(null)
  const [showSystem, setShowSystem] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Prompt
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [loadedPromptTitle, setLoadedPromptTitle] = useState<string | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful, concise assistant.')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)

  // Variables
  const [variableValues, setVariableValues] = useState<Record<string, string>>({
    topic: 'React Server Components',
    audience: 'junior developer',
  })
  const detectedVars = detectVariables(prompt)

  // Models
  const [selectedModels, setSelectedModels] = useState<string[]>(['llama-3.3-70b-versatile'])
  const [compareMode, setCompareMode] = useState(false)

  // Results
  const [results, setResults] = useState<ModelResult[]>([])
  const [running, setRunning] = useState(false)
  const [runningCost, setRunningCost] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // Context (RAG)
  const [contextText, setContextText] = useState('')
  const [contextEnabled, setContextEnabled] = useState(false)

  // Optimizer / Safety
  const [optimizerResult, setOptimizerResult] = useState<any>(null)
  const [safetyResult, setSafetyResult] = useState<any>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [checking, setChecking] = useState(false)

  // Load prompt from URL
  useEffect(() => {
    if (!promptIdParam) return
    fetch(`/api/prompts/${promptIdParam}`)
      .then(r => r.json())
      .then((data) => {
        const versions = data.versions ?? []
        const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null
        if (latestVersion?.content) {
          setPrompt(latestVersion.content)
          setLoadedPromptTitle(data.title ?? null)
          const vars = latestVersion.variables
          if (Array.isArray(vars)) {
            const defaults: Record<string, string> = {}
            vars.forEach((v: { name: string; default?: string }) => {
              defaults[v.name] = v.default ?? ''
            })
            setVariableValues(defaults)
          }
        }
      })
      .catch(console.error)
  }, [promptIdParam])

  useEffect(() => {
    if (!compareMode && selectedModels.length > 1) {
      setSelectedModels([selectedModels[0]!])
    }
  }, [compareMode])

  const handleOptimize = useCallback(async () => {
    setOptimizing(true)
    setOptimizerResult(null)
    setActiveToolTab('optimizer')
    try {
      const res = await fetch('/api/playground/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: prompt }),
      })
      const data = await res.json()
      if (data.optimizedPrompt) {
        setOptimizerResult(data)
      }
    } catch (e) { console.error(e) }
    setOptimizing(false)
  }, [prompt])

  const handleSafety = useCallback(async () => {
    setChecking(true)
    setSafetyResult(null)
    setActiveToolTab('safety')
    try {
      const res = await fetch('/api/playground/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: prompt }),
      })
      const data = await res.json()
      if (data.overallScore !== undefined) {
        setSafetyResult(data)
      }
    } catch (e) { console.error(e) }
    setChecking(false)
  }, [prompt])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA'
      if (e.key === '?' && !inInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowShortcuts(v => !v)
        return
      }
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      switch (e.key.toLowerCase()) {
        case 'k': e.preventDefault(); setPrompt(''); break
        case 'h': e.preventDefault(); setShowHistory(v => !v); break
        case 'o': e.preventDefault(); handleOptimize(); break
        case 'g': e.preventDefault(); handleSafety(); break
        case 't': e.preventDefault(); setActiveToolTab(t => t === 'translate' ? null : 'translate'); break
        case 'm': e.preventDefault(); setCompareMode(v => !v); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleOptimize, handleSafety])

  const toggleModel = (id: string) => {
    if (compareMode) {
      setSelectedModels(prev =>
        prev.includes(id)
          ? prev.length > 1 ? prev.filter(m => m !== id) : prev
          : prev.length < 4 ? [...prev, id] : prev
      )
    } else {
      setSelectedModels([id])
    }
  }

  const run = useCallback(async () => {
    if (!prompt.trim() || running) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setRunning(true)
    setResults([])
    setRunningCost(0)

    const effectiveSystem = contextEnabled && contextText
      ? `CONTEXT DOCUMENTS:\n${contextText}\n\nUse the above context when responding.\n\n${systemPrompt}`
      : systemPrompt

    if (compareMode && selectedModels.length > 1) {
      const pending: ModelResult[] = selectedModels.map(m => ({ model: m, success: true, streaming: true }))
      setResults(pending)
      try {
        const res = await fetch('/api/playground/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortRef.current.signal,
          body: JSON.stringify({ content: prompt, models: selectedModels, systemPrompt: showSystem ? effectiveSystem : undefined, variables: variableValues, temperature, maxTokens }),
        })
        const data = await res.json() as ModelResult[]
        setResults(data.map(r => ({ ...r, streaming: false })))
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setResults(selectedModels.map(m => ({ model: m, success: false, error: 'Request failed', streaming: false })))
        }
      }
    } else {
      const model = selectedModels[0]!
      setResults([{ model, success: true, output: '', streaming: true }])
      try {
        const res = await fetch('/api/playground/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortRef.current.signal,
          body: JSON.stringify({ content: prompt, model, systemPrompt: showSystem ? effectiveSystem : undefined, variables: variableValues, temperature, maxTokens }),
        })
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6)
            if (payload === '[DONE]') {
              setResults(prev => prev.map(r => r.model === model ? { ...r, streaming: false } : r))
              break
            }
            try {
              const { text, error } = JSON.parse(payload) as { text?: string; error?: string }
              if (error) {
                setResults([{ model, success: false, error, streaming: false }])
              } else if (text) {
                setResults(prev => prev.map(r => r.model === model ? { ...r, output: (r.output ?? '') + text } : r))
                const chunkTokens = text.length / 4
                const costPer1k = MODEL_COST_PER_1K[model] ?? 0.0005
                setRunningCost(prev => prev + (chunkTokens / 1000) * costPer1k)
              }
            } catch { /* ignore */ }
          }
        }
        const metaRes = await fetch('/api/playground/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: prompt, model, systemPrompt: showSystem ? effectiveSystem : undefined, variables: variableValues, temperature, maxTokens: 1 }),
        })
        if (metaRes.ok) {
          const meta = await metaRes.json() as ModelResult
          setResults(prev => prev.map(r => r.model === model ? { ...r, inputTokens: meta.inputTokens, outputTokens: meta.outputTokens, cost: meta.cost, latencyMs: meta.latencyMs } : r))
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setResults([{ model, success: false, error: 'Stream failed', streaming: false }])
      }
    }
    setRunning(false)
  }, [prompt, selectedModels, compareMode, systemPrompt, showSystem, variableValues, temperature, maxTokens, running, contextEnabled, contextText])

  const stop = () => { abortRef.current?.abort(); setRunning(false); setResults(prev => prev.map(r => ({ ...r, streaming: false }))) }
  const clear = () => { stop(); setResults([]) }

  const tokenCount = estimateTokens(prompt)
  const totalCost = results.reduce((sum, r) => sum + (r.cost ?? 0), 0)
  const avgLatency = results.filter(r => r.latencyMs).reduce((sum, r, _, arr) => sum + (r.latencyMs ?? 0) / arr.length, 0)
  const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModels[0])

  const toggleToolTab = (tab: ToolTab) => setActiveToolTab(t => t === tab ? null : tab)

  return (
    <div className="flex h-screen flex-col bg-[#0C0C0E] overflow-hidden">

      {/* ── Accent line ─────────────────────────────────────────────────────── */}
      <div className="h-[2px] w-full bg-gradient-to-r from-forge-orange via-orange-400 to-transparent shrink-0" />

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[#2A2A2E] bg-[#0F0F11] px-3">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="flex items-center justify-center w-8 h-8 rounded-md text-[#666670] hover:text-[#E8E8EC] hover:bg-[#1E1E22] transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>

        <div className="h-4 w-px bg-[#2A2A2E]" />

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo size={24} />
          <span className="font-display font-black text-[#E8E8EC] tracking-tight text-sm hidden sm:block">
            PROMPTFORGE
          </span>
        </Link>

        <div className="h-4 w-px bg-[#2A2A2E]" />

        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-forge-orange" />
          <span className="font-bold text-sm text-[#E8E8EC]">Playground</span>
          {loadedPromptTitle && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-[#444448]" />
              <span className="text-xs font-medium text-forge-orange truncate max-w-[160px]">{loadedPromptTitle}</span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Tool buttons */}
          <button
            onClick={handleOptimize}
            disabled={optimizing || !prompt.trim()}
            title="Optimize prompt (⌘O)"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all disabled:opacity-40 ${
              activeToolTab === 'optimizer'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-[#888890] hover:text-[#E8E8EC] hover:bg-[#1E1E22] border border-transparent'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{optimizing ? 'Optimizing…' : 'Optimize'}</span>
          </button>

          <button
            onClick={handleSafety}
            disabled={checking || !prompt.trim()}
            title="Safety check (⌘G)"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all disabled:opacity-40 ${
              activeToolTab === 'safety'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-[#888890] hover:text-[#E8E8EC] hover:bg-[#1E1E22] border border-transparent'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{checking ? 'Checking…' : 'Safety'}</span>
          </button>

          <button
            onClick={() => toggleToolTab('translate')}
            title="Translate prompt (⌘T)"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all ${
              activeToolTab === 'translate'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-[#888890] hover:text-[#E8E8EC] hover:bg-[#1E1E22] border border-transparent'
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Translate</span>
          </button>

          <button
            onClick={() => toggleToolTab('context')}
            title="Add context (RAG)"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all ${
              activeToolTab === 'context'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : contextEnabled && contextText
                  ? 'text-forge-orange bg-forge-orange/10 border border-forge-orange/30'
                  : 'text-[#888890] hover:text-[#E8E8EC] hover:bg-[#1E1E22] border border-transparent'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Context</span>
            {contextEnabled && contextText && <div className="h-1.5 w-1.5 rounded-full bg-forge-orange" />}
          </button>

          <div className="h-4 w-px bg-[#2A2A2E] mx-1" />

          {/* Compare toggle */}
          <button
            onClick={() => setCompareMode(v => !v)}
            title="Compare models (⌘M)"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all border ${
              compareMode
                ? 'bg-forge-orange text-white border-forge-orange'
                : 'text-[#888890] hover:text-[#E8E8EC] hover:bg-[#1E1E22] border-[#2A2A2E]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compare</span>
          </button>

          {/* Run / Stop */}
          {running ? (
            <button
              onClick={stop}
              className="flex items-center gap-1.5 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop
            </button>
          ) : (
            <button
              onClick={run}
              disabled={!prompt.trim() || !selectedModels.length}
              className="flex items-center gap-1.5 rounded-md bg-forge-orange px-4 py-1.5 text-xs font-black text-white hover:bg-orange-500 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-forge-orange/20"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Run
              <kbd className="hidden sm:inline-flex ml-1 items-center rounded border border-white/20 bg-white/10 px-1 py-0.5 text-[10px] font-mono">⌘↵</kbd>
            </button>
          )}
        </div>
      </header>

      {/* ── Main workspace ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar — model & settings ────────────────────────────── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="shrink-0 border-r border-[#2A2A2E] bg-[#0F0F11] overflow-y-auto overflow-x-hidden flex flex-col h-full"
            >
              <div className="min-w-[260px]">
                {/* Model selector */}
                <div className="p-4 border-b border-[#1E1E22]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#555560]">
                      {compareMode ? `Models (${selectedModels.length}/4)` : 'Model'}
                    </span>
                    {compareMode && (
                      <span className="text-[10px] text-[#555560]">up to 4</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {AVAILABLE_MODELS.map((model) => {
                      const isSelected = selectedModels.includes(model.id)
                      const isDisabled = compareMode && !isSelected && selectedModels.length >= 4
                      return (
                        <button
                          key={model.id}
                          onClick={() => !isDisabled && toggleModel(model.id)}
                          disabled={isDisabled}
                          className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all ${
                            isSelected
                              ? 'bg-forge-orange/10 border border-forge-orange/40'
                              : isDisabled
                                ? 'opacity-30 cursor-not-allowed border border-transparent'
                                : 'border border-transparent hover:bg-[#1A1A1E] hover:border-[#2A2A2E]'
                          }`}
                        >
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: model.color ?? '#888' }}
                          />
                          <div className="min-w-0">
                            <div className={`text-xs font-bold truncate ${isSelected ? 'text-forge-orange' : 'text-[#C8C8CC]'}`}>
                              {model.name}
                            </div>
                            <div className="text-[10px] text-[#555560] truncate">{model.provider}</div>
                          </div>
                          {isSelected && !compareMode && (
                            <Check className="h-3 w-3 text-forge-orange ml-auto shrink-0" />
                          )}
                          {compareMode && isSelected && (
                            <div className="ml-auto shrink-0 h-4 w-4 rounded-full bg-forge-orange flex items-center justify-center">
                              <span className="text-[9px] font-black text-white">{selectedModels.indexOf(model.id) + 1}</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Parameters */}
                <div className="border-b border-[#1E1E22]">
                  <button
                    onClick={() => setShowSettings(v => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#555560] hover:text-[#888890] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Parameters
                    </div>
                    {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden px-4 pb-4 space-y-4"
                      >
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <label className="text-xs font-medium text-[#888890]">Temperature</label>
                            <span className="font-mono text-xs font-black text-forge-orange">{temperature.toFixed(1)}</span>
                          </div>
                          <input type="range" min="0" max="2" step="0.1" value={temperature}
                            onChange={e => setTemperature(Number(e.target.value))}
                            className="w-full accent-forge-orange h-1 rounded-full" />
                          <div className="flex justify-between text-[10px] text-[#444448] mt-1">
                            <span>Precise</span><span>Creative</span>
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <label className="text-xs font-medium text-[#888890]">Max Tokens</label>
                            <span className="font-mono text-xs font-black text-forge-orange">{maxTokens.toLocaleString()}</span>
                          </div>
                          <input type="range" min="256" max="8192" step="256" value={maxTokens}
                            onChange={e => setMaxTokens(Number(e.target.value))}
                            className="w-full accent-forge-orange h-1 rounded-full" />
                          <div className="flex justify-between text-[10px] text-[#444448] mt-1">
                            <span>256</span><span>8192</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* History */}
                <div className="border-b border-[#1E1E22]">
                  <HistoryPanel
                    currentPrompt={prompt}
                    currentSystemPrompt={systemPrompt}
                    currentVariables={variableValues}
                    currentModels={selectedModels}
                    currentTemperature={temperature}
                    currentMaxTokens={maxTokens}
                    accessToken={accessToken}
                    isOpen={showHistory}
                    onToggle={() => setShowHistory(v => !v)}
                    onRestore={(session) => {
                      setPrompt(session.promptContent)
                      setSystemPrompt(session.systemPrompt)
                      setVariableValues(session.variableValues)
                      setSelectedModels(session.selectedModels)
                      setTemperature(session.temperature)
                      setMaxTokens(session.maxTokens)
                    }}
                  />
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="p-4">
                  <button
                    onClick={() => setShowShortcuts(true)}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[#444448] hover:text-[#888890] hover:bg-[#1A1A1E] transition-colors text-xs font-medium"
                  >
                    <kbd className="rounded border border-[#2A2A2E] bg-[#1A1A1E] px-1.5 py-0.5 font-mono text-[10px]">?</kbd>
                    Keyboard shortcuts
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Center — prompt editor ──────────────────────────────────────── */}
        <div className={`${sidebarOpen ? 'w-[400px]' : 'w-[440px]'} shrink-0 border-r border-[#2A2A2E] bg-[#0F0F11] flex flex-col overflow-y-auto h-full
          ${mobileTab === 'prompt' ? 'flex' : 'hidden'} lg:flex`}>

          {/* Editor header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E22]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#555560]">Prompt</span>
              <span className="rounded-full bg-[#1E1E22] border border-[#2A2A2E] px-2 py-0.5 text-[10px] font-mono font-bold text-[#666670]">
                ~{tokenCount}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPrompt('')} title="Clear (⌘K)"
                className="rounded p-1.5 text-[#444448] hover:text-[#888890] hover:bg-[#1A1A1E] transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPrompt(DEFAULT_PROMPT)} title="Reset to example"
                className="rounded p-1.5 text-[#444448] hover:text-[#888890] hover:bg-[#1A1A1E] transition-colors">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Prompt textarea */}
          <div className="flex flex-col">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run() } }}
              placeholder="Write your prompt here… Use {{variable}} for dynamic values"
              className="w-full resize-none bg-transparent p-4 font-mono text-sm text-[#C8C8CC] leading-relaxed placeholder:text-[#333338] focus:outline-none"
              style={{ minHeight: '260px' }}
            />
          </div>

          {/* Tool panels are now rendered as modals — see ToolModal below */}

          {/* Variables */}
          {detectedVars.length > 0 && (
            <div className="border-t border-[#1E1E22] p-4">
              <VariableBadge
                variables={detectedVars}
                values={variableValues}
                onChange={(k, v) => setVariableValues(prev => ({ ...prev, [k]: v }))}
              />
            </div>
          )}

          {/* System prompt */}
          <div className="border-t border-[#1E1E22]">
            <button
              onClick={() => setShowSystem(v => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#555560] hover:text-[#888890] transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                System
                {showSystem && systemPrompt && (
                  <span className="rounded-full bg-forge-orange/20 px-1.5 py-0.5 text-[9px] text-forge-orange font-bold border border-forge-orange/30">ON</span>
                )}
              </div>
              {showSystem ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <AnimatePresence>
              {showSystem && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden px-4 pb-4"
                >
                  <textarea
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                    placeholder="Optional system instructions…"
                    className="w-full resize-none rounded-lg border border-[#2A2A2E] bg-[#141416] p-3 font-mono text-xs text-[#C8C8CC] leading-relaxed placeholder:text-[#333338] focus:border-[#444448] focus:outline-none transition-colors"
                    rows={4}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right — output ──────────────────────────────────────────────── */}
        <div className={`flex-1 min-w-0 flex flex-col overflow-hidden bg-[#0C0C0E]
          ${mobileTab === 'output' ? 'flex' : 'hidden'} lg:flex`}>

          {results.length === 0 ? (
            <EmptyState onRun={run} running={running} hasPrompt={!!prompt.trim()} />
          ) : (
            <div className={`grid flex-1 gap-3 p-4 overflow-auto h-full auto-rows-fr
              ${results.length === 1 ? 'grid-cols-1' : ''}
              ${results.length === 2 ? 'grid-cols-2' : ''}
              ${results.length === 3 ? 'grid-cols-3' : ''}
              ${results.length === 4 ? 'grid-cols-2 grid-rows-2' : ''}
            `}>
              <AnimatePresence>
                {results.map(result => (
                  <motion.div
                    key={result.model}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="min-h-0 h-full"
                  >
                    <OutputPanel result={result} modelInfo={AVAILABLE_MODELS.find(m => m.id === result.model)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Output action bar */}
          {results.length > 0 && (
            <div className="flex shrink-0 items-center gap-2 border-t border-[#1E1E22] bg-[#0F0F11] px-4 py-2">
              <button onClick={clear}
                className="flex items-center gap-1.5 rounded-md border border-[#2A2A2E] px-2.5 py-1.5 text-xs font-bold text-[#555560] hover:text-[#888890] hover:border-[#3A3A3E] transition-colors">
                <Trash2 className="h-3 w-3" />Clear
              </button>
              <button onClick={run} disabled={running}
                className="flex items-center gap-1.5 rounded-md bg-forge-orange/10 border border-forge-orange/30 px-2.5 py-1.5 text-xs font-bold text-forge-orange hover:bg-forge-orange/20 transition-colors disabled:opacity-40">
                <RotateCcw className="h-3 w-3" />Re-run
              </button>

              <div className="ml-auto flex items-center gap-3">
                {(totalCost > 0 || runningCost > 0) && (
                  <div className="flex items-center gap-1 text-[10px] text-[#555560]">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-mono font-bold text-[#888890]">~${(totalCost || runningCost).toFixed(4)}</span>
                  </div>
                )}
                {avgLatency > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-[#555560]">
                    <Timer className="h-3 w-3" />
                    <span className="font-mono font-bold text-[#888890]">{Math.round(avgLatency)}ms</span>
                  </div>
                )}
                {results.map(r => {
                  const model = AVAILABLE_MODELS.find(m => m.id === r.model)
                  return (
                    <div key={r.model} className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: model?.color ?? '#888' }} />
                      <span className="text-[10px] text-[#555560] font-medium">{model?.name ?? r.model}</span>
                      {r.outputTokens && (
                        <span className="text-[10px] font-mono text-[#444448]">{r.outputTokens}t</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────────── */}
      <div className="flex h-6 shrink-0 items-center gap-4 border-t border-[#1E1E22] bg-[#0A0A0C] px-4 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-forge-orange" />
          <span className="text-[10px] text-[#444448] font-mono">
            {activeModel?.name ?? selectedModels[0]}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Hash className="h-2.5 w-2.5 text-[#333338]" />
          <span className="text-[10px] text-[#444448] font-mono">~{tokenCount} tokens</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Cpu className="h-2.5 w-2.5 text-[#333338]" />
          <span className="text-[10px] text-[#444448] font-mono">temp {temperature.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-[#444448] font-mono">{maxTokens} max</span>
        </div>
        {compareMode && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="rounded bg-forge-orange/20 px-1.5 py-0.5 text-[9px] font-black text-forge-orange">COMPARE</span>
          </div>
        )}
        {contextEnabled && contextText && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-black text-purple-400">RAG ON</span>
          </div>
        )}
        <div className="ml-auto shrink-0">
          <span className="text-[10px] text-[#333338] font-mono">PromptForge Playground</span>
        </div>
      </div>

      {/* ── Mobile tab bar ───────────────────────────────────────────────────── */}
      <div className="flex lg:hidden shrink-0 border-t border-[#2A2A2E] bg-[#0F0F11]">
        {(['prompt', 'output'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-colors ${
              mobileTab === tab
                ? 'text-forge-orange border-t-2 border-forge-orange -mt-[2px]'
                : 'text-[#444448]'
            }`}
          >
            {tab === 'output' && results.length > 0 ? `Output (${results.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* ── Tool Modal Overlay ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeToolTab !== null && (
          <motion.div
            key="tool-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setActiveToolTab(null) }}
          >
            <motion.div
              key="tool-modal-panel"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-2xl max-h-[85vh] rounded-xl border border-[#2A2A2E] bg-[#0F0F11] flex flex-col shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E1E22] shrink-0">
                <div className="flex items-center gap-2">
                  {activeToolTab === 'optimizer' && <><Sparkles className="h-4 w-4 text-amber-400" /><span className="text-sm font-black text-[#E8E8EC]">Prompt Optimizer</span></>}
                  {activeToolTab === 'safety' && <><Shield className="h-4 w-4 text-emerald-400" /><span className="text-sm font-black text-[#E8E8EC]">Safety Check</span></>}
                  {activeToolTab === 'translate' && <><Languages className="h-4 w-4 text-blue-400" /><span className="text-sm font-black text-[#E8E8EC]">Translate Prompt</span></>}
                  {activeToolTab === 'context' && <><FileText className="h-4 w-4 text-purple-400" /><span className="text-sm font-black text-[#E8E8EC]">Context (RAG)</span></>}
                </div>
                <button
                  onClick={() => setActiveToolTab(null)}
                  className="flex items-center justify-center h-7 w-7 rounded-lg text-[#555560] hover:text-[#E8E8EC] hover:bg-[#1E1E22] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal body — scrollable */}
              <div className="flex-1 overflow-y-auto">
                {activeToolTab === 'optimizer' && optimizerResult && (
                  <OptimizerPanel
                    result={optimizerResult}
                    onApply={(opt) => { setPrompt(opt); setActiveToolTab(null) }}
                    onClose={() => setActiveToolTab(null)}
                  />
                )}
                {activeToolTab === 'optimizer' && !optimizerResult && (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                    <p className="text-sm text-[#555560]">Analyzing your prompt…</p>
                  </div>
                )}
                {activeToolTab === 'safety' && safetyResult && (
                  <SafetyPanel result={safetyResult} onClose={() => setActiveToolTab(null)} />
                )}
                {activeToolTab === 'safety' && !safetyResult && (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <div className="h-8 w-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                    <p className="text-sm text-[#555560]">Running safety analysis…</p>
                  </div>
                )}
                {activeToolTab === 'translate' && (
                  <TranslationPanel
                    originalContent={prompt}
                    onUseTranslation={t => { setPrompt(t); setActiveToolTab(null) }}
                    onClose={() => setActiveToolTab(null)}
                  />
                )}
                {activeToolTab === 'context' && (
                  <div className="p-5">
                    <p className="text-xs text-[#555560] mb-4 leading-relaxed">
                      Paste document text or knowledge base content below. When enabled, it will be injected as context before your system prompt.
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-3 text-sm text-[#C8C8CC] cursor-pointer select-none">
                        <div
                          onClick={() => setContextEnabled(v => !v)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${contextEnabled ? 'bg-forge-orange' : 'bg-[#2A2A2E]'}`}
                        >
                          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${contextEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="font-bold">Enable context injection</span>
                      </label>
                      {contextEnabled && (
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-black text-purple-400 border border-purple-500/30">ACTIVE</span>
                      )}
                    </div>
                    <textarea
                      value={contextText}
                      onChange={e => setContextText(e.target.value.slice(0, 8000))}
                      placeholder="Paste document text, article, or knowledge base content here…&#10;&#10;This will be prepended to your system prompt when running."
                      className="w-full resize-none rounded-lg border border-[#2A2A2E] bg-[#141416] p-4 text-sm text-[#C8C8CC] placeholder:text-[#333338] focus:outline-none focus:border-[#444448] font-mono leading-relaxed"
                      style={{ minHeight: '240px' }}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-[#444448]">Max 8,000 characters</span>
                      <span className={`text-[10px] font-mono ${contextText.length > 7500 ? 'text-amber-400' : 'text-[#444448]'}`}>
                        {contextText.length.toLocaleString()} / 8,000
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2 justify-end">
                      <button
                        onClick={() => setContextText('')}
                        disabled={!contextText}
                        className="rounded-lg border border-[#2A2A2E] px-4 py-2 text-xs font-bold text-[#555560] hover:text-[#888890] hover:border-[#3A3A3E] transition-colors disabled:opacity-30"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setActiveToolTab(null)}
                        className="rounded-lg bg-purple-500/20 border border-purple-500/30 px-4 py-2 text-xs font-bold text-purple-400 hover:bg-purple-500/30 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onRun, running, hasPrompt }: {
  onRun: () => void; running: boolean; hasPrompt: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-12 text-center">
      {/* Animated icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-forge-orange/20 blur-xl" />
        <div className="relative h-16 w-16 rounded-2xl border border-forge-orange/30 bg-gradient-to-br from-forge-orange/10 to-transparent flex items-center justify-center">
          <Zap className="h-8 w-8 text-forge-orange" strokeWidth={1.5} />
        </div>
        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-forge-orange border-2 border-[#0C0C0E] animate-pulse" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-black text-[#E8E8EC] tracking-tight">
          Ready to forge
        </h3>
        <p className="text-sm text-[#555560] max-w-xs leading-relaxed">
          Write a prompt in the editor, select a model, and run it to see the output here.
        </p>
      </div>

      <button
        onClick={onRun}
        disabled={!hasPrompt || running}
        className="flex items-center gap-2 rounded-xl bg-forge-orange px-8 py-3 text-sm font-black text-white hover:bg-orange-500 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-forge-orange/25"
      >
        <Play className="h-4 w-4 fill-current" />
        Run Prompt
      </button>

      <div className="grid grid-cols-2 gap-3 text-xs text-[#444448]">
        {[
          ['⌘ + ↵', 'Run prompt'],
          ['⌘ + M', 'Compare mode'],
          ['⌘ + O', 'Optimize'],
          ['⌘ + K', 'Clear editor'],
        ].map(([key, desc]) => (
          <div key={key} className="flex items-center gap-2 rounded-lg bg-[#141416] border border-[#1E1E22] px-3 py-2">
            <kbd className="rounded border border-[#2A2A2E] bg-[#1A1A1E] px-1.5 py-0.5 font-mono text-[10px] text-[#666670]">{key}</kbd>
            <span className="text-[#444448]">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
