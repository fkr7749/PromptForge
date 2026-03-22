'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin)
}

export { gsap, ScrollTrigger }

// ─── Reusable animation presets ───
export const fadeUp = (element: gsap.TweenTarget, delay = 0, duration = 0.8) =>
  gsap.fromTo(
    element,
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration,
      delay,
      ease: 'expo.out',
    }
  )

export const staggerFadeUp = (
  elements: gsap.TweenTarget,
  stagger = 0.1,
  delay = 0
) =>
  gsap.fromTo(
    elements,
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      delay,
      stagger,
      ease: 'expo.out',
    }
  )

export const createScrollReveal = (
  element: gsap.TweenTarget,
  trigger: Element | string,
  options?: gsap.TweenVars
) => {
  return gsap.fromTo(
    element,
    { y: 60, opacity: 0, ...options },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
    }
  )
}

export const drawSVGPath = (path: SVGPathElement, trigger: Element | string) => {
  const length = path.getTotalLength()
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
  return gsap.to(path, {
    strokeDashoffset: 0,
    duration: 2,
    ease: 'power2.inOut',
    scrollTrigger: {
      trigger,
      start: 'top 70%',
      end: 'bottom 30%',
      scrub: 1,
    },
  })
}
