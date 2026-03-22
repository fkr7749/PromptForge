'use client'

import { useEffect, useRef } from 'react'

/**
 * Attaches an IntersectionObserver to a container ref.
 * Any child with [data-reveal] will get the "revealed" class when 60% visible.
 */
export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            const delay = target.dataset.revealDelay ?? '0'
            setTimeout(() => {
              target.classList.add('revealed')
            }, Number(delay))
            observer.unobserve(target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '-40px', ...options }
    )

    targets.forEach(t => observer.observe(t))
    return () => observer.disconnect()
  }, [])

  return ref
}
