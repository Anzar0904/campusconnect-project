// src/components/dating/SwipeCard.tsx
'use client'

import React from 'react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeCardProps {
  profile: any // expects same shape as dating profile items
}

export default function SwipeCard({ profile }: SwipeCardProps) {
  const AVATAR_COLORS = ['#4f46e5', '#571bc1', '#0ea5e9', '#7c3aed', '#db2777']
  const cardColorIdx = Math.abs(profile.user_id.charCodeAt(0) + profile.user_id.charCodeAt(profile.user_id.length - 1)) % 5

  const myInterests = profile.myInterests || [] // to be provided via wrapper
  const profileInterests = profile.interests || []
  const mutualInterests = profileInterests.filter((i: string) => myInterests.includes(i))
  const compatibilityScore = Math.min(
    99,
    Math.max(
      45,
      50 + mutualInterests.length * 12 + (profile.profiles?.branch === 'CSE' ? 8 : 0)
    )
  )

  return (
    <div
      className={cn('relative w-full h-[460px] rounded-3xl overflow-hidden shadow-2xl', 'border border-white/[0.08]')}
      style={{
        background: `linear-gradient(135deg, ${AVATAR_COLORS[cardColorIdx]}25 0%, ${AVATAR_COLORS[(cardColorIdx + 2) % 5]}25 100%)`
      }}
    >
      {/* Background surface */}
      <div className="absolute inset-0 bg-[#0c0c0e]" />

      {/* Avatar area */}
      <div className="h-60 w-full flex items-center justify-center relative select-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-black/30 z-10" />
        <div className="absolute w-44 h-44 rounded-full opacity-20 filter blur-3xl" style={{ backgroundColor: AVATAR_COLORS[cardColorIdx] }} />
        <GlobalAvatar
          profile={profile.profiles}
          size="custom"
          className="w-32 h-32 rounded-3xl text-5xl font-display font-bold ring-4 ring-white/10 z-20 shadow-2xl"
        />
        {/* Compatibility badge */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1 z-20">
          <Sparkles className="text-amber-400" size={12} />
          <span className="text-[11px] font-mono font-bold text-amber-300">{compatibilityScore}% MATCH</span>
        </div>
      </div>

      {/* Info section */}
      <div className="p-6 flex flex-col justify-between h-[220px] bg-[#0c0c0e] relative z-20">
        <div>
          <h3 className="font-display font-bold text-zinc-100 text-xl tracking-tight flex items-center gap-2">
            {profile.profiles?.full_name}
            {profile.profiles?.verified && (
              <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-[10px]">✓</span>
            )}
          </h3>
          <p className="text-xs font-mono text-zinc-400 mt-1 flex items-center gap-1.5">
            {profile.profiles?.branch} · Year {profile.profiles?.year}
          </p>
          <p className="text-sm text-zinc-300 mt-3 line-clamp-2 leading-relaxed">
            {profile.bio || 'No bio filled yet.'}
          </p>
        </div>
        {/* Interests preview */}
        <div className="border-t border-white/[0.04] pt-3 flex flex-wrap gap-1.5 overflow-hidden max-h-[36px]">
          {profileInterests.map((interest: string) => {
            const isMutual = myInterests.includes(interest)
            return (
              <span
                key={interest}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono tracking-tight transition-colors ${
                  isMutual
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-zinc-800/40 text-zinc-400 border border-white/[0.04]'
                }`}
              >
                {interest}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
