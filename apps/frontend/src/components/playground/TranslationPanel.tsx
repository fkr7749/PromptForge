'use client'

import { useState } from 'react'
import { X, Copy, Check, Globe, Loader2 } from 'lucide-react'

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Dutch', 'Russian', 'Polish', 'Swedish',
  'Norwegian', 'Danish', 'Finnish', 'Czech', 'Slovak', 'Hungarian', 'Romanian', 'Bulgarian', 'Croatian', 'Serbian',
  'Greek', 'Turkish', 'Arabic', 'Hebrew', 'Persian', 'Hindi', 'Bengali', 'Urdu', 'Punjabi', 'Tamil',
  'Telugu', 'Kannada', 'Malayalam', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino', 'Swahili', 'Amharic',
  'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean', 'Mongolian', 'Tibetan',
  'Ukrainian', 'Belarusian', 'Kazakh', 'Azerbaijani',
]

const RTL_LANGUAGES = ['Arabic', 'Hebrew', 'Persian', 'Urdu']

interface Props {
  prompt: string
  onUseTranslation: (translated: string) => void
  onClose: () => void
}

// Also support legacy prop name used by playground page
interface PropsLegacy {
  originalContent: string
  onUseTranslation: (translated: string) => void
  onClose: () => void
}

export default function TranslationPanel(props: Props | PropsLegacy) {
  const originalContent = 'prompt' in props ? props.prompt : (props as PropsLegacy).originalContent

  const [targetLanguage, setTargetLanguage] = useState('Spanish')
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState('')
  const [detectedLang, setDetectedLang] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleDetect = async () => {
    if (!originalContent.trim()) return
    setDetecting(true)
    setError('')
    try {
      const res = await fetch('/api/playground/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: originalContent, targetLanguage: 'English' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDetectedLang(data.detectedLanguage ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Detection failed')
    }
    setDetecting(false)
  }

  const handleTranslate = async () => {
    if (!originalContent.trim()) return
    setTranslating(true)
    setError('')
    try {
      const res = await fetch('/api/playground/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: originalContent, targetLanguage }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTranslated(data.translatedContent ?? '')
      setDetectedLang(data.detectedLanguage ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Translation failed')
    }
    setTranslating(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isRTL = RTL_LANGUAGES.includes(targetLanguage)

  return (
    <div className="bg-white rounded-2xl border-2 border-forge-border p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-forge-orange" />
          <span className="font-display text-xs font-black uppercase tracking-wider text-forge-ink">
            Multilingual Studio
          </span>
        </div>
        <button
          onClick={props.onClose}
          className="rounded-lg p-1 text-forge-muted hover:bg-forge-silver hover:text-forge-ink transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Language selector + actions */}
      <div className="mb-3 flex flex-col gap-2">
        <select
          value={targetLanguage}
          onChange={e => setTargetLanguage(e.target.value)}
          className="w-full rounded-xl border-2 border-forge-border bg-forge-silver px-3 py-2 text-xs font-bold text-forge-ink focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
        >
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <div className="flex gap-2">
          {/* Detect Language button */}
          <button
            onClick={handleDetect}
            disabled={detecting || translating || !originalContent.trim()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-forge-border bg-white px-3 py-2 text-xs font-bold text-forge-muted hover:border-forge-ink hover:text-forge-ink disabled:opacity-40 transition-colors"
          >
            {detecting ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Detecting...</>
            ) : (
              'Detect Language'
            )}
          </button>

          {/* Translate button */}
          <button
            onClick={handleTranslate}
            disabled={translating || detecting || !originalContent.trim()}
            className="flex flex-1 items-center justify-center gap-1.5 btn-orange text-xs py-2 disabled:opacity-40"
          >
            {translating ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Translating...</>
            ) : (
              'Translate'
            )}
          </button>
        </div>
      </div>

      {/* Detected language badge */}
      {detectedLang && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-forge-border bg-forge-silver px-3 py-1 text-xs font-bold text-forge-muted">
            Detected: <span className="text-forge-ink">{detectedLang}</span>
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      {/* Result */}
      {translated && (
        <div className="mt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forge-muted">
              {targetLanguage}:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg border border-forge-border px-2 py-1 text-xs font-bold text-forge-muted hover:border-forge-ink hover:text-forge-ink transition-colors"
              >
                {copied ? (
                  <><Check className="h-3 w-3 text-green-500" /> Copied</>
                ) : (
                  <><Copy className="h-3 w-3" /> Copy</>
                )}
              </button>
              <button
                onClick={() => props.onUseTranslation(translated)}
                className="btn-orange text-xs px-3 py-1"
              >
                Use Translation
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={translated}
            dir={isRTL ? 'rtl' : 'ltr'}
            rows={7}
            className="w-full resize-none rounded-xl border-2 border-forge-border bg-forge-silver p-3 font-mono text-xs text-forge-ink outline-none"
          />
        </div>
      )}
    </div>
  )
}
