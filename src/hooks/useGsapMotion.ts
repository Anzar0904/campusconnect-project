'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register ScrollTrigger on client-side
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Global premium easings
export const Easing = {
  // Apple/Linear style cubic-bezier easings
  premium: 'cubic-bezier(0.25, 1, 0.5, 1)',
  expoOut: 'expo.out',
  power3Out: 'power3.out',
  power4Out: 'power4.out',
  backOut: 'back.out(1.7)',
  slowMo: 'power1.inOut',
}

/**
 * Checks if user prefers reduced motion for accessibility
 */
export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Hook to stagger-reveal elements in a container.
 * Excellent for lists, dashboard cards, grid elements, feed posts, etc.
 */
export function useGsapReveal({
  stagger = 0.08,
  duration = 0.8,
  y = 24,
  x = 0,
  scale = 1,
  delay = 0,
  scrollTrigger = true,
} = {}) {
  const containerRef = useRef<any>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    if (getPrefersReducedMotion()) {
      // Accessibility bypass: instant fade
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, stagger: 0.02, ease: 'none' }
      )
      return
    }

    const items = containerRef.current.children
    if (items.length === 0) return

    const animationConfig: gsap.TweenVars = {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration,
      stagger,
      delay,
      ease: Easing.premium,
      overwrite: 'auto',
    }

    // Set initial values
    gsap.set(items, { opacity: 0, y, x, scale })

    if (scrollTrigger) {
      ScrollTrigger.batch(items, {
        onEnter: (batch) => {
          gsap.to(batch, animationConfig)
        },
        once: true,
      })
    } else {
      gsap.to(items, animationConfig)
    }
  }, { scope: containerRef })

  return containerRef
}

/**
 * Hook to animate number counting.
 * Excellent for points/XP widgets, statistic counters, rewards pages.
 */
export function useGsapNumberCounter(
  targetValue: number,
  duration = 1.5,
  delay = 0,
  suffix = ''
) {
  const elementRef = useRef<HTMLElement | null>(null)

  useGSAP(() => {
    if (!elementRef.current) return
    
    const obj = { value: 0 }
    
    gsap.to(obj, {
      value: targetValue,
      duration,
      delay,
      ease: Easing.premium,
      onUpdate: () => {
        if (elementRef.current) {
          elementRef.current.innerText = Math.floor(obj.value).toLocaleString() + suffix
        }
      },
    })
  }, [targetValue, duration, delay, suffix])

  return elementRef
}

/**
 * Hook to apply Apple/Linear style magnetic draw effect on a CTA button.
 */
export function useGsapMagnetic(strength = 0.35) {
  const buttonRef = useRef<HTMLElement | null>(null)

  useGSAP(() => {
    const el = buttonRef.current
    if (!el || getPrefersReducedMotion()) return

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    const onMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.3)',
      })
    }

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)

    return () => {
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
    }
  }, { scope: buttonRef })

  return buttonRef
}

/**
 * Hook to apply subtle 3D card tilt on hover.
 */
export function useGsapTilt(maxTilt = 8) {
  const cardRef = useRef<HTMLElement | null>(null)

  useGSAP(() => {
    const el = cardRef.current
    if (!el || getPrefersReducedMotion()) return

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const px = x / rect.width
      const py = y / rect.height
      const tiltX = (maxTilt / 2 - px * maxTilt).toFixed(2)
      const tiltY = (py * maxTilt - maxTilt / 2).toFixed(2)

      gsap.to(el, {
        rotateY: tiltX,
        rotateX: tiltY,
        transformPerspective: 800,
        ease: 'power2.out',
        duration: 0.25,
      })
    }

    const onMouseLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power2.out',
      })
    }

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)

    return () => {
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
    }
  }, { scope: cardRef })

  return cardRef
}

/**
 * Hook to apply gentle float animation.
 */
export function useGsapFloating(y = 10, duration = 2.5, delay = 0) {
  const elRef = useRef<HTMLElement | null>(null)

  useGSAP(() => {
    if (!elRef.current || getPrefersReducedMotion()) return

    gsap.fromTo(
      elRef.current,
      { y: -y / 2 },
      {
        y: y / 2,
        duration,
        delay,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      }
    )
  }, { scope: elRef })

  return elRef
}

/**
 * Custom cursor mouse follower logic (desktop only).
 */
export function useGsapCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || getPrefersReducedMotion()) return

    const cursor = cursorRef.current
    if (!cursor) return

    // Position cursor offscreen initially
    gsap.set(cursor, { xPercent: -50, yPercent: -50, x: -100, y: -100 })

    const onMouseMove = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out',
      })
    }

    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return cursorRef
}
