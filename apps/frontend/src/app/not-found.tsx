'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Zap } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />
      <div className="container-forge flex min-h-[80vh] flex-col items-center justify-center text-center">
        {/* Giant 404 number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8"
        >
          <div
            className="font-display font-black select-none"
            style={{
              fontSize: 'clamp(8rem, 20vw, 18rem)',
              lineHeight: 1,
              letterSpacing: '-0.05em',
              WebkitTextStroke: '2px #FF6B2B',
              color: 'transparent',
            }}
          >
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-forge-orange animate-pulse" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-label mb-3">Page not found</div>
          <h1 className="mb-4 font-display text-4xl font-black text-forge-ink">
            THIS PROMPT ESCAPED.
          </h1>
          <p className="mb-8 max-w-md text-forge-muted">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back to building.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-orange px-6 py-3">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              href="/browse"
              className="flex items-center gap-2 rounded-xl border-2 border-forge-border bg-white px-6 py-3 text-sm font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink"
            >
              <Search className="h-4 w-4" />
              Browse Prompts
            </Link>
            <Link
              href="/playground"
              className="flex items-center gap-2 rounded-xl border-2 border-forge-border bg-white px-6 py-3 text-sm font-bold text-forge-muted transition-all hover:border-forge-ink hover:text-forge-ink"
            >
              <Zap className="h-4 w-4" />
              Try Playground
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
