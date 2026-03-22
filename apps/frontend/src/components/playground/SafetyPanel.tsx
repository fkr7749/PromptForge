'use client'

import { motion } from 'framer-motion'
import { X, ShieldCheck, ShieldAlert, ShieldOff, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface SafetyPanelProps {
  result: {
    overallScore: number
    flags: Array<{ type: string; severity: 'low' | 'medium' | 'high'; detail: string }>
    piiDetected: boolean
    jailbreakRisk: string
    toxicityScore: number
    recommendation: 'safe' | 'review' | 'block'
    summary: string
  }
  onClose: () => void
}

const SEVERITY_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const color =
    score >= 70 ? '#16a34a' :
    score >= 40 ? '#ca8a04' :
    '#dc2626'
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg width="96" height="96" className="-rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span
        className="absolute font-display font-black text-xl"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}

function RecommendationBadge({ recommendation }: { recommendation: 'safe' | 'review' | 'block' }) {
  if (recommendation === 'safe') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-700">
        <ShieldCheck className="h-3.5 w-3.5" />
        Safe to Use
      </span>
    )
  }
  if (recommendation === 'review') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Review Recommended
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-700">
      <ShieldOff className="h-3.5 w-3.5" />
      Unsafe - Do Not Use
    </span>
  )
}

export default function SafetyPanel({ result, onClose }: SafetyPanelProps) {
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
          Safety Analysis
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-forge-muted hover:text-forge-ink transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Score + recommendation row */}
      <div className="flex items-center gap-4 mb-5">
        <ScoreCircle score={result.overallScore} />
        <div className="flex flex-col gap-2">
          <RecommendationBadge recommendation={result.recommendation} />
          <p className="text-xs text-forge-muted leading-relaxed max-w-xs">{result.summary}</p>
        </div>
      </div>

      {/* Flags */}
      <div className="mb-5">
        <p className="font-display text-xs font-black uppercase tracking-wider text-forge-muted mb-3">
          Flags
        </p>
        {result.flags.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            No safety concerns detected
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {result.flags.map((flag, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl border-2 border-forge-border bg-forge-silver/50 p-3"
              >
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_COLORS[flag.severity]}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="rounded-md bg-forge-silver border border-forge-border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-forge-ink">
                      {flag.type}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-forge-muted">
                      {flag.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-forge-muted">{flag.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indicators */}
      <div className="flex flex-col gap-3">
        <p className="font-display text-xs font-black uppercase tracking-wider text-forge-muted">
          Indicators
        </p>

        {/* PII */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-forge-muted font-semibold">
            {result.piiDetected ? (
              <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            )}
            {result.piiDetected ? 'PII Detected' : 'No PII'}
          </div>
          <span className={`font-black text-[11px] px-2 py-0.5 rounded-full ${
            result.piiDetected ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {result.piiDetected ? 'Yes' : 'None'}
          </span>
        </div>

        {/* Jailbreak */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-forge-muted font-semibold">
            <AlertTriangle className={`h-3.5 w-3.5 ${
              result.jailbreakRisk === 'none' || result.jailbreakRisk === 'low'
                ? 'text-green-500'
                : result.jailbreakRisk === 'medium'
                ? 'text-yellow-500'
                : 'text-red-500'
            }`} />
            Jailbreak Risk
          </div>
          <span className={`font-black text-[11px] px-2 py-0.5 rounded-full capitalize ${
            result.jailbreakRisk === 'none' || result.jailbreakRisk === 'low'
              ? 'bg-green-100 text-green-700'
              : result.jailbreakRisk === 'medium'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {result.jailbreakRisk}
          </span>
        </div>

        {/* Toxicity */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-forge-muted font-semibold">Toxicity Score</span>
            <span className="font-black text-forge-ink">{result.toxicityScore}/100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-forge-silver overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.toxicityScore}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                result.toxicityScore <= 30
                  ? 'bg-green-500'
                  : result.toxicityScore <= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
