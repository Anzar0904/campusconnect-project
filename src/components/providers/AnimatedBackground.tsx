'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// NOTE: ScrollTrigger is already registered in MotionProvider — do not re-register here.

const FRAME_COUNT = 192

function getFrameUrl(index: number) {
  return `/background-sequence/frame_${String(index).padStart(3, '0')}.png`
}

export default function AnimatedBackground() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Sparse cache: index → loaded HTMLImageElement (or undefined if not yet loaded)
  const imagesRef = useRef<(HTMLImageElement | undefined)[]>(
    new Array(FRAME_COUNT).fill(undefined)
  )

  // Track how many frames have been loaded (used only for deciding readiness)
  const loadedCountRef = useRef(0)

  // Whether the very first frame is ready to paint
  const [firstFrameReady, setFirstFrameReady] = useState(false)

  // Tracker refs for render loops and duplicate draw avoidance
  const lastRenderedFrame = useRef<number>(-1)
  const renderRequested = useRef<boolean>(false)
  const lastKnownFrameIndex = useRef<number>(1)

  // ─── Draw logic (Object-Fit: Cover) ───────────────────────────────────────
  const renderFrame = useCallback((index: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const targetIndex = Math.min(Math.max(1, index), FRAME_COUNT)

    // Walk backwards from targetIndex to find the nearest loaded frame so the
    // canvas never shows a blank — frame 1 is always loaded first, so this
    // will always resolve.
    let img: HTMLImageElement | undefined
    for (let i = targetIndex - 1; i >= 0; i--) {
      const candidate = imagesRef.current[i]
      if (candidate && candidate.complete && candidate.naturalWidth > 0) {
        img = candidate
        break
      }
    }

    if (!img) return

    const cw = canvas.width
    const ch = canvas.height
    const iw = img.naturalWidth
    const ih = img.naturalHeight

    const hRatio = cw / iw
    const vRatio = ch / ih
    const ratio = Math.max(hRatio, vRatio)

    const cx = (cw - iw * ratio) / 2
    const cy = (ch - ih * ratio) / 2

    try {
      context.drawImage(img, 0, 0, iw, ih, cx, cy, iw * ratio, ih * ratio)
    } catch {
      // Silently ignore draw errors (e.g. canvas detached during navigation)
    }
  }, [])

  // Queues a paint under rAF, deduplicating rapid calls
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

  // ─── Loading strategy ─────────────────────────────────────────────────────
  // Phase 1: load frame 1 immediately → paint + reveal app
  // Phase 2: load remaining frames 2–192 sequentially in the background
  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false

    const loadImage = (index: number): Promise<void> =>
      new Promise((resolve) => {
        // Already loaded (e.g. from browser cache)
        const existing = imagesRef.current[index]
        if (existing && existing.complete && existing.naturalWidth > 0) {
          resolve()
          return
        }

        const img = new Image()
        img.src = getFrameUrl(index + 1) // index is 0-based; filenames are 1-based
        img.onload = () => {
          if (!cancelled) {
            imagesRef.current[index] = img
            loadedCountRef.current += 1

            // Re-render current frame whenever a new frame lands so the
            // sequence updates live without waiting for all frames.
            const current = lastKnownFrameIndex.current
            if (index + 1 === current) {
              lastRenderedFrame.current = -1 // force repaint
              requestRender(current)
            }
          }
          resolve()
        }
        img.onerror = () => resolve() // skip silently; sequence will show nearest loaded frame
      })

    const run = async () => {
      // ── Phase 1: first frame only ────────────────────────────────────────
      await loadImage(0)
      if (cancelled) return

      setFirstFrameReady(true)

      // ── Phase 2: rest of the sequence, 4 concurrent workers ─────────────
      const remaining = Array.from({ length: FRAME_COUNT - 1 }, (_, i) => i + 1)
      const queue = [...remaining]

      const worker = async () => {
        while (queue.length > 0) {
          if (cancelled) return
          const idx = queue.shift()
          if (idx === undefined) return
          await loadImage(idx)
        }
      }

      // 4 workers — keeps network busy without saturating it
      await Promise.all([worker(), worker(), worker(), worker()])
    }

    run()

    return () => {
      cancelled = true
    }
  }, [requestRender])

  // ─── Initial paint once frame 1 is ready ──────────────────────────────────
  useEffect(() => {
    if (firstFrameReady) {
      lastRenderedFrame.current = -1
      requestRender(1)
    }
  }, [firstFrameReady, requestRender])

  // ─── Responsive / HiDPI canvas sizing ────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)

      lastRenderedFrame.current = -1
      requestRender(lastKnownFrameIndex.current)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [firstFrameReady, requestRender])

  // ─── GSAP ScrollTrigger timeline sync ────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !firstFrameReady) return

    ScrollTrigger.getAll().forEach((t) => {
      if (t.vars.id === 'global-background-scroll-trigger') t.kill()
    })

    const triggerInstance = ScrollTrigger.create({
      id: 'global-background-scroll-trigger',
      trigger: '#main-scroll-container',
      scroller: '#main-scroll-container',
      start: 'top top',
      end: () => {
        const el = document.getElementById('main-scroll-container')
        return el ? el.scrollHeight - el.clientHeight : 1
      },
      scrub: true,
      onUpdate: (self) => {
        const targetFrame = Math.min(
          FRAME_COUNT,
          Math.max(1, Math.round(self.progress * (FRAME_COUNT - 1)) + 1)
        )
        requestRender(targetFrame)
      },
    })

    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300)

    return () => {
      clearTimeout(refreshTimer)
      triggerInstance.kill()
    }
  }, [firstFrameReady, requestRender, pathname])

  // ─── Pause/resume on tab visibility ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibility = () => {
      if (!document.hidden) {
        lastRenderedFrame.current = -1
        requestRender(lastKnownFrameIndex.current)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [requestRender])

  return (
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
        // Fade in only after the first frame is painted to avoid a flash of
        // blank canvas on very fast connections where the frame arrives before
        // the browser has laid out the canvas element.
        opacity: firstFrameReady ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    />
  )
}
