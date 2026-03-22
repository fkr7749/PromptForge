import type { Metadata, Viewport } from 'next'
import { Inter, Syne, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import SmoothScrollProvider from '@/components/layout/SmoothScrollProvider'
import MagneticCursor from '@/components/ui/MagneticCursor'

// ─── Fonts ───
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
  display: 'swap',
})

// Clash Display is loaded via @font-face in globals.css from Fontshare CDN
// The CSS variable --font-clash is set there; we use Syne as the local variable fallback
const clashDisplay = syne

// ─── Metadata ───
export const metadata: Metadata = {
  title: {
    default: 'PromptForge — The Definitive AI Prompt Engineering Platform',
    template: '%s | PromptForge',
  },
  description:
    'Discover, craft, test, version, and monetize AI prompts. GitHub meets Postman meets Figma — for the age of AI.',
  keywords: [
    'AI prompts',
    'prompt engineering',
    'ChatGPT prompts',
    'Claude prompts',
    'GPT-4 prompts',
    'prompt marketplace',
    'AI tools',
    'prompt testing',
    'prompt playground',
  ],
  authors: [{ name: 'PromptForge' }],
  creator: 'PromptForge',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://promptforge.dev',
    title: 'PromptForge — The Definitive AI Prompt Engineering Platform',
    description:
      'Discover, craft, test, version, and monetize AI prompts across GPT-4, Claude, Gemini & Mistral.',
    siteName: 'PromptForge',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PromptForge — AI Prompt Engineering Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptForge — The Definitive AI Prompt Engineering Platform',
    description: 'Discover, craft, test, version, and monetize AI prompts.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// ─── Root Layout ───
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable} ${clashDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-x-hidden bg-forge-silver text-forge-ink antialiased">
        <SmoothScrollProvider>
          <MagneticCursor />
          <main>{children}</main>
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
