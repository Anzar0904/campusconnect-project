'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { 
  Camera, CheckCircle, Edit2, GraduationCap, Save, X, Phone, 
  Mail, Award, BookOpen, Calendar, User, ShieldCheck, Home, 
  FileText, Users, MessageCircle, Trophy, Activity, Lock, EyeOff, Check, ChevronLeft,
  Clock
} from 'lucide-react'
import { createClient, checkRateLimit } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useAutoAnimate } from '@formkit/auto-animate/react'

const BRANCHES = ['BBA', 'MBA', 'BCA', 'MCA', 'B.Com', 'BA (H)', 'B.Sc', 'Law', 'B.Tech', 'Other']
const HOSTELS = ['Boys Hostel A', 'Boys Hostel B', 'Girls Hostel A', 'Girls Hostel B', 'Day Scholar']
const YEARS = [1, 2, 3, 4, 5]

const PREDEFINED_BADGES = [
  { id: 'early_adopter', name: 'Early Adopter', icon: Trophy, desc: 'Joined in the first month', color: 'from-amber-400 to-yellow-500' },
  { id: 'first_post', name: 'First Post', icon: FileText, desc: 'Published your first post', color: 'from-blue-400 to-cyan-500' },
  { id: 'social_butterfly', name: 'Social Butterfly', icon: Users, desc: 'Connected with peers', color: 'from-pink-400 to-rose-500' },
  { id: 'study_hero', name: 'Study Hero', icon: BookOpen, desc: 'Uploaded study notes', color: 'from-emerald-400 to-teal-500' },
  { id: 'top_coder', name: 'Top Coder', icon: Trophy, desc: 'Active in Coding Arena', color: 'from-purple-400 to-indigo-500' },
  { id: 'mentor', name: 'Verified Mentor', icon: ShieldCheck, desc: 'Helping other students', color: 'from-violet-400 to-fuchsia-500' },
]

interface Profile {
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
}

interface ProfileClientProps {
  profile: Profile | null
  userId: string
  targetUserId: string
  currentUserRole?: string
}

export default function ProfileClient({ 
  profile: initialProfile, 
  userId, 
  targetUserId,
  currentUserRole = 'STUDENT'
}: ProfileClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const isOwner = userId === targetUserId
  const isSuperAdmin = currentUserRole?.toUpperCase() === 'SUPER_ADMIN' || currentUserRole?.toUpperCase() === 'ADMIN'
  const canViewSensitiveInfo = isOwner || isSuperAdmin

  const { profile: currentProfile, refetch: refetchCurrentProfile, setProfile } = useCurrentProfile()
  const [activeProfile, setActiveProfile] = useState<Profile | null>(initialProfile)
  const profile = isOwner ? (currentProfile || activeProfile) : activeProfile

  const [parentBio] = useAutoAnimate()
  const [parentActions] = useAutoAnimate()
  const [parentBioInfo] = useAutoAnimate()
  const [parentBadges] = useAutoAnimate()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(initialProfile?.avatar_url)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('edit') === 'true' || params.get('onboarding') === '1') {
        setEditing(true)
      }
    }
  }, [])

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    branch: profile?.branch || '',
    year: profile?.year || 1,
    roll_number: profile?.roll_number || '',
    hostel: profile?.hostel || '',
    phone: profile?.phone || '',
  })

  // Live DB stats
  const [stats, setStats] = useState({
    friends: 0,
    posts: 0,
    points: 0,
    communities: 0,
    studyGroups: 0,
    badges: 0
  })

  // Live DB activities
  const [activities, setActivities] = useState<{
    posts: any[]
    communities: any[]
    events: any[]
    badges: any[]
  }>({
    posts: [],
    communities: [],
    events: [],
    badges: []
  })

  const [earnedBadges, setEarnedBadges] = useState<string[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)

  const [friendship, setFriendship] = useState<any | null>(null)
  const [friendshipLoading, setFriendshipLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mutualFriends, setMutualFriends] = useState<any[]>([])
  const [showAllMutual, setShowAllMutual] = useState(false)

  // Handle dropdown clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mutual friends fetch helper
  const fetchMutualFriends = useCallback(async () => {
    try {
      const { data: myFriendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

      const { data: targetFriendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)

      if (!myFriendships || !targetFriendships) return []

      const myFriendsIds = new Set(
        myFriendships.map((f: any) => f.requester_id === userId ? f.addressee_id : f.requester_id)
      )

      const targetFriendsIds = targetFriendships.map((f: any) => f.requester_id === targetUserId ? f.addressee_id : f.requester_id)

      const mutualIds = targetFriendsIds.filter((id: string) => myFriendsIds.has(id))
      
      if (mutualIds.length === 0) return []

      const { data: mutualProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username, branch, year')
        .in('id', mutualIds)

      return mutualProfiles || []
    } catch (e) {
      console.error('Error fetching mutual friends:', e)
      return []
    }
  }, [userId, targetUserId, supabase])

  // Connection handlers
  const handleAddConnection = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (friendshipLoading || isOwner) return
    setFriendshipLoading(true)

    try {
      const allowed = await checkRateLimit(supabase, 'friend_request', 10, '1 hour')
      if (!allowed) {
        toast.error('You have sent too many requests. Try again later.')
        return
      }

      const { data: existing } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

      const alreadyExists = (existing || []).some(
        (f: any) =>
          (f.requester_id === userId && f.addressee_id === targetUserId) ||
          (f.requester_id === targetUserId && f.addressee_id === userId)
      )

      if (alreadyExists) {
        toast.error('A friendship request already exists.')
        return
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: userId,
          addressee_id: targetUserId,
          status: 'pending'
        })
        .select('*')
        .single()

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Connection request sent successfully!')
        setFriendship(data)
      }
    } catch (err: any) {
      toast.error('Failed to send request.')
    } finally {
      setFriendshipLoading(false)
    }
  }

  const handleAcceptRequest = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (friendshipLoading || isOwner) return
    setFriendshipLoading(true)

    try {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', targetUserId)
        .eq('addressee_id', userId)
        .select('*')
        .single()

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Connection request accepted!')
        setFriendship(data)
        const mutuals = await fetchMutualFriends()
        setMutualFriends(mutuals)
      }
    } catch (err: any) {
      toast.error('Failed to accept request.')
    } finally {
      setFriendshipLoading(false)
    }
  }

  const handleDeclineOrCancelRequest = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (friendshipLoading || isOwner) return
    setFriendshipLoading(true)

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Connection request declined/canceled.')
        setFriendship(null)
        const mutuals = await fetchMutualFriends()
        setMutualFriends(mutuals)
      }
    } catch (err: any) {
      toast.error('Failed to update request.')
    } finally {
      setFriendshipLoading(false)
    }
  }

  const getRelation = () => {
    if (!friendship) return 'none'
    if (friendship.status === 'blocked') return 'blocked'
    if (friendship.status === 'accepted') return 'friends'
    if (friendship.requester_id === userId) return 'sent'
    return 'received'
  }
  const relation = getRelation()

  // Fetch friendship & Realtime subscription
  useEffect(() => {
    if (isOwner || !targetUserId) return

    async function fetchFriendship() {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`)
        .maybeSingle()

      if (!error && data) {
        setFriendship(data)
      } else {
        setFriendship(null)
      }
    }

    fetchFriendship()

    const channel = supabase
      .channel(`friendship_channel_${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        (payload: any) => {
          const reqId = payload.new?.requester_id || payload.old?.requester_id
          const addId = payload.new?.addressee_id || payload.old?.addressee_id
          
          if (
            (reqId === userId && addId === targetUserId) ||
            (reqId === targetUserId && addId === userId)
          ) {
            if (payload.eventType === 'DELETE') {
              setFriendship(null)
            } else {
              setFriendship(payload.new)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, targetUserId, isOwner, supabase])

  // Fetch mutual connections
  useEffect(() => {
    if (isOwner || !targetUserId) return

    async function getMutuals() {
      const mutuals = await fetchMutualFriends()
      setMutualFriends(mutuals)
    }

    getMutuals()
  }, [userId, targetUserId, isOwner, fetchMutualFriends])

  // Fetch stats and activity
  useEffect(() => {
    async function fetchStatsAndActivity() {
      if (!targetUserId) return
      try {
        setLoadingActivity(true)
        const [
          friendsRes,
          postsRes,
          pointsRes,
          commsRes,
          studyGroupsRes,
          badgesRes,
          recentPostsRes,
          recentCommsRes,
          recentEventsRes,
          recentBadgesRes
        ] = await Promise.all([
          // stats counts
          supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('status', 'accepted').or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`),
          supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', targetUserId),
          supabase.from('user_points').select('total_points').eq('user_id', targetUserId).maybeSingle(),
          supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId),
          supabase.from('study_group_members').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId),
          supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId),
          
          // activity data
          supabase.from('posts').select('id, content, created_at, likes_count, comments_count').eq('author_id', targetUserId).order('created_at', { ascending: false }).limit(5),
          supabase.from('community_members').select('created_at, communities(id, name, description)').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(5),
          supabase.from('event_attendees').select('created_at, events(id, title, description, start_time)').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(5),
          supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', targetUserId).order('earned_at', { ascending: false }).limit(5)
        ])

        setStats({
          friends: friendsRes.count || 0,
          posts: postsRes.count || 0,
          points: pointsRes.data?.total_points || 0,
          communities: commsRes.count || 0,
          studyGroups: studyGroupsRes.count || 0,
          badges: badgesRes.count || 0
        })

        setActivities({
          posts: recentPostsRes.data || [],
          communities: recentCommsRes.data || [],
          events: recentEventsRes.data || [],
          badges: recentBadgesRes.data || []
        })

        const earnedIds = (recentBadgesRes.data || []).map((b: any) => b.badge_id)
        setEarnedBadges(earnedIds)
      } catch (err) {
        console.error('Failed to load stats and activity:', err)
      } finally {
        setLoadingActivity(false)
      }
    }

    fetchStatsAndActivity()
  }, [targetUserId, supabase, profile])

  // Sync state if profile changes
  useEffect(() => {
    const activeProf = isOwner ? (currentProfile || initialProfile) : initialProfile
    if (activeProf) {
      setCurrentAvatarUrl(activeProf.avatar_url)
      setForm({
        full_name: activeProf.full_name || '',
        username: activeProf.username || '',
        bio: activeProf.bio || '',
        branch: activeProf.branch || '',
        year: activeProf.year || 1,
        roll_number: activeProf.roll_number || '',
        hostel: activeProf.hostel || '',
        phone: activeProf.phone || '',
      })
    }
  }, [initialProfile, currentProfile, isOwner])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !isOwner) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    const toastId = toast.loading('Uploading avatar...')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles_secure')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setCurrentAvatarUrl(publicUrl)
      if (activeProfile) {
        setActiveProfile({ ...activeProfile, avatar_url: publicUrl })
      }
      if (isOwner && currentProfile) {
        setProfile({ ...currentProfile, avatar_url: publicUrl })
      }
      toast.success('Avatar updated successfully!', { id: toastId })
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar', { id: toastId })
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!isOwner) return
    if (!form.full_name.trim()) {
      toast.error('Full Name is required')
      return
    }
    if (!form.username.trim()) {
      toast.error('Username is required')
      return
    }
    if (!form.branch.trim()) {
      toast.error('Branch is required for campus onboarding')
      return
    }
    if (!form.year || form.year < 1 || form.year > 5) {
      toast.error('Current Year must be between 1 and 5')
      return
    }
    if (!form.roll_number.trim()) {
      toast.error('Roll Number is required for campus onboarding')
      return
    }
    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles_secure')
        .update({
          full_name: form.full_name,
          username: form.username || null,
          bio: form.bio || null,
          branch: form.branch || null,
          year: form.year,
          roll_number: form.roll_number || null,
          hostel: form.hostel || null,
          phone: form.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        toast.error(error.message)
        return
      }

      // Refetch profile directly from Supabase to sync local states immediately after save
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username, branch, year, is_verified, role, bio, dating_verified, roll_number, hostel, phone, email, college_id, colleges(name, city)')
        .eq('id', userId)
        .single()

      if (!fetchError && updatedProfile) {
        setActiveProfile(updatedProfile as any)
        if (isOwner) {
          setProfile(updatedProfile as any)
        }
      }

      if (isOwner) {
        await refetchCurrentProfile()
      }

      toast.success('Profile updated successfully')
      setEditing(false)

    } catch (err) {
      console.error(err)
      toast.error('Unexpected error while saving profile')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'CC'
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Mobile back button & Desktop Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => {
            if (window.history.length > 1) {
              router.back()
            } else {
              router.push('/dashboard')
            }
          }}
          className="md:hidden flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
          <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span>&gt;</span>
          <span className="text-white font-medium">Profile ({profile?.full_name || 'User'})</span>
        </div>
      </div>
      {/* Profile Hero Section with Futuristic Glow & Animations */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#090d16]/40 p-8 backdrop-blur-2xl shadow-2xl"
      >
        {/* Animated ambient mesh gradients */}
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 opacity-40 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          
          {/* Avatar Upload / Status Area */}
          <div className="relative shrink-0 group">
            {/* Glow ring animation */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 rounded-3xl opacity-40 blur-md group-hover:opacity-80 transition-all duration-500 group-hover:scale-105" />
            
            <div className="relative rounded-3xl bg-[#030712] p-1.5 border border-white/[0.08] overflow-hidden">
              {currentAvatarUrl ? (
                <img 
                  src={currentAvatarUrl} 
                  alt={profile?.full_name || 'Avatar'} 
                  className="w-32 h-32 rounded-2xl object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-cyan-900/30 to-purple-900/30 border border-white/[0.04] flex items-center justify-center text-3xl font-extrabold text-cyan-400 group-hover:scale-105 transition-transform duration-500">
                  {getInitials(profile?.full_name || 'Campus Connect')}
                </div>
              )}

              {/* Online Indicator Badge */}
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 bg-emerald-500 border-[3px] border-[#030712] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
            </div>

            {editing && isOwner && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 shadow-lg border border-white/10 bg-gradient-to-tr from-cyan-500 to-indigo-600"
                aria-label="Upload Avatar"
              >
                {uploading ? (
                  <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="text-white" size={16} />
                )}
              </button>
            )}
            <input 
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* User Bio and Meta Information */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div ref={parentBio} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl text-left">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Full Name *</span>
                      <input 
                        value={form.full_name} 
                        onChange={e => set('full_name', e.target.value)} 
                        className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Username</span>
                      <input 
                        value={form.username} 
                        onChange={e => set('username', e.target.value)} 
                        className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium" 
                        placeholder="johndoe" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <h1 className="font-display text-3xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-2.5">
                      {profile?.full_name}
                      {profile?.is_verified && (
                        <span className="inline-flex items-center justify-center bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase">
                          Verified
                        </span>
                      )}
                    </h1>
                    {profile?.username && (
                      <p className="text-xs font-mono text-cyan-400">@{profile.username}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Edit / Action controls */}
              {/* Edit / Action controls */}
              <div ref={parentActions} className="flex flex-col sm:flex-row justify-center md:justify-start gap-3 w-full sm:w-auto">
                {isOwner ? (
                  editing ? (
                    <>
                      <button 
                        onClick={() => setEditing(false)} 
                        className="px-4 h-11 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                      <button 
                        onClick={handleSave} 
                        disabled={saving || !form.full_name}
                        className="px-5 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-white transition-all hover:scale-105 active:scale-95 shadow-lg border border-cyan-500/20 bg-gradient-to-r from-cyan-500 to-blue-500 w-full sm:w-auto cursor-pointer"
                      >
                        {saving ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        Save Info
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setEditing(true)} 
                      className="px-5 h-11 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                    >
                      <Edit2 size={13} />
                      Edit Profile
                    </button>
                  )
                ) : (
                  relation !== 'blocked' && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      {/* Message Button */}
                      <Link
                        href={relation === 'friends' ? `/messages?userId=${targetUserId}` : '#'}
                        className={clsx(
                          "px-5 h-11 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 border w-full sm:w-auto select-none",
                          relation === 'friends'
                            ? "bg-blue-600/10 hover:bg-blue-600/20 border-blue-600/20 text-blue-400 cursor-pointer active:scale-95"
                            : "bg-white/[0.02] border-white/[0.04] text-neutral-500 cursor-not-allowed"
                        )}
                        aria-disabled={relation !== 'friends'}
                        onClick={(e) => {
                          if (relation !== 'friends') {
                            e.preventDefault()
                          }
                        }}
                      >
                        <MessageCircle size={14} />
                        Message
                      </Link>

                      {/* Connection Action Button */}
                      {relation === 'none' && (
                        <button
                          onClick={handleAddConnection}
                          disabled={friendshipLoading}
                          className="px-5 h-11 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 border border-cyan-500/20 shadow-lg shadow-cyan-600/10 active:scale-95 w-full sm:w-auto cursor-pointer"
                        >
                          {friendshipLoading ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>+ Add Connection</span>
                            </>
                          )}
                        </button>
                      )}

                      {relation === 'sent' && (
                        <button
                          disabled
                          className="px-5 h-11 bg-white/5 border border-white/5 text-neutral-500 rounded-xl text-xs font-bold tracking-wide cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          <Clock size={14} className="text-neutral-600" />
                          Pending
                        </button>
                      )}

                      {relation === 'received' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={handleAcceptRequest}
                            disabled={friendshipLoading}
                            className="px-4 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-emerald-500/20 w-full sm:w-auto cursor-pointer"
                          >
                            {friendshipLoading ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Check size={14} />
                                Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeclineOrCancelRequest()}
                            disabled={friendshipLoading}
                            className="px-4 h-11 bg-red-600/10 hover:bg-red-600/20 disabled:opacity-50 border border-red-600/20 text-red-400 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {relation === 'friends' && (
                        <div className="relative dropdown-container w-full sm:w-auto" ref={dropdownRef}>
                          <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="px-5 h-11 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/20 text-emerald-400 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                          >
                            <Check size={14} />
                            Connected ✓
                          </button>

                          {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#090d16] border border-white/10 shadow-2xl p-1.5 z-30 animate-fade-in font-sans">
                              <Link
                                href={`/messages?userId=${targetUserId}`}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                                onClick={() => setShowDropdown(false)}
                              >
                                <MessageCircle size={13} />
                                Message
                              </Link>
                              {mutualFriends.length > 0 && (
                                <button
                                  onClick={() => {
                                    setShowDropdown(false)
                                    setShowAllMutual(true)
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left font-medium cursor-pointer"
                                >
                                  <Users size={13} />
                                  View Mutual Friends
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  setShowDropdown(false)
                                  handleDeclineOrCancelRequest(e)
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left font-bold border-t border-white/[0.04] mt-1 pt-2 cursor-pointer"
                              >
                                Remove Connection
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Bio info */}
            <div ref={parentBioInfo} className="max-w-2xl">
              {editing ? (
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Short Bio</span>
                  <textarea 
                    value={form.bio || ''} 
                    onChange={e => set('bio', e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium resize-none h-20" 
                    placeholder="Tell the campus your story..." 
                  />
                </div>
              ) : (
                profile?.bio ? (
                  <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 italic">No biography written yet.</p>
                )
              )}
            </div>

            {/* Verification & Badges block */}
            {!editing && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                {profile?.role && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 tracking-wider uppercase">
                    Role: {profile.role}
                  </span>
                )}
                {profile?.branch && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 tracking-wider uppercase">
                    {profile.branch}
                  </span>
                )}
                {profile?.year && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-purple-500/10 border border-purple-500/20 text-purple-400 tracking-wider uppercase">
                    Year {profile.year}
                  </span>
                )}
                {profile?.hostel && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tracking-wider uppercase">
                    {profile.hostel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Academic & Statistics Card */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Academic Details Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/[0.08] bg-[#090d16]/40 p-6 backdrop-blur-2xl shadow-xl space-y-6"
          >
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2.5">
              <GraduationCap className="text-cyan-400 shrink-0" size={20} />
              Academic Info
            </h3>

            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Branch / Program</label>
                  <select 
                    value={form.branch} 
                    onChange={e => set('branch', e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium cursor-pointer"
                  >
                    <option value="" className="bg-[#030712]">Select branch</option>
                    {BRANCHES.map(b => <option key={b} value={b} className="bg-[#030712]">{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Current Year</label>
                  <select 
                    value={form.year} 
                    onChange={e => set('year', +e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium cursor-pointer"
                  >
                    {YEARS.map(y => <option key={y} value={y} className="bg-[#030712]">Year {y}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Roll Number</label>
                  <input 
                    value={form.roll_number} 
                    onChange={e => set('roll_number', e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium" 
                    placeholder="IILM2024BBA001" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Hostel Room / Campus Housing</label>
                  <select 
                    value={form.hostel} 
                    onChange={e => set('hostel', e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium cursor-pointer"
                  >
                    <option value="" className="bg-[#030712]">Select hostel</option>
                    {HOSTELS.map(h => <option key={h} value={h} className="bg-[#030712]">{h}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Phone Contact</label>
                  <input 
                    value={form.phone} 
                    onChange={e => set('phone', e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium" 
                    placeholder="+91 99999 99999" 
                    type="tel" 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2.5 border-b border-white/[0.04]">
                  <span className="text-xs text-neutral-400 font-medium">Branch</span>
                  <span className="text-xs text-white font-bold">{profile?.branch || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/[0.04]">
                  <span className="text-xs text-neutral-400 font-medium">Current Year</span>
                  <span className="text-xs text-white font-bold">{profile?.year ? `Year ${profile.year}` : 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/[0.04]">
                  <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                    Campus Housing {!canViewSensitiveInfo && <EyeOff size={11} className="text-neutral-500" />}
                  </span>
                  {canViewSensitiveInfo ? (
                    <span className="text-xs text-white font-bold">{profile?.hostel || 'Not set'}</span>
                  ) : (
                    <span className="text-xs text-neutral-500 italic flex items-center gap-1"><Lock size={12} /> Locked</span>
                  )}
                </div>

                {/* SENSITIVE DATA RULES ENFORCED HERE */}
                <div className="flex justify-between items-center py-2.5 border-b border-white/[0.04]">
                  <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                    Roll Number {!canViewSensitiveInfo && <EyeOff size={11} className="text-neutral-500" />}
                  </span>
                  {canViewSensitiveInfo ? (
                    <span className="text-xs text-white font-bold font-mono">{profile?.roll_number || 'Not set'}</span>
                  ) : (
                    <span className="text-xs text-neutral-500 italic flex items-center gap-1"><Lock size={12} /> Locked</span>
                  )}
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-white/[0.04]">
                  <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                    Phone {!canViewSensitiveInfo && <EyeOff size={11} className="text-neutral-500" />}
                  </span>
                  {canViewSensitiveInfo ? (
                    <span className="text-xs text-white font-bold font-mono">{profile?.phone || 'Not set'}</span>
                  ) : (
                    <span className="text-xs text-neutral-500 italic flex items-center gap-1"><Lock size={12} /> Locked</span>
                  )}
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                    Email {!canViewSensitiveInfo && <EyeOff size={11} className="text-neutral-500" />}
                  </span>
                  {canViewSensitiveInfo ? (
                    <span className="text-xs text-white font-bold truncate max-w-[180px]">{profile?.email || 'Not set'}</span>
                  ) : (
                    <span className="text-xs text-neutral-500 italic flex items-center gap-1"><Lock size={12} /> Locked</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Statistics Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-white/[0.08] bg-[#090d16]/40 p-6 backdrop-blur-2xl shadow-xl space-y-6"
          >
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2.5">
              <Award className="text-purple-400 shrink-0" size={20} />
              Statistics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Posts', value: stats.posts, icon: FileText, color: 'text-purple-400 bg-purple-500/10' },
                { label: 'Connections', value: stats.friends, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
                { label: 'Communities', value: stats.communities, icon: MessageCircle, color: 'text-cyan-400 bg-cyan-500/10' },
                { label: 'Study Groups', value: stats.studyGroups, icon: BookOpen, color: 'text-rose-400 bg-rose-500/10' },
                { label: 'Achievements', value: stats.badges, icon: Trophy, color: 'text-indigo-400 bg-indigo-500/10' },
                { label: 'Points', value: stats.points, icon: Award, color: 'text-amber-400 bg-amber-500/10' },
              ].map((stat, idx) => {
                const IconComp = stat.icon
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-[#030712]/50 border border-white/[0.04] text-center hover:border-cyan-500/20 transition-all duration-300">
                    <div className="flex justify-center mb-1.5">
                      <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/[0.04]", stat.color)}>
                        <IconComp size={15} />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-white leading-tight">{stat.value}</p>
                    <p className="text-[10px] font-mono uppercase text-neutral-500 mt-1 leading-none tracking-tight">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Mutual Connections Card */}
          {!isOwner && mutualFriends.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-3xl border border-white/[0.08] bg-[#090d16]/40 p-6 backdrop-blur-2xl shadow-xl space-y-4 font-sans"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2.5">
                  <Users className="text-cyan-400 shrink-0" size={18} />
                  Mutual Connections ({mutualFriends.length})
                </h3>
                {mutualFriends.length > 5 && (
                  <button 
                    onClick={() => setShowAllMutual(true)}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {mutualFriends.slice(0, 5).map((f) => (
                  <Link 
                    key={f.id} 
                    href={`/profile?id=${f.id}`}
                    title={f.full_name}
                    className="relative shrink-0 hover:scale-105 transition-transform"
                  >
                    <GlobalAvatar profile={f} size="sm" />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Side: Activity & Achievements Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Achievements (Badges) Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-white/[0.08] bg-[#090d16]/40 p-6 backdrop-blur-2xl shadow-xl space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2.5">
                <Trophy className="text-amber-400 shrink-0" size={20} />
                Unlocked Achievements
              </h3>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                {stats.badges} / {PREDEFINED_BADGES.length} Badges
              </span>
            </div>

            <div ref={parentBadges} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PREDEFINED_BADGES.map((badge) => {
                const isEarned = earnedBadges.includes(badge.id)
                const BadgeIcon = badge.icon
                return (
                  <div 
                    key={badge.id}
                    className={clsx(
                      "flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                      isEarned 
                        ? "bg-[#090d16]/80 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]" 
                        : "bg-white/[0.01] border-white/[0.04] opacity-50"
                    )}
                  >
                    {isEarned && (
                      <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-cyan-500/5 blur-md" />
                    )}
                    
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                      isEarned 
                        ? `bg-gradient-to-tr ${badge.color} text-zinc-950 border-transparent shadow-md` 
                        : "bg-zinc-900 text-neutral-600 border-white/[0.04]"
                    )}>
                      <BadgeIcon size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className={clsx(
                        "text-xs font-bold leading-tight flex items-center gap-1.5",
                        isEarned ? "text-white" : "text-neutral-500"
                      )}>
                        {badge.name}
                        {isEarned && <Check size={12} className="text-cyan-400 font-black shrink-0" />}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1 leading-normal">{badge.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Activity Logs Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-white/[0.08] bg-[#090d16]/40 p-6 backdrop-blur-2xl shadow-xl space-y-6"
          >
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2.5">
              <Activity className="text-blue-400 shrink-0" size={20} />
              Recent Campus Activity
            </h3>

            {loadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 w-full rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Posts Activity */}
                {activities.posts.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1">Recent Posts</p>
                    <div className="flex flex-col gap-2">
                      {activities.posts.map((post) => (
                        <div key={post.id} className="p-3.5 rounded-2xl bg-[#030712]/40 border border-white/[0.04] flex justify-between items-center">
                          <div className="min-w-0">
                            <p className="text-xs text-white font-medium truncate max-w-[400px]">
                              &ldquo;{post.content}&rdquo;
                            </p>
                            <p className="text-[9px] font-mono text-neutral-500 mt-1.5">
                              {new Date(post.created_at).toLocaleDateString()} · {post.likes_count} likes · {post.comments_count} comments
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Communities Joined Activity */}
                {activities.communities.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <p className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1">Communities Joined</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activities.communities.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-[#030712]/40 border border-white/[0.04] flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                            <MessageCircle size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-white font-bold truncate">{item.communities?.name}</p>
                            <p className="text-[9px] text-neutral-500 truncate mt-0.5">{item.communities?.description || 'Active interest group'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Events RSVP'd Activity */}
                {activities.events.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <p className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1">Upcoming Events</p>
                    <div className="flex flex-col gap-2">
                      {activities.events.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-[#030712]/40 border border-white/[0.04] flex justify-between items-center">
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <Calendar size={15} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-white font-bold truncate">{item.events?.title}</p>
                              <p className="text-[9px] text-neutral-500 truncate mt-0.5">{item.events?.description || 'No description provided'}</p>
                            </div>
                          </div>
                          {item.events?.start_time && (
                            <span className="text-[10px] font-mono font-bold text-neutral-400 shrink-0">
                              {new Date(item.events.start_time).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State if absolutely nothing exists */}
                {activities.posts.length === 0 && activities.communities.length === 0 && activities.events.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 text-xs italic">
                    No recent activities recorded for this student node.
                  </div>
                )}
              </div>
            )}
          </motion.div>

        </div>

      </div>

      {showAllMutual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAllMutual(false)} />
          <div className="glass-panel-base max-w-md w-full relative z-10 p-6 space-y-4 bg-[#090d16] border border-white/10 rounded-2xl animate-scale-up max-h-[80vh] flex flex-col font-sans">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-white text-base">Mutual Connections</h3>
              <button onClick={() => setShowAllMutual(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2">
              {mutualFriends.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <GlobalAvatar profile={f} size="sm" />
                    <div className="min-w-0 text-left">
                      <Link 
                        href={`/profile?id=${f.id}`}
                        onClick={() => setShowAllMutual(false)}
                        className="text-xs font-bold text-white hover:text-blue-400 transition-colors tracking-tight block truncate max-w-[180px]"
                      >
                        {f.full_name}
                      </Link>
                      <p className="text-[10px] text-neutral-500 font-medium">
                        {f.branch ? `${f.branch}` : ''} {f.year ? `· Y${f.year}` : ''}
                      </p>
                    </div>
                  </div>
                  <Link 
                    href={`/profile?id=${f.id}`}
                    onClick={() => setShowAllMutual(false)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-bold transition-all text-center"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
