'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { gsap } from '@/lib/gsap'
import { ArrowUpRight, Play, TrendingUp, Users, Zap, GitBranch } from 'lucide-react'

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => null,
})

const models = ['Llama 4 Scout', 'Kimi K2', 'GPT OSS 120B', 'Llama 3.3 70B', 'GPT OSS 20B', 'Llama 3.1 8B']

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const wordsRef   = useRef<HTMLSpanElement>(null)
  const wordIdx    = useRef(0)

  // Rotate model names
  useEffect(() => {
    const el = wordsRef.current
    if (!el) return
    const id = setInterval(() => {
      gsap.to(el, {
        y: -20, opacity: 0, duration: 0.22, ease: 'power2.in',
        onComplete: () => {
          wordIdx.current = (wordIdx.current + 1) % models.length
          el.textContent = models[wordIdx.current]!
          gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'expo.out' })
        },
      })
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // Stagger entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-line',
        { y: 100, opacity: 0, skewY: 3 },
        { y: 0, opacity: 1, skewY: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out', delay: 0.4 }
      )
      gsap.fromTo('.hero-sub',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', delay: 1.0 }
      )
      gsap.fromTo('.hero-cta',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'expo.out', delay: 1.2 }
      )
      gsap.fromTo('.hero-stat',
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.08, duration: 0.6, ease: 'back.out(1.4)', delay: 1.5 }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-forge-black"
    >
      {/* ── 3D Scene — fills entire hero ── */}
      <div className="absolute inset-0 z-0">
        <HeroScene />
      </div>

      {/* ── Left dark vignette for text readability ── */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-gradient-to-r from-forge-black/90 via-forge-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-forge-black/60 via-transparent to-forge-black/20" />
      </div>

      {/* ── Background watermark ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] select-none overflow-hidden leading-none"
      >
        <span
          className="block font-display font-black"
          style={{
            fontSize: 'clamp(5rem, 16vw, 15rem)',
            letterSpacing: '-0.06em',
            lineHeight: 0.85,
            WebkitTextStroke: '1px rgba(255,255,255,0.04)',
            color: 'transparent',
          }}
        >
          PROMPTFORGE
        </span>
      </div>

      {/* ── Content ── */}
      <div className="container-forge relative z-10 flex min-h-screen flex-col justify-center pb-12 pt-28">
        <div className="max-w-[680px]">

          {/* Step indicator */}
          <div className="hero-line mb-6 flex items-center gap-3 opacity-0">
            <span className="font-mono text-xs font-bold tracking-[0.15em] text-white/40">[01 / 06]</span>
            <div className="h-px w-8 bg-forge-orange" />
            <span className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-forge-orange">
              AI Prompt Platform
            </span>
          </div>

          {/* Massive headline */}
          <div className="overflow-hidden">
            <h1
              className="hero-line font-display font-black leading-none text-white opacity-0"
              style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)', letterSpacing: '-0.04em', lineHeight: 0.9 }}
            >
              CRAFT AI
            </h1>
          </div>
          <div className="overflow-hidden">
            <h1
              className="hero-line font-display font-black leading-none text-gradient opacity-0"
              style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)', letterSpacing: '-0.04em', lineHeight: 0.9 }}
            >
              PROMPTS
            </h1>
          </div>
          <div className="overflow-hidden mb-8">
            <h1
              className="hero-line font-display font-black leading-none text-white opacity-0"
              style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)', letterSpacing: '-0.04em', lineHeight: 0.9 }}
            >
              THAT WORK.
            </h1>
          </div>

          {/* Subtitle */}
          <p className="hero-sub mb-2 max-w-lg text-base font-medium text-white/60 opacity-0 leading-relaxed md:text-lg">
            Test, version, and share prompts across{' '}
            <span
              className="inline-block overflow-hidden font-bold text-forge-orange"
              style={{ verticalAlign: 'bottom', height: '1.4em' }}
            >
              <span ref={wordsRef} className="inline-block">{models[0]}</span>
            </span>
            {' '}and more.
          </p>
          <p className="hero-sub mb-10 text-sm text-white/35 opacity-0">
            GitHub meets Postman meets Figma — for the age of AI.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="hero-cta btn-orange opacity-0"
            >
              Start Building Free
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/playground"
              className="hero-cta opacity-0 inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-7 py-[0.875rem] text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
            >
              <Play className="h-3.5 w-3.5" fill="currentColor" />
              Try Playground
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 flex flex-wrap gap-5">
            {[
              { icon: Users,     value: '12K+', label: 'Builders'  },
              { icon: Zap,       value: '50K+', label: 'Prompts'   },
              { icon: GitBranch, value: '6',    label: 'AI Models' },
              { icon: TrendingUp,value: 'Free', label: 'To start'  },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="hero-stat flex items-center gap-2.5 opacity-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
                  <Icon className="h-4 w-4 text-forge-orange" />
                </div>
                <div>
                  <div className="font-display text-base font-black leading-none text-white">{value}</div>
                  <div className="text-xs text-white/40">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Floating stat cards (large screens) ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-6 top-32 hidden xl:block"
        >
          <div
            className="w-52 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
            style={{ boxShadow: '0 0 40px rgba(255,107,43,0.15)' }}
          >
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-forge-orange" />
              <span className="text-xs font-bold uppercase tracking-wider text-forge-orange">Performance</span>
            </div>
            <div className="font-display text-5xl font-black text-white leading-none">98%</div>
            <div className="mt-1 text-xs text-white/40">prompt success rate</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 2.0, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-28 right-6 hidden xl:block"
        >
          <div
            className="w-48 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
            style={{ boxShadow: '0 0 30px rgba(255,107,43,0.1)' }}
          >
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-forge-orange">Live Models</div>
            <div className="space-y-2">
              {['Llama 4 Scout', 'Kimi K2', 'GPT OSS 120B'].map(m => (
                <div key={m} className="flex items-center gap-2">
                  <div
                    className="h-1.5 w-1.5 rounded-full bg-forge-green"
                    style={{ boxShadow: '0 0 6px #00C27C' }}
                  />
                  <span className="text-xs font-medium text-white/70">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/30">Scroll</span>
          <div className="h-9 w-5 rounded-full border border-white/20 p-1">
            <motion.div
              className="h-2 w-2 rounded-full bg-forge-orange"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
