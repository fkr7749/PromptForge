'use client'

import { useState } from 'react'
import { Share2, Check, Twitter, Copy } from 'lucide-react'

interface ShareButtonProps {
  promptId: string
  title: string
  upvotes: number
  forks: number
  runs: number
}

export default function ShareButton({ promptId, title, upvotes, forks, runs }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined' ? `${window.location.origin}/prompt/${promptId}` : ''
  const tweetText = `Just found "${title}" on PromptForge \u2014 ${upvotes} upvotes, ${forks} forks, ${runs} runs. \uD83D\uDD25\n\n${url}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for browsers without clipboard API
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-xl border-2 border-forge-border bg-white px-3 py-2 text-sm font-bold text-forge-muted hover:border-forge-ink hover:text-forge-ink transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-2xl border-2 border-forge-border bg-white shadow-[4px_4px_0_#0A0A0A] overflow-hidden">
            <button
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank')
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-forge-ink hover:bg-forge-silver transition-colors"
            >
              <Twitter className="h-4 w-4 text-[#1DA1F2]" /> Share on X/Twitter
            </button>
            <div className="h-px bg-forge-border" />
            <button
              onClick={copyLink}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-forge-ink hover:bg-forge-silver transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
