'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { 
  Camera, CheckCircle, Edit2, GraduationCap, Save, X, Phone, 
  Mail, Award, BookOpen, Calendar, User, ShieldCheck, Home, 
  FileText, Users, MessageCircle, Trophy, Activity, Lock, EyeOff, Check, ChevronLeft,
  Clock, Hash, MapPin, Sparkles, Heart, Plus
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

const COVER_PRESETS = [
  { id: 0, class: 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950', name: 'Deep Space' },
  { id: 1, class: 'bg-gradient-to-r from-emerald-950 via-zinc-900 to-teal-950', name: 'Emerald Aura' },
  { id: 2, class: 'bg-gradient-to-r from-amber-950 via-stone-900 to-orange-950', name: 'Cosmic Gold' },
  { id: 3, class: 'bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900', name: 'Midnight Charcoal' },
  { id: 4, class: 'bg-gradient-to-r from-purple-950 via-zinc-900 to-rose-950', name: 'Velvet Rose' }
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
  colleges?: {
    name: string
    city: string
  } | null
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

  const [parentStats] = useAutoAnimate()
  const [parentBadges] = useAutoAnimate()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(initialProfile?.avatar_url)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [coverPreset, setCoverPreset] = useState(0)
  const [showCoverPicker, setShowCoverPicker] = useState(false)

  // Local storage lists for Skills & Interests
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')

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

  const [activeActivityTab, setActiveActivityTab] = useState<'posts' | 'communities' | 'events'>('posts')

  // Validation States
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Fetch local storage properties on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSkills = localStorage.getItem(`cc_skills_${targetUserId}`)
      const storedInterests = localStorage.getItem(`cc_interests_${targetUserId}`)
      const storedCover = localStorage.getItem(`cc_cover_preset_${targetUserId}`)

      setSkills(storedSkills ? JSON.parse(storedSkills) : ['React', 'TypeScript', 'TailwindCSS', 'Next.js', 'Python'])
      setInterests(storedInterests ? JSON.parse(storedInterests) : ['Open Source', 'UI/UX Design', 'Hackathons', 'Artificial Intelligence'])
      setCoverPreset(storedCover ? parseInt(storedCover, 10) : 0)
    }
  }, [targetUserId])

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
        setStats(prev => ({ ...prev, friends: prev.friends + 1 }))
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
        toast.success('Connection updated successfully.')
        setFriendship(null)
        setStats(prev => ({ ...prev, friends: Math.max(0, prev.friends - 1) }))
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
          supabase.from('user_points').select('total').eq('user_id', targetUserId).maybeSingle(),
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
          points: pointsRes.data?.total || 0,
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

  // Live Validations
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!form.full_name.trim()) {
      errors.full_name = 'Full name is required.'
    }
    if (!form.username.trim()) {
      errors.username = 'Username is required.'
    } else if (!/^[a-zA-Z0-9_]{3,15}$/.test(form.username)) {
      errors.username = 'Username must be 3-15 chars & alphanumeric/underscores.'
    }
    if (!form.branch.trim()) {
      errors.branch = 'Branch is required.'
    }
    if (!form.roll_number.trim()) {
      errors.roll_number = 'Roll Number is required.'
    }
    if (form.phone.trim() && !/^\+?[0-9\s-]{10,15}$/.test(form.phone)) {
      errors.phone = 'Please provide a valid phone format.'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!isOwner) return
    if (!validateForm()) {
      toast.error('Please resolve validation errors before saving.')
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

      // Save tags and presets local state
      localStorage.setItem(`cc_skills_${userId}`, JSON.stringify(skills))
      localStorage.setItem(`cc_interests_${userId}`, JSON.stringify(interests))
      localStorage.setItem(`cc_cover_preset_${userId}`, coverPreset.toString())

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

      toast.success('Profile saved successfully!')
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

  const set = (k: string, v: any) => {
    setForm(f => ({ ...f, [k]: v }))
    // Clear validation error dynamically
    if (validationErrors[k]) {
      setValidationErrors(prev => {
        const copy = { ...prev }
        delete copy[k]
        return copy
      })
    }
  }

  // Tags Helpers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (index: number) => {
    setSkills(prev => prev.filter((_, idx) => idx !== index))
  }

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests(prev => [...prev, newInterest.trim()])
      setNewInterest('')
    }
  }

  const removeInterest = (index: number) => {
    setInterests(prev => prev.filter((_, idx) => idx !== index))
  }

  const handlePresetSelect = (id: number) => {
    setCoverPreset(id)
    if (isOwner) {
      localStorage.setItem(`cc_cover_preset_${userId}`, id.toString())
    }
    setShowCoverPicker(false)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 font-sans select-none">
      
      {/* Navigation Breadcrumb header */}
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

        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-zinc-500">
          <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span>&gt;</span>
          <span className="text-white font-semibold">Profiles</span>
          <span>&gt;</span>
          <span className="text-zinc-300 font-medium">{profile?.full_name || 'User'}</span>
        </div>
      </div>

      {/* Flagship Header Box */}
      <div className="relative rounded-3xl border border-white/[0.04] bg-[#18181B] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Cover Image banner presets */}
        <div className={clsx("h-36 sm:h-52 w-full transition-all duration-700 relative", COVER_PRESETS[coverPreset].class)}>
          {/* Overlay mask */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          
          {/* Change Cover Trigger (Owner only) */}
          {isOwner && (
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setShowCoverPicker(!showCoverPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.08] text-[10px] font-bold text-zinc-300 hover:text-white hover:bg-black/80 transition-all select-none active:scale-95 cursor-pointer"
              >
                <Camera size={12} />
                Customize Cover
              </button>

              {showCoverPicker && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1c1c22] border border-white/[0.08] shadow-2xl p-2 z-30 space-y-1">
                  <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase px-2 py-1">Select Preset</p>
                  {COVER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      className={clsx(
                        "w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2",
                        coverPreset === preset.id && "bg-white/5 font-semibold text-white"
                      )}
                    >
                      <span className={clsx("w-3 h-3 rounded-full border border-white/20 shrink-0", preset.class)} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Card Header Info */}
        <div className="px-6 pb-6 pt-0 sm:px-8 relative z-10 flex flex-col md:flex-row md:items-end gap-5">
          {/* Avatar Area with overlap */}
          <div className="relative shrink-0 -mt-16 sm:-mt-24 mx-auto md:mx-0 group">
            {/* Outline Glow ring */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-400 via-emerald-400 to-indigo-600 rounded-3xl opacity-35 blur group-hover:opacity-60 transition duration-500 group-hover:scale-105" />
            
            <div className="relative rounded-3xl bg-[#18181B] p-1.5 border border-white/[0.04]">
              {currentAvatarUrl ? (
                <img 
                  src={currentAvatarUrl} 
                  alt={profile?.full_name || 'Avatar'} 
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-tr from-blue-900/40 to-slate-900 border border-white/[0.04] flex items-center justify-center text-4xl font-extrabold text-blue-400">
                  {getInitials(profile?.full_name || 'CC')}
                </div>
              )}
              {/* Online pulse green dot */}
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 bg-[#22C55E] border-[3px] border-[#18181B] rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
            </div>

            {editing && isOwner && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg border border-white/10 bg-brand-500 hover:bg-brand-600 text-white cursor-pointer"
                title="Change Avatar"
              >
                {uploading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={14} />
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

          {/* Identity details and Action buttons */}
          <div className="flex-1 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none font-sans">
                  {profile?.full_name}
                </h1>
                {profile?.is_verified && (
                  <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase">
                    Verified Student
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-zinc-500">@{profile?.username || 'user'}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-zinc-400 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <GraduationCap size={13} className="text-zinc-500" />
                  <span>{profile?.colleges?.name || 'IILM University'}</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                <span>{profile?.branch}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                <span>Year {profile?.year}</span>
              </div>
            </div>

            {/* Profile Action Triggers */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
              {isOwner ? (
                <button 
                  onClick={() => setEditing(true)} 
                  className="px-5 h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] text-zinc-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all select-none active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit2 size={13} />
                  Edit Profile
                </button>
              ) : (
                relation !== 'blocked' && (
                  <>
                    {/* Message Action */}
                    <Link
                      href={relation === 'friends' ? `/messages?userId=${targetUserId}` : '#'}
                      className={clsx(
                        "px-5 h-10 rounded-xl text-xs font-semibold tracking-wide transition-all select-none flex items-center justify-center gap-2 border active:scale-95",
                        relation === 'friends'
                          ? "bg-blue-600/10 hover:bg-blue-600/20 border-blue-600/20 text-blue-400 cursor-pointer"
                          : "bg-white/[0.01] border-white/[0.04] text-zinc-600 cursor-not-allowed"
                      )}
                      onClick={(e) => relation !== 'friends' && e.preventDefault()}
                    >
                      <MessageCircle size={14} />
                      Message
                    </Link>

                    {/* Friend relationship actions */}
                    {relation === 'none' && (
                      <button
                        onClick={handleAddConnection}
                        disabled={friendshipLoading}
                        className="px-5 h-10 bg-blue-500 hover:bg-blue-600 border border-blue-500/20 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-blue-500/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
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
                        onClick={() => handleDeclineOrCancelRequest()}
                        disabled={friendshipLoading}
                        className="px-5 h-10 bg-white/[0.02] border border-white/[0.04] text-zinc-400 hover:text-red-400 hover:border-red-500/20 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {friendshipLoading ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Clock size={13} className="animate-pulse" />
                            <span>Request Sent</span>
                          </>
                        )}
                      </button>
                    )}

                    {relation === 'received' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAcceptRequest}
                          disabled={friendshipLoading}
                          className="px-4 h-10 bg-emerald-500 hover:bg-emerald-600 border border-emerald-500/20 text-white rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {friendshipLoading ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check size={13} />
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeclineOrCancelRequest()}
                          disabled={friendshipLoading}
                          className="px-4 h-10 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {relation === 'friends' && (
                      <div className="relative dropdown-container" ref={dropdownRef}>
                        <button
                          onClick={() => setShowDropdown(!showDropdown)}
                          className="px-5 h-10 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check size={13} />
                          Connected ✓
                        </button>

                        {showDropdown && (
                          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1c1c22] border border-white/[0.08] shadow-2xl p-1.5 z-30 font-sans">
                            <button
                              onClick={(e) => {
                                setShowDropdown(false)
                                handleDeclineOrCancelRequest(e)
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left font-bold cursor-pointer"
                            >
                              Remove Connection
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Box 1: About */}
        <div className="bg-[#18181B] border border-white/[0.04] rounded-3xl p-6 shadow-md flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <User size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">About Student</h3>
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-normal text-left whitespace-pre-wrap">
            {profile?.bio || 'Biography details have not been updated yet.'}
          </p>
        </div>

        {/* Box 2: Academic Journey */}
        <div className="bg-[#18181B] border border-white/[0.04] rounded-3xl p-6 shadow-md flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <GraduationCap size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">Academic Details</h3>
          </div>
          
          <div className="space-y-3.5 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium">Program</span>
              <span className="text-zinc-200 font-semibold">{profile?.branch || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium">Semester / Year</span>
              <span className="text-zinc-200 font-semibold">{profile?.year ? `Year ${profile.year}` : 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium flex items-center gap-1">
                Roll Number {!canViewSensitiveInfo && <EyeOff size={11} className="text-zinc-600" />}
              </span>
              {canViewSensitiveInfo ? (
                <span className="text-zinc-200 font-semibold font-mono">{profile?.roll_number || 'Not set'}</span>
              ) : (
                <span className="text-zinc-600 font-medium italic flex items-center gap-1 text-[11px]"><Lock size={10} /> Locked</span>
              )}
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium flex items-center gap-1">
                Campus Housing {!canViewSensitiveInfo && <EyeOff size={11} className="text-zinc-600" />}
              </span>
              {canViewSensitiveInfo ? (
                <span className="text-zinc-200 font-semibold">{profile?.hostel || 'Not set'}</span>
              ) : (
                <span className="text-zinc-600 font-medium italic flex items-center gap-1 text-[11px]"><Lock size={10} /> Locked</span>
              )}
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium flex items-center gap-1">
                Contact Phone {!canViewSensitiveInfo && <EyeOff size={11} className="text-zinc-600" />}
              </span>
              {canViewSensitiveInfo ? (
                <span className="text-zinc-200 font-semibold font-mono">{profile?.phone || 'Not set'}</span>
              ) : (
                <span className="text-zinc-600 font-medium italic flex items-center gap-1 text-[11px]"><Lock size={10} /> Locked</span>
              )}
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium flex items-center gap-1">
                Email Address {!canViewSensitiveInfo && <EyeOff size={11} className="text-zinc-600" />}
              </span>
              {canViewSensitiveInfo ? (
                <span className="text-zinc-200 font-semibold truncate max-w-[160px]">{profile?.email || 'Not set'}</span>
              ) : (
                <span className="text-zinc-600 font-medium italic flex items-center gap-1 text-[11px]"><Lock size={10} /> Locked</span>
              )}
            </div>
          </div>
        </div>

        {/* Box 3: Live Stats & Level Progression */}
        <div className="bg-[#18181B] border border-white/[0.04] rounded-3xl p-6 shadow-md flex flex-col gap-5 justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
              <Award size={16} className="text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">Reputation & Stats</h3>
            </div>

            <div ref={parentStats} className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Posts', value: stats.posts, icon: FileText, color: 'text-indigo-400 bg-indigo-500/10' },
                { label: 'Network', value: stats.friends, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
                { label: 'Badges', value: stats.badges, icon: Trophy, color: 'text-amber-400 bg-amber-500/10' },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl text-center">
                    <div className="flex justify-center mb-1">
                      <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center", item.color)}>
                        <Icon size={12} />
                      </div>
                    </div>
                    <p className="text-lg font-black text-white">{item.value}</p>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-tight mt-0.5">{item.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Level Points Progression */}
          <div className="space-y-2 pt-2 border-t border-white/[0.04]">
            <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-400">
              <span className="flex items-center gap-1"><Sparkles size={11} className="text-amber-400 animate-pulse" /> Level {Math.floor(stats.points / 500) + 1}</span>
              <span>{stats.points % 500} / 500 XP</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.02] border border-white/[0.04] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${((stats.points % 500) / 500) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Box 4: Skills & Interests */}
        <div className="bg-[#18181B] border border-white/[0.04] rounded-3xl p-6 shadow-md flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <Hash size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">Skills & Interests</h3>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-2">Technical Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold">
                    {s}
                  </span>
                ))}
                {skills.length === 0 && <span className="text-xs text-zinc-600 italic">No skills listed</span>}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-2">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((i, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                    {i}
                  </span>
                ))}
                {interests.length === 0 && <span className="text-xs text-zinc-600 italic">No interests listed</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Box 5: Achievements Badges */}
        <div className="bg-[#18181B] border border-white/[0.04] rounded-3xl p-6 shadow-md flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">Badges Earned</h3>
            </div>
            <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
              {stats.badges} Earned
            </span>
          </div>

          <div ref={parentBadges} className="grid grid-cols-2 gap-2 text-left">
            {PREDEFINED_BADGES.map((badge) => {
              const isEarned = earnedBadges.includes(badge.id)
              const BadgeIcon = badge.icon
              return (
                <div 
                  key={badge.id}
                  className={clsx(
                    "flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                    isEarned 
                      ? "bg-white/[0.01] border-white/[0.08]" 
                      : "bg-white/[0.01] border-white/[0.02] opacity-35"
                  )}
                  title={badge.desc}
                >
                  <div className={clsx(
                    "w-7 h-7 rounded-lg flex items-center justify-center border shrink-0",
                    isEarned 
                      ? `bg-gradient-to-tr ${badge.color} text-zinc-950 border-transparent` 
                      : "bg-zinc-900 text-zinc-600 border-white/[0.04]"
                  )}>
                    <BadgeIcon size={12} />
                  </div>
                  <div className="min-w-0">
                    <p className={clsx(
                      "text-[10px] font-bold truncate",
                      isEarned ? "text-zinc-200" : "text-zinc-600"
                    )}>
                      {badge.name}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Box 6: Connections Mutual or Facepile */}
        <div className="bg-[#18181B] border border-white/[0.04] rounded-3xl p-6 shadow-md flex flex-col gap-4 justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">Network</h3>
              </div>
              <Link href="/friends" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">
                Manage
              </Link>
            </div>
            
            {/* Show mutual friends if visiting another profile, or showcase connections */}
            {!isOwner && mutualFriends.length > 0 ? (
              <div className="mt-4 text-left">
                <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-2">Mutual Connections ({mutualFriends.length})</p>
                <div className="flex flex-wrap gap-2">
                  {mutualFriends.slice(0, 5).map((f) => (
                    <Link key={f.id} href={`/profile?id=${f.id}`} className="hover:scale-105 transition-transform" title={f.full_name}>
                      <GlobalAvatar profile={f} size="sm" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-left">
                <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3">Recent connections</p>
                <p className="text-zinc-500 text-xs italic">Manage connections tab to view all peers.</p>
              </div>
            )}
          </div>

          <Link href="/friends" className="w-full py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] rounded-xl text-xs font-semibold text-zinc-300 hover:text-white text-center transition-all">
            Open Connections Suite
          </Link>
        </div>

        {/* Box 7: Campus Activity & Recent Posts (Col Span 2) */}
        <div className="md:col-span-2 bg-[#18181B] border border-white/[0.04] rounded-3xl p-6 shadow-md flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">Recent Campus Activity</h3>
            </div>

            {/* Custom Tab Toggles */}
            <div className="flex gap-1 p-1 rounded-xl bg-zinc-900 border border-white/[0.04] select-none">
              {(['posts', 'communities', 'events'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveActivityTab(tab)}
                  className={clsx(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                    activeActivityTab === tab
                      ? "bg-white/5 border border-white/[0.04] text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Activity items body */}
          <div className="min-h-[160px] flex flex-col gap-2 text-left">
            {loadingActivity ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2].map(n => <div key={n} className="h-12 w-full rounded-xl bg-white/[0.02]" />)}
              </div>
            ) : (
              <>
                {/* Posts Activity */}
                {activeActivityTab === 'posts' && (
                  <div className="space-y-2">
                    {activities.posts.map(post => (
                      <div key={post.id} className="p-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="min-w-0 pr-4">
                          <p className="text-xs text-zinc-300 truncate max-w-[450px] font-medium leading-relaxed">&ldquo;{post.content}&rdquo;</p>
                          <span className="text-[9px] font-mono text-zinc-500 mt-1 block">
                            {new Date(post.created_at).toLocaleDateString()} · {post.likes_count} Likes · {post.comments_count} Replies
                          </span>
                        </div>
                      </div>
                    ))}
                    {activities.posts.length === 0 && (
                      <p className="text-zinc-500 text-xs italic py-4 text-center">No posts shared yet.</p>
                    )}
                  </div>
                )}

                {/* Communities Activity */}
                {activeActivityTab === 'communities' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activities.communities.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <MessageCircle size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-200 font-bold truncate">{item.communities?.name}</p>
                          <p className="text-[9px] text-zinc-500 truncate mt-0.5">{item.communities?.description || 'Campus interest group'}</p>
                        </div>
                      </div>
                    ))}
                    {activities.communities.length === 0 && (
                      <p className="col-span-2 text-zinc-500 text-xs italic py-4 text-center">No communities joined yet.</p>
                    )}
                  </div>
                )}

                {/* Events Activity */}
                {activeActivityTab === 'events' && (
                  <div className="space-y-2">
                    {activities.events.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Calendar size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-200 font-bold truncate">{item.events?.title}</p>
                            <p className="text-[9px] text-zinc-500 truncate mt-0.5">{item.events?.description || 'RSVPd Event'}</p>
                          </div>
                        </div>
                        {item.events?.start_time && (
                          <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.04] px-1.5 py-0.5 rounded">
                            {new Date(item.events.start_time).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                    {activities.events.length === 0 && (
                      <p className="text-zinc-500 text-xs italic py-4 text-center">No upcoming events RSVPd.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Edit Profile Pane Overlay Modal (Premium Transition Layer) */}
      <AnimatePresence>
        {editing && isOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop filter overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-2xl bg-[#1c1c22] border border-white/[0.06] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-none space-y-6"
            >
              {/* Header Title section */}
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-4">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Edit2 size={16} className="text-blue-400" />
                    Edit Campus Profile
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-1 font-medium">Keep your university credentials and social handles up-to-date.</p>
                </div>
                
                <button 
                  onClick={() => setEditing(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form Input Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* Full name block */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Full Name *</span>
                  <input 
                    value={form.full_name} 
                    onChange={e => set('full_name', e.target.value)} 
                    className={clsx(
                      "w-full bg-[#09090B] border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 transition-all font-medium",
                      validationErrors.full_name ? "border-red-500 focus:ring-red-500" : "border-white/[0.06] focus:border-blue-500 focus:ring-blue-500"
                    )} 
                    placeholder="Enter full name" 
                  />
                  {validationErrors.full_name && (
                    <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.full_name}</span>
                  )}
                </div>

                {/* Username block */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Username *</span>
                  <input 
                    value={form.username} 
                    onChange={e => set('username', e.target.value)} 
                    className={clsx(
                      "w-full bg-[#09090B] border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 transition-all font-medium",
                      validationErrors.username ? "border-red-500 focus:ring-red-500" : "border-white/[0.06] focus:border-blue-500 focus:ring-blue-500"
                    )} 
                    placeholder="johndoe" 
                  />
                  {validationErrors.username && (
                    <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.username}</span>
                  )}
                </div>

                {/* Branch block */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Branch / Program *</span>
                  <select 
                    value={form.branch} 
                    onChange={e => set('branch', e.target.value)} 
                    className="w-full bg-[#09090B] border border-white/[0.06] focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="" className="bg-[#09090B]">Select branch</option>
                    {BRANCHES.map(b => <option key={b} value={b} className="bg-[#09090B]">{b}</option>)}
                  </select>
                  {validationErrors.branch && (
                    <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.branch}</span>
                  )}
                </div>

                {/* Year block */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Current Year *</span>
                  <select 
                    value={form.year} 
                    onChange={e => set('year', +e.target.value)} 
                    className="w-full bg-[#09090B] border border-white/[0.06] focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium cursor-pointer"
                  >
                    {YEARS.map(y => <option key={y} value={y} className="bg-[#09090B]">Year {y}</option>)}
                  </select>
                </div>

                {/* Roll number block */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Roll Number *</span>
                  <input 
                    value={form.roll_number} 
                    onChange={e => set('roll_number', e.target.value)} 
                    className={clsx(
                      "w-full bg-[#09090B] border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 transition-all font-medium",
                      validationErrors.roll_number ? "border-red-500 focus:ring-red-500" : "border-white/[0.06] focus:border-blue-500 focus:ring-blue-500"
                    )} 
                    placeholder="IILM2024BBA001" 
                  />
                  {validationErrors.roll_number && (
                    <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.roll_number}</span>
                  )}
                </div>

                {/* Hostel block */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Hostel housing</span>
                  <select 
                    value={form.hostel} 
                    onChange={e => set('hostel', e.target.value)} 
                    className="w-full bg-[#09090B] border border-white/[0.06] focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium cursor-pointer"
                  >
                    <option value="" className="bg-[#09090B]">Select housing option</option>
                    {HOSTELS.map(h => <option key={h} value={h} className="bg-[#09090B]">{h}</option>)}
                  </select>
                </div>

                {/* Phone contact */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Phone contact</span>
                  <input 
                    value={form.phone} 
                    onChange={e => set('phone', e.target.value)} 
                    className={clsx(
                      "w-full bg-[#09090B] border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 transition-all font-medium",
                      validationErrors.phone ? "border-red-500 focus:ring-red-500" : "border-white/[0.06] focus:border-blue-500 focus:ring-blue-500"
                    )} 
                    placeholder="+91 99999 99999" 
                    type="tel"
                  />
                  {validationErrors.phone && (
                    <span className="text-[9px] text-red-500 block font-semibold">{validationErrors.phone}</span>
                  )}
                </div>

                {/* Short Bio Block */}
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Biography</span>
                  <textarea 
                    value={form.bio || ''} 
                    onChange={e => set('bio', e.target.value)} 
                    className="w-full bg-[#09090B] border border-white/[0.06] focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium resize-none h-16" 
                    placeholder="Tell the campus your story..." 
                  />
                </div>
              </div>

              {/* Skills and Interests tagging */}
              <div className="border-t border-white/[0.04] pt-4 space-y-4 text-left">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configure Tags</h3>
                
                {/* Skills tags builder */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Technical Skills</span>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#09090B] border border-white/[0.04] min-h-[40px]">
                    {skills.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeSkill(idx)} className="hover:text-red-400 shrink-0">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="flex-1 bg-[#09090B] border border-white/[0.06] focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                      placeholder="Type a skill (e.g. Next.js) and press enter"
                    />
                    <button 
                      type="button" 
                      onClick={addSkill}
                      className="px-3.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Interests tags builder */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Interests & Hobbies</span>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#09090B] border border-white/[0.04] min-h-[40px]">
                    {interests.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeInterest(idx)} className="hover:text-red-400 shrink-0">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newInterest}
                      onChange={e => setNewInterest(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                      className="flex-1 bg-[#09090B] border border-white/[0.06] focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                      placeholder="Type an interest (e.g. Hackathons) and press enter"
                    />
                    <button 
                      type="button" 
                      onClick={addInterest}
                      className="px-3.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04]">
                <button 
                  onClick={() => setEditing(false)} 
                  className="px-5 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mutual Connections List Modal */}
      {showAllMutual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAllMutual(false)} />
          <div className="max-w-md w-full relative z-10 p-6 space-y-4 bg-[#1c1c22] border border-white/[0.06] rounded-3xl shadow-2xl flex flex-col font-sans max-h-[80vh]">
            <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
              <h3 className="font-display font-bold text-white text-base">Mutual Connections</h3>
              <button onClick={() => setShowAllMutual(false)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2">
              {mutualFriends.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-[#09090B] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <GlobalAvatar profile={f} size="sm" />
                    <div className="min-w-0 text-left">
                      <Link 
                        href={`/profile?id=${f.id}`}
                        onClick={() => setShowAllMutual(false)}
                        className="text-xs font-bold text-white hover:text-blue-400 transition-colors block truncate max-w-[180px]"
                      >
                        {f.full_name}
                      </Link>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                        {f.branch ? `${f.branch}` : ''} {f.year ? `· Y${f.year}` : ''}
                      </p>
                    </div>
                  </div>
                  <Link 
                    href={`/profile?id=${f.id}`}
                    onClick={() => setShowAllMutual(false)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-bold text-center"
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
