'use client'

import { useMemo } from 'react'
import { generatePromptDNA } from '@/lib/prompt-dna'

interface PromptDNAProps {
  content: string
  category?: string
  size?: number  // pixel size to display at
  className?: string
  title?: string  // for tooltip
}

export default function PromptDNA({ content, category, size = 32, className = '', title }: PromptDNAProps) {
  const svg = useMemo(() => generatePromptDNA(content, category), [content, category])

  return (
    <div
      className={`shrink-0 rounded overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      title={title ?? 'Prompt DNA — unique fingerprint for this prompt'}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
