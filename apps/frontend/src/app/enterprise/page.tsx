'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import {
  Building2, Shield, Zap, Users, Lock, BarChart3, Headphones,
  CheckCircle, ArrowRight, Globe, Key, GitBranch, RefreshCw
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'SSO & Advanced Security',
    description: 'SAML/OIDC single sign-on, SCIM user provisioning, audit logs, and SOC 2 Type II compliance.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Unlimited seats, role-based access control, shared workspaces, and org-wide prompt libraries.',
  },
  {
    icon: Lock,
    title: 'Private Deployment',
    description: 'Deploy PromptForge in your own cloud (AWS, GCP, Azure) or on-premises with full data residency.',
  },
  {
    icon: Key,
    title: 'Bring Your Own Keys',
    description: 'Connect your existing AI provider contracts. Use your OpenAI, Anthropic, or Groq API keys at scale.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Team-wide usage dashboards, cost attribution by department, and custom export to your BI tools.',
  },
  {
    icon: GitBranch,
    title: 'Version Control & Governance',
    description: 'Git-like version history, approval workflows, prompt review policies, and change management.',
  },
  {
    icon: RefreshCw,
    title: 'CI/CD Integration',
    description: 'GitHub Actions, GitLab CI, and Jenkins integrations for automated prompt testing and deployment.',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: '24/7 priority support, dedicated customer success manager, and SLA guarantees.',
  },
]

const trustedBy = [
  'Acme Corp', 'TechGiant Inc', 'BuildCo', 'DataStream', 'NeuralWorks', 'CloudBase'
]

export default function EnterprisePage() {
  const [formData, setFormData] = useState({
    name: '', email: '', company: '', teamSize: '', message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <>
      <Navigation />
      <main>

        {/* Hero */}
        <section className="bg-forge-black pt-24 pb-20 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,90,0,0.15),transparent_60%)]" />
          <div className="container-forge relative z-10">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-forge-orange/30 bg-forge-orange/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-forge-orange">
                <Building2 className="h-3.5 w-3.5" />
                Enterprise
              </div>
              <h1 className="font-display text-5xl font-black uppercase leading-none tracking-tight md:text-7xl">
                AI PROMPTS AT
                <span className="block text-forge-orange">ENTERPRISE SCALE</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-forge-muted leading-relaxed">
                Equip every team with a shared prompt library, governance controls, and analytics.
                PromptForge Enterprise turns AI productivity from a personal hack into a company-wide advantage.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#contact" className="btn-orange text-sm inline-flex items-center gap-2">
                  Talk to Sales <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/pricing" className="btn-ghost border-white/30 text-white hover:bg-white/10 text-sm">
                  Compare Plans
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 flex-wrap">
                {[
                  { icon: Globe, label: '99.99% Uptime SLA' },
                  { icon: Shield, label: 'SOC 2 Type II' },
                  { icon: Lock, label: 'GDPR Compliant' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-forge-muted">
                    <Icon className="h-4 w-4 text-forge-orange" />
                    <span className="font-bold">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="border-b-2 border-forge-border bg-forge-silver py-8">
          <div className="container-forge">
            <p className="mb-6 text-center text-xs font-black uppercase tracking-widest text-forge-muted">
              Trusted by teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {trustedBy.map(company => (
                <span key={company} className="text-sm font-black uppercase tracking-wider text-forge-muted opacity-60">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="container-forge">
            <div className="mb-12 text-center">
              <h2 className="font-display text-4xl font-black uppercase text-forge-ink">
                Built for Teams
              </h2>
              <p className="mt-3 text-forge-muted max-w-xl mx-auto">
                Everything you need to roll out AI prompt engineering across your entire organization, securely.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="card-hard rounded-2xl bg-white p-6"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-forge-black">
                    <f.icon className="h-5 w-5 text-forge-orange" />
                  </div>
                  <h3 className="font-display text-sm font-black uppercase tracking-tight text-forge-ink mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs text-forge-muted leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Block */}
        <section className="border-y-2 border-forge-border bg-forge-black py-20 text-white">
          <div className="container-forge text-center">
            <h2 className="font-display text-4xl font-black uppercase mb-4">Enterprise Pricing</h2>
            <p className="text-forge-muted max-w-lg mx-auto mb-8">
              Custom pricing based on your team size, usage, and requirements.
              Starts at <span className="font-bold text-white">$49/seat/month</span> for 10+ seats.
            </p>
            <div className="mx-auto max-w-2xl grid grid-cols-1 gap-4 md:grid-cols-3 mb-10">
              {[
                { label: 'Unlimited prompts & executions', },
                { label: 'Dedicated infrastructure', },
                { label: 'Custom contract & invoicing', },
                { label: 'SLA + priority support', },
                { label: 'On-boarding & training', },
                { label: 'Custom integrations', },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-left">
                  <CheckCircle className="h-4 w-4 shrink-0 text-forge-orange" />
                  <span className="text-forge-muted">{item.label}</span>
                </div>
              ))}
            </div>
            <a href="#contact" className="btn-orange text-sm inline-flex items-center gap-2">
              Get a Custom Quote <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-20">
          <div className="container-forge">
            <div className="mx-auto max-w-2xl">
              <div className="mb-10 text-center">
                <h2 className="font-display text-4xl font-black uppercase text-forge-ink">
                  Talk to Sales
                </h2>
                <p className="mt-3 text-forge-muted">
                  Tell us about your team and we&apos;ll get back to you within one business day.
                </p>
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="card-hard rounded-2xl bg-white p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-forge-ink">
                        Your Name
                      </label>
                      <input
                        required
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="Jane Smith"
                        className="w-full rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-2.5 text-sm font-medium text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-forge-ink">
                        Work Email
                      </label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="jane@company.com"
                        className="w-full rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-2.5 text-sm font-medium text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-forge-ink">
                        Company
                      </label>
                      <input
                        required
                        value={formData.company}
                        onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                        placeholder="Acme Inc."
                        className="w-full rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-2.5 text-sm font-medium text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-forge-ink">
                        Team Size
                      </label>
                      <select
                        required
                        value={formData.teamSize}
                        onChange={e => setFormData(p => ({ ...p, teamSize: e.target.value }))}
                        className="w-full rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-2.5 text-sm font-medium text-forge-ink focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                      >
                        <option value="">Select size</option>
                        <option>10–50</option>
                        <option>51–200</option>
                        <option>201–1000</option>
                        <option>1000+</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-forge-ink">
                      Tell us about your use case
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                      placeholder="We're a team of 50 engineers looking to standardize our AI prompts across..."
                      className="w-full resize-none rounded-xl border-2 border-forge-border bg-forge-silver px-4 py-2.5 text-sm text-forge-ink placeholder:text-forge-muted focus:border-forge-orange focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-orange w-full py-3 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? 'Submitting...' : <>Submit Request <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-center text-xs text-forge-muted">
                    By submitting, you agree to our{' '}
                    <Link href="/privacy" className="font-bold text-forge-orange hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card-hard rounded-2xl bg-white p-12 text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-display text-2xl font-black uppercase text-forge-ink mb-2">
                    Request Received!
                  </h3>
                  <p className="text-forge-muted mb-6">
                    Our enterprise team will reach out to <strong className="text-forge-ink">{formData.email}</strong> within one business day.
                  </p>
                  <Link href="/" className="btn-ghost text-sm">← Back to PromptForge</Link>
                </motion.div>
              )}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
