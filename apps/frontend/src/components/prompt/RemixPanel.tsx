'use client'

import { useState } from 'react'
import { X, Wand2, Copy, Check, Loader2 } from 'lucide-react'

interface RemixPanelProps {
  content: string
  onUse: (variant: string) => void
  onClose: () => void
}

type Style = 'precise' | 'few-shot' | 'react' | 'constrained'

const PRESETS: { label: string; style: Style; description: string }[] = [
  { label: 'Minimal', style: 'precise', description: 'Precise & concise' },
  { label: 'Aggressive', style: 'constrained', description: 'Strict constraints' },
  { label: 'Structured', style: 'react', description: 'ReAct format' },
  { label: 'Creative', style: 'few-shot', description: 'With examples' },
  { label: 'Expert', style: 'precise', description: 'Expert-level detail' },
]

interface Variant {
  id: string
  style: string
  label: string
  text: string
}

export default function RemixPanel({ content, onUse, onClose }: RemixPanelProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [customInstruction, setCustomInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const generateVariant = async (style: Style, label: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/playground/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, style }),
      })
      if (!res.ok) throw new Error('Failed to generate variant')
      const data = await res.json()
      const optimizedText: string = data.optimizedPrompt ?? content
      const variant: Variant = {
        id: `${style}-${Date.now()}`,
        style,
        label,
        text: optimizedText,
      }
      setVariants(prev => [variant, ...prev].slice(0, 6))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const generateCustom = async () => {
    if (!customInstruction.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/playground/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, style: 'precise' }),
      })
      if (!res.ok) throw new Error('Failed to generate variant')
      const data = await res.json()
      const optimizedText: string = data.optimizedPrompt ?? content
      const variant: Variant = {
        id: `custom-${Date.now()}`,
        style: 'custom',
        label: 'Custom',
        text: optimizedText,
      }
      setVariants(prev => [variant, ...prev].slice(0, 6))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-forge-orange" />
          <h2 className="font-display text-lg font-black uppercase tracking-wider text-forge-ink">
            Remix This Prompt
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-forge-muted hover:bg-forge-silver hover:text-forge-ink transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Style preset buttons */}
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-forge-muted">Choose a Style</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                setActivePreset(preset.label)
                generateVariant(preset.style, preset.label)
              }}
              disabled={loading}
              className={`flex flex-col items-start rounded-xl border-2 px-4 py-2.5 text-left transition-all disabled:opacity-50 ${
                activePreset === preset.label
                  ? 'border-forge-orange bg-orange-50 text-forge-orange'
                  : 'border-forge-border bg-white text-forge-muted hover:border-forge-orange hover:text-forge-orange'
              }`}
            >
              <span className="text-sm font-black">{preset.label}</span>
              <span className="text-[11px] opacity-70">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom remix input */}
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-forge-muted">Custom Remix</p>
        <div className="flex gap-2">
          <textarea
            value={customInstruction}
            onChange={e => setCustomInstruction(e.target.value)}
            placeholder="e.g. Make it more conversational and add markdown formatting..."
            rows={2}
            className="flex-1 resize-none rounded-xl border-2 border-forge-border bg-forge-silver px-3 py-2 text-sm text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
          />
          <button
            onClick={generateCustom}
            disabled={loading || !customInstruction.trim()}
            className="btn-orange self-stretch px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-forge-border bg-forge-silver py-8">
          <Loader2 className="h-6 w-6 animate-spin text-forge-orange" />
          <span className="text-sm font-bold text-forge-muted">Generating variations...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      {/* Variants grid */}
      {variants.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-wider text-forge-muted">Generated Variants</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {variants.map(variant => (
              <div
                key={variant.id}
                className="flex flex-col gap-3 rounded-2xl border-2 border-forge-border bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-forge-orange/10 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-forge-orange">
                    {variant.label}
                  </span>
                  <button
                    onClick={() => handleCopy(variant.id, variant.text)}
                    className="rounded-lg p-1.5 text-forge-muted hover:bg-forge-silver hover:text-forge-ink transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedId === variant.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <pre className="max-h-36 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-forge-muted">
                  {variant.text}
                </pre>
                <button
                  onClick={() => onUse(variant.text)}
                  className="btn-orange w-full justify-center py-2 text-sm"
                >
                  Use This
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && variants.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-forge-border py-10 text-center">
          <Wand2 className="mx-auto mb-2 h-8 w-8 text-forge-border" />
          <p className="text-sm font-bold text-forge-muted">
            Pick a style above or write a custom instruction to generate variations.
          </p>
        </div>
      )}
    </div>
  )
}
