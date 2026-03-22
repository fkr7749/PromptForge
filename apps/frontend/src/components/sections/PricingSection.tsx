'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, ArrowUpRight, Zap, Sparkles, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import SpotlightCard from '@/components/ui/SpotlightCard'

const plans = [
  {
    icon: Zap,
    name: 'Starter',
    tagline: 'Explore prompt engineering.',
    monthly: 0,
    yearly: 0,
    color: '#6B6B6B',
    highlighted: false,
    features: [
      '50 AI executions / month',
      '10 saved prompts',
      'Access to public library',
      'Basic playground (1 model)',
      'Community support',
    ],
    cta: 'Start for Free',
    href: '/register',
  },
  {
    icon: Sparkles,
    name: 'Creator',
    tagline: 'For power builders.',
    monthly: 19,
    yearly: 15,
    color: '#FF6B2B',
    highlighted: true,
    features: [
      '2,000 AI executions / month',
      'Unlimited saved prompts',
      'All 6 Groq-powered models',
      'Prompt versioning & diffs',
      'Prompt DNA 3D visualizer',
      'Analytics dashboard',
      'Battle Arena access',
      'Priority support',
    ],
    cta: 'Start 14-day trial',
    href: '/register?plan=creator',
  },
  {
    icon: Building2,
    name: 'Team',
    tagline: 'Scale your AI workflows.',
    monthly: 79,
    yearly: 63,
    color: '#0A0A0A',
    highlighted: false,
    features: [
      'Unlimited executions',
      'Team workspace & sharing',
      'Private prompt registry',
      'RAG document upload',
      'Marketplace seller access',
      'Safety scanner',
      'API + webhooks',
      'SSO & audit logs',
      'Dedicated support',
    ],
    cta: 'Start Team trial',
    href: '/register?plan=team',
  },
]

export default function PricingSection() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="section-padding relative">
      <div className="absolute left-0 right-0 top-0 h-px bg-forge-border" />

      <div className="container-forge">
        {/* Header */}
        <div className="mb-12">
          <div className="section-label mb-3">Pricing</div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2
              className="font-display font-black text-forge-ink"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
            >
              START FREE.
              <br />
              <span className="text-gradient">SCALE BIG.</span>
            </h2>

            {/* Toggle */}
            <div className="inline-flex items-center gap-2 rounded-xl border-2 border-forge-black p-1 bg-white">
              <button
                onClick={() => setYearly(false)}
                className={cn(
                  'rounded-lg px-5 py-2 text-sm font-black transition-all',
                  !yearly ? 'bg-forge-black text-white' : 'text-forge-muted hover:text-forge-ink'
                )}
              >Monthly</button>
              <button
                onClick={() => setYearly(true)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-black transition-all',
                  yearly ? 'bg-forge-black text-white' : 'text-forge-muted hover:text-forge-ink'
                )}
              >
                Yearly
                <span className="rounded-full bg-forge-orange px-2 py-0.5 text-[10px] font-black text-white">
                  −20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan, i) => {
            const Icon = plan.icon
            const price = yearly ? plan.yearly : plan.monthly

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Badge sits OUTSIDE the card so overflow:hidden doesn't clip it */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-6 z-20">
                    <div className="badge badge-orange shadow-orange">Most Popular</div>
                  </div>
                )}
                <SpotlightCard
                  spotlightColor={plan.highlighted ? 'rgba(255,107,43,0.15)' : 'rgba(10,10,10,0.06)'}
                  className={plan.highlighted ? 'card-hard-orange' : 'card-hard'}
                >

                <div className="p-7">
                  {/* Plan header */}
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <div
                        className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2"
                        style={{ borderColor: plan.color, color: plan.color }}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <h3 className="font-display text-xl font-black text-forge-ink">{plan.name}</h3>
                      <p className="text-sm text-forge-muted">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-7 flex items-end gap-1.5">
                    <span
                      className="font-display font-black leading-none text-forge-ink"
                      style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em' }}
                    >
                      ${price}
                    </span>
                    {price > 0 && (
                      <span className="mb-2 text-sm text-forge-muted">/mo</span>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    className={cn(
                      'mb-7 flex w-full items-center justify-center gap-2 rounded-xl border-2 px-6 py-3.5 text-sm font-black transition-all duration-200',
                      plan.highlighted
                        ? 'border-forge-orange bg-forge-orange text-white hover:bg-forge-ink hover:border-forge-ink'
                        : 'border-forge-black bg-forge-black text-white hover:bg-forge-orange hover:border-forge-orange'
                    )}
                  >
                    {plan.cta}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <div
                          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm"
                          style={{ background: plan.color }}
                        >
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-forge-muted">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                </SpotlightCard>
              </motion.div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-forge-subtle">
          14-day free trial on all paid plans. No credit card required.{' '}
          <Link href="/enterprise" className="font-semibold text-forge-orange hover:underline">
            Enterprise? Talk to us →
          </Link>
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-forge-border" />
    </section>
  )
}
