'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'premium' | 'glass' | 'elevated'
  hoverEffects?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'premium', hoverEffects = false, ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-300'
    
    const variantStyles = {
      premium: 'border border-white/[0.08] bg-zinc-900/40 backdrop-blur-xl shadow-premium',
      glass: 'border border-white/[0.05] bg-white/[0.02] backdrop-blur-md',
      elevated: 'bg-zinc-900 border border-white/[0.04] shadow-premium-deep'
    }

    const hoverMotion = hoverEffects && !props.whileHover ? {
      whileHover: variant === 'premium' 
        ? { y: -2, borderColor: 'rgba(139, 92, 246, 0.3)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' } 
        : { y: -2 }
    } : {}

    return (
      <motion.div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...hoverMotion}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'
