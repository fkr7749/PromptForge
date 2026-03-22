'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin, ArrowUpRight } from 'lucide-react'
import Logo from '@/components/ui/Logo'

const footerLinks = {
  Product: [
    { label: 'Explore Prompts', href: '/explore' },
    { label: 'AI Playground', href: '/playground' },
    { label: 'Prompt DNA', href: '/dna' },
    { label: 'Battle Arena', href: '/arena' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Analytics', href: '/analytics' },
  ],
  Developers: [
    { label: 'API Docs', href: '/docs/api' },
    { label: 'JavaScript SDK', href: '/docs/sdk/js' },
    { label: 'Python SDK', href: '/docs/sdk/python' },
    { label: 'Webhooks', href: '/docs/webhooks' },
    { label: 'CLI Tool', href: '/docs/cli' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press Kit', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Security', href: '/security' },
  ],
}

const MODELS = ['Llama 4 Scout', 'Kimi K2', 'GPT OSS 120B', 'Llama 3.3 70B', 'Llama 3.1 8B', 'GPT OSS 20B']

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forge-black">

      {/* Giant background text */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 select-none overflow-hidden leading-none"
        style={{ fontSize: 'clamp(6rem, 18vw, 18rem)', letterSpacing: '-0.06em' }}
      >
        <span
          className="block font-display font-black"
          style={{ WebkitTextStroke: '1px rgba(255,255,255,0.04)', color: 'transparent' }}
        >
          FORGE
        </span>
      </div>

      {/* Top border accent */}
      <div className="h-1 w-full bg-forge-orange" />

      <div className="container-forge relative z-10 pt-16 pb-8">

        {/* Top section: Brand + Newsletter */}
        <div className="mb-16 flex flex-col gap-8 border-b-2 border-white/10 pb-16 lg:flex-row lg:items-start lg:justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="group mb-6 inline-flex items-center gap-3">
              <div className="text-forge-orange transition-transform duration-300 group-hover:scale-110">
                <Logo size={40} variant="filled" />
              </div>
              <span className="font-display text-2xl font-black text-white tracking-tight">
                PROMPT<span className="text-forge-orange">FORGE</span>
              </span>
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-white/50">
              The definitive platform for AI prompt engineering. Craft, test, version, and monetize
              prompts that actually work — across every frontier model.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Github, href: 'https://github.com/promptforge', label: 'GitHub' },
                { Icon: Twitter, href: 'https://twitter.com/promptforge', label: 'Twitter' },
                { Icon: Linkedin, href: 'https://linkedin.com/company/promptforge', label: 'LinkedIn' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 text-white/50 transition-all duration-200 hover:border-forge-orange hover:text-forge-orange"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter signup */}
          <div className="max-w-md">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-forge-orange">
              Stay in the loop
            </div>
            <h3 className="mb-4 font-display text-2xl font-black text-white">
              GET THE LATEST
              <br />
              PROMPT DROPS.
            </h3>
            <div className="flex gap-0">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 rounded-l-xl border-2 border-r-0 border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-forge-orange"
              />
              <button className="flex items-center gap-2 rounded-r-xl border-2 border-forge-orange bg-forge-orange px-5 py-3 text-sm font-black text-white transition-all hover:bg-forge-ink hover:border-forge-ink">
                Subscribe
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-white/30">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        {/* Middle: Links grid */}
        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-5 font-display text-xs font-black uppercase tracking-widest text-white/40">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-1 text-sm text-white/60 transition-colors duration-200 hover:text-forge-orange"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Live models status bar */}
        <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border-2 border-white/10 bg-white/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-forge-green" style={{ boxShadow: '0 0 6px #00C27C' }} />
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Live Models</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {MODELS.map(m => (
              <span key={m} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/50">
                {m}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-forge-green animate-pulse" />
            <span className="text-xs text-white/40">All systems operational</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="font-mono text-xs text-white/30">
            © {new Date().getFullYear()} PromptForge, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1 font-mono text-xs text-white/30">
            <span>Built for builders who ship.</span>
          </div>
          <div className="flex items-center gap-4">
            {['Privacy', 'Terms', 'Security'].map(item => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="font-mono text-xs text-white/30 transition-colors hover:text-white/60"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
