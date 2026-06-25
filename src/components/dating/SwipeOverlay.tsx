// src/components/dating/SwipeOverlay.tsx
'use client'

import React from 'react'
import { motion, useTransform } from 'framer-motion'

interface SwipeOverlayProps {
  /** Motion value for horizontal drag */
  x: any
}

export default function SwipeOverlay({ x }: SwipeOverlayProps) {
  // Opacity for LIKE badge (right swipe) and NOPE badge (left swipe)
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0])

  return (
    <>
      {/* LIKE badge */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-8 border-4 border-emerald-500 text-emerald-500 font-display font-black px-6 py-2 rounded-xl text-3xl uppercase tracking-wider rotate-[-12deg] z-30 pointer-events-none"
      >
        LIKE
      </motion.div>

      {/* NOPE badge */}
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute top-8 right-8 border-4 border-rose-500 text-rose-500 font-display font-black px-6 py-2 rounded-xl text-3xl uppercase tracking-wider rotate-[12deg] z-30 pointer-events-none"
      >
        NOPE
      </motion.div>
    </>
  )
}
