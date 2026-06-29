'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// Restrict to standard motion button element props
export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-display font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 select-none'
    
    const variantStyles = {
      primary: 'btn-premium text-white',
      secondary: 'btn-ghost-pro text-zinc-200 border border-white/[0.08] bg-zinc-900/50 hover:bg-zinc-800/80',
      ghost: 'bg-transparent border border-transparent text-zinc-400 hover:text-zinc-50 hover:bg-white/[0.04] active:bg-white/[0.08]',
      danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 focus:ring-red-500/40'
    }

    const sizeStyles = {
      sm: 'h-9 px-3.5 rounded-lg text-xs gap-1.5',
      md: 'h-11 px-5 rounded-xl text-sm gap-2',
      lg: 'h-13 px-7 rounded-2xl text-base gap-2.5'
    }

    return (
      <motion.button
        ref={ref}
        whileTap={disabled || isLoading ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          isLoading && 'relative !text-transparent select-none cursor-default',
          className
        )}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-100 dark:text-zinc-100">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        
        {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
