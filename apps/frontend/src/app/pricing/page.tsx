'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Zap, Star, Building2, ArrowRight, Sparkles } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }),
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for exploring and getting started with AI prompts.',
    icon: Zap,
    color: 'bg-forge-silver',
    border: 'border-forge-border',
    buttonClass: 'border-2 border-forge-black text-forge-ink font-black hover:bg-forge-black hover:text-white transition-colors',
    buttonLabel: 'Get started free',
    href: '/browse',
    features: [
      'Browse all public prompts',
      'Run up to 50 prompts/month',
      'Access to Playground',
      'Save up to 3 collections',
      'Basic prompt analytics',
      'Community support',
    ],
    notIncluded: [
      'Premium marketplace prompts',
      'Priority model access',
      'Advanced AI optimizer',
      'API access',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For power users who want the full PromptForge experience.',
    icon: Star,
    color: 'bg-forge-orange',
    border: 'border-forge-orange',
    popular: true,
    buttonClass: 'btn-orange',
    buttonLabel: 'Start Pro trial',
    href: '/register',
    features: [
      'Everything in Free',
      'Unlimited prompt executions',
      'Full marketplace access',
      'Advanced AI optimizer',
      'Safety scanner',
      'Translation studio (50 languages)',
      'RAG context injection',
      'Export/import (YAML & JSON)',
      'Unlimited collections',
      'Full analytics dashboard',
      'Priority GPT-4o & Claude access',
      'API access (10,000 req/day)',
      'Email support',
    ],
    notIncluded: [],
  },
  {
    name: 'Teams',
    price: '$49',
    period: 'per seat/month',
    description: 'For teams building with AI at scale. Shared workspace + admin controls.',
    icon: Building2,
    color: 'bg-forge-ink',
    border: 'border-forge-ink',
    buttonClass: 'border-2 border-forge-ink text-forge-ink font-black hover:bg-forge-ink hover:text-white transition-colors',
    buttonLabel: 'Contact sales',
    href: 'mailto:sales@promptforge.dev',
    features: [
      'Everything in Pro',
      'Shared team workspace',
      'Centralized billing',
      'Admin controls & permissions',
      'SSO (SAML/Google)',
      'Private prompt library',
      'Team analytics & reporting',
      'Custom API rate limits',
      'SLA & uptime guarantee',
      'Dedicated Slack support',
      'Onboarding & training',
    ],
    notIncluded: [],
  },
]

const faqs = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. Upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of the billing cycle.',
  },
  {
    q: 'What counts as a prompt execution?',
    a: 'Each time you run a prompt in the Playground or via API, it counts as one execution. Viewing prompts, editing, and saving do not count.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Yes — 14 days free, no credit card required. Full Pro access from day one.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Stripe powers our payments. We accept all major credit/debit cards, and annual plans can be invoiced.',
  },
  {
    q: 'Can I sell my prompts on the Marketplace?',
    a: 'Yes, any Pro or Teams user can list prompts for sale. PromptForge takes a 20% commission on each sale.',
  },
  {
    q: 'What is the API rate limit on Free?',
    a: 'Free accounts have 100 API requests/day. Pro users get 10,000/day. Teams have custom limits.',
  },
]

export default function PricingPage() {
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />

      <div className="pt-24 pb-20">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-[1380px] px-6 md:px-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-forge-border bg-white px-4 py-1.5 text-xs font-black uppercase tracking-widest text-forge-orange shadow-[2px_2px_0_#0A0A0A] mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Simple pricing
            </div>
            <h1 className="font-display font-black text-5xl md:text-6xl text-forge-ink tracking-tight mb-4">
              Build smarter.
              <br />
              <span className="text-forge-orange">Pay less.</span>
            </h1>
            <p className="text-lg text-forge-muted font-semibold max-w-xl mx-auto mb-8">
              Start free forever. Upgrade when you need more power. No hidden fees, no surprises.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 rounded-2xl border-2 border-forge-border bg-white p-1 shadow-[3px_3px_0_#0A0A0A]">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`rounded-xl px-5 py-2 text-sm font-black transition-all ${!billingAnnual ? 'bg-forge-black text-white' : 'text-forge-muted hover:text-forge-ink'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-black transition-all ${billingAnnual ? 'bg-forge-black text-white' : 'text-forge-muted hover:text-forge-ink'}`}
              >
                Annual
                <span className="rounded-full bg-forge-orange px-2 py-0.5 text-[10px] font-black text-white">-20%</span>
              </button>
            </div>
          </motion.div>

          {/* ── Plans grid ─────────────────────────────────────────────────── */}
          <div className="grid gap-6 md:grid-cols-3 mb-20">
            {plans.map((plan, i) => {
              const Icon = plan.icon
              const annualPrice = plan.price === '$0' ? '$0' : `$${Math.round(parseInt(plan.price.slice(1)) * 0.8)}`
              const displayPrice = billingAnnual ? annualPrice : plan.price

              return (
                <motion.div
                  key={plan.name}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i + 1}
                  className={`relative rounded-2xl border-2 ${plan.border} bg-white shadow-[4px_4px_0_#0A0A0A] overflow-hidden flex flex-col ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
                >
                  {plan.popular && (
                    <div className="bg-forge-orange py-2 text-center text-xs font-black uppercase tracking-widest text-white">
                      ★ Most Popular
                    </div>
                  )}
                  <div className="p-8 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-forge-border ${i === 0 ? 'bg-forge-silver' : i === 1 ? 'bg-orange-50' : 'bg-forge-ink'}`}>
                        <Icon className={`h-5 w-5 ${i === 2 ? 'text-white' : 'text-forge-ink'}`} />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-lg text-forge-ink">{plan.name}</h3>
                        <p className="text-xs text-forge-muted font-semibold">{plan.description.split('.')[0]}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display font-black text-5xl text-forge-ink">{displayPrice}</span>
                        <span className="text-sm font-bold text-forge-muted">/{plan.period}</span>
                      </div>
                      {billingAnnual && plan.price !== '$0' && (
                        <p className="text-xs text-forge-orange font-black mt-1">Billed annually · Save 20%</p>
                      )}
                    </div>

                    {/* CTA */}
                    <Link href={plan.href} className={`block text-center rounded-xl px-6 py-3 text-sm mb-6 ${plan.buttonClass}`}>
                      {plan.buttonLabel}
                    </Link>

                    <div className="h-px bg-forge-border mb-6" />

                    {/* Features */}
                    <ul className="flex-1 space-y-2.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm font-semibold text-forge-ink">
                          <Check className="h-4 w-4 mt-0.5 shrink-0 text-forge-orange" />
                          {f}
                        </li>
                      ))}
                      {plan.notIncluded.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm font-semibold text-forge-muted/50 line-through">
                          <span className="h-4 w-4 mt-0.5 shrink-0 flex items-center justify-center text-forge-border font-black">×</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* ── Feature comparison ───────────────────────────────────────── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mb-20">
            <div className="card-hard rounded-2xl overflow-hidden">
              <div className="bg-forge-black px-8 py-5">
                <h2 className="font-display font-black text-xl text-white">Feature comparison</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-forge-border bg-forge-silver/50">
                      <th className="px-6 py-4 text-left font-black text-forge-ink">Feature</th>
                      {plans.map(p => (
                        <th key={p.name} className="px-6 py-4 text-center font-black text-forge-ink">{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Browse public prompts', '✓', '✓', '✓'],
                      ['Monthly executions', '50', 'Unlimited', 'Unlimited'],
                      ['Collections', '3', 'Unlimited', 'Unlimited'],
                      ['Premium marketplace', '—', '✓', '✓'],
                      ['AI Optimizer', 'Limited', '✓', '✓'],
                      ['Safety scanner', '—', '✓', '✓'],
                      ['Translation studio', '—', '✓', '✓'],
                      ['Export / Import', '—', '✓', '✓'],
                      ['API access', '—', '10K/day', 'Custom'],
                      ['Battle Arena voting', '✓', '✓', '✓'],
                      ['Team workspace', '—', '—', '✓'],
                      ['SSO', '—', '—', '✓'],
                      ['Support', 'Community', 'Email', 'Dedicated Slack'],
                    ].map(([feature, free, pro, teams], i) => (
                      <tr key={feature} className={`border-b border-forge-border/50 ${i % 2 === 0 ? 'bg-white' : 'bg-forge-silver/20'}`}>
                        <td className="px-6 py-3.5 font-semibold text-forge-ink">{feature}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-forge-muted">{free === '—' ? <span className="text-forge-border">—</span> : free === '✓' ? <span className="text-forge-orange">✓</span> : free}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-forge-ink bg-orange-50/40">{pro === '—' ? <span className="text-forge-border">—</span> : pro === '✓' ? <span className="text-forge-orange font-black">✓</span> : pro}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-forge-muted">{teams === '—' ? <span className="text-forge-border">—</span> : teams === '✓' ? <span className="text-forge-orange">✓</span> : teams}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="max-w-2xl mx-auto mb-20">
            <h2 className="font-display font-black text-3xl text-forge-ink text-center mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="card-hard rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left font-black text-forge-ink hover:bg-forge-silver/30 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="ml-4 text-forge-orange font-black text-lg">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-sm font-semibold text-forge-muted border-t border-forge-border/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
            <div className="rounded-2xl bg-forge-black border-2 border-forge-border shadow-[6px_6px_0_#FF6B2B] overflow-hidden">
              <div className="p-12 md:p-16 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-forge-orange/30 bg-forge-orange/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-forge-orange mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  Get started today
                </div>
                <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-4 tracking-tight">
                  Ready to get started?
                </h2>
                <p className="text-white/60 font-semibold mb-10 max-w-md mx-auto text-lg">
                  Join thousands of developers and creators already using PromptForge. Free forever.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-forge-orange border-2 border-forge-orange px-8 py-3.5 text-sm font-black text-white shadow-[4px_4px_0_rgba(255,255,255,0.2)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(255,255,255,0.2)]"
                  >
                    Start for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 text-sm font-black text-white transition-all hover:bg-white/10 hover:border-white/50"
                  >
                    Browse prompts
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
