'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Tag } from 'lucide-react'

interface TrendingTag {
  name: string
  slug: string
  totalCount: number
  recentCount: number
}

interface TrendingTagsProps {
  onTagClick: (tag: string) => void
  activeTag?: string
}

export default function TrendingTags({ onTagClick, activeTag }: TrendingTagsProps) {
  const [tags, setTags] = useState<TrendingTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tags/trending')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTags(Array.isArray(data) ? data : []))
      .catch(() => setTags([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="rounded-2xl border-2 border-forge-border bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-forge-orange" />
        <span className="font-display text-xs font-black uppercase tracking-wider text-forge-ink">Trending Tags</span>
        <span className="ml-auto rounded-full bg-forge-silver px-2 py-0.5 text-[10px] font-bold text-forge-muted">7 days</span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-forge-silver" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tags.map((tag, i) => (
            <button
              key={tag.slug}
              onClick={() => onTagClick(tag.name)}
              className={`group flex items-center justify-between rounded-xl px-3 py-2 text-left transition-all hover:bg-forge-silver ${
                activeTag === tag.name ? 'bg-forge-orange/10 border border-forge-orange/30' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-[10px] font-black text-forge-muted">{i + 1}</span>
                <Tag className="h-3 w-3 text-forge-muted" />
                <span className={`text-sm font-bold ${activeTag === tag.name ? 'text-forge-orange' : 'text-forge-ink group-hover:text-forge-orange'} transition-colors`}>
                  {tag.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {tag.recentCount > 0 && (
                  <span className="rounded-full bg-forge-orange/15 px-2 py-0.5 text-[10px] font-black text-forge-orange">
                    +{tag.recentCount}
                  </span>
                )}
                <span className="text-[10px] text-forge-muted">{tag.totalCount}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
