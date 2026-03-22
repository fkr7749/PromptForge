'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

const ParticleBackground = dynamic(() => import('@/components/3d/ParticleBackground'), {
  ssr: false,
  loading: () => null,
})

export default function CTASection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute left-0 right-0 top-0 h-px bg-forge-border" />

      <div className="container-forge">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border-2 border-forge-black bg-forge-black p-12 md:p-20"
        >
          {/* WebGL particle background */}
          <div className="absolute inset-0 z-0 opacity-70">
            <ParticleBackground className="absolute inset-0" />
          </div>

          {/* CSS ambient glow top-left */}
          <div
            className="pointer-events-none absolute -left-16 -top-16 z-[1] opacity-25"
            style={{
              width: 320, height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,107,43,0.7) 0%, transparent 65%)',
              filter: 'blur(50px)',
            }}
          />

          {/* Background giant text */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] select-none overflow-hidden"
          >
            <span
              className="block font-display font-black leading-none"
              style={{
                fontSize: 'clamp(4rem, 12vw, 11rem)',
                letterSpacing: '-0.06em',
                WebkitTextStroke: '1.5px rgba(255,255,255,0.07)',
                color: 'transparent',
              }}
            >
              PROMPTFORGE
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-forge-green" style={{ boxShadow: '0 0 8px #00C27C' }} />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                12,000+ builders already forging
              </span>
            </div>

            <h2
              className="mx-auto mb-4 max-w-3xl font-display font-black text-white"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)', lineHeight: 0.95, letterSpacing: '-0.04em' }}
            >
              START FORGING
              <br />
              <span className="text-gradient">YOUR BEST PROMPTS</span>
              <br />
              TODAY.
            </h2>
            <p className="mx-auto mb-10 max-w-md text-base text-white/60">
              Free forever tier. No credit card. Upgrade when you&apos;re ready.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register" className="btn-orange text-base px-8 py-4">
                Get Started — It&apos;s Free
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/playground"
                className="flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-black text-white backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/15"
              >
                Try Playground
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
