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

  // Sparse frame cache — populated progressively as frames arrive.
  // Initialized immediately so workers can write into it from frame 1 onward.
  const imagesRef = useRef<(HTMLImageElement | undefined)[]>(
    new Array(FRAME_COUNT).fill(undefined)
  )

  // Tracks how many frames have arrived — used only to decide when to
  // register the ScrollTrigger (we wait for frame 1, not all 192).
  // This is a ref, not state, so it never causes a re-render.
  const loadedCountRef = useRef(0)

  // Single boolean state: has frame 1 arrived yet?
  // This is the ONLY gate — it unlocks canvas paint + ScrollTrigger.
  // The app itself is NEVER gated on this value; only the canvas is.
  const [firstFrameReady, setFirstFrameReady] = useState(false)

  // Internal render-loop refs — never cause React re-renders
  const lastRenderedFrame = useRef<number>(-1)
  const renderRequested = useRef<boolean>(false)
  const lastKnownFrameIndex = useRef<number>(1)

  // ─── Draw a single frame onto the canvas (object-fit: cover) ──────────────
  const renderFrame = useCallback((index: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const target = Math.min(Math.max(1, index), FRAME_COUNT)

    // Walk backwards to find the nearest available frame so the canvas is
    // never blank. Frame 1 is always loaded first, so this always resolves.
    let img: HTMLImageElement | undefined
    for (let i = target - 1; i >= 0; i--) {
      const candidate = imagesRef.current[i]
      if (candidate?.complete && candidate.naturalWidth > 0) {
        img = candidate
        break
      }
    }
    if (!img) return

    const cw = canvas.width
    const ch = canvas.height
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const ratio = Math.max(cw / iw, ch / ih)
    const cx = (cw - iw * ratio) / 2
    const cy = (ch - ih * ratio) / 2

    try {
      ctx.drawImage(img, 0, 0, iw, ih, cx, cy, iw * ratio, ih * ratio)
    } catch {
      // Canvas may be detached during navigation — ignore silently
    }
  }, [])

  // Debounced rAF paint — deduplicates rapid calls from scroll/resize
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

  // ─── Loading strategy ──────────────────────────────────────────────────────
  //
  // Phase 1 — frame 1 only: fetched before anything else.
  //   → setFirstFrameReady(true) fires immediately after it lands.
  //   → The app is already rendered by React; this only unlocks the canvas.
  //
  // Phase 2 — frames 2–192: loaded concurrently with 4 workers in the
  //   background. Each resolved frame is stored in imagesRef and the canvas
  //   is re-painted if the user is currently viewing that frame index, giving
  //   a live "fill-in" effect as the sequence becomes available.
  //
  // No state is set during Phase 2. Zero React re-renders from loading.
  // No overlay is shown at any point. The app is always interactive.
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false

    const fetchFrame = (zeroBasedIndex: number): Promise<void> =>
      new Promise((resolve) => {
        const existing = imagesRef.current[zeroBasedIndex]
        if (existing?.complete && existing.naturalWidth > 0) {
          resolve()
          return
        }
        const img = new Image()
        img.src = getFrameUrl(zeroBasedIndex + 1)
        img.onload = () => {
          if (cancelled) { resolve(); return }
          imagesRef.current[zeroBasedIndex] = img
          loadedCountRef.current += 1
          // Repaint live if this frame is currently on screen
          if (zeroBasedIndex + 1 === lastKnownFrameIndex.current) {
            lastRenderedFrame.current = -1
            requestRender(lastKnownFrameIndex.current)
          }
          resolve()
        }
        img.onerror = () => resolve() // skip bad frames silently
      })

    const run = async () => {
      // ── Phase 1: fetch frame 1 only, then immediately unblock ────────────
      await fetchFrame(0)
      if (cancelled) return
      setFirstFrameReady(true)

      // ── Phase 2: remaining frames with 4 concurrent workers ──────────────
      const remaining: number[] = []
      for (let i = 1; i < FRAME_COUNT; i++) remaining.push(i)

      const queue = [...remaining]
      const worker = async () => {
        while (queue.length > 0) {
          if (cancelled) return
          const idx = queue.shift()
          if (idx === undefined) return
          await fetchFrame(idx)
        }
      }
      // Fire and forget — never awaited by any gate or state
      Promise.all([worker(), worker(), worker(), worker()])
    }

    run()
    return () => { cancelled = true }
  }, [requestRender])

  // ─── Initial canvas paint — fires as soon as frame 1 is ready ────────────
  useEffect(() => {
    if (!firstFrameReady) return
    lastRenderedFrame.current = -1
    requestRender(1)
  }, [firstFrameReady, requestRender])

  // ─── Responsive canvas sizing + HiDPI scaling ────────────────────────────
  // NOT gated on firstFrameReady — the canvas element is always in the DOM
  // and needs correct dimensions from mount.
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
  }, [requestRender]) // ← no isLoaded gate

  // ─── GSAP ScrollTrigger — registers once frame 1 is available ────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !firstFrameReady) return

    // Kill any stale instance before re-creating (handles route changes)
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

  // ─── Tab visibility — repaint on return ──────────────────────────────────
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

  // ─── Render ───────────────────────────────────────────────────────────────
  // Just the canvas. No overlay. No loading gate. No blocking state.
  // The canvas fades in when frame 1 lands; the rest of the app is
  // always visible and interactive regardless.
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
        opacity: firstFrameReady ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  )
}
