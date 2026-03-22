'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { PenTool, Zap, Share2, TrendingUp, ArrowRight } from 'lucide-react'

const steps = [
  {
    num: '01',
    icon: PenTool,
    title: 'Craft Your Prompt',
    desc: 'Rich editor with variable injection `{{syntax}}`, live token counting, syntax highlighting, and template library to start from.',
    detail: 'Start from 500+ community templates or blank slate. Supports system prompts, multi-turn, and RAG-augmented context.',
    color: '#FF6B2B',
  },
  {
    num: '02',
    icon: Zap,
    title: 'Test Across Models',
    desc: 'Execute against Llama 4, Kimi K2, GPT OSS 120B, and more simultaneously via Groq\'s ultra-fast inference.',
    detail: 'Real-time streaming output. Compare latency, token usage, cost, and quality side-by-side in a 4-panel grid.',
    color: '#FFB800',
  },
  {
    num: '03',
    icon: Share2,
    title: 'Share & Collaborate',
    desc: 'Publish to the community, fork others\' prompts, and build on shoulders of giants. Version every change like code.',
    detail: 'Comments, upvotes, collections, and following. Team workspaces with private registries.',
    color: '#0A0A0A',
  },
  {
    num: '04',
    icon: TrendingUp,
    title: 'Monetize',
    desc: 'List your best prompts on the marketplace. Set your price, earn revenue, track analytics per listing.',
    detail: 'Stripe-powered payments. Revenue dashboard. Creator leaderboard. Prompt subscription bundles.',
    color: '#FF6B2B',
  },
]

export default function HowItWorksSection() {
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!lineRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(lineRef.current,
        { scaleY: 0, transformOrigin: 'top' },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: lineRef.current,
            start: 'top 60%',
            end: 'bottom 40%',
            scrub: 1,
          },
        }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <section id="how-it-works" className="section-padding relative overflow-hidden">
      <div className="absolute left-0 right-0 top-0 h-px bg-forge-border" />

      {/* CSS ambient glow */}
      <div
        className="pointer-events-none absolute -right-20 top-1/3 hidden opacity-20 lg:block"
        style={{
          width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,43,0.4) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'floatA 9s ease-in-out infinite',
        }}
      />

      <div className="container-forge">
        {/* Header */}
        <div className="mb-16">
          <div className="section-label mb-3">Process</div>
          <h2
            className="font-display font-black text-forge-ink"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
          >
            FROM IDEA
            <br />
            TO <span className="text-gradient">PRODUCTION</span>
            <br />
            IN FOUR STEPS.
          </h2>
        </div>

        {/* Steps — large editorial cards */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div
            ref={lineRef}
            className="absolute left-0 top-0 hidden h-full w-0.5 bg-forge-orange lg:block"
            style={{ transformOrigin: 'top' }}
          />

          <div className="flex flex-col gap-0">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative border-b-2 border-forge-border lg:pl-16"
                  style={{ borderBottomColor: i === steps.length - 1 ? 'transparent' : undefined }}
                >
                  {/* Circle on timeline (desktop) */}
                  <div
                    className="absolute -left-[9px] top-10 hidden h-4.5 w-4.5 rounded-full border-2 border-forge-orange bg-forge-silver lg:block transition-all duration-300 group-hover:bg-forge-orange"
                    style={{ borderColor: step.color }}
                  />

                  <div className="grid gap-6 py-12 md:grid-cols-2 md:gap-12">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="font-display text-5xl font-black text-forge-border leading-none">
                          {step.num}
                        </span>
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl border-2"
                          style={{ borderColor: step.color, color: step.color }}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </div>
                      </div>
                      <h3
                        className="font-display font-black text-forge-ink mb-3"
                        style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', letterSpacing: '-0.02em' }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-base text-forge-muted leading-relaxed">
                        {step.desc}
                      </p>
                    </div>

                    {/* Visual card */}
                    <div className="card-hard-orange rounded-2xl p-6 flex flex-col justify-between">
                      <div
                        className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                        style={{ background: `${step.color}15`, color: step.color }}
                      >
                        <Icon className="h-3 w-3" />
                        Step {step.num}
                      </div>
                      <p className="text-sm text-forge-muted leading-relaxed mb-4">
                        {step.detail}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-bold text-forge-orange">
                        Learn more <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-forge-border" />
    </section>
  )
}
