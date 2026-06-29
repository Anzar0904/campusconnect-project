'use client'

import * as React from 'react'
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Standard spring settings matching DESIGN_SYSTEM.md / premium_redesign_plan.md
export const SPRING_TRANSITION = {
  type: 'spring' as const,
  mass: 1,
  stiffness: 170,
  damping: 26
}

export const SOFT_SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 20
}

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
  delay?: number
  duration?: number
}

export function FadeIn({
  children,
  className,
  direction = 'up',
  distance = 10,
  delay = 0,
  duration = 0.35,
  ...props
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directions[direction] }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface ScaleInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode
  delay?: number
  scale?: number
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  scale = 0.95,
  ...props
}: ScaleInProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale }}
      transition={{
        ...SPRING_TRANSITION,
        delay
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface StaggerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode
  staggerChildren?: number
  delayChildren?: number
}

export function Stagger({
  children,
  className,
  staggerChildren = 0.05,
  delayChildren = 0,
  ...props
}: StaggerProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren,
            delayChildren
          }
        },
        exit: {}
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export { AnimatePresence }
