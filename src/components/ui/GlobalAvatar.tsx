'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface GlobalAvatarProps {
  profile?: {
    avatar_url?: string | null
    full_name?: string | null
    username?: string | null
    [key: string]: any
  } | null
  avatarUrl?: string | null
  fullName?: string | null
  username?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  className?: string
  imageClassName?: string
  status?: 'online' | 'offline' | 'typing'
}

const GRADIENTS = [
  'from-violet-600 to-indigo-600',
  'from-blue-600 to-cyan-600',
  'from-emerald-600 to-teal-600',
  'from-rose-600 to-pink-600',
  'from-amber-600 to-orange-600',
]

export function GlobalAvatar({
  profile,
  avatarUrl,
  fullName,
  username,
  size = 'md',
  className,
  imageClassName,
  status,
}: GlobalAvatarProps) {
  const [imgError, setImgError] = useState(false)

  const resolvedAvatarUrl = avatarUrl !== undefined ? avatarUrl : profile?.avatar_url
  const resolvedFullName = fullName !== undefined ? fullName : profile?.full_name
  const resolvedUsername = username !== undefined ? username : profile?.username

  useEffect(() => {
    setImgError(false)
  }, [resolvedAvatarUrl])

  const initial = (() => {
    if (resolvedFullName && resolvedFullName.trim()) {
      return resolvedFullName.trim().charAt(0).toUpperCase()
    }
    if (resolvedUsername && resolvedUsername.trim()) {
      return resolvedUsername.trim().charAt(0).toUpperCase()
    }
    return 'U'
  })()

  // Deterministic background gradient selection
  const seed = resolvedFullName || resolvedUsername || 'U'
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const gradientIndex = Math.abs(hash) % GRADIENTS.length
  const gradientClass = GRADIENTS[gradientIndex]

  // Default size maps
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
    xl: 'w-20 h-20 rounded-3xl text-2xl',
    custom: '',
  }

  const dimensions = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 80,
    custom: 128,
  }

  const widthHeight = dimensions[size] || 40

  const hasImage = resolvedAvatarUrl && !imgError

  return (
    <div
      className={cn(
        "relative overflow-hidden ring-1 ring-white/10 shrink-0 shadow-sm flex items-center justify-center font-display font-bold select-none",
        sizeClasses[size],
        className
      )}
    >
      {hasImage ? (
        <Image
          src={resolvedAvatarUrl}
          alt={resolvedFullName || 'User Avatar'}
          width={widthHeight}
          height={widthHeight}
          onError={() => setImgError(true)}
          className={cn("object-cover w-full h-full", imageClassName)}
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center bg-gradient-to-br text-white font-bold uppercase",
            gradientClass
          )}
        >
          {initial}
        </div>
      )}
      {status && (
        <span className={cn(
          "absolute bottom-0 right-0 block rounded-full ring-1.5 ring-zinc-950",
          status === 'online' ? 'bg-emerald-400 neon-ring-active w-2 h-2' :
          status === 'typing' ? 'bg-sky-400 w-2 h-2 animate-pulse' : 'bg-neutral-500 w-2 h-2'
        )} />
      )}
    </div>
  )
}
