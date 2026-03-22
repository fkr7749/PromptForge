'use client'

import { Variable } from 'lucide-react'

interface Props {
  variables: string[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
}

export default function VariableBadge({ variables, values, onChange }: Props) {
  if (!variables.length) return null

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700">
        <Variable className="h-3.5 w-3.5" />
        Variables detected
      </div>
      <div className="flex flex-wrap gap-2">
        {variables.map((v) => (
          <div key={v} className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white overflow-hidden">
            <span className="border-r border-amber-300 bg-amber-100 px-2 py-1 font-mono text-xs font-bold text-amber-800">
              {`{{${v}}}`}
            </span>
            <input
              type="text"
              placeholder={`value`}
              value={values[v] ?? ''}
              onChange={(e) => onChange(v, e.target.value)}
              className="w-24 bg-transparent px-2 py-1 text-xs text-forge-ink outline-none placeholder:text-amber-400"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
