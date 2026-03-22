'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FlaskConical, GitBranch, Search, BarChart3, Shield,
  Globe2, Layers, Award, Code2
} from 'lucide-react'
import SpotlightCard from '@/components/ui/SpotlightCard'

const features = [
  { icon: FlaskConical, title: 'AI Playground',     desc: 'Stream prompt results from 6 Groq-powered models simultaneously with token counting and cost tracking.',     color: '#FF6B2B', tag: '01', badge: null },
  { icon: Layers,       title: 'Prompt DNA',         desc: 'Every prompt has a unique fingerprint — explore fork trees and semantic clusters in a 3D genealogy graph.',  color: '#FF6B2B', tag: '02', badge: 'New' },
  { icon: Award,        title: 'Battle Arena',       desc: 'Vote on the best prompts head-to-head — real-time ELO-ranked tournaments with live leaderboards.',           color: '#E84040', tag: '03', badge: 'Hot' },
  { icon: BarChart3,    title: 'Analytics',          desc: 'Deep insights on how your prompts perform — execution trends, cost heatmaps and model comparison charts.',    color: '#00C27C', tag: '04', badge: null },
  { icon: GitBranch,    title: 'Version Control',   desc: 'Git-style versioning — diff viewer, rollback, changelogs. Every prompt iteration preserved forever.',         color: '#0A0A0A', tag: '05', badge: null },
  { icon: Search,       title: 'Semantic Search',   desc: 'Find prompts by meaning via pgvector embeddings. Typo-tolerance plus full-text via Meilisearch.',            color: '#FFB800', tag: '06', badge: null },
  { icon: Globe2,       title: 'Marketplace',        desc: 'Sell your best prompts to the community — set your price, track sales and earn from your expertise.',        color: '#7C3AED', tag: '07', badge: 'New' },
  { icon: Code2,        title: 'Prompt Chains',      desc: 'Coming soon: chain prompts into multi-step workflows and automate complex AI pipelines end-to-end.',         color: '#0A0A0A', tag: '08', badge: 'Soon' },
  { icon: Shield,       title: 'Safety Scanner',     desc: 'AI-powered jailbreak and PII detection — real-time toxicity analysis keeps your prompts production-safe.',   color: '#FFB800', tag: '09', badge: null },
]

function FeatureCard({ f, i }: { f: typeof features[0]; i: number }) {
  const Icon = f.icon
  const cardRef = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 10
    const y = -((e.clientY - r.top)  / r.height - 0.5) * 10
    el.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`
  }

  const onLeave = () => {
    const el = cardRef.current
    if (el) el.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0)'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <SpotlightCard
        spotlightColor={`${f.color}18`}
        spotlightSize={300}
        className="card-hard group cursor-pointer"
      >
        <div
          ref={cardRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="flex flex-col gap-4 p-6"
          style={{ transition: 'transform 0.18s ease' }}
          data-cursor
        >
          {/* Tag + Badge */}
          <div className="absolute right-5 top-5 flex items-center gap-2">
            {f.badge && (
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  f.badge === 'Hot'  ? 'bg-red-100 text-red-600' :
                  f.badge === 'Soon' ? 'bg-gray-100 text-gray-500' :
                  'bg-orange-100 text-forge-orange'
                }`}
              >
                {f.badge}
              </span>
            )}
            <span className="font-display text-xs font-black text-forge-border">{f.tag}</span>
          </div>

          {/* Icon */}
          <div
            className="icon-box"
            style={{ color: f.color }}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
          </div>

          <div>
            <h3 className="mb-1.5 font-display text-lg font-black text-forge-ink leading-tight">
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed text-forge-muted">
              {f.desc}
            </p>
          </div>

          {/* Bottom accent line */}
          <div
            className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full"
            style={{ backgroundColor: f.color }}
          />
        </div>
      </SpotlightCard>
    </motion.div>
  )
}

export default function FeaturesSection() {
  return (
    <section id="features" className="section-padding relative">
      <div className="absolute left-0 right-0 top-0 h-px bg-forge-border" />

      <div className="container-forge">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="section-label mb-3">Everything you need</div>
            <h2
              className="font-display font-black text-forge-ink"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
            >
              BUILT FOR
              <br />
              <span className="text-gradient">SERIOUS</span>
              <br />
              ENGINEERS.
            </h2>
          </div>
          <div className="flex items-end gap-6">
            {/* CSS glow orb — replaces WebGL canvas for performance */}
            <div
              className="hidden md:block w-28 h-28 lg:w-36 lg:h-36 shrink-0 pointer-events-none"
              style={{
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,107,43,0.5) 0%, rgba(255,107,43,0.1) 50%, transparent 70%)',
                filter: 'blur(8px)',
                animation: 'floatA 7s ease-in-out infinite',
                boxShadow: '0 0 60px rgba(255,107,43,0.3)',
              }}
            />
            <p className="max-w-xs text-base text-forge-muted leading-relaxed md:text-right">
              From first idea to production-grade prompt
              pipelines — every tool you need in one place.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-forge-border" />
    </section>
  )
}
