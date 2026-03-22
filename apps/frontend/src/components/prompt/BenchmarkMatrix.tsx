'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Play, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface TestCase {
  input: Record<string, string>
  expectedPattern: string
}

interface CaseResult {
  input: string
  output: string
  latencyMs: number
  cost: number
  passed: boolean
}

interface ModelResult {
  model: string
  modelName: string
  passRate: number
  avgLatency: number
  avgCost: number
  cases: CaseResult[]
}

interface BenchmarkRun {
  id: string
  createdAt: string
  results: ModelResult[]
}

interface BenchmarkSuite {
  id: string
  name: string
  cases: TestCase[]
  runs: BenchmarkRun[]
  createdAt: string
}

interface Props {
  promptId: string
  versionId: string
}

function formatCost(cost: number) {
  if (cost === 0) return '$0.000'
  if (cost < 0.0001) return `$${(cost * 1000000).toFixed(1)}µ`
  return `$${cost.toFixed(5)}`
}

export default function BenchmarkMatrix({ promptId }: Props) {
  const [suites, setSuites] = useState<BenchmarkSuite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSuite, setSelectedSuite] = useState<BenchmarkSuite | null>(null)
  const [runResult, setRunResult] = useState<{ modelResults: ModelResult[] } | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState('')

  // New suite form state
  const [showNewForm, setShowNewForm] = useState(false)
  const [newSuiteName, setNewSuiteName] = useState('')
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: { input: '' }, expectedPattern: '' }
  ])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    fetch(`/api/prompts/${promptId}/benchmarks`)
      .then(r => r.json())
      .then(data => {
        setSuites(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [promptId])

  function addTestCase() {
    setTestCases(prev => [...prev, { input: { input: '' }, expectedPattern: '' }])
  }

  function removeTestCase(i: number) {
    setTestCases(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateTestCaseInput(i: number, key: string, value: string) {
    setTestCases(prev => prev.map((tc, idx) =>
      idx === i ? { ...tc, input: { ...tc.input, [key]: value } } : tc
    ))
  }

  function updateTestCasePattern(i: number, value: string) {
    setTestCases(prev => prev.map((tc, idx) =>
      idx === i ? { ...tc, expectedPattern: value } : tc
    ))
  }

  async function handleCreateSuite() {
    if (!newSuiteName.trim()) { setCreateError('Suite name is required'); return }
    if (testCases.length === 0) { setCreateError('Add at least one test case'); return }
    setCreating(true)
    setCreateError('')
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const res = await fetch(`/api/prompts/${promptId}/benchmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newSuiteName.trim(), cases: testCases }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error || 'Failed to create suite'); return }
      setSuites(prev => [{ ...data, runs: [] }, ...prev])
      setNewSuiteName('')
      setTestCases([{ input: { input: '' }, expectedPattern: '' }])
      setShowNewForm(false)
    } catch {
      setCreateError('Network error')
    } finally {
      setCreating(false)
    }
  }

  async function handleRunBenchmark(suite: BenchmarkSuite) {
    setSelectedSuite(suite)
    setRunning(true)
    setRunError('')
    setRunResult(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const res = await fetch(`/api/prompts/${promptId}/benchmarks/${suite.id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await res.json()
      if (!res.ok) { setRunError(data.error || 'Run failed'); return }
      setRunResult(data)
      // Update suite runs
      setSuites(prev => prev.map(s =>
        s.id === suite.id
          ? { ...s, runs: [{ id: data.id, createdAt: data.createdAt, results: data.modelResults }, ...s.runs].slice(0, 3) }
          : s
      ))
    } catch {
      setRunError('Network error during benchmark run')
    } finally {
      setRunning(false)
    }
  }

  // Determine best model (highest pass rate)
  function getBestModelIdx(results: ModelResult[]) {
    let bestIdx = 0
    let bestRate = -1
    results.forEach((r, i) => {
      if (r.passRate > bestRate) { bestRate = r.passRate; bestIdx = i }
    })
    return bestIdx
  }

  // Check regression vs last run
  function getRegressionWarning(suite: BenchmarkSuite, current: ModelResult[]) {
    if (suite.runs.length === 0) return null
    const lastRun = suite.runs[0]!
    const lastResults = lastRun.results as ModelResult[]
    const warnings: string[] = []
    current.forEach(curr => {
      const prev = lastResults.find(r => r.model === curr.model)
      if (prev && prev.passRate - curr.passRate > 0.1) {
        warnings.push(`${curr.modelName}: pass rate dropped ${Math.round((prev.passRate - curr.passRate) * 100)}%`)
      }
    })
    return warnings.length > 0 ? warnings : null
  }

  if (loading) {
    return (
      <div className="card-hard rounded-xl p-6 text-center text-forge-muted text-sm animate-pulse">
        Loading benchmarks...
      </div>
    )
  }

  const displayResults = runResult?.modelResults ?? (selectedSuite?.runs[0]?.results as ModelResult[] | undefined)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Benchmark Matrix</h3>
        <button
          onClick={() => setShowNewForm(v => !v)}
          className="btn-orange flex items-center gap-1.5 text-sm px-3 py-2"
        >
          <Plus size={14} />
          New Suite
        </button>
      </div>

      {/* New Suite Form */}
      {showNewForm && (
        <div className="card-hard rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-white text-sm">Create Benchmark Suite</h4>
          <input
            type="text"
            placeholder="Suite name..."
            value={newSuiteName}
            onChange={e => setNewSuiteName(e.target.value)}
            className="w-full bg-forge-black border border-forge-border rounded-lg px-3 py-2 text-sm text-white placeholder-forge-muted focus:outline-none focus:border-forge-orange"
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-forge-muted uppercase tracking-wider">Test Cases</span>
              <button onClick={addTestCase} className="text-xs text-forge-orange hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Case
              </button>
            </div>

            {testCases.map((tc, i) => (
              <div key={i} className="rounded-lg border border-forge-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Case {i + 1}</span>
                  {testCases.length > 1 && (
                    <button onClick={() => removeTestCase(i)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-forge-muted uppercase tracking-wider">Input value</label>
                    <input
                      type="text"
                      placeholder="input value..."
                      value={tc.input.input ?? ''}
                      onChange={e => updateTestCaseInput(i, 'input', e.target.value)}
                      className="w-full bg-forge-black border border-forge-border rounded px-2 py-1.5 text-xs text-white placeholder-forge-muted focus:outline-none focus:border-forge-orange mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-forge-muted uppercase tracking-wider">Expected pattern</label>
                    <input
                      type="text"
                      placeholder="text or /regex/"
                      value={tc.expectedPattern}
                      onChange={e => updateTestCasePattern(i, e.target.value)}
                      className="w-full bg-forge-black border border-forge-border rounded px-2 py-1.5 text-xs text-white placeholder-forge-muted focus:outline-none focus:border-forge-orange mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {createError && <p className="text-xs text-red-400">{createError}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleCreateSuite}
              disabled={creating}
              className="btn-orange text-sm px-4 py-2 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Suite'}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="text-sm text-forge-muted hover:text-white px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Suite List */}
      {suites.length === 0 && !showNewForm && (
        <div className="card-hard rounded-xl p-8 text-center text-forge-muted text-sm">
          No benchmark suites yet. Create one to start testing across models.
        </div>
      )}

      {suites.map(suite => (
        <div key={suite.id} className="card-hard rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border">
            <div>
              <h4 className="font-semibold text-white text-sm">{suite.name}</h4>
              <p className="text-xs text-forge-muted mt-0.5">{suite.cases.length} test cases · {suite.runs.length} runs</p>
            </div>
            <button
              onClick={() => handleRunBenchmark(suite)}
              disabled={running && selectedSuite?.id === suite.id}
              className="flex items-center gap-1.5 rounded-lg bg-forge-orange px-3 py-2 text-xs font-bold text-white hover:bg-forge-orange/90 transition-colors disabled:opacity-50"
            >
              {running && selectedSuite?.id === suite.id ? (
                <>
                  <div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={12} />
                  Run Benchmark
                </>
              )}
            </button>
          </div>

          {/* Results Matrix */}
          {selectedSuite?.id === suite.id && displayResults && displayResults.length > 0 && (
            <div className="p-5 space-y-4">
              {/* Regression warning */}
              {(() => {
                const warnings = getRegressionWarning(suite, displayResults)
                return warnings ? (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2.5">
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-400">Regression Detected</p>
                      {warnings.map((w, i) => <p key={i} className="text-xs text-amber-300">{w}</p>)}
                    </div>
                  </div>
                ) : null
              })()}

              {/* Matrix table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left text-forge-muted font-semibold py-2 pr-4 min-w-[100px]">Test Case</th>
                      {displayResults.map((m, i) => {
                        const isBest = i === getBestModelIdx(displayResults)
                        return (
                          <th key={m.model} className={`text-center py-2 px-2 font-semibold min-w-[100px] ${isBest ? 'text-forge-orange' : 'text-white'}`}>
                            {m.modelName}
                            {isBest && <span className="ml-1 text-[9px] text-forge-orange">★ Best</span>}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {suite.cases.map((tc, caseIdx) => (
                      <tr key={caseIdx} className="border-t border-forge-border/50">
                        <td className="py-2 pr-4 text-forge-muted truncate max-w-[120px]">
                          {JSON.stringify(tc.input).slice(0, 30)}...
                        </td>
                        {displayResults.map(m => {
                          const cr = m.cases[caseIdx]
                          if (!cr) return <td key={m.model} className="py-2 px-2 text-center text-forge-muted">—</td>
                          return (
                            <td key={m.model} className="py-2 px-2 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                {cr.passed ? (
                                  <CheckCircle size={12} className="text-green-400" />
                                ) : (
                                  <XCircle size={12} className="text-red-400" />
                                )}
                                <span className="text-[10px] text-forge-muted">{cr.latencyMs}ms</span>
                                <span className="text-[10px] text-forge-muted">{formatCost(cr.cost)}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}

                    {/* Summary row */}
                    <tr className="border-t-2 border-forge-border bg-forge-black/30">
                      <td className="py-3 pr-4 font-bold text-white">Summary</td>
                      {displayResults.map((m, i) => {
                        const isBest = i === getBestModelIdx(displayResults)
                        return (
                          <td key={m.model} className="py-3 px-2 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`font-bold text-sm ${isBest ? 'text-forge-orange' : 'text-white'}`}>
                                {Math.round(m.passRate * 100)}%
                              </span>
                              <span className="text-[10px] text-forge-muted">Pass rate</span>
                              <span className="text-[10px] text-forge-muted">{m.avgLatency}ms avg</span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {runError && selectedSuite?.id === suite.id && (
            <div className="px-5 py-3 text-xs text-red-400 border-t border-forge-border">
              {runError}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
