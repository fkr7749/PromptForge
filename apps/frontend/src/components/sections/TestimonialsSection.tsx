'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    quote: "PromptForge completely changed how our team develops AI features. The version control for prompts alone saved us weeks of debugging. It's the GitHub we've been waiting for.",
    name: 'Sarah Chen',
    role: 'AI Product Lead',
    co: 'Synthia AI',
    color: '#FF6B2B',
    init: 'SC',
  },
  {
    quote: "Multi-model comparison is insane. Seeing Llama 4 and Kimi K2 side-by-side with cost breakdowns made choosing the right model trivial. We cut AI costs by 40% in two weeks.",
    name: 'Marcus Webb',
    role: 'Senior Engineer',
    co: 'DataStream',
    color: '#FFB800',
    init: 'MW',
  },
  {
    quote: "I've published 12 prompt packs and earned $2,400 last month. PromptForge turned my prompt engineering skills into a legitimate income stream. Absolutely wild.",
    name: 'Priya Nair',
    role: 'Freelance AI Consultant',
    co: 'Independent',
    color: '#0A0A0A',
    init: 'PN',
  },
]

export default function TestimonialsSection() {
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)

  const go = (d: number) => { setDir(d); setI(c => (c + d + testimonials.length) % testimonials.length) }
  const t = testimonials[i]!

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute left-0 right-0 top-0 h-px bg-forge-border" />

      {/* CSS ambient glow */}
      <div
        className="pointer-events-none absolute -left-20 bottom-10 hidden opacity-20 lg:block"
        style={{
          width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,184,0,0.4) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'floatB 10s ease-in-out infinite',
        }}
      />

      {/* Large background number */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none font-display font-black text-outline-light leading-none"
        style={{ fontSize: 'clamp(8rem, 20vw, 20rem)', letterSpacing: '-0.06em' }}
      >
        {String(i + 1).padStart(2, '0')}
      </div>

      <div className="container-forge relative z-10">
        <div className="mb-12">
          <div className="section-label mb-3">Social proof</div>
          <h2
            className="font-display font-black text-forge-ink"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
          >
            LOVED BY
            <br />
            <span className="text-gradient">12,000+</span> BUILDERS.
          </h2>
        </div>

        <div className="max-w-3xl">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={i}
              custom={dir}
              initial={{ opacity: 0, x: dir * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir * 50 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Quote */}
              <div className="card-hard p-8 mb-6">
                <div
                  className="mb-6 font-display text-3xl font-black text-forge-border leading-none"
                  style={{ fontSize: '4rem' }}
                >
                  "
                </div>
                <p className="font-heading text-xl font-medium text-forge-ink leading-relaxed md:text-2xl">
                  {t.quote}
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 font-black text-white"
                  style={{ backgroundColor: t.color, borderColor: t.color }}
                >
                  {t.init}
                </div>
                <div>
                  <div className="font-display font-black text-forge-ink">{t.name}</div>
                  <div className="text-sm text-forge-muted">{t.role} · {t.co}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-10 flex items-center gap-4">
            <button
              onClick={() => go(-1)}
              className="btn-ghost h-11 w-11 p-0 justify-center"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setDir(idx > i ? 1 : -1); setI(idx) }}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    idx === i ? 'w-10 bg-forge-orange' : 'w-2 bg-forge-border hover:bg-forge-ink'
                  )}
                  aria-label={`Testimonial ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => go(1)}
              className="btn-ghost h-11 w-11 p-0 justify-center"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-forge-border" />
    </section>
  )
}
