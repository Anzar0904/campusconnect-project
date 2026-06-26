'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getPrefersReducedMotion } from '@/hooks/useGsapMotion'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const FRAME_COUNT = 192

function getFrameUrl(index: number) {
  return `/background-sequence/frame_${String(index).padStart(3, '0')}.png`
}

export default function SequenceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([])
  const playhead = useRef({ frame: 1 })
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const isClient = typeof window !== 'undefined'

  // Frame rendering helpers using requestAnimationFrame throttle
  const lastRenderedFrame = useRef<number>(-1)
  const renderRequested = useRef<boolean>(false)

  // Outward-search helper to find the closest loaded frame to targetIndex
  const getClosestLoadedImage = useCallback((targetIndex: number) => {
    if (imagesRef.current[targetIndex]) {
      return imagesRef.current[targetIndex]
    }
    for (let i = 1; i < FRAME_COUNT; i++) {
      const left = targetIndex - i
      const right = targetIndex + i
      if (left >= 0 && imagesRef.current[left]) {
        return imagesRef.current[left]
      }
      if (right < FRAME_COUNT && imagesRef.current[right]) {
        return imagesRef.current[right]
      }
    }
    return null
  }, [])

  // Draw target frame on Canvas matching object-fit: cover
  const renderFrame = useCallback((index: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const targetIndex = Math.min(Math.max(1, index), FRAME_COUNT) - 1
    const img = getClosestLoadedImage(targetIndex)

    const cw = canvas.width
    const ch = canvas.height

    if (img && img.complete) {
      const iw = img.width
      const ih = img.height

      const hRatio = cw / iw
      const vRatio = ch / ih
      const ratio = Math.max(hRatio, vRatio)

      const cx = (cw - iw * ratio) / 2
      const cy = (ch - ih * ratio) / 2

      context.fillStyle = '#020205' // Fallback deep color
      context.fillRect(0, 0, cw, ch)
      context.drawImage(img, 0, 0, iw, ih, cx, cy, iw * ratio, ih * ratio)
    } else {
      context.fillStyle = '#020205'
      context.fillRect(0, 0, cw, ch)
    }
  }, [getClosestLoadedImage])

  // Request render frame safely enqueued via rAF
  const requestRender = useCallback((frame: number) => {
    if (lastRenderedFrame.current === frame) return
    lastRenderedFrame.current = frame
    if (renderRequested.current) return
    renderRequested.current = true
    requestAnimationFrame(() => {
      renderRequested.current = false
      renderFrame(lastRenderedFrame.current)
    })
  }, [renderFrame])

  // Determine step size based on viewport width
  const getStepSize = () => {
    if (typeof window === 'undefined') return 1
    const width = window.innerWidth
    if (width < 768) return 4       // Mobile loads ~48 frames (25% memory/load)
    if (width < 1024) return 2      // Tablet loads ~96 frames (50% memory/load)
    return 1                        // Desktop loads full sequence
  }

  // Load and cache frames adaptively
  useEffect(() => {
    if (!isClient) return
    
    const reduced = getPrefersReducedMotion()
    setIsReducedMotion(reduced)

    if (imagesRef.current.length === 0) {
      imagesRef.current = new Array(FRAME_COUNT).fill(null)
    }

    const loadImages = async () => {
      const step = getStepSize()

      // 1. Load the first frame immediately to unblock initial display
      const img1 = new Image()
      img1.src = getFrameUrl(1)
      await new Promise<void>(resolve => {
        img1.onload = () => resolve()
        img1.onerror = () => resolve()
      })
      imagesRef.current[0] = img1
      setIsLoaded(true)
      requestRender(1)

      if (reduced) return

      // 2. Preload immediate next few frames based on step to enable immediate scroll response
      const immediateFrames: number[] = []
      for (let i = 1 + step; i <= 1 + 15 * step && i <= FRAME_COUNT; i += step) {
        immediateFrames.push(i)
      }

      await Promise.all(immediateFrames.map(f => {
        return new Promise<void>(resolve => {
          const img = new Image()
          img.src = getFrameUrl(f)
          img.onload = () => {
            imagesRef.current[f - 1] = img
            resolve()
          }
          img.onerror = () => resolve()
        })
      }))

      // Force render of first/current frame now that initial batch is ready
      requestRender(Math.round(playhead.current.frame))

      // 3. Lazy load remaining step-based frames in chunks to prevent thread blocking
      const remainingFrames: number[] = []
      for (let i = 1; i <= FRAME_COUNT; i += step) {
        if (i !== 1 && !immediateFrames.includes(i)) {
          remainingFrames.push(i)
        }
      }

      let currentIndex = 0
      const lazyLoad = () => {
        const end = Math.min(currentIndex + 8, remainingFrames.length)
        for (let i = currentIndex; i < end; i++) {
          const f = remainingFrames[i]
          const img = new Image()
          img.src = getFrameUrl(f)
          img.onload = () => {
            imagesRef.current[f - 1] = img
            requestRender(Math.round(playhead.current.frame))
          }
        }
        currentIndex = end
        if (currentIndex < remainingFrames.length) {
          setTimeout(lazyLoad, 60) // Yield main thread
        }
      }
      setTimeout(lazyLoad, 150)
    }

    loadImages()
  }, [isClient, requestRender])

  // Handle responsive canvas sizing & high DPI scaling
  useEffect(() => {
    if (!isClient) return
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      
      requestRender(Math.round(playhead.current.frame))
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [isClient, requestRender])

  // GSAP ScrollTrigger timeline to scrub sequence frames
  useEffect(() => {
    if (!isClient || isReducedMotion || !isLoaded) return

    let tl: gsap.core.Tween | null = null

    const timer = setTimeout(() => {
      tl = gsap.to(playhead.current, {
        frame: FRAME_COUNT,
        snap: 'frame',
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.25,
        },
        onUpdate: () => {
          requestRender(Math.round(playhead.current.frame))
        }
      })

      ScrollTrigger.refresh()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (tl) {
        tl.kill()
      }
    }
  }, [isClient, isReducedMotion, isLoaded, requestRender])

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      {/* Premium Glass Overlay on top of sequence background */}
      <div className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[3px] pointer-events-none transition-all duration-500" />
    </div>
  )
}
