'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'

export default function MagneticCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const pos     = useRef({ x: 0, y: 0 })
  const follow  = useRef({ x: 0, y: 0 })
  const raf     = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      gsap.set(dot, { x: e.clientX - 5, y: e.clientY - 5 })
    }

    const tick = () => {
      follow.current.x += (pos.current.x - follow.current.x) * 0.1
      follow.current.y += (pos.current.y - follow.current.y) * 0.1
      gsap.set(ring, { x: follow.current.x - 18, y: follow.current.y - 18 })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    const onEnter = () => {
      gsap.to(dot,  { scale: 3, backgroundColor: '#FF6B2B', duration: 0.3, ease: 'expo.out' })
      gsap.to(ring, { scale: 0.4, opacity: 0.5, duration: 0.3 })
    }
    const onLeave = () => {
      gsap.to(dot,  { scale: 1, backgroundColor: '#0A0A0A', duration: 0.4, ease: 'expo.out' })
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.4 })
    }
    const onClick = () => {
      gsap.fromTo(dot, { scale: 1 }, {
        scale: 4, opacity: 0, duration: 0.4, ease: 'expo.out',
        onComplete: () => { gsap.set(dot, { scale: 1, opacity: 1 }) },
      })
    }

    document.querySelectorAll('a,button,[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
      document.querySelectorAll('a,button,[data-cursor]').forEach(el => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  return (
    <>
      <div ref={dotRef}
        className="custom-cursor pointer-events-none fixed left-0 top-0 z-[100] h-2.5 w-2.5 rounded-full bg-forge-black"
        style={{ willChange: 'transform' }} />
      <div ref={ringRef}
        className="custom-cursor pointer-events-none fixed left-0 top-0 z-[99] h-9 w-9 rounded-full border-2 border-forge-orange"
        style={{ willChange: 'transform' }} />
    </>
  )
}
