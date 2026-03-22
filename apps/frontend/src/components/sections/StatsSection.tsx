'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

interface RealStats {
  prompts: number
  builders: number
  executions: number
  tags: number
}

const FALLBACK_STATS = [
  { value: 50000, suffix: '+', label: 'Prompts Created',  desc: 'across all categories' },
  { value: 12000, suffix: '+', label: 'Active Builders',  desc: 'on the platform'        },
  { value: 6,     suffix: '',  label: 'AI Models',        desc: 'via Groq inference'     },
  { value: 99.9,  suffix: '%', label: 'Uptime',           desc: 'over last 12 months'    },
]

export default function StatsSection() {
  const [realStats, setRealStats] = useState<RealStats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then((data: RealStats) => setRealStats(data))
      .catch(() => {/* use fallback */})
  }, [])

  // Build stat blocks — use real data when available, fallback otherwise
  const stats = realStats
    ? [
        { value: realStats.prompts,   suffix: '+', label: 'Prompts Created',  desc: 'publicly shared'    },
        { value: realStats.builders,  suffix: '+', label: 'Active Builders',  desc: 'on the platform'    },
        { value: realStats.executions,suffix: '+', label: 'Prompt Runs',      desc: 'and counting'       },
        { value: realStats.tags,      suffix: '+', label: 'Topic Tags',       desc: 'across categories'  },
      ]
    : FALLBACK_STATS

  return (
    <section className="relative overflow-hidden py-0">
      {/* Marquee ticker */}
      <div className="border-y-2 border-forge-black bg-forge-black py-3 overflow-hidden">
        <div className="marquee-track flex items-center gap-8">
          {[...Array(4)].flatMap(() =>
            ['Craft Prompts', '→', 'Test Across 6 Models', '→', 'Version Like Code', '→',
             'Share With The World', '→', 'Earn From Your Expertise', '→', 'Powered by Groq', '→']
          ).map((item, i) => (
            <span
              key={i}
              className={
                item === '→'
                  ? 'text-forge-orange font-black text-lg flex-shrink-0'
                  : 'font-display text-sm font-black uppercase tracking-widest text-white whitespace-nowrap flex-shrink-0'
              }
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="container-forge py-14 md:py-18">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x-2 divide-forge-border">
          {stats.map((s, i) => (
            <StatBlock key={s.label} stat={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatBlock({ stat, index }: { stat: typeof FALLBACK_STATS[0]; index: number }) {
  const numRef = useRef<HTMLSpanElement>(null)
  const done   = useRef(false)

  useEffect(() => {
    // Reset when value changes (real data loaded)
    done.current = false
    const el = numRef.current
    if (!el) return
    el.textContent = '0'
  }, [stat.value])

  useEffect(() => {
    const el = numRef.current
    if (!el) return
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        if (done.current) return
        done.current = true
        gsap.fromTo({ val: 0 }, { val: stat.value }, {
          duration: 2,
          delay: index * 0.08,
          ease: 'power2.out',
          onUpdate: function () {
            const o = this.targets()[0] as { val: number }
            el.textContent = stat.value % 1 !== 0
              ? o.val.toFixed(1)
              : Math.round(o.val).toLocaleString()
          },
        })
      },
    })
    return () => trigger.kill()
  }, [stat.value, index])

  return (
    <div className="px-6 py-10 md:px-10 md:py-12 min-w-0">
      {/* Number */}
      <div className="flex items-baseline gap-0.5 mb-2 min-w-0 overflow-hidden">
        <span
          className="font-display font-black text-forge-ink leading-none block truncate"
          style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.8rem)', letterSpacing: '-0.04em' }}
        >
          <span ref={numRef}>0</span>{stat.suffix}
        </span>
      </div>
      <div className="font-display text-xs font-black uppercase tracking-wider text-forge-ink mb-0.5 md:text-sm">
        {stat.label}
      </div>
      <div className="text-xs text-forge-muted mt-0.5 hidden sm:block">{stat.desc}</div>
    </div>
  )
}
