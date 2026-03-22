'use client'

import { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

/**
 * A card with a radial gradient spotlight that follows the cursor.
 * Creates a gorgeous glow effect on hover — like Stripe's cards.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(255, 107, 43, 0.12)',
  spotlightSize = 350,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  spotlightColor?: string
  spotlightSize?: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`)
    el.style.setProperty('--spotlight-opacity', '1')
  }, [])

  const onLeave = useCallback(() => {
    const el = cardRef.current
    if (!el) return
    el.style.setProperty('--spotlight-opacity', '0')
  }, [])

  return (
    <div
      ref={cardRef}
      className={cn('spotlight-card relative overflow-hidden', className)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        '--spotlight-x': '50%',
        '--spotlight-y': '50%',
        '--spotlight-opacity': '0',
        '--spotlight-color': spotlightColor,
        '--spotlight-size': `${spotlightSize}px`,
      } as React.CSSProperties}
      {...props}
    >
      {/* The gradient spotlight layer */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity: 'var(--spotlight-opacity)',
          background: `radial-gradient(var(--spotlight-size) circle at var(--spotlight-x) var(--spotlight-y), var(--spotlight-color), transparent 60%)`,
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
