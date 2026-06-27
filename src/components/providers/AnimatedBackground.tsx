'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
  ;(window as any).gsap = gsap
  ;(window as any).ScrollTrigger = ScrollTrigger
}

const FRAME_COUNT = 192

function getFrameUrl(index: number) {
  return `/background-sequence/frame_${String(index).padStart(3, '0')}.png`
}

export default function AnimatedBackground() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Cache of preloaded Image objects
  const imagesRef = useRef<(HTMLImageElement | null)[]>([])
  
  // Loading states
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadedProgress, setLoadedProgress] = useState(0)
  const [loadedFrames, setLoadedFrames] = useState(0)

  // Tracker refs for render loops and duplicate draw avoidance
  const lastRenderedFrame = useRef<number>(-1)
  const renderRequested = useRef<boolean>(false)
  const lastKnownFrameIndex = useRef<number>(1)

  // Direct DOM references for debugging UI to bypass React state updates (60 FPS support)
  const debugFrameRef = useRef<HTMLSpanElement>(null)
  const debugScrollRef = useRef<HTMLSpanElement>(null)
  const debugFpsRef = useRef<HTMLSpanElement>(null)
  const debugResolutionRef = useRef<HTMLSpanElement>(null)

  // Draw loop execution logic (Object-Fit: Cover)
  const renderFrame = useCallback((index: number) => {
    console.log(`[drawFrame] executes for index: ${index}`)
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const targetIndex = Math.min(Math.max(1, index), FRAME_COUNT)
    const img = imagesRef.current[targetIndex - 1]
    
    if (!img || !img.complete) {
      console.log(`[drawFrame] Frame ${targetIndex} image not loaded/complete yet.`)
      return
    }

    const cw = canvas.width
    const ch = canvas.height
    const iw = img.width
    const ih = img.height

    const hRatio = cw / iw
    const vRatio = ch / ih
    const ratio = Math.max(hRatio, vRatio)

    const cx = (cw - iw * ratio) / 2
    const cy = (ch - ih * ratio) / 2

    try {
      context.drawImage(img, 0, 0, iw, ih, cx, cy, iw * ratio, ih * ratio)
      console.log(`[drawFrame] successfully drew frame ${targetIndex}`)
    } catch (err) {
      console.error(`[AnimatedBackground] Draw failed for frame ${targetIndex}:`, err)
    }
  }, [])

  // Request frame drawing queued under requestAnimationFrame
  const requestRender = useCallback((frame: number) => {
    lastKnownFrameIndex.current = frame
    if (lastRenderedFrame.current === frame) return
    lastRenderedFrame.current = frame
    
    if (renderRequested.current) return
    renderRequested.current = true
    
    requestAnimationFrame(() => {
      renderRequested.current = false
      renderFrame(lastRenderedFrame.current)
    })
  }, [renderFrame])

  // Sequential worker pool image preloader
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (imagesRef.current.length === 0) {
      imagesRef.current = new Array(FRAME_COUNT).fill(null)
    }

    const preloadImages = async () => {
      const urls = Array.from({ length: FRAME_COUNT }, (_, i) => getFrameUrl(i + 1))
      const total = urls.length
      let count = 0
      
      const concurrency = 8
      const queue = [...urls.entries()]
      
      const worker = async () => {
        while (queue.length > 0) {
          const item = queue.shift()
          if (!item) break
          const [index, url] = item
          
          try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image()
              image.src = url
              image.onload = () => resolve(image)
              image.onerror = () => reject(new Error(`Failed to load image: ${url}`))
            })
            imagesRef.current[index] = img
          } catch (err) {
            console.error(`[AnimatedBackground] Preloading failed for: ${url}`, err)
          } finally {
            count++
            console.log(`Frames loaded: ${count}`)
            setLoadedProgress(Math.round((count / total) * 100))
            setLoadedFrames(count)
          }
        }
      }

      await Promise.all(Array.from({ length: concurrency }, () => worker()))
      setIsLoaded(true)
    };

    preloadImages()
  }, [])

  // Initial draw loop setup once all frames are cached
  useEffect(() => {
    if (isLoaded) {
      lastRenderedFrame.current = -1
      requestRender(1)
    }
  }, [isLoaded, requestRender])

  // Responsive layout resizing and high-DPI scaling
  useEffect(() => {
    if (typeof window === 'undefined') return
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.round(rect.width * dpr)
      const height = Math.round(rect.height * dpr)

      canvas.width = width
      canvas.height = height
      
      console.log(`Canvas initialized: ${width}x${height}`)
      if (debugResolutionRef.current) {
        debugResolutionRef.current.innerText = `${width} x ${height}`
      }

      // Reset cache and redraw last known frame immediately
      lastRenderedFrame.current = -1
      requestRender(lastKnownFrameIndex.current)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [isLoaded, requestRender])

  // GSAP ScrollTrigger timeline sync
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return

    let triggerInstance: ScrollTrigger | null = null
    const resizeObserver = new ResizeObserver(() => {
  ScrollTrigger.refresh()
})

const scroller = document.getElementById("main-scroll-container")
const content = document.getElementById("main-scroll-content")

if (scroller) resizeObserver.observe(scroller)
if (content) resizeObserver.observe(content)

    const initScrollTrigger = () => {
      // Clean up previous triggers for this component to prevent double registering
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.id === 'global-background-scroll-trigger') {
          t.kill()
        }
      })

      triggerInstance = ScrollTrigger.create({
        id: 'global-background-scroll-trigger',
        trigger: '#main-scroll-container',
        scroller: '#main-scroll-container',
        start: 'top top',
        end: () =>
  document.getElementById("main-scroll-container")!.scrollHeight -
  document.getElementById("main-scroll-container")!.clientHeight,
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress
          const docHeight = typeof document !== 'undefined' ? document.documentElement.scrollHeight : 0
          const loadedCount = imagesRef.current.filter(Boolean).length
          
          // Map progress directly to frame index
          const targetFrame = Math.min(
            FRAME_COUNT,
            Math.max(1, Math.round(progress * (FRAME_COUNT - 1)) + 1)
          )

          console.log(
            `[ScrollTrigger Update] | ` +
            `Document Height: ${docHeight}px | ` +
            `ScrollTrigger Start: ${self.start} | ` +
            `ScrollTrigger End: ${self.end} | ` +
            `Scroll Progress: ${progress.toFixed(4)} | ` +
            `Frame Index: ${targetFrame} | ` +
            `Total Frames Loaded: ${loadedCount}`
          )

          requestRender(targetFrame)

          // Direct DOM node updates for FPS/Frame counter debug panels
          if (debugFrameRef.current) {
            debugFrameRef.current.innerText = String(targetFrame)
          }
          if (debugScrollRef.current) {
            debugScrollRef.current.innerText = `${Math.round(progress * 100)}%`
          }
        }
      })
      requestAnimationFrame(() => {
    ScrollTrigger.refresh();
});

setTimeout(() => {
    ScrollTrigger.refresh();
}, 500);

setTimeout(() => {
    ScrollTrigger.refresh();
}, 1500);

      ScrollTrigger.refresh()
      requestAnimationFrame(() => {
  ScrollTrigger.refresh()
})

setTimeout(() => {
  ScrollTrigger.refresh()
}, 1000)
    }

    // Wrap in a short timeout to let NextJS finish hydration/rendering
   initScrollTrigger()

return () => {
  if (triggerInstance) {
    triggerInstance.kill()
  }
}
  }, [isLoaded, requestRender, pathname])

  // Track and show performance metric FPS counter
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return

    let lastTime = performance.now()
    let count = 0
    let animId: number

    const tick = () => {
      count++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        const fps = Math.round((count * 1000) / (now - lastTime))
        count = 0
        lastTime = now
        if (debugFpsRef.current) {
          debugFpsRef.current.innerText = `${fps} FPS`
        }
      }
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [isLoaded])

  return (
    <>
      {/* Full screen fixed canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: -1,
          display: 'block',
        }}
      />

      {/* Loading panel overlay */}
      {!isLoaded && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            color: '#ffffff',
            pointerEvents: 'auto',
          }}
        >
          <div 
            style={{
              padding: '24px',
              backgroundColor: 'rgba(20, 20, 25, 0.8)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'center',
              width: '320px',
            }}
          >
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderTopColor: '#3b82f6',
                animation: 'spin 1s linear infinite',
              }}
            />
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}} />
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Loading Experience</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#71717a' }}>Preloading campus showcase sequence...</p>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${loadedProgress}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.15s ease-out' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'between', width: '100%', fontSize: '10px', fontFamily: 'monospace', color: '#a1a1aa' }}>
              <span style={{ marginRight: 'auto' }}>{loadedProgress}%</span>
              <span>{loadedFrames} / {FRAME_COUNT}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
