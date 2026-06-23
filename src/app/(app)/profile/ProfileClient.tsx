'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Camera, CheckCircle, Edit2, GraduationCap, Save, X, Phone, 
  Mail, Award, BookOpen, Calendar, User, ShieldCheck, Home, 
  FileText, Users, MessageCircle, Trophy 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { DynamicIcon } from '@/components/ui/DynamicIcon'

const BRANCHES = ['BBA', 'MBA', 'BCA', 'MCA', 'B.Com', 'BA (H)', 'B.Sc', 'Law', 'B.Tech', 'Other']
const HOSTELS = ['Boys Hostel A', 'Boys Hostel B', 'Girls Hostel A', 'Girls Hostel B', 'Day Scholar']
const YEARS = [1, 2, 3, 4, 5]

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

export default function ProfileClient({ 
  profile, 
  userId, 
  targetUserId 
}: { 
  profile: Profile | null
  userId: string
  targetUserId: string 
}) {
  const supabase = createClient()
  const isOwner = userId === targetUserId

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(profile?.avatar_url)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const [stats, setStats] = useState({
    friends: 0,
    posts: 0,
    points: 0,
    communities: 0
  })

  // Fetch live stats on component mount/load
  useEffect(() => {
    async function fetchStats() {
      try {
        const [friendsRes, postsRes, pointsRes, commsRes] = await Promise.all([
          supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`),
          supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', targetUserId),
          supabase
            .from('user_points')
            .select('total_points')
            .eq('user_id', targetUserId)
            .maybeSingle(),
          supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', targetUserId)
        ])

        setStats({
          friends: friendsRes.count || 0,
          posts: postsRes.count || 0,
          points: pointsRes.data?.total_points || 0,
          communities: commsRes.count || 0
        })
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }

    if (targetUserId) {
      fetchStats()
    }
  }, [targetUserId, supabase])

  // Sync state if profile changes
  useEffect(() => {
    if (profile) {
      setCurrentAvatarUrl(profile.avatar_url)
      setForm({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        branch: profile.branch || '',
        year: profile.year || 1,
        roll_number: profile.roll_number || '',
        hostel: profile.hostel || '',
        phone: profile.phone || '',
      })
    }
  }, [profile])

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
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setCurrentAvatarUrl(publicUrl)
      toast.success('Avatar updated!', { id: toastId })
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar', { id: toastId })
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!isOwner) return
    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
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

      toast.success('Profile updated successfully')
      setEditing(false)
      // Slight delay to allow server sync before reload
      setTimeout(() => {
        window.location.reload()
      }, 500)

    } catch (err) {
      console.error(err)
      toast.error('Unexpected error while saving profile')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="animate-fade-in space-y-8 max-w-4xl pb-24">
      {/* Profile Header Premium Card with Moving Mesh BG */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#090d16]/80 p-8 backdrop-blur-2xl shadow-2xl"
      >
        {/* Glow ambient effects */}
        <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-cyan-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />

        {/* Profile Card Banner Backing */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/15 via-purple-900/10 to-cyan-900/10 opacity-30 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          {/* Avatar Area with Glow Ring */}
          <div className="relative shrink-0 group">
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-cyan-400 via-blue-600 to-indigo-600 rounded-3xl opacity-30 group-hover:opacity-75 blur-md transition-all duration-500" />
            <div className="relative rounded-3xl bg-[#030712] p-1.5 border border-white/[0.08]">
              <GlobalAvatar
                avatarUrl={currentAvatarUrl}
                fullName={profile?.full_name}
                username={profile?.username}
                size="xl"
                className="w-28 h-28 rounded-2xl object-cover"
              />
            </div>
            {editing && isOwner && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 shadow-lg border border-white/10" 
                style={{ background: 'linear-gradient(135deg,#06b6d4,#4f46e5)' }}
                aria-label="Upload Avatar"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="text-white" size={15} />
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

          {/* User Meta Info Area */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl text-left">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Full Name *</span>
                      <input 
                        value={form.full_name} 
                        onChange={e => set('full_name', e.target.value)} 
                        className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium" 
                        placeholder="Priya Sharma" 
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Username</span>
                      <input 
                        value={form.username} 
                        onChange={e => set('username', e.target.value)} 
                        className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium" 
                        placeholder="priya.sharma" 
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="font-display text-3xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-2.5">
                      {profile?.full_name}
                      {(profile?.is_verified || profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN') && (
                        <CheckCircle className="text-cyan-400 shrink-0" size={22} />
                      )}
                    </h1>
                    {profile?.username && (
                      <p className="text-sm font-mono text-cyan-400 mt-1">@{profile.username}</p>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              {isOwner && (
                <div className="flex justify-center md:justify-start gap-3">
                  {editing ? (
                    <>
                      <button 
                        onClick={() => setEditing(false)} 
                        className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                      <button 
                        onClick={handleSave} 
                        disabled={saving || !form.full_name}
                        className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white transition-all hover:scale-105 active:scale-95 shadow-lg border border-cyan-500/20"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
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
                      className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold tracking-wide transition-all duration-300 flex items-center gap-2"
                    >
                      <Edit2 size={13} />
                      Edit Profile
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bio Field Redesign */}
            <div className="max-w-xl">
              {editing ? (
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Short Bio</span>
                  <textarea 
                    value={form.bio} 
                    onChange={e => set('bio', e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium resize-none h-16" 
                    placeholder="Tell your campus what you're about..." 
                  />
                </div>
              ) : (
                profile?.bio ? (
                  <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 italic">No bio written yet.</p>
                )
              )}
            </div>

            {/* Chips block */}
            {!editing && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
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
                {profile?.role && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 tracking-wider uppercase">
                    {profile.role}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Grid: Academic Info + Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Col: Academic & Contact Info (2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/[0.08] bg-[#090d16]/80 p-6 backdrop-blur-2xl shadow-xl"
          >
            <h3 className="font-display font-bold text-lg text-white mb-6 flex items-center gap-2.5">
              <GraduationCap className="text-cyan-400 shrink-0" size={20} />
              Academic & Contact Profile
            </h3>

            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Branch / Program</label>
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
                  <label className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Current Year</label>
                  <select 
                    value={form.year} 
                    onChange={e => set('year', +e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium cursor-pointer"
                  >
                    {YEARS.map(y => <option key={y} value={y} className="bg-[#030712]">Year {y}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Roll Number</label>
                  <input 
                    value={form.roll_number} 
                    onChange={e => set('roll_number', e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium" 
                    placeholder="IILM2024BBA001" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Campus Housing</label>
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
                  <label className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Phone Contact</label>
                  <input 
                    value={form.phone} 
                    onChange={e => set('phone', e.target.value)} 
                    className="w-full bg-[#0d121f]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium" 
                    placeholder="+91 9999999999" 
                    type="tel" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Email Address (Auth)</label>
                  <input 
                    value={profile?.email || ''} 
                    disabled 
                    className="w-full bg-[#0d121f]/30 border border-white/[0.04] rounded-xl px-3 py-2 text-xs text-neutral-500 font-medium cursor-not-allowed" 
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Branch / Program', value: profile?.branch, icon: BookOpen, color: 'text-cyan-400' },
                  { label: 'Current Year', value: profile?.year ? `${profile.year} Year` : null, icon: Calendar, color: 'text-purple-400' },
                  { label: 'Roll Number', value: profile?.roll_number, icon: User, color: 'text-blue-400' },
                  { label: 'Campus Housing', value: profile?.hostel, icon: Home, color: 'text-emerald-400' },
                  { label: 'Phone Contact', value: profile?.phone, icon: Phone, color: 'text-pink-400' },
                  { label: 'Email Address', value: profile?.email, icon: Mail, color: 'text-amber-400' },
                ].map(({ label, value, icon: IconComponent, color }) => (
                  <div 
                    key={label} 
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.08] hover:shadow-[0_0_15px_rgba(255,255,255,0.01)] transition-all duration-300 group cursor-default"
                  >
                    <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-950 border border-white/[0.04] shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300", color)}>
                      <IconComponent size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest leading-none">{label}</p>
                      <p className="text-xs text-white font-semibold tracking-tight mt-1 truncate">
                        {value || <span className="text-neutral-600 font-medium italic">Not set</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Col: Stats Grid (1/3 width) */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-white/[0.08] bg-[#090d16]/80 p-6 backdrop-blur-2xl shadow-xl"
          >
            <h3 className="font-display font-bold text-lg text-white mb-6 flex items-center gap-2.5">
              <Award className="text-purple-400 shrink-0" size={20} />
              Node Statistics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Friends', value: stats.friends, icon: Users, color: 'text-blue-400' },
                { label: 'Posts', value: stats.posts, icon: FileText, color: 'text-purple-400' },
                { label: 'Points', value: stats.points, icon: Trophy, color: 'text-amber-400' },
                { label: 'Communities', value: stats.communities, icon: MessageCircle, color: 'text-cyan-400' },
              ].map(stat => {
                const StatIcon = stat.icon
                return (
                  <div 
                    key={stat.label} 
                    className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0d121f]/50 p-4 text-center hover:border-cyan-500/20 hover:bg-white/[0.02] hover:shadow-[0_0_15px_rgba(6,182,212,0.05)] transition-all duration-300 group cursor-default"
                  >
                    <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-white/[0.01] blur-md group-hover:bg-cyan-500/5 transition-colors" />
                    
                    <div className="mb-2 flex justify-center">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-950 border border-white/[0.03] shadow-inner text-neutral-400 group-hover:text-cyan-400 transition-all group-hover:scale-105 duration-300">
                        <StatIcon size={15} className={stat.color} />
                      </div>
                    </div>
                    
                    <p className="font-display text-2xl font-extrabold text-white tracking-tight leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mt-1.5 leading-none">
                      {stat.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
