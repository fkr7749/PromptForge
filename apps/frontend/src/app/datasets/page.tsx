'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Upload, Play, RefreshCw, Database, Tag, BookOpen, ChevronRight } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'

interface DatasetRow {
  [key: string]: string
}

interface Dataset {
  id: string
  name: string
  description?: string
  rowCount: number
  rows: DatasetRow[]
  createdAt: string
  _count?: { trainings: number }
}

interface Variable {
  name: string
  description: string
  default: string
}

interface TrainingResult {
  id: string
  generatedPrompt: string
  variables: Variable[]
  model: string
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = (lines[0] ?? '').split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

export default function DatasetsPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Dataset | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  // New dataset form
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // CSV paste
  const [csvText, setCsvText] = useState('')
  const [showCsvInput, setShowCsvInput] = useState(false)

  // Table editing
  const [tableRows, setTableRows] = useState<DatasetRow[]>([])
  const [tableColumns, setTableColumns] = useState<string[]>([])

  // Training
  const [training, setTraining] = useState(false)
  const [trainResult, setTrainResult] = useState<TrainingResult | null>(null)
  const [trainError, setTrainError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    loadDatasets()
  }, [accessToken])

  useEffect(() => {
    if (selected) {
      const rows = (selected.rows as DatasetRow[]) || []
      setTableRows(rows)
      setTableColumns(rows.length > 0 ? Object.keys(rows[0] ?? {}) : ['input', 'output'])
      setTrainResult(null)
      setTrainError('')
      setSaveSuccess(false)
    }
  }, [selected])

  async function loadDatasets() {
    setLoading(true)
    try {
      const token = accessToken
      if (!token) { setLoading(false); return }
      const res = await fetch('/api/datasets', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setDatasets(Array.isArray(data) ? data : [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function handleCreateDataset() {
    if (!newName.trim()) { setCreateError('Name is required'); return }
    setCreating(true)
    setCreateError('')
    try {
      const token = accessToken
      const res = await fetch('/api/datasets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined, rows: [] }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error || 'Failed to create'); return }
      setDatasets(prev => [{ ...data, _count: { trainings: 0 } }, ...prev])
      setSelected({ ...data, _count: { trainings: 0 } })
      setNewName('')
      setNewDesc('')
      setShowNewForm(false)
    } catch { setCreateError('Network error') }
    finally { setCreating(false) }
  }

  function handleParseCsv() {
    const rows = parseCSV(csvText)
    if (rows.length === 0) return
    setTableRows(rows)
    setTableColumns(Object.keys(rows[0] ?? {}))
    setCsvText('')
    setShowCsvInput(false)
  }

  function addRow() {
    const emptyRow = Object.fromEntries(tableColumns.map(c => [c, '']))
    setTableRows(prev => [...prev, emptyRow])
  }

  function updateCell(rowIdx: number, col: string, value: string) {
    setTableRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [col]: value } : r))
  }

  function removeRow(rowIdx: number) {
    setTableRows(prev => prev.filter((_, i) => i !== rowIdx))
  }

  async function saveRows() {
    if (!selected) return
    try {
      const token = accessToken
      await fetch(`/api/datasets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    } catch { /* ignore */ }
  }

  async function handleTrain() {
    if (!selected) return
    if (tableRows.length === 0) { setTrainError('Add some rows first'); return }
    setTraining(true)
    setTrainError('')
    setTrainResult(null)
    setSaveSuccess(false)
    try {
      // First persist rows
      const token = accessToken
      const updateRes = await fetch(`/api/datasets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: selected.name, description: selected.description, rows: tableRows }),
      })
      const updated = await updateRes.json()
      const datasetId = updateRes.ok ? updated.id : selected.id

      const res = await fetch(`/api/datasets/${datasetId}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { setTrainError(data.error || 'Training failed'); return }
      setTrainResult(data)
    } catch { setTrainError('Network error') }
    finally { setTraining(false) }
  }

  async function handleSaveToLibrary() {
    if (!trainResult) return
    setSaving(true)
    try {
      const token = accessToken
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: `[Draft] Trained from ${selected?.name ?? 'Dataset'}`,
          content: trainResult.generatedPrompt,
          variables: trainResult.variables,
          category: 'OTHER',
          tags: ['dataset-trained'],
          isPublic: false,
        }),
      })
      if (res.ok) {
        setSaveSuccess(true)
      }
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-forge-ink">
      <Navigation />
      <div className="max-w-[1400px] mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <p className="text-xs font-black text-forge-orange uppercase tracking-widest mb-1">Feature</p>
          <h1 className="text-4xl font-display font-black text-white leading-none">DATASET TRAINER</h1>
          <p className="text-forge-muted text-sm mt-2">Upload example data and let AI generate a prompt template.</p>
        </div>

        <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
          {/* ── Left Panel: Dataset List ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-sm">Datasets</h2>
              <button
                onClick={() => setShowNewForm(v => !v)}
                className="btn-orange text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <Plus size={12} />
                New
              </button>
            </div>

            {/* New Dataset Form */}
            {showNewForm && (
              <div className="card-hard rounded-xl p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Dataset name..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-forge-black border border-forge-border rounded-lg px-3 py-2 text-sm text-white placeholder-forge-muted focus:outline-none focus:border-forge-orange"
                />
                <input
                  type="text"
                  placeholder="Description (optional)..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-forge-black border border-forge-border rounded-lg px-3 py-2 text-sm text-white placeholder-forge-muted focus:outline-none focus:border-forge-orange"
                />
                {createError && <p className="text-xs text-red-400">{createError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleCreateDataset} disabled={creating} className="btn-orange text-xs px-3 py-1.5 disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button onClick={() => setShowNewForm(false)} className="text-xs text-forge-muted hover:text-white">Cancel</button>
                </div>
              </div>
            )}

            {/* Dataset list */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 card-hard rounded-xl animate-pulse" />)}
              </div>
            ) : datasets.length === 0 ? (
              <div className="card-hard rounded-xl p-6 text-center text-forge-muted text-sm">
                <Database size={24} className="mx-auto mb-2 opacity-40" />
                No datasets yet
              </div>
            ) : (
              <div className="space-y-2">
                {datasets.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={`w-full text-left card-hard rounded-xl p-4 transition-all hover:border-forge-orange/50 ${
                      selected?.id === d.id ? 'border-forge-orange bg-forge-orange/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{d.name}</p>
                        <p className="text-xs text-forge-muted mt-0.5">
                          {d.rowCount} rows · {d._count?.trainings ?? 0} trainings
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-forge-muted shrink-0 mt-0.5" />
                    </div>
                    {d.description && (
                      <p className="text-xs text-forge-muted mt-1 truncate">{d.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right Panel: Dataset Editor ── */}
          {selected ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-display font-black text-white">{selected.name}</h2>
                {selected.description && <p className="text-forge-muted text-sm mt-1">{selected.description}</p>}
              </div>

              {/* CSV Import */}
              <div className="card-hard rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">Data Table</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCsvInput(v => !v)}
                      className="flex items-center gap-1.5 text-xs text-forge-muted hover:text-white border border-forge-border rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Upload size={12} />
                      Parse CSV
                    </button>
                    <button
                      onClick={addRow}
                      className="flex items-center gap-1.5 text-xs text-forge-orange hover:text-white border border-forge-orange/50 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Plus size={12} />
                      Add Row
                    </button>
                  </div>
                </div>

                {showCsvInput && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Paste CSV here (first line = headers)..."
                      value={csvText}
                      onChange={e => setCsvText(e.target.value)}
                      rows={5}
                      className="w-full bg-forge-black border border-forge-border rounded-lg px-3 py-2 text-xs text-white placeholder-forge-muted focus:outline-none focus:border-forge-orange font-mono resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleParseCsv} className="btn-orange text-xs px-3 py-1.5">
                        Parse CSV
                      </button>
                      <button onClick={() => setShowCsvInput(false)} className="text-xs text-forge-muted hover:text-white">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Table */}
                {tableRows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          {tableColumns.map(col => (
                            <th key={col} className="text-left text-forge-muted font-semibold py-2 pr-3 capitalize">
                              {col}
                            </th>
                          ))}
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-t border-forge-border/40">
                            {tableColumns.map(col => (
                              <td key={col} className="py-1.5 pr-3">
                                <input
                                  type="text"
                                  value={row[col] ?? ''}
                                  onChange={e => updateCell(rowIdx, col, e.target.value)}
                                  className="w-full bg-forge-black border border-forge-border/50 rounded px-2 py-1 text-white placeholder-forge-muted focus:outline-none focus:border-forge-orange"
                                />
                              </td>
                            ))}
                            <td className="py-1.5">
                              <button onClick={() => removeRow(rowIdx)} className="text-red-400 hover:text-red-300">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-forge-muted text-center py-4">
                    No rows yet. Add rows or paste CSV to get started.
                  </p>
                )}
              </div>

              {/* Train Button */}
              <button
                onClick={handleTrain}
                disabled={training || tableRows.length === 0}
                className="btn-orange w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                {training ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Generating prompt template...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Train Prompt
                  </>
                )}
              </button>

              {trainError && (
                <p className="text-sm text-red-400 text-center">{trainError}</p>
              )}

              {/* Generated Prompt */}
              {trainResult && (
                <div className="card-hard rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Generated Prompt Template</h3>
                    <button
                      onClick={handleTrain}
                      disabled={training}
                      className="flex items-center gap-1.5 text-xs text-forge-muted hover:text-white border border-forge-border rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <RefreshCw size={12} />
                      Regenerate
                    </button>
                  </div>

                  <pre className="bg-forge-black rounded-lg p-4 text-xs text-green-300 font-mono whitespace-pre-wrap leading-relaxed border border-forge-border overflow-x-auto">
                    {trainResult.generatedPrompt}
                  </pre>

                  {/* Variable chips */}
                  {trainResult.variables.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-forge-muted uppercase tracking-wider mb-2">Detected Variables</p>
                      <div className="flex flex-wrap gap-2">
                        {trainResult.variables.map(v => (
                          <span key={v.name} className="flex items-center gap-1 bg-forge-orange/10 border border-forge-orange/30 rounded-full px-3 py-1 text-xs text-forge-orange font-mono">
                            <Tag size={10} />
                            {`{{${v.name}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save to Library */}
                  <div className="flex items-center gap-3 pt-2 border-t border-forge-border">
                    {saveSuccess ? (
                      <span className="text-sm text-green-400 font-semibold">Saved to library as draft!</span>
                    ) : (
                      <button
                        onClick={handleSaveToLibrary}
                        disabled={saving}
                        className="btn-orange flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <BookOpen size={14} />
                            Save to Library
                          </>
                        )}
                      </button>
                    )}
                    <span className="text-xs text-forge-muted">Saves as a private draft prompt</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card-hard rounded-xl p-16 text-center text-forge-muted">
              <Database size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">Select a dataset from the left to edit and train</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
