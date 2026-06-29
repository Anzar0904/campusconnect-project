'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getPrefersReducedMotion } from '@/hooks/useGsapMotion'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  variant?: 'premium' | 'glass' | 'elevated'
  hoverEffects?: boolean
  spotlight?: boolean
  children?: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'premium', hoverEffects = true, spotlight = true, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-300 relative overflow-hidden group/card'
    
    const variantStyles = {
      premium: 'border border-white/[0.08] bg-zinc-900/22 backdrop-blur-2xl shadow-premium',
      glass: 'border border-white/[0.05] bg-white/[0.02] backdrop-blur-md',
      elevated: 'border border-white/[0.04] bg-zinc-900/35 backdrop-blur-xl shadow-premium-deep'
    }

    const [coords, setCoords] = React.useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = React.useState(false)
    const localRef = React.useRef<HTMLDivElement | null>(null)

    // Merge internal and external refs
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!localRef.current || getPrefersReducedMotion()) return
      const rect = localRef.current.getBoundingClientRect()
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }

    // Spring scaling on click (compression feedback)
    const clickAnimation = hoverEffects ? {
      whileTap: { scale: 0.985 }
    } : {}

    // Lift/shadow changes on hover
    const hoverMotion = hoverEffects && !props.whileHover ? {
      whileHover: variant === 'premium' 
        ? { y: -3, borderColor: 'rgba(139, 92, 246, 0.25)', boxShadow: '0 12px 30px rgba(139, 92, 246, 0.08)' } 
        : { y: -3, borderColor: 'rgba(255, 255, 255, 0.12)' }
    } : {}

    return (
      <motion.div
        ref={setRefs}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...hoverMotion}
        {...clickAnimation}
        {...props}
      >
        {/* Cursor Glow Spotlight */}
        {spotlight && isHovered && !getPrefersReducedMotion() && (
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(250px circle at ${coords.x}px ${coords.y}px, rgba(139, 92, 246, 0.12), transparent 80%)`
            }}
          />
        )}
        
        {/* Highlight Border Overlay */}
        {spotlight && isHovered && !getPrefersReducedMotion() && (
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(120px circle at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.15), transparent 80%)`,
              maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
              WebkitMaskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px'
            } as any}
          />
        )}

        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'
