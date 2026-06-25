'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId()
    const resolvedId = id || inputId

    return (
      <div className={cn("w-full flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={resolvedId}
            className="text-xs font-semibold tracking-wide text-zinc-400 select-none px-1"
          >
            {label}
          </label>
        )}

        <div className="relative w-full group">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-zinc-500 group-focus-within:text-brand-400 transition-colors pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            id={resolvedId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "input-pro",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/10",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-zinc-500 group-focus-within:text-brand-400 transition-colors">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <span className="text-xs font-medium text-red-400 px-1 leading-none select-none">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span className="text-xs text-zinc-500 px-1 leading-none select-none">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
