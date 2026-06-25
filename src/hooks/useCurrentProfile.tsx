'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Profile {
  id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  branch: string | null
  year: number | null
  roll_number: string | null
  hostel: string | null
  phone: string | null
  email: string
  role?: string | null
  is_verified?: boolean
  college_id?: string | null
  colleges?: {
    name: string
    city: string
  } | null
  dating_verified?: boolean
}

interface ProfileContextType {
  profile: Profile | null
  loading: boolean
  refetch: () => Promise<void>
  setProfile: (profile: Profile | null) => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({
  children,
  initialProfile,
  userId
}: {
  children: React.ReactNode
  initialProfile: Profile | null
  userId: string
}) {
  const [profile, setProfileState] = useState<Profile | null>(initialProfile)
  const [loading, setLoading] = useState(!initialProfile)
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username, branch, year, is_verified, role, bio, dating_verified, roll_number, hostel, phone, email, college_id, colleges(name, city)')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfileState(data as any)
      } else if (error) {
        console.error('[ProfileProvider] fetch error:', error.message)
      }
    } catch (err) {
      console.error('[ProfileProvider] unexpected fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, userId])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // If we don't have initialProfile, fetch it immediately
    if (!initialProfile) {
      fetchProfile()
    }

    // Subscribe to realtime updates for this user's profile
    const channel = supabase
      .channel(`profile-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles_secure',
          filter: `id=eq.${userId}`
        },
        async (payload: any) => {
          // Re-fetch to get nested colleges info
          await fetchProfile()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, fetchProfile, initialProfile])

  return (
    <ProfileContext.Provider value={{ profile, loading, refetch: fetchProfile, setProfile: setProfileState }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useCurrentProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useCurrentProfile must be used within a ProfileProvider')
  }
  return context
}
