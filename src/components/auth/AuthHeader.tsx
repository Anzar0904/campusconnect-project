'use client'
import React from 'react'
import { cn } from '@/lib/utils'

export interface AuthHeaderProps {
  title: string
  description?: string
  className?: string
}

export function AuthHeader({ title, description, className }: AuthHeaderProps) {
  return (
    <div className={cn('text-center mb-6', className)}>
      <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
      {description && (
        <p className="text-sm text-on-surface-variant mt-1.5">{description}</p>
      )}
    </div>
  )
}

export default AuthHeader
