import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Forge Editorial Palette ─────────────────────────────────
        forge: {
          // Backgrounds
          silver:   '#EBEBEB',   // main background — warm silver
          offwhite: '#F7F7F5',   // surface
          white:    '#FFFFFF',   // card bg
          // Accents
          orange:   '#FF6B2B',   // primary CTA — vivid orange
          amber:    '#FFB800',   // secondary accent — amber
          red:      '#E84040',   // danger / highlight
          green:    '#00C27C',   // success
          // Typographic
          black:    '#0A0A0A',   // primary text
          ink:      '#1A1A1A',   // headings
          muted:    '#6B6B6B',   // secondary text
          subtle:   '#9B9B9B',   // placeholder / disabled
          violet:   '#7C3AED',   // violet accent
          // Borders
          border:   '#D4D4D0',   // default border
          'border-strong': '#A8A8A4',  // stronger border
        },
        // Semantic tokens
        background: 'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
      },

      fontFamily: {
        display: ['var(--font-clash)', 'var(--font-syne)', 'system-ui', 'sans-serif'],
        heading:  ['var(--font-syne)',  'system-ui', 'sans-serif'],
        sans:     ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:     ['var(--font-jetbrains)', 'monospace'],
      },

      fontSize: {
        // Display sizes
        '10xl': ['9rem',  { lineHeight: '0.9',  letterSpacing: '-0.05em' }],
        '11xl': ['12rem', { lineHeight: '0.88', letterSpacing: '-0.06em' }],
        '12xl': ['16rem', { lineHeight: '0.85', letterSpacing: '-0.07em' }],
        // Overrides
        '7xl': ['4.5rem', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        '8xl': ['6rem',   { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        '9xl': ['8rem',   { lineHeight: '0.9',  letterSpacing: '-0.05em' }],
      },

      animation: {
        'float-a':   'floatA 7s ease-in-out infinite',
        'float-b':   'floatB 9s ease-in-out 1.5s infinite',
        'float-c':   'floatC 11s ease-in-out 3s infinite',
        'spin-slow': 'spin 30s linear infinite',
        'spin-rev':  'spinRev 25s linear infinite',
        marquee:     'marquee 20s linear infinite',
        'fade-up':   'fadeUp 0.7s ease-out forwards',
        shimmer:     'shimmer 2s linear infinite',
        'scale-in':  'scaleIn 0.5s ease-out forwards',
        'blink':     'blink 1.2s step-end infinite',
        'pulse-ring':'pulseRing 2s ease-out infinite',
      },

      keyframes: {
        floatA: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':     { transform: 'translateY(-18px) rotate(2deg)' },
          '66%':     { transform: 'translateY(-9px) rotate(-1deg)' },
        },
        floatB: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':     { transform: 'translateY(-22px) rotate(-3deg)' },
        },
        floatC: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '40%':     { transform: 'translateY(-12px) rotate(4deg)' },
          '80%':     { transform: 'translateY(-20px) rotate(-2deg)' },
        },
        spinRev: {
          from: { transform: 'rotate(360deg)' },
          to:   { transform: 'rotate(0deg)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        blink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
        pulseRing: {
          '0%':   { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },

      boxShadow: {
        // Hard editorial shadows
        'hard-sm':  '3px 3px 0px 0px #0A0A0A',
        'hard':     '5px 5px 0px 0px #0A0A0A',
        'hard-lg':  '8px 8px 0px 0px #0A0A0A',
        'hard-xl':  '12px 12px 0px 0px #0A0A0A',
        'hard-orange': '5px 5px 0px 0px #FF6B2B',
        // Soft shadows
        'card':     '0 2px 24px rgba(10,10,10,0.06)',
        'card-lg':  '0 8px 48px rgba(10,10,10,0.1)',
        'orange':   '0 8px 32px rgba(255,107,43,0.35)',
        'orange-lg':'0 16px 64px rgba(255,107,43,0.4)',
        'inner-top':'inset 0 2px 0 rgba(255,255,255,0.8)',
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      transitionTimingFunction: {
        'expo-out':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring':    'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':    'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      zIndex: {
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
      },
    },
  },
  plugins: [],
}

export default config
