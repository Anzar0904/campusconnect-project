'use client'
import React from 'react'
import { cn } from '@/lib/utils'

export interface AuthCardProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export function AuthCard({ children, title, description, className }: AuthCardProps) {
  return (
    <div className={cn('glass-elevated rounded-2xl p-8 w-full max-w-md mx-auto', className)}>
      {title && (
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
          {description && (
            <p className="text-sm text-on-surface-variant mt-1.5">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-6">{children}</div>
    </div>
  )
}

export default AuthCard
