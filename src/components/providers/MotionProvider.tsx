'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { getPrefersReducedMotion } from '@/hooks/useGsapMotion'
import dynamic from 'next/dynamic'

// Dynamically load AnimatedBackground to prevent SSR hydration errors
const AnimatedBackground = dynamic(() => import('./AnimatedBackground'), { ssr: false })

// Register ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const MotionContext = createContext<{
  lenis: Lenis | null
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  season: 'spring' | 'summer' | 'autumn' | 'winter'
}>({
  lenis: null,
  timeOfDay: 'afternoon',
  season: 'summer',
})

export const useMotion = () => useContext(MotionContext)

// Seasonal helper based on month
function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

// Time of day helper
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 20) return 'evening'
  return 'night'
}

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [lenis, setLenis] = useState<Lenis | null>(null)
  
  const timeOfDay = getTimeOfDay()
  const season = getSeason()

  const backgroundRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Track cursor position for the spotlight
  const mousePos = useRef({ x: -1000, y: -1000 })
  const spotlightPos = useRef({ x: -1000, y: -1000 })

  // Initialize Lenis scroll and ScrollTrigger synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !contentRef.current) return

    const scrollContainer = contentRef.current

    // Set ScrollTrigger default scroller
    ScrollTrigger.defaults({ scroller: scrollContainer })

    

    const lenisInstance = new Lenis({
      wrapper: scrollContainer,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      infinite: false,
    })

    setLenis(lenisInstance)
    if (typeof window !== 'undefined') {
      (window as any).lenis = lenisInstance
    }

    // Configure ScrollTrigger scrollerProxy for the custom scroll wrapper
    ScrollTrigger.scrollerProxy(scrollContainer, {
      scrollTop(value) {
        if (value !== undefined) {
          lenisInstance.scrollTo(value, { immediate: true })
        }
        return lenisInstance.scroll
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      pinType: 'fixed'
    })

    // Ensure Lenis drives ScrollTrigger updates on scroll
    lenisInstance.on('scroll', () => {
      ScrollTrigger.update()
    })

    const tickHandler = (time: number) => {
      lenisInstance.raf(time * 1000)
    }
    gsap.ticker.add(tickHandler)
    gsap.ticker.lagSmoothing(0)

    // Track layout updates and trigger a debounced ScrollTrigger refresh
    let debounceTimer: NodeJS.Timeout | null = null
    let lastHeight = document.documentElement.scrollHeight

    const handleLayoutChange = () => {
      const currentHeight = document.documentElement.scrollHeight
      if (currentHeight !== lastHeight) {
        console.log(`[LayoutChange] Document height changed from ${lastHeight}px to ${currentHeight}px. Refreshing ScrollTrigger.`)
        lastHeight = currentHeight
        ScrollTrigger.refresh()
        lenisInstance.resize()
      }
    }

    const debouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(handleLayoutChange, 150)
    }

    // Set up ResizeObserver to track layout changes
    const resizeObserver = new ResizeObserver(() => {
      debouncedRefresh()
    })

    resizeObserver.observe(document.documentElement)
    if (document.body) {
      resizeObserver.observe(document.body)
    }
    const scrollContent = scrollContainer.querySelector('#main-scroll-content')
    if (scrollContent) {
      resizeObserver.observe(scrollContent)
    }

    // Listen to resize and orientation changes
    window.addEventListener('resize', debouncedRefresh)
    window.addEventListener('orientationchange', debouncedRefresh)

    // Capture image loading
    const handleImageLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        debouncedRefresh()
      }
    }
    window.addEventListener('load', handleImageLoad, true)

    // Track font loading
    if (document.fonts) {
      document.fonts.ready.then(() => {
        debouncedRefresh()
      })
    }

    // Track transitions/animations (sidebar changes, modal openings)
    const handleTransitionOrAnimationEnd = () => {
      debouncedRefresh()
    }
    window.addEventListener('transitionend', handleTransitionOrAnimationEnd)
    window.addEventListener('animationend', handleTransitionOrAnimationEnd)

    // Initial refresh after initialization
    ScrollTrigger.refresh()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lenisInstance.stop()
      } else {
        lenisInstance.start()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      resizeObserver.disconnect()
      window.removeEventListener('resize', debouncedRefresh)
      window.removeEventListener('orientationchange', debouncedRefresh)
      window.removeEventListener('load', handleImageLoad, true)
      window.removeEventListener('transitionend', handleTransitionOrAnimationEnd)
      window.removeEventListener('animationend', handleTransitionOrAnimationEnd)

      lenisInstance.destroy()
      gsap.ticker.remove(tickHandler)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Reset ScrollTrigger defaults scroller
      ScrollTrigger.defaults({ scroller: window })
    }
  }, [])

  // Page Transition Animation on route change (combining fade, scale, and blur)
  useGSAP(() => {
    if (getPrefersReducedMotion() || !contentRef.current) return

    gsap.fromTo(contentRef.current,
      { opacity: 0, scale: 0.985, filter: 'blur(6px)', y: 10 },
      { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' }
    )

    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
      // Wait for layout to settle after route transition completes
      const timer = setTimeout(() => {
        ScrollTrigger.refresh()
        lenis.resize()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, { dependencies: [pathname, lenis], scope: contentRef })

  // Scroll Storytelling independent scroll reveals with 3D depth, translation, and blur
  useGSAP(() => {
    if (typeof window === 'undefined') return

    // Allow DOM to finish mounting/hydrating
    const timer = setTimeout(() => {
      // Clear existing reveals to prevent double registration / leaks
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.id && t.vars.id.startsWith('reveal-')) {
          t.kill()
        }
      })

      if (getPrefersReducedMotion()) return

      const specs = [
        { selector: '.reveal-hero', y: 30, scale: 0.97, rotate: -0.5, blur: 8, delay: 0 },
        { selector: '.reveal-quick-actions', y: 20, scale: 0.98, rotate: 0.5, blur: 6, delay: 0.05 },
        { selector: '.reveal-feed', y: 35, scale: 1, rotate: 0, blur: 10, delay: 0.1 },
        { selector: '.reveal-communities', y: 25, scale: 0.98, rotate: 0.5, blur: 6, delay: 0.15 },
        { selector: '.reveal-study-hub', y: 30, scale: 0.97, rotate: -0.5, blur: 8, delay: 0 },
        { selector: '.reveal-marketplace', y: 30, scale: 0.97, rotate: 0.8, blur: 8, delay: 0 },
        { selector: '.reveal-coding-arena', y: 35, scale: 0.96, rotate: -1, blur: 10, delay: 0 },
        { selector: '.reveal-ai-assistant', y: 25, scale: 0.98, rotate: 0.5, blur: 6, delay: 0 }
      ]

      specs.forEach(({ selector, y, scale, rotate, blur, delay }) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((el, idx) => {
          // Initial visual state
          gsap.set(el, {
            opacity: 0,
            y,
            scale,
            rotateX: rotate * 3,
            rotateY: rotate * 3,
            z: -40,
            filter: `blur(${blur}px)`,
            transformPerspective: 1000,
          })

          ScrollTrigger.create({
            id: `reveal-${selector}-${idx}`,
            trigger: el,
            start: 'top 92%',
            once: true,
            onEnter: () => {
              gsap.to(el, {
                opacity: 1,
                y: 0,
                scale: 1,
                rotateX: 0,
                rotateY: 0,
                z: 0,
                filter: 'blur(0px)',
                duration: 1.0,
                delay,
                ease: 'power3.out',
                clearProps: 'transform,filter,rotateX,rotateY,z,scale,opacity',
              })
            }
          })
        })
      })

      ScrollTrigger.refresh()
    }, 120)

    return () => clearTimeout(timer)
  }, { dependencies: [pathname], scope: contentRef })

  // Mouse Spotlight Effect (desktop only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    let spotTicker: number
    const updateSpotlight = () => {
      if (!getPrefersReducedMotion() && spotlightRef.current) {
        // Linear interpolation for smooth lag
        spotlightPos.current.x += (mousePos.current.x - spotlightPos.current.x) * 0.08
        spotlightPos.current.y += (mousePos.current.y - spotlightPos.current.y) * 0.08

        spotlightRef.current.style.background = `radial-gradient(400px circle at ${spotlightPos.current.x}px ${spotlightPos.current.y}px, rgba(99, 102, 241, 0.04), transparent 80%)`
      }
      spotTicker = requestAnimationFrame(updateSpotlight)
    }
    updateSpotlight()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(spotTicker)
    }
  }, [])

  // Get dynamic background gradient configurations based on Time of Day
  const getAmbientGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'from-amber-950/15 via-zinc-950 to-sky-950/20'
      case 'afternoon':
        return 'from-sky-950/15 via-zinc-950 to-indigo-950/15'
      case 'evening':
        return 'from-rose-950/20 via-zinc-950 to-violet-950/20'
      case 'night':
      default:
        return 'from-indigo-950/20 via-zinc-950 to-neutral-950'
    }
  }

  return (
    <MotionContext.Provider value={{ lenis, timeOfDay, season }}>
      {/* Dynamic Ambient Background Layers */}
      <div 
        ref={backgroundRef}
        className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none transform-gpu"
      >
        {/* Layer 0: Animated Cinematic Sequence Background */}
        <AnimatedBackground />

        {/* Layer 1: Soft Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${getAmbientGradient()} opacity-10 transition-all duration-[3000ms]`} />

        {/* Dot Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Layer 2: Aurora Blobs */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-500 blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-500 blur-[150px] animate-pulse" style={{ animationDuration: '14s' }} />
        </div>

        {/* Layer 3: Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Layer 5: Client side cursor spotlight (floating glow) */}
        <div ref={spotlightRef} className="absolute inset-0 w-full h-full hidden md:block" />
      </div>

      {/* Glass Overlay (fixed, between background and scrollable app content) */}
      <div className="fixed inset-0 pointer-events-none z-[5] bg-zinc-950/10 backdrop-blur-[2px] transition-all duration-500" />

      {/* Layer 4: Content (Main Page Transition Containment Wrapper) */}
      <div ref={contentRef} id="main-scroll-container" className="w-full h-screen overflow-y-auto overflow-x-hidden flex flex-col relative z-10 custom-scrollbar">
        <div
  id="main-scroll-content"
  className="w-full flex flex-col"
  style={{ minHeight: "max-content" }}
>
          {children}
        </div>
      </div>
    </MotionContext.Provider>
  )
}
