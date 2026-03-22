'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dimension {
  name: string
  weight: number
  rubric: string
}

interface CaseInput {
  input: Record<string, string>
  expected: string
}

interface EvalCase {
  id: string
  input: Record<string, string>
  expected?: string | null
}

interface EvalResult {
  id: string
  caseId: string
  output: string
  scores: Record<string, number>
  overallScore: number
  passed: boolean
  reasoning: string
  case?: EvalCase
}

interface EvalRun {
  id: string
  overallScore: number
  passed: number
  total: number
  model: string
  createdAt: string
  results?: EvalResult[]
}

interface EvalSuite {
  id: string
  name: string
  dimensions: Dimension[]
  cases: EvalCase[]
  runs: EvalRun[]
  createdAt: string
}

interface NewSuiteForm {
  name: string
  dimensions: Dimension[]
  cases: CaseInput[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100)
  const color = score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/70 w-8 text-right">{score.toFixed(1)}</span>
    </div>
  )
}

function ResultRow({
  result,
  index,
  dimensions,
}: {
  result: EvalResult
  index: number
  dimensions: Dimension[]
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      {/* Row header */}
      <button
        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="text-white/50 text-sm w-8">#{index + 1}</span>

        {result.passed ? (
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        )}

        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
            result.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {result.passed ? 'PASS' : 'FAIL'}
        </span>

        <div className="flex-1 min-w-0">
          <ScoreBar score={result.overallScore} />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {dimensions.map(dim => (
            <div key={dim.name} className="hidden md:flex flex-col items-center text-xs">
              <span className="text-white/40 truncate max-w-[60px]">{dim.name}</span>
              <span className="text-white/80 font-mono">{(result.scores[dim.name] ?? 5).toFixed(0)}</span>
            </div>
          ))}
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-4 bg-black/20">
          {/* Input variables */}
          {result.case?.input && Object.keys(result.case.input).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Inputs</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.case.input).map(([k, v]) => (
                  <span key={k} className="text-xs bg-white/10 rounded px-2 py-1">
                    <span className="text-[#FF6B2B]">{k}</span>
                    <span className="text-white/50">: </span>
                    <span className="text-white/80">{String(v)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Output</p>
            <pre className="text-sm text-white/80 whitespace-pre-wrap bg-white/5 rounded p-3 font-mono leading-relaxed max-h-48 overflow-y-auto">
              {result.output || <span className="text-white/30 italic">No output</span>}
            </pre>
          </div>

          {/* Expected */}
          {result.case?.expected && (
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Expected</p>
              <pre className="text-sm text-white/60 whitespace-pre-wrap bg-white/5 rounded p-3 font-mono leading-relaxed max-h-32 overflow-y-auto">
                {result.case.expected}
              </pre>
            </div>
          )}

          {/* Per-dimension scores */}
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Dimension Scores</p>
            <div className="space-y-2">
              {dimensions.map(dim => (
                <div key={dim.name} className="flex items-center gap-3">
                  <span className="text-xs text-white/60 w-28 flex-shrink-0 truncate">{dim.name}</span>
                  <div className="flex-1">
                    <ScoreBar score={result.scores[dim.name] ?? 5} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reasoning */}
          {result.reasoning && (
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Reasoning</p>
              <p className="text-sm text-white/70 bg-white/5 rounded p-3 leading-relaxed">{result.reasoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EvalHarness({ promptId, versionId }: { promptId: string; versionId: string }) {
  const [suites, setSuites] = useState<EvalSuite[]>([])
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null)
  const [runResults, setRunResults] = useState<Record<string, EvalRun>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newSuite, setNewSuite] = useState<NewSuiteForm>({
    name: '',
    dimensions: [{ name: 'Quality', weight: 50, rubric: 'Is the output high quality and accurate?' }],
    cases: [{ input: {}, expected: '' }],
  })

  // ── Fetch suites ────────────────────────────────────────────────────────────
  const fetchSuites = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`/api/prompts/${promptId}/eval`)
      if (!res.ok) throw new Error('Failed to load eval suites')
      const data: EvalSuite[] = await res.json()
      setSuites(data)
      if (data.length > 0 && !selectedSuiteId && data[0]) {
        setSelectedSuiteId(data[0].id)
      }
      // Seed runResults with latest run per suite
      const seedRuns: Record<string, EvalRun> = {}
      data.forEach(s => {
        if (s.runs?.[0]) seedRuns[s.id] = s.runs[0]
      })
      setRunResults(prev => ({ ...seedRuns, ...prev }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [promptId, selectedSuiteId])

  useEffect(() => {
    fetchSuites()
  }, [promptId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Create suite ────────────────────────────────────────────────────────────
  const handleCreateSuite = async () => {
    if (!newSuite.name.trim()) return
    try {
      setError(null)
      const res = await fetch(`/api/prompts/${promptId}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSuite.name.trim(),
          dimensions: newSuite.dimensions,
          cases: newSuite.cases.map(c => ({ input: c.input, expected: c.expected || undefined })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to create suite')
      }
      const suite: EvalSuite = await res.json()
      setSuites(prev => [suite, ...prev])
      setSelectedSuiteId(suite.id)
      setIsCreating(false)
      setNewSuite({
        name: '',
        dimensions: [{ name: 'Quality', weight: 50, rubric: 'Is the output high quality and accurate?' }],
        cases: [{ input: {}, expected: '' }],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  // ── Run eval ────────────────────────────────────────────────────────────────
  const handleRunEval = async (suiteId: string) => {
    try {
      setIsRunning(true)
      setError(null)
      const res = await fetch(`/api/prompts/${promptId}/eval/${suiteId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId, model: 'llama-3.3-70b-versatile' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Run failed')
      }
      const run: EvalRun = await res.json()
      setRunResults(prev => ({ ...prev, [suiteId]: run }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  // ── Dimension helpers ───────────────────────────────────────────────────────
  const addDimension = () =>
    setNewSuite(prev => ({
      ...prev,
      dimensions: [...prev.dimensions, { name: '', weight: 25, rubric: '' }],
    }))

  const removeDimension = (i: number) =>
    setNewSuite(prev => ({ ...prev, dimensions: prev.dimensions.filter((_, idx) => idx !== i) }))

  const updateDimension = (i: number, field: keyof Dimension, value: string | number) =>
    setNewSuite(prev => ({
      ...prev,
      dimensions: prev.dimensions.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)),
    }))

  // ── Case helpers ────────────────────────────────────────────────────────────
  const addCase = () =>
    setNewSuite(prev => ({ ...prev, cases: [...prev.cases, { input: {}, expected: '' }] }))

  const removeCase = (i: number) =>
    setNewSuite(prev => ({ ...prev, cases: prev.cases.filter((_, idx) => idx !== i) }))

  const updateCaseInput = (i: number, key: string, value: string) =>
    setNewSuite(prev => ({
      ...prev,
      cases: prev.cases.map((c, idx) =>
        idx === i ? { ...c, input: { ...c.input, [key]: value } } : c
      ),
    }))

  const addCaseInputKey = (i: number) => {
    const key = prompt('Variable name (e.g. "topic"):')?.trim()
    if (!key) return
    updateCaseInput(i, key, '')
  }

  const updateCaseExpected = (i: number, value: string) =>
    setNewSuite(prev => ({
      ...prev,
      cases: prev.cases.map((c, idx) => (idx === i ? { ...c, expected: value } : c)),
    }))

  const selectedSuite = suites.find(s => s.id === selectedSuiteId)
  const currentRun = selectedSuiteId ? runResults[selectedSuiteId] : undefined

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Eval Harness</h2>
          <p className="text-sm text-white/50 mt-0.5">Test your prompt against structured evaluation suites</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-orange flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Suite
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* New Suite Form */}
      {isCreating && (
        <div className="card-hard rounded-xl p-6 space-y-6 border border-[#FF6B2B]/30">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Create Eval Suite</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-white/40 hover:text-white/70 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>

          {/* Suite name */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Suite Name
            </label>
            <input
              type="text"
              placeholder="e.g. Tone & Accuracy Suite"
              value={newSuite.name}
              onChange={e => setNewSuite(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B2B]/50 transition-colors"
            />
          </div>

          {/* Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Dimensions
              </label>
              <button
                onClick={addDimension}
                className="flex items-center gap-1.5 text-xs text-[#FF6B2B] hover:text-[#FF8C5A] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Dimension
              </button>
            </div>
            <div className="space-y-3">
              {newSuite.dimensions.map((dim, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Dimension name"
                      value={dim.name}
                      onChange={e => updateDimension(i, 'name', e.target.value)}
                      className="flex-1 bg-transparent border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B2B]/50"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">Weight</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={dim.weight}
                        onChange={e => updateDimension(i, 'weight', Number(e.target.value))}
                        className="w-20 accent-[#FF6B2B]"
                      />
                      <span className="text-xs text-white/70 w-8">{dim.weight}</span>
                    </div>
                    {newSuite.dimensions.length > 1 && (
                      <button
                        onClick={() => removeDimension(i)}
                        className="text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    placeholder="Rubric: describe what makes a good score on this dimension..."
                    value={dim.rubric}
                    onChange={e => updateDimension(i, 'rubric', e.target.value)}
                    rows={2}
                    className="w-full bg-transparent border border-white/10 rounded px-3 py-1.5 text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-[#FF6B2B]/50 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Test Cases
              </label>
              <button
                onClick={addCase}
                className="flex items-center gap-1.5 text-xs text-[#FF6B2B] hover:text-[#FF8C5A] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Case
              </button>
            </div>
            <div className="space-y-3">
              {newSuite.cases.map((c, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Case #{i + 1}</span>
                    {newSuite.cases.length > 1 && (
                      <button
                        onClick={() => removeCase(i)}
                        className="text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Variable inputs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/40">Variable Inputs</span>
                      <button
                        onClick={() => addCaseInputKey(i)}
                        className="text-xs text-[#FF6B2B] hover:text-[#FF8C5A]"
                      >
                        + Add variable
                      </button>
                    </div>
                    {Object.keys(c.input).length === 0 ? (
                      <p className="text-xs text-white/25 italic">No variables — click &quot;Add variable&quot; to set variable values</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(c.input).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2">
                            <span className="text-xs text-[#FF6B2B] font-mono w-24 flex-shrink-0 truncate">{`{{${k}}}`}</span>
                            <input
                              type="text"
                              value={v}
                              onChange={e => updateCaseInput(i, k, e.target.value)}
                              placeholder={`Value for ${k}`}
                              className="flex-1 bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B2B]/50"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expected output */}
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Expected Output (optional)</label>
                    <textarea
                      placeholder="Describe the expected output or pattern..."
                      value={c.expected}
                      onChange={e => updateCaseExpected(i, e.target.value)}
                      rows={2}
                      className="w-full bg-transparent border border-white/10 rounded px-3 py-1.5 text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-[#FF6B2B]/50 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSuite}
              disabled={!newSuite.name.trim()}
              className="btn-orange text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Suite
            </button>
          </div>
        </div>
      )}

      {/* Suite list / tabs */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-[#FF6B2B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : suites.length === 0 && !isCreating ? (
        <div className="card-hard rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FF6B2B]/10 flex items-center justify-center mx-auto">
            <Play className="w-5 h-5 text-[#FF6B2B]" />
          </div>
          <p className="text-white/60 text-sm">No eval suites yet.</p>
          <button onClick={() => setIsCreating(true)} className="btn-orange text-sm">
            Create your first suite
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          {suites.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suites.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSuiteId(s.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSuiteId === s.id
                      ? 'bg-[#FF6B2B] text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {s.name}
                  <span className="ml-2 text-xs opacity-60">{s.cases.length}c</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected suite detail */}
          {selectedSuite && (
            <div className="card-hard rounded-xl p-6 space-y-6">
              {/* Suite header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{selectedSuite.name}</h3>
                  <p className="text-xs text-white/40 mt-1">
                    {selectedSuite.cases.length} case{selectedSuite.cases.length !== 1 ? 's' : ''} ·{' '}
                    {selectedSuite.dimensions.length} dimension{selectedSuite.dimensions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleRunEval(selectedSuite.id)}
                  disabled={isRunning || selectedSuite.cases.length === 0}
                  className="btn-orange flex items-center gap-2 text-sm flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Running…
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Eval
                    </>
                  )}
                </button>
              </div>

              {/* Dimensions summary */}
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Dimensions</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSuite.dimensions.map(d => (
                    <span
                      key={d.name}
                      className="text-xs bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 text-[#FF6B2B] rounded-full px-3 py-1"
                      title={d.rubric}
                    >
                      {d.name} <span className="opacity-60">×{d.weight}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Run results */}
              {currentRun && (
                <div className="space-y-4">
                  {/* Summary bar */}
                  <div
                    className={`rounded-lg p-4 flex items-center justify-between gap-4 ${
                      currentRun.passed / Math.max(currentRun.total, 1) >= 0.7
                        ? 'bg-green-500/10 border border-green-500/20'
                        : currentRun.passed / Math.max(currentRun.total, 1) >= 0.4
                        ? 'bg-yellow-500/10 border border-yellow-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-2xl font-bold ${
                          currentRun.passed / Math.max(currentRun.total, 1) >= 0.7
                            ? 'text-green-400'
                            : currentRun.passed / Math.max(currentRun.total, 1) >= 0.4
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {currentRun.passed}/{currentRun.total}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Passed</p>
                        <p className="text-xs text-white/50">
                          {currentRun.total > 0
                            ? Math.round((currentRun.passed / currentRun.total) * 100)
                            : 0}
                          % pass rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{currentRun.overallScore.toFixed(1)}</p>
                      <p className="text-xs text-white/50">/ 10 avg score</p>
                    </div>
                    <div className="text-right text-xs text-white/30">
                      <p>{currentRun.model}</p>
                      <p>{new Date(currentRun.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Result rows */}
                  {currentRun.results && currentRun.results.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Results</p>
                      {currentRun.results.map((result, i) => (
                        <ResultRow
                          key={result.id}
                          result={result}
                          index={i}
                          dimensions={selectedSuite.dimensions}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cases preview (when no run yet) */}
              {!currentRun && selectedSuite.cases.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Test Cases</p>
                  <div className="space-y-2">
                    {selectedSuite.cases.map((c, i) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-3 bg-white/5 rounded-lg p-3 border border-white/5"
                      >
                        <span className="text-xs text-white/30 w-6 flex-shrink-0">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          {Object.entries(c.input).length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(c.input).map(([k, v]) => (
                                <span key={k} className="text-xs bg-white/10 rounded px-2 py-0.5">
                                  <span className="text-[#FF6B2B]">{k}</span>
                                  <span className="text-white/40">: </span>
                                  <span className="text-white/70">{String(v)}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-white/25 italic">No variables</span>
                          )}
                          {c.expected && (
                            <p className="text-xs text-white/40 mt-1 truncate">Expected: {c.expected}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/30 mt-3 text-center">
                    Click &quot;Run Eval&quot; to execute all cases and get AI-powered scores
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
