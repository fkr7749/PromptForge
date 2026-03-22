import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main>
        <div className="border-b-2 border-forge-border bg-forge-black pt-24 pb-12 text-white">
          <div className="container-forge">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-forge-orange">Legal</p>
            <h1 className="font-display text-4xl font-black uppercase tracking-tight md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-forge-muted">Last updated: March 22, 2026</p>
          </div>
        </div>

        <div className="container-forge py-16">
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-lg max-w-none">

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">1. Introduction</h2>
                <p className="text-forge-muted leading-relaxed">
                  PromptForge ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
                  platform at promptforge.dev and any associated services.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">2. Information We Collect</h2>
                <h3 className="text-lg font-bold text-forge-ink mt-6 mb-2">2.1 Account Information</h3>
                <p className="text-forge-muted leading-relaxed">
                  When you register, we collect your username, email address, and (optionally) your display name and bio.
                  If you sign in via GitHub, we receive your public GitHub profile information.
                </p>
                <h3 className="text-lg font-bold text-forge-ink mt-6 mb-2">2.2 Content You Create</h3>
                <p className="text-forge-muted leading-relaxed">
                  We store the prompts, collections, comments, and other content you create on PromptForge.
                  Prompts marked as "public" are visible to all users. Private prompts are accessible only to you.
                </p>
                <h3 className="text-lg font-bold text-forge-ink mt-6 mb-2">2.3 Usage Data</h3>
                <p className="text-forge-muted leading-relaxed">
                  We automatically collect information about how you interact with our service, including pages visited,
                  features used, and prompt execution logs (model, tokens, latency). This data is used to improve the platform.
                </p>
                <h3 className="text-lg font-bold text-forge-ink mt-6 mb-2">2.4 API Keys</h3>
                <p className="text-forge-muted leading-relaxed">
                  API keys you generate are stored as hashed values. We never store your raw API keys after initial creation.
                  Any third-party AI provider keys you enter in the Playground are not stored on our servers.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">3. How We Use Your Information</h2>
                <ul className="list-none space-y-3">
                  {[
                    'Provide, operate, and improve the PromptForge platform',
                    'Personalize your experience and surface relevant prompts',
                    'Send you product updates, security alerts, and support messages',
                    'Monitor and analyze usage patterns to improve performance',
                    'Detect and prevent fraudulent or abusive activity',
                    'Comply with legal obligations',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-forge-muted">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forge-orange" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">4. Data Sharing</h2>
                <p className="text-forge-muted leading-relaxed mb-4">
                  We do not sell your personal data. We share information only in these limited circumstances:
                </p>
                <ul className="list-none space-y-3">
                  {[
                    'Service providers who assist in operating our platform (hosting, analytics, payments)',
                    'Legal requirements: when compelled by law, court order, or government authority',
                    'Protection of rights: to protect the safety, rights, or property of PromptForge or our users',
                    'Business transfers: in connection with a merger, acquisition, or sale of assets',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-forge-muted">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forge-orange" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">5. Data Retention</h2>
                <p className="text-forge-muted leading-relaxed">
                  We retain your account data as long as your account is active. Execution logs are retained for 90 days.
                  You may request deletion of your account and associated data at any time by contacting us at{' '}
                  <a href="mailto:privacy@promptforge.dev" className="text-forge-orange font-bold hover:underline">
                    privacy@promptforge.dev
                  </a>.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">6. Security</h2>
                <p className="text-forge-muted leading-relaxed">
                  We implement industry-standard security measures including TLS encryption in transit, bcrypt password hashing,
                  and regular security audits. No system is 100% secure, and we encourage you to use strong passwords and
                  keep your credentials confidential.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">7. Your Rights</h2>
                <p className="text-forge-muted leading-relaxed mb-4">
                  Depending on your location, you may have the right to:
                </p>
                <ul className="list-none space-y-3">
                  {[
                    'Access the personal data we hold about you',
                    'Correct inaccurate or incomplete data',
                    'Request deletion of your data ("right to be forgotten")',
                    'Object to processing of your data',
                    'Data portability — export your prompts and data',
                    'Withdraw consent at any time where processing is based on consent',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-forge-muted">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forge-orange" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">8. Cookies</h2>
                <p className="text-forge-muted leading-relaxed">
                  We use essential cookies for authentication (session tokens) and preference cookies to remember your
                  settings. We do not use tracking cookies for advertising. You can control cookies through your browser settings.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-black uppercase text-forge-ink mb-4">9. Contact</h2>
                <p className="text-forge-muted leading-relaxed">
                  For any privacy-related questions or requests, contact our Data Protection team at{' '}
                  <a href="mailto:privacy@promptforge.dev" className="text-forge-orange font-bold hover:underline">
                    privacy@promptforge.dev
                  </a>{' '}
                  or write to PromptForge Inc., 123 Market Street, San Francisco, CA 94105.
                </p>
              </section>

            </div>

            <div className="mt-12 flex items-center gap-4 border-t-2 border-forge-border pt-8">
              <Link href="/terms" className="btn-ghost text-sm">Terms of Service</Link>
              <Link href="/" className="btn-ghost text-sm">← Back to PromptForge</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
