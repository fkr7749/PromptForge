'use client'

import { Check } from 'lucide-react'
import type { ModelInfo } from '@/lib/models'

interface Props {
  model: ModelInfo
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}

const BADGE_COLORS: Record<string, string> = {
  Recommended: 'bg-orange-100 text-orange-700',
  Latest:      'bg-amber-100 text-amber-700',
  Fast:        'bg-emerald-100 text-emerald-700',
  Powerful:    'bg-purple-100 text-purple-700',
  Efficient:   'bg-sky-100 text-sky-700',
  Lightning:   'bg-red-100 text-red-700',
}

export default function ModelCard({ model, selected, onToggle, disabled }: Props) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`group relative w-full rounded-xl border-2 p-3 text-left transition-all duration-200
        ${selected
          ? 'border-forge-orange bg-orange-50 shadow-[3px_3px_0_#FF6B2B]'
          : 'border-forge-border bg-white hover:border-forge-ink hover:shadow-[2px_2px_0_#0A0A0A]'}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
    >
      {/* Checkmark */}
      <div className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all
        ${selected ? 'border-forge-orange bg-forge-orange' : 'border-forge-border bg-white'}`}
      >
        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </div>

      <div className="pr-6">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-display text-sm font-black text-forge-ink leading-tight">{model.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_COLORS[model.badge] ?? 'bg-gray-100 text-gray-600'}`}>
            {model.badge}
          </span>
        </div>
        <p className="text-[11px] text-forge-muted">{model.provider}</p>
        <p className="mt-1 text-[11px] text-forge-muted leading-snug hidden group-hover:block">
          {model.description}
        </p>
        <p className="mt-1 text-[11px] font-bold text-forge-muted">
          {(model.contextWindow / 1000).toFixed(0)}K ctx
        </p>
      </div>
    </button>
  )
}
