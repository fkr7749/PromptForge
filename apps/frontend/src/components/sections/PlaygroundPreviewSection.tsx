'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Zap, Copy, CheckCheck } from 'lucide-react'

const DEMO_PROMPT = `You are an expert copywriter.

Write a compelling product description for:
Product: {{product_name}}
Audience: {{target_audience}}
Tone: {{tone}}

Requirements:
- Max 150 words
- Include 3 key benefits
- End with a strong CTA`

const DEMO_OUTPUT = `Introducing **{{product_name}}** — the tool that changes everything.

Built specifically for {{target_audience}}, this isn't just another solution. It's the one you've been waiting for.

**Three reasons you'll love it:**
→ Save 10+ hours every week on repetitive tasks
→ Get results that actually move the needle
→ Start seeing impact from day one

No fluff. No complexity. Just results that speak for themselves.

**Ready to transform how you work?**
Try it free today — no credit card required.`

const models = [
  { id: 'llama-3.3-70b-versatile',                   name: 'Llama 3.3 70B',  badge: 'Best' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout',  badge: 'Fast' },
  { id: 'moonshotai/kimi-k2-instruct',               name: 'Kimi K2',        badge: '60 RPM' },
  { id: 'openai/gpt-oss-120b',                       name: 'GPT OSS 120B',   badge: 'Large' },
]

export default function PlaygroundPreviewSection() {
  const [selected, setSelected] = useState(models[0]!.id)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(DEMO_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute left-0 right-0 top-0 h-px bg-forge-border" />

      {/* CSS-only ambient glow — replaces heavy WebGL canvas */}
      <div
        className="pointer-events-none absolute -right-32 top-1/4 hidden opacity-30 lg:block"
        style={{
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,184,0,0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'floatA 8s ease-in-out infinite',
        }}
      />

      <div className="container-forge relative z-10">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-3">
          <div className="section-label">See it in action</div>
          <h2
            className="font-display font-black text-forge-ink"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
          >
            THE PLAYGROUND
            <br />
            <span className="text-gradient">EXPERIENCE.</span>
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — Prompt Editor */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="card-hard flex flex-col overflow-hidden"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between border-b-2 border-forge-black bg-forge-ink px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  {['#E84040', '#FFB800', '#00C27C'].map(c => (
                    <div key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span className="ml-2 font-mono text-xs text-white/60">prompt.md</span>
              </div>
              <button onClick={copy} className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-white/60 hover:bg-white/10 transition-colors">
                {copied ? <CheckCheck className="h-3 w-3 text-forge-green" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Editor content */}
            <div className="bg-forge-ink flex-1 p-5 font-mono text-sm leading-relaxed overflow-auto" style={{ minHeight: '320px' }}>
              {DEMO_PROMPT.split('\n').map((line, i) => (
                <div key={i} className="flex gap-4">
                  <span className="select-none text-forge-muted/40 w-5 text-right shrink-0 text-xs pt-0.5">{i + 1}</span>
                  <span className={
                    line.startsWith('{{') || line.includes('{{')
                      ? 'text-forge-amber'
                      : line.startsWith('You') || line.startsWith('Write') || line.startsWith('Requirements')
                      ? 'text-white'
                      : 'text-white/60'
                  }>
                    {line || '\u00A0'}
                  </span>
                </div>
              ))}
            </div>

            {/* Variables */}
            <div className="border-t-2 border-forge-black bg-forge-offwhite px-5 py-3">
              <div className="text-xs font-bold uppercase tracking-wider text-forge-muted mb-2">Variables</div>
              <div className="flex flex-wrap gap-2">
                {['product_name', 'target_audience', 'tone'].map(v => (
                  <div key={v} className="rounded-md border border-forge-orange/30 bg-forge-orange/10 px-2.5 py-1 font-mono text-xs text-forge-orange">
                    {'{{' + v + '}}'}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — Output */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4"
          >
            {/* Model selector */}
            <div className="card-hard p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-forge-muted mb-3">Select Model</div>
              <div className="grid grid-cols-2 gap-2">
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m.id)}
                    className={`flex items-center justify-between rounded-lg border-2 px-3 py-2.5 text-left transition-all duration-150 ${
                      selected === m.id
                        ? 'border-forge-orange bg-forge-orange/10'
                        : 'border-forge-border bg-white hover:border-forge-ink'
                    }`}
                  >
                    <span className={`text-xs font-bold ${selected === m.id ? 'text-forge-orange' : 'text-forge-ink'}`}>
                      {m.name}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                      selected === m.id ? 'bg-forge-orange text-white' : 'bg-forge-border text-forge-muted'
                    }`}>
                      {m.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Output */}
            <div className="card-hard flex-1 overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-forge-black bg-forge-offwhite px-5 py-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-forge-orange" />
                  <span className="text-xs font-bold text-forge-muted">Output</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-forge-green" />
                  <span className="text-xs text-forge-muted">Streaming</span>
                </div>
              </div>
              <div className="p-5 text-sm leading-relaxed text-forge-ink" style={{ minHeight: '220px' }}>
                {DEMO_OUTPUT.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-bold text-forge-ink mb-2">{line.replace(/\*\*/g, '')}</p>
                  }
                  if (line.startsWith('→')) {
                    return <p key={i} className="text-forge-muted mb-1 pl-2">{line}</p>
                  }
                  return line ? <p key={i} className="text-forge-muted mb-2">{line}</p> : <div key={i} className="h-2" />
                })}
              </div>
              <div className="border-t border-forge-border bg-forge-offwhite px-5 py-3 flex items-center justify-between">
                <div className="flex gap-4 text-xs text-forge-subtle">
                  <span>~680 tokens</span>
                  <span>1.2s</span>
                  <span>$0.0001</span>
                </div>
                <button className="btn-orange text-xs py-1.5 px-4">
                  <Play className="h-3 w-3" fill="currentColor" />
                  Run
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-forge-border" />
    </section>
  )
}
