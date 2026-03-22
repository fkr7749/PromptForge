'use client'

import { useState } from 'react'
import { Copy, Check, Clock, Cpu, DollarSign, AlertTriangle, Loader2 } from 'lucide-react'
import type { ModelInfo } from '@/lib/models'

export interface ModelResult {
  model: string
  output?: string
  inputTokens?: number
  outputTokens?: number
  cost?: number
  latencyMs?: number
  success: boolean
  error?: string
  streaming?: boolean
}

interface Props {
  result: ModelResult
  modelInfo?: ModelInfo
}

function MetaPill({ icon: Icon, value, title }: {
  icon: React.FC<{ className?: string }>; value: string; title: string
}) {
  return (
    <div title={title} className="flex items-center gap-1 rounded-full border border-forge-border bg-white px-2.5 py-1 text-xs font-bold text-forge-muted">
      <Icon className="h-3 w-3" />
      {value}
    </div>
  )
}

export default function OutputPanel({ result, modelInfo }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!result.output) return
    await navigator.clipboard.writeText(result.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const totalTokens = (result.inputTokens ?? 0) + (result.outputTokens ?? 0)

  return (
    <div className="flex h-full flex-col rounded-2xl border-2 border-forge-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-forge-border bg-forge-silver px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: modelInfo?.color ?? '#FF6B2B', boxShadow: `0 0 6px ${modelInfo?.color ?? '#FF6B2B'}` }}
          />
          <span className="font-display text-sm font-black text-forge-ink">{modelInfo?.name ?? result.model}</span>
          {modelInfo?.badge && (
            <span className="rounded-full bg-forge-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {modelInfo.badge}
            </span>
          )}
        </div>
        <button
          onClick={copy}
          disabled={!result.output}
          className="flex items-center gap-1.5 rounded-lg border border-forge-border bg-white px-2.5 py-1.5 text-xs font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink disabled:opacity-40"
        >
          {copied ? <Check className="h-3 w-3 text-forge-green" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Output body */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {result.streaming && !result.output && (
          <div className="flex items-center gap-2 text-sm text-forge-muted">
            <Loader2 className="h-4 w-4 animate-spin text-forge-orange" />
            Generating...
          </div>
        )}

        {!result.success && result.error && (
          <div className="flex items-start gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{result.error}</span>
          </div>
        )}

        {result.output && (
          <pre className="font-mono text-sm text-forge-ink leading-relaxed whitespace-pre-wrap break-words">
            {result.output}
            {result.streaming && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-forge-orange" />
            )}
          </pre>
        )}

        {!result.output && !result.streaming && result.success && (
          <p className="text-sm text-forge-muted italic">No output returned.</p>
        )}
      </div>

      {/* Metadata footer */}
      {(result.latencyMs !== undefined || totalTokens > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-t-2 border-forge-border bg-forge-silver px-4 py-2.5">
          {result.latencyMs !== undefined && (
            <MetaPill icon={Clock} value={`${result.latencyMs}ms`} title="Latency" />
          )}
          {totalTokens > 0 && (
            <MetaPill icon={Cpu} value={`${totalTokens.toLocaleString()} tok`} title="Total tokens" />
          )}
          {result.inputTokens !== undefined && (
            <MetaPill icon={Cpu} value={`↑${result.inputTokens} ↓${result.outputTokens}`} title="Input / Output tokens" />
          )}
          {result.cost !== undefined && (
            <MetaPill
              icon={DollarSign}
              value={result.cost === 0 ? 'Free' : `$${result.cost.toFixed(6)}`}
              title="Estimated cost"
            />
          )}
        </div>
      )}
    </div>
  )
}
