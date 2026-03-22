'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface OptimizerPanelProps {
  result: {
    optimizedPrompt: string
    changes: Array<{ original: string; improved: string; reason: string }>
    scores: {
      original: { clarity: number; specificity: number; context: number; examples: number; outputFormat: number }
      optimized: { clarity: number; specificity: number; context: number; examples: number; outputFormat: number }
    }
    summary: string
  }
  onApply: (optimizedPrompt: string) => void
  onClose: () => void
}

const CRITERIA: Array<{ key: keyof OptimizerPanelProps['result']['scores']['original']; label: string }> = [
  { key: 'clarity', label: 'Clarity' },
  { key: 'specificity', label: 'Specificity' },
  { key: 'context', label: 'Context' },
  { key: 'examples', label: 'Examples' },
  { key: 'outputFormat', label: 'Output Format' },
]

export default function OptimizerPanel({ result, onApply, onClose }: OptimizerPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border-2 border-forge-border p-6 mt-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h2 className="font-display font-black text-sm uppercase tracking-wider text-forge-ink">
          AI Optimization Results
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-forge-muted hover:text-forge-ink transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Summary */}
      <p className="text-xs italic text-forge-muted mb-5 leading-relaxed">{result.summary}</p>

      {/* Score Comparison */}
      <div className="mb-5">
        <p className="font-display text-xs font-black uppercase tracking-wider text-forge-muted mb-3">
          Score Comparison
        </p>
        <div className="flex flex-col gap-3">
          {CRITERIA.map(({ key, label }) => {
            const origScore = result.scores.original[key]
            const optScore = result.scores.optimized[key]
            return (
              <div key={key}>
                <p className="text-[11px] font-bold text-forge-muted mb-1">{label}</p>
                <div className="flex flex-col gap-1">
                  {/* Original bar */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-forge-muted shrink-0">Original</span>
                    <div className="flex-1 h-3 bg-forge-silver rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${origScore * 10}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gray-400 rounded-full"
                      />
                    </div>
                    <span className="w-5 text-[10px] font-black text-forge-ink text-right shrink-0">
                      {origScore}
                    </span>
                  </div>
                  {/* Optimized bar */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-forge-orange shrink-0">Optimized</span>
                    <div className="flex-1 h-3 bg-forge-silver rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${optScore * 10}%` }}
                        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                        className="h-full bg-forge-orange rounded-full"
                      />
                    </div>
                    <span className="w-5 text-[10px] font-black text-forge-orange text-right shrink-0">
                      {optScore}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Changes */}
      {result.changes.length > 0 && (
        <div className="mb-5">
          <p className="font-display text-xs font-black uppercase tracking-wider text-forge-muted mb-3">
            Changes Made
          </p>
          <div className="flex flex-col gap-2">
            {result.changes.map((change, i) => (
              <div
                key={i}
                className="rounded-xl border-2 border-forge-border bg-forge-silver/50 p-3"
              >
                <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] text-gray-400 line-through break-all">{change.original}</span>
                  <span className="text-[11px] text-forge-muted shrink-0">→</span>
                  <span className="text-[11px] text-green-600 font-semibold break-all">{change.improved}</span>
                </div>
                <p className="text-[10px] text-forge-muted">{change.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply button */}
      <button
        onClick={() => onApply(result.optimizedPrompt)}
        className="btn-orange w-full justify-center text-xs py-2.5"
      >
        Apply Optimized Prompt
      </button>
    </motion.div>
  )
}
