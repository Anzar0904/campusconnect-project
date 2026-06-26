'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { getPrefersReducedMotion } from '@/hooks/useGsapMotion'

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
  const month = new Date().getMonth() // 0-indexed: 0=Jan, 11=Dec
  if (month >= 2 && month <= 4) return 'spring'   // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'summer'   // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return 'autumn'  // Sep, Oct, Nov
  return 'winter'                                 // Dec, Jan, Feb
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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Track cursor position for the spotlight
  const mousePos = useRef({ x: -1000, y: -1000 })
  const spotlightPos = useRef({ x: -1000, y: -1000 })

  // Initialize Lenis scroll
  useEffect(() => {
    if (typeof window === 'undefined') return

    const lenisInstance = new Lenis({
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

    // Sync Lenis with GSAP ScrollTrigger
    lenisInstance.on('scroll', ScrollTrigger.update)

    const tickHandler = (time: number) => {
      lenisInstance.raf(time * 1000)
    }
    gsap.ticker.add(tickHandler)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenisInstance.destroy()
      gsap.ticker.remove(tickHandler)
    }
  }, [])

  // Page Transition Animation on route change
  useGSAP(() => {
    if (getPrefersReducedMotion() || !contentRef.current) return

    // Centralised Page Transition Reveal
    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', clearProps: 'y' }
    )

    // Reset scroll positions
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    }
  }, { dependencies: [pathname, lenis], scope: contentRef })

  // Mouse Spotlight Effect & Canvas Particle Loop
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Mouse Tracking for spotlight & ambient parallax
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Spotlights tick
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

    // 2. Canvas Particles Simulation (Subtle & high performance)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth
        height = canvas.height = window.innerHeight
      }
    }
    window.addEventListener('resize', handleResize)

    // Setup seasonal particles
    interface Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      color: string
      angle?: number
      spinSpeed?: number
    }

    const particles: Particle[] = []
    const maxParticles = getPrefersReducedMotion() ? 0 : 35

    const initParticle = (p: Partial<Particle> = {}): Particle => {
      const size = Math.random() * 2 + 1
      let color = 'rgba(255, 255, 255, 0.3)'

      // Theme-specific colors
      if (season === 'spring') {
        color = `rgba(244, 180, 200, ${Math.random() * 0.3 + 0.15})` // Cherry blossom pink
      } else if (season === 'summer') {
        color = `rgba(253, 224, 71, ${Math.random() * 0.25 + 0.1})`  // Warm golden sunbeams
      } else if (season === 'autumn') {
        color = `rgba(${200 + Math.random() * 55}, ${100 + Math.random() * 100}, 40, ${Math.random() * 0.25 + 0.1})` // Auburn/Amber leaves
      } else if (season === 'winter') {
        color = `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.2})`   // Snow crystal white
      }

      return {
        x: p.x ?? Math.random() * width,
        y: p.y ?? Math.random() * height,
        size,
        speedX: p.speedX ?? (Math.random() * 0.4 - 0.2) + (season === 'spring' || season === 'autumn' ? 0.3 : 0),
        speedY: p.speedY ?? (Math.random() * 0.5 + 0.1) * (season === 'winter' ? 1.2 : 0.8),
        opacity: Math.random() * 0.4 + 0.1,
        color,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() * 0.02 - 0.01),
      }
    }

    // Populate initial particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(initParticle())
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height)

      // Only run simulation if the window tab is active and visible to prevent idle CPU cycles
      if (document.visibilityState === 'visible') {
        particles.forEach((p, idx) => {
          // Update positions
          p.y += p.speedY
          p.x += p.speedX
          if (p.angle !== undefined && p.spinSpeed !== undefined) {
            p.angle += p.spinSpeed
          }

          // Wrap around screen boundaries
          if (p.y > height) {
            particles[idx] = initParticle({ y: -10 })
          } else if (p.x > width) {
            particles[idx] = initParticle({ x: -10 })
          } else if (p.x < -10) {
            particles[idx] = initParticle({ x: width + 10 })
          }

          // Draw the custom shape depending on the season
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.angle || 0)
          ctx.fillStyle = p.color
          ctx.shadowBlur = season === 'summer' || season === 'winter' ? 6 : 0
          ctx.shadowColor = p.color

          if (season === 'spring' || season === 'autumn') {
            // Draw leaf/petal paths
            ctx.beginPath()
            ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2)
            ctx.fill()
          } else {
            // Draw soft dots/snowflakes
            ctx.beginPath()
            ctx.arc(0, 0, p.size, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.restore()
        })
      }

      animationFrameId = requestAnimationFrame(drawParticles)
    }

    if (maxParticles > 0) {
      drawParticles()
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(spotTicker)
      cancelAnimationFrame(animationFrameId)
    }
  }, [season])

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
      {/* Dynamic Ambient Background Nodes */}
      <div 
        ref={backgroundRef}
        className="fixed inset-0 pointer-events-none -z-50 overflow-hidden select-none bg-zinc-950"
      >
        {/* Living Time-based Layered CSS Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${getAmbientGradient()} opacity-80 transition-all duration-[3000ms]`} />

        {/* Dynamic Vercel-like Dot Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient Aurora blobs */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-500 blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-500 blur-[150px] animate-pulse" style={{ animationDuration: '14s' }} />
        </div>

        {/* Interactive canvas particle storm */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Client side cursor spotlight (desktop only) */}
        <div ref={spotlightRef} className="absolute inset-0 w-full h-full hidden md:block" />

        {/* Noise overlay texture */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Main Page Transition Containment Wrapper */}
      <div ref={contentRef} className="w-full min-h-screen flex flex-col">
        {children}
      </div>
    </MotionContext.Provider>
  )
}
