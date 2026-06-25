// src/components/dating/SwipeStack.tsx
'use client'
import React, { useState } from 'react'
import { useGesture } from '@use-gesture/react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import SwipeCard from './SwipeCard'
import SwipeOverlay from './SwipeOverlay'
import { Skeleton } from '@/components/ui/Skeleton'

interface SwipeStackProps {
  profiles: any[] // array of dating profiles fetched from server
  onLike: (profileId: string) => void
  onNope: (profileId: string) => void
  onSuperLike: (profileId: string) => void
}

export default function SwipeStack({ profiles, onLike, onNope, onSuperLike }: SwipeStackProps) {
  const [index, setIndex] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])

  const bind = useGesture(
    {
      onDrag: ({ offset: [dx] }) => x.set(dx),
      onDragEnd: ({ velocity: [vx], direction: [dx] }) => {
        const threshold = 150
        if (dx > threshold || (vx > 0 && Math.abs(dx) > 50)) {
          // LIKE
          onLike(profiles[index].id)
          setIndex((i) => i + 1)
          x.set(0)
        } else if (dx < -threshold || (vx < 0 && Math.abs(dx) > 50)) {
          // NOPE
          onNope(profiles[index].id)
          setIndex((i) => i + 1)
          x.set(0)
        } else if (Math.abs(dx) < 20 && Math.abs(vx) > 800) {
          // SUPER LIKE (quick upward flick – we treat as a special action)
          onSuperLike(profiles[index].id)
          setIndex((i) => i + 1)
          x.set(0)
        } else {
          // Return to centre
          x.set(0)
        }
      },
      onKeyDown: ({ event }) => {
        const key = (event as KeyboardEvent).key
        if (key === 'ArrowRight') {
          onLike(profiles[index].id)
          setIndex((i) => i + 1)
        } else if (key === 'ArrowLeft') {
          onNope(profiles[index].id)
          setIndex((i) => i + 1)
        } else if (key === ' ') {
          onSuperLike(profiles[index].id)
          setIndex((i) => i + 1)
        }
      }
    },
    { drag: { filterTaps: true } }
  )

  if (profiles.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Skeleton className="h-64 w-48" />
      </div>
    )
  }

  if (index >= profiles.length) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-gray-400">No more profiles</p>
      </div>
    )
  }

  const profile = profiles[index]

  return (
    <div className="relative w-full h-full" {...bind()} tabIndex={0} aria-label="Dating swipe stack">
      <SwipeOverlay x={x} />
      <motion.div
        style={{ x, rotate }}
        className={cn('absolute inset-0 flex justify-center items-center')}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
        whileTap={{ scale: 0.97 }}
      >
        <SwipeCard profile={profile} />
      </motion.div>
    </div>
  )
}
