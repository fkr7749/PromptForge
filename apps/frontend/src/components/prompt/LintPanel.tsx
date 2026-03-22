'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, Info, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface LintIssue {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  suggestion?: string
}

interface LintResult {
  issues: LintIssue[]
  score: number
}

interface LintPanelProps {
  content: string
  variables?: Array<{ name: string }>
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score > 80
      ? 'text-green-400 border-green-500'
      : score >= 50
      ? 'text-amber-400 border-amber-500'
      : 'text-red-400 border-red-500'
  const bgColor =
    score > 80
      ? 'bg-green-900/30'
      : score >= 50
      ? 'bg-amber-900/30'
      : 'bg-red-900/30'

  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm ${color} ${bgColor}`}
    >
      {score}
    </span>
  )
}

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-900/20 border-red-800/40',
    label: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-900/20 border-amber-800/40',
    label: 'Warning',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-900/20 border-blue-800/40',
    label: 'Info',
  },
}

function IssueRow({ issue }: { issue: LintIssue }) {
  const cfg = SEVERITY_CONFIG[issue.severity]
  const Icon = cfg.icon
  return (
    <div className={`rounded-lg border p-3 ${cfg.bg}`}>
      <div className="flex items-start gap-2">
        <Icon size={15} className={`shrink-0 mt-0.5 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
            <span className="text-xs text-gray-500 font-mono">{issue.code}</span>
          </div>
          <p className="text-sm text-gray-200 mt-0.5">{issue.message}</p>
          {issue.suggestion && (
            <p className="text-xs text-gray-400 mt-1 italic">{issue.suggestion}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LintPanel({ content, variables = [] }: LintPanelProps) {
  const [result, setResult] = useState<LintResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!content.trim()) {
      setResult(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/prompts/lint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, variables }),
        })
        if (res.ok) {
          const data: LintResult = await res.json()
          setResult(data)
        }
      } catch {
        // Silently ignore lint errors — non-critical
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [content, JSON.stringify(variables)])

  const issueCount = result?.issues.length ?? 0
  const errorCount = result?.issues.filter(i => i.severity === 'error').length ?? 0
  const warnCount = result?.issues.filter(i => i.severity === 'warning').length ?? 0

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/60 overflow-hidden">
      {/* Panel Toggle Button */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors text-left"
      >
        {/* Score badge or loading indicator */}
        <div className="shrink-0">
          {loading ? (
            <div className="w-10 h-10 rounded-full border-2 border-gray-600 bg-gray-800 animate-pulse" />
          ) : result ? (
            <ScoreBadge score={result.score} />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-gray-700 bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
              --
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="text-sm font-medium text-gray-200">Prompt Linter</div>
          {result && (
            <div className="flex items-center gap-2 mt-0.5">
              {issueCount === 0 ? (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle size={11} /> All clear
                </span>
              ) : (
                <>
                  {errorCount > 0 && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={11} /> {errorCount} error{errorCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {warnCount > 0 && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={11} /> {warnCount} warning{warnCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {issueCount - errorCount - warnCount > 0 && (
                    <span className="text-xs text-blue-400 flex items-center gap-1">
                      <Info size={11} /> {issueCount - errorCount - warnCount} info
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Issue count badge */}
        {issueCount > 0 && (
          <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B2B] text-white text-xs font-bold">
            {issueCount}
          </span>
        )}

        {expanded ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-700 p-4">
          {loading && !result ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : result ? (
            result.issues.length === 0 ? (
              <div className="flex items-center gap-2 text-green-400 py-2">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">No issues found. Prompt looks great!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {result.issues.map((issue, i) => (
                  <IssueRow key={i} issue={issue} />
                ))}
              </div>
            )
          ) : (
            <p className="text-sm text-gray-500">Start typing to lint your prompt.</p>
          )}
        </div>
      )}
    </div>
  )
}
