'use client'

import { useMemo } from 'react'
import { diff_match_patch } from 'diff-match-patch'

interface DiffViewerProps {
  oldText: string
  newText: string
  oldLabel: string
  newLabel: string
}

export default function DiffViewer({ oldText, newText, oldLabel, newLabel }: DiffViewerProps) {
  const diffs = useMemo(() => {
    const dmp = new diff_match_patch()
    const d = dmp.diff_main(oldText, newText)
    dmp.diff_cleanupSemantic(d)
    return d
  }, [oldText, newText])

  const additions = diffs.filter(([op]) => op === 1).reduce((acc, [, text]) => acc + text.length, 0)
  const deletions = diffs.filter(([op]) => op === -1).reduce((acc, [, text]) => acc + text.length, 0)

  const renderDiff = (diffs: [number, string][], showOnly: 'old' | 'new') => (
    <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
      {diffs.map(([op, text], i) => {
        if (op === 0) return <span key={i} className="text-forge-ink">{text}</span>
        if (op === -1 && showOnly === 'old') return <span key={i} className="bg-red-100 text-red-700 rounded px-0.5">{text}</span>
        if (op === 1 && showOnly === 'new') return <span key={i} className="bg-green-100 text-green-700 rounded px-0.5">{text}</span>
        if (op === -1 && showOnly === 'new') return null
        if (op === 1 && showOnly === 'old') return null
        return null
      })}
    </pre>
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Stats bar */}
      <div className="flex items-center gap-4 rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-2 text-xs font-bold">
        <span className="text-green-600">+{additions} chars added</span>
        <span className="text-red-500">-{deletions} chars removed</span>
        <span className="text-forge-muted">Net: {additions - deletions > 0 ? '+' : ''}{additions - deletions}</span>
      </div>
      {/* Side-by-side diff */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 overflow-auto max-h-80">
          <div className="mb-2 text-xs font-black uppercase tracking-wider text-red-500">{oldLabel}</div>
          {renderDiff(diffs, 'old')}
        </div>
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 overflow-auto max-h-80">
          <div className="mb-2 text-xs font-black uppercase tracking-wider text-green-600">{newLabel}</div>
          {renderDiff(diffs, 'new')}
        </div>
      </div>
    </div>
  )
}
