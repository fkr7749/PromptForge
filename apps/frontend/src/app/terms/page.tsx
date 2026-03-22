import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main>
        <div className="border-b-2 border-forge-border bg-forge-black pt-24 pb-12 text-white">
          <div className="container-forge">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-forge-orange">Legal</p>
            <h1 className="font-display text-4xl font-black uppercase tracking-tight md:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-forge-muted">Last updated: March 22, 2026</p>
          </div>
        </div>

        <div className="container-forge py-16">
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-lg max-w-none">

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">1. Acceptance of Terms</h2>
                <p className="text-forge-muted leading-relaxed">
                  By accessing or using PromptForge ("Service"), you agree to be bound by these Terms of Service.
                  If you do not agree to all terms, you may not use the Service. We reserve the right to update
                  these terms at any time, with notice provided via email or in-app notification.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">2. Accounts</h2>
                <p className="text-forge-muted leading-relaxed mb-4">
                  You must be at least 13 years old to use PromptForge. You are responsible for:
                </p>
                <ul className="list-none space-y-3">
                  {[
                    'Maintaining the confidentiality of your account credentials',
                    'All activity that occurs under your account',
                    'Providing accurate and complete registration information',
                    'Notifying us immediately of unauthorized account access',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-forge-muted">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forge-orange" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">3. Acceptable Use</h2>
                <p className="text-forge-muted leading-relaxed mb-4">
                  You agree NOT to use PromptForge to:
                </p>
                <ul className="list-none space-y-3">
                  {[
                    'Create, share, or run prompts intended to generate illegal, harmful, or abusive content',
                    'Attempt to circumvent AI safety systems or generate jailbreak prompts',
                    'Collect or harvest other users\' personal information without consent',
                    'Interfere with or disrupt the integrity of the Service',
                    'Use automated means to access the Service without our API program',
                    'Impersonate another person or entity',
                    'Violate any applicable laws or regulations',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-forge-muted">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forge-orange" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">4. Content Ownership</h2>
                <p className="text-forge-muted leading-relaxed mb-4">
                  <strong className="text-forge-ink">Your content:</strong> You retain ownership of all prompts and content
                  you create on PromptForge. By publishing a public prompt, you grant PromptForge a non-exclusive,
                  worldwide, royalty-free license to display and distribute that prompt on the platform.
                </p>
                <p className="text-forge-muted leading-relaxed">
                  <strong className="text-forge-ink">Our content:</strong> The PromptForge platform, interface, and branding
                  are owned by PromptForge Inc. and protected by intellectual property laws.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">5. Subscriptions & Billing</h2>
                <p className="text-forge-muted leading-relaxed mb-4">
                  PromptForge offers Free and Pro plans. For paid plans:
                </p>
                <ul className="list-none space-y-3">
                  {[
                    'Subscriptions renew automatically unless cancelled before the renewal date',
                    'You may cancel at any time; access continues until the end of the billing period',
                    'Refunds are provided at our discretion for unused portions within 7 days of charge',
                    'Prices may change with 30 days\' notice',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-forge-muted">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forge-orange" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">6. API Usage</h2>
                <p className="text-forge-muted leading-relaxed">
                  Access to the PromptForge API is subject to rate limits based on your plan. You may not use the API
                  to build a competing product or to circumvent usage limits. API keys are non-transferable and must
                  not be shared publicly.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">7. Disclaimers</h2>
                <p className="text-forge-muted leading-relaxed">
                  PromptForge is provided "as is" without warranties of any kind. We do not guarantee that the Service
                  will be uninterrupted, error-free, or that AI-generated outputs will be accurate or appropriate for
                  your use case. You are solely responsible for how you use prompts and their outputs.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">8. Limitation of Liability</h2>
                <p className="text-forge-muted leading-relaxed">
                  To the maximum extent permitted by law, PromptForge shall not be liable for any indirect, incidental,
                  special, consequential, or punitive damages arising from your use of the Service, even if we have been
                  advised of the possibility of such damages. Our total liability shall not exceed the amount you paid
                  to us in the 12 months preceding the claim.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">9. Termination</h2>
                <p className="text-forge-muted leading-relaxed">
                  We reserve the right to suspend or terminate your account for violations of these Terms, without
                  prior notice. You may terminate your account at any time from the account settings page.
                  Upon termination, your public prompts may remain visible unless you delete them first.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">10. Governing Law</h2>
                <p className="text-forge-muted leading-relaxed">
                  These Terms are governed by the laws of the State of California, United States. Any disputes shall
                  be resolved in the courts of San Francisco County, California.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">11. Contact</h2>
                <p className="text-forge-muted leading-relaxed">
                  Questions about these Terms? Contact us at{' '}
                  <a href="mailto:legal@promptforge.dev" className="text-forge-orange font-bold hover:underline">
                    legal@promptforge.dev
                  </a>.
                </p>
              </section>

            </div>

            <div className="mt-12 flex items-center gap-4 border-t-2 border-forge-border pt-8">
              <Link href="/privacy" className="btn-ghost text-sm">Privacy Policy</Link>
              <Link href="/" className="btn-ghost text-sm">← Back to PromptForge</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
