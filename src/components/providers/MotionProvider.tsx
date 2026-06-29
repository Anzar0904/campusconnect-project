'use client'

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { getPrefersReducedMotion } from '@/hooks/useGsapMotion'
import dynamic from 'next/dynamic'

// Dynamically load AnimatedBackground to prevent SSR hydration errors
const AnimatedBackground = dynamic(() => import('./AnimatedBackground'), { ssr: false })

// Register GSAP plugins once at module level — safe to call multiple times
gsap.registerPlugin(ScrollTrigger)

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

function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

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

  // Memoized — these don't change within a session, no need to recompute on every render
  const timeOfDay = useMemo(() => getTimeOfDay(), [])
  const season = useMemo(() => getSeason(), [])

  const backgroundRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Use ref to track lenis instance for cleanup — avoids stale closure issues
  const lenisRef = useRef<Lenis | null>(null)

  // Track cursor position for the spotlight
  const mousePos = useRef({ x: -1000, y: -1000 })
  const spotlightPos = useRef({ x: -1000, y: -1000 })

  // Initialize Lenis scroll and ScrollTrigger synchronization using useLayoutEffect for deterministic DOM readiness
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    // Ensure the scroll container exists before initializing Lenis
    const scrollContainer = contentRef.current;
    if (!scrollContainer) return;

    // Clean up any previous Lenis instance (important for React Strict Mode double mounting)
    if (lenisRef.current) {
      lenisRef.current.destroy();
      lenisRef.current = null;
    }

    // Create Lenis instance attached to the custom scroll container
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
      overscroll: false,
    });

    lenisRef.current = lenisInstance;
    setLenis(lenisInstance);
    (window as any).lenis = lenisInstance;

    // Configure ScrollTrigger to use Lenis as the scroller proxy
    ScrollTrigger.defaults({ scroller: scrollContainer });
    ScrollTrigger.scrollerProxy(scrollContainer, {
      scrollTop(value?: number) {
        if (arguments.length && value !== undefined) {
          lenisInstance.scrollTo(value, { immediate: true });
        }
        return lenisInstance.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
      pinType: 'fixed',
    });

    // Sync ScrollTrigger on Lenis scroll events
    lenisInstance.on('scroll', ScrollTrigger.update);

    // Connect GSAP ticker to Lenis RAF (GSAP provides seconds, Lenis expects ms)
    const tickHandler = (time: number) => lenisInstance.raf(time * 1000);
    gsap.ticker.add(tickHandler);
    gsap.ticker.lagSmoothing(0);

    // Debounced resize/layout change handling
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let lastHeight = scrollContainer.scrollHeight;
    const handleLayoutChange = () => {
      const currentHeight = scrollContainer.scrollHeight;
      if (currentHeight !== lastHeight) {
        lastHeight = currentHeight;
        ScrollTrigger.refresh();
        lenisInstance.resize();
      }
    };
    const debouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleLayoutChange, 200);
    };
    const resizeObserver = new ResizeObserver(debouncedRefresh);
    const scrollContent = scrollContainer.querySelector('#main-scroll-content');
    if (scrollContent) resizeObserver.observe(scrollContent);
    window.addEventListener('resize', debouncedRefresh, { passive: true });
    window.addEventListener('orientationchange', debouncedRefresh, { passive: true });

    // Pause/resume Lenis on page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lenisInstance.stop();
      } else {
        lenisInstance.start();
        ScrollTrigger.refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial refresh after Lenis setup
    ScrollTrigger.refresh();

    // Attach a cleanup function directly to the scroll container for safe unmount handling
    (scrollContainer as any).__lenisCleanup = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedRefresh);
      window.removeEventListener('orientationchange', debouncedRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      lenisInstance.off('scroll', ScrollTrigger.update);
      gsap.ticker.remove(tickHandler);
      // Reset ScrollTrigger defaults and kill all triggers
      ScrollTrigger.scrollerProxy(scrollContainer, undefined as any);
      ScrollTrigger.defaults({ scroller: window });
      ScrollTrigger.getAll().forEach((t) => t.kill());
      lenisInstance.destroy();
      lenisRef.current = null;
      (window as any).lenis = null;
    };

    // Cleanup on component unmount
    return () => {
      if (scrollContainer && (scrollContainer as any).__lenisCleanup) {
        (scrollContainer as any).__lenisCleanup();
      } else if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      setLenis(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Page transition animation + scroll reset on route change
  useGSAP(() => {
    if (getPrefersReducedMotion() || !contentRef.current) return

    gsap.fromTo(
      contentRef.current,
      { opacity: 0, scale: 0.985, filter: 'blur(6px)', y: 10 },
      { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'all' }
    )

    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
      const timer = setTimeout(() => {
        ScrollTrigger.refresh()
        lenis.resize()
      }, 550)
      return () => clearTimeout(timer)
    }
  }, { dependencies: [pathname, lenis], scope: contentRef })

  // Scroll reveal triggers — registered after mount, scoped to current route
  useGSAP(() => {
    if (typeof window === 'undefined') return

    const timer = setTimeout(() => {
      // Kill previous reveal triggers before re-registering
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.id && typeof t.vars.id === 'string' && t.vars.id.startsWith('reveal-')) {
          t.kill()
        }
      })

      if (getPrefersReducedMotion()) return

      const scrollContainer = contentRef.current
      if (!scrollContainer) return

      const specs = [
        { selector: '.reveal-hero', y: 30, scale: 0.97, rotate: -0.5, blur: 8, delay: 0 },
        { selector: '.reveal-quick-actions', y: 20, scale: 0.98, rotate: 0.5, blur: 6, delay: 0.05 },
        { selector: '.reveal-feed', y: 35, scale: 1, rotate: 0, blur: 10, delay: 0.1 },
        { selector: '.reveal-communities', y: 25, scale: 0.98, rotate: 0.5, blur: 6, delay: 0.15 },
        { selector: '.reveal-study-hub', y: 30, scale: 0.97, rotate: -0.5, blur: 8, delay: 0 },
        { selector: '.reveal-marketplace', y: 30, scale: 0.97, rotate: 0.8, blur: 8, delay: 0 },
        { selector: '.reveal-coding-arena', y: 35, scale: 0.96, rotate: -1, blur: 10, delay: 0 },
        { selector: '.reveal-ai-assistant', y: 25, scale: 0.98, rotate: 0.5, blur: 6, delay: 0 },
      ]

      specs.forEach(({ selector, y, scale, rotate, blur, delay }) => {
        const elements = scrollContainer.querySelectorAll(selector)
        elements.forEach((el, idx) => {
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
            scroller: scrollContainer,
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
            },
          })
        })
      })

      ScrollTrigger.refresh()
    }, 150)

    return () => clearTimeout(timer)
  }, { dependencies: [pathname], scope: contentRef })

  // Mouse spotlight (desktop only) — RAF loop with proper cleanup
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    let rafId: number
    const updateSpotlight = () => {
      if (!getPrefersReducedMotion() && spotlightRef.current) {
        spotlightPos.current.x += (mousePos.current.x - spotlightPos.current.x) * 0.08
        spotlightPos.current.y += (mousePos.current.y - spotlightPos.current.y) * 0.08
        spotlightRef.current.style.background = `radial-gradient(400px circle at ${spotlightPos.current.x}px ${spotlightPos.current.y}px, rgba(99, 102, 241, 0.04), transparent 80%)`
      }
      rafId = requestAnimationFrame(updateSpotlight)
    }
    rafId = requestAnimationFrame(updateSpotlight)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

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
      {/* Fixed Background Layers */}
      <div
        ref={backgroundRef}
        className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none transform-gpu"
        aria-hidden="true"
      >
        {/* Layer 0: Animated Cinematic Sequence Background */}
        <AnimatedBackground />

        {/* Layer 1: Soft Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${getAmbientGradient()} opacity-10`} />

        {/* Dot Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Layer 2: Aurora Blobs — low opacity, GPU-composited */}
        <div className="absolute inset-0 opacity-[0.02]" aria-hidden="true">
          <div
            className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-500 blur-[150px]"
            style={{ animation: 'pulse 10s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
          <div
            className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-500 blur-[150px]"
            style={{ animation: 'pulse 14s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
        </div>

        {/* Layer 3: Noise Texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Layer 5: Cursor spotlight */}
        <div ref={spotlightRef} className="absolute inset-0 w-full h-full hidden md:block" />
      </div>

      {/* Main scrollable content container */}
      <div
        ref={contentRef}
        id="main-scroll-container"
        className="w-full h-screen overflow-y-auto overflow-x-hidden flex flex-col relative z-10 custom-scrollbar"
        style={{ overscrollBehavior: 'none' }}
      >
        <div
          id="main-scroll-content"
          className="w-full flex flex-col"
          style={{ minHeight: 'max-content' }}
        >
          {children}
        </div>
      </div>
    </MotionContext.Provider>
  )
}
