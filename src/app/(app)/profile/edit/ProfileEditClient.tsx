'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { Camera, ChevronLeft, Save } from 'lucide-react'
import clsx from 'clsx'

const BRANCHES = ['BBA', 'MBA', 'BCA', 'MCA', 'B.Com', 'BA (H)', 'B.Sc', 'Law', 'B.Tech', 'Other']
const YEARS = [1, 2, 3, 4, 5]

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  username: string | null
  bio: string | null
  branch: string | null
  year: number | null
  roll_number: string | null
  hostel: string | null
  phone: string | null
  email: string
  colleges?: {
    name: string
    city: string
  } | null
}

interface ProfileEditClientProps {
  profile: Profile | null
  userId: string
}

export default function ProfileEditClient({ profile: initialProfile, userId }: ProfileEditClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const { refetch: refetchCurrentProfile, setProfile } = useCurrentProfile()
  
  const [profile, setLocalProfile] = useState<Profile | null>(initialProfile)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Update local states when profile changes
  useEffect(() => {
    if (profile) {
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

  const set = (field: string, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }))
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be under 2MB')
      return
    }

    setUploading(true)
    const toastId = toast.loading('Uploading avatar...')

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`

      // 1. Upload to Storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // 2. Update profiles table
      const { error: updateError } = await supabase
        .from('profiles_secure')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      // Refresh state
      const { data: fresh } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fresh) {
        setLocalProfile(fresh as any)
        setProfile(fresh as any)
        await refetchCurrentProfile()
      }

      toast.success('Avatar updated successfully!', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error('Upload failed: ' + err.message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  // Handle profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple client side validation
    const errors: Record<string, string> = {}
    if (!form.full_name.trim()) errors.full_name = 'Name is required'
    if (!form.username.trim()) errors.username = 'Username is required'
    if (form.username.includes(' ')) errors.username = 'Username cannot contain spaces'

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error('Please correct the validation errors')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles_secure')
        .update({
          full_name: form.full_name,
          username: form.username.toLowerCase(),
          bio: form.bio,
          branch: form.branch,
          year: form.year,
          roll_number: form.roll_number,
          hostel: form.hostel,
          phone: form.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      const { data: fresh } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fresh) {
        setLocalProfile(fresh as any)
        setProfile(fresh as any)
        await refetchCurrentProfile()
      }

      toast.success('Profile saved successfully!')
      router.push('/profile')
    } catch (err: any) {
      console.error(err)
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 select-none animate-fade-in py-6">
      {/* Back button */}
      <button 
        onClick={() => router.push('/profile')}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs font-semibold"
      >
        <ChevronLeft size={16} />
        Back to Profile
      </button>

      <Card variant="premium" className="p-6 sm:p-8 space-y-6 border border-white/[0.06] shadow-premium">
        <div className="border-b border-white/[0.04] pb-4.5">
          <h2 className="text-lg font-bold text-white tracking-tight font-display">Edit Profile</h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Keep your university credentials and basic information accurate.</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar block */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-white/[0.01] border border-white/[0.03] p-4.5 rounded-2xl">
            <div className="relative group">
              <GlobalAvatar profile={profile} className="w-20 h-20 border-2 border-white/10 cursor-pointer shadow-lg" />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/10 w-full h-full"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-bold text-zinc-200 font-display">Avatar Image</p>
              <p className="text-[10px] text-zinc-500 font-mono">PNG, JPEG up to 2MB. Square dimensions recommended.</p>
              <button 
                type="button" 
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 btn-ghost-pro py-1 px-3 text-[10px] uppercase tracking-wider h-8"
              >
                Change Image
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Full Name *</span>
              <input 
                value={form.full_name} 
                onChange={e => set('full_name', e.target.value)} 
                className={clsx(
                  "input-pro text-xs font-medium",
                  validationErrors.full_name && "border-red-500/50 focus:border-red-500"
                )} 
                placeholder="Enter full name" 
              />
              {validationErrors.full_name && (
                <span className="text-[9px] text-red-400 block font-semibold">{validationErrors.full_name}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Username *</span>
              <input 
                value={form.username} 
                onChange={e => set('username', e.target.value)} 
                className={clsx(
                  "input-pro text-xs font-medium",
                  validationErrors.username && "border-red-500/50 focus:border-red-500"
                )} 
                placeholder="e.g. johndoe" 
              />
              {validationErrors.username && (
                <span className="text-[9px] text-red-400 block font-semibold">{validationErrors.username}</span>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Biography</span>
              <textarea 
                value={form.bio} 
                onChange={e => set('bio', e.target.value)} 
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all placeholder:text-zinc-500 font-medium resize-none"
                placeholder="Tell your classmates something about yourself..." 
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Course Branch</span>
              <select 
                value={form.branch} 
                onChange={e => set('branch', e.target.value)} 
                className="input-pro text-xs font-medium appearance-none cursor-pointer"
              >
                <option value="">Select Branch</option>
                {BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Academic Year</span>
              <select 
                value={form.year} 
                onChange={e => set('year', parseInt(e.target.value, 10))} 
                className="input-pro text-xs font-medium appearance-none cursor-pointer"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Roll Number</span>
              <input 
                value={form.roll_number} 
                onChange={e => set('roll_number', e.target.value)} 
                className="input-pro text-xs font-medium" 
                placeholder="University Roll Number" 
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Hostel Block</span>
              <input 
                value={form.hostel} 
                onChange={e => set('hostel', e.target.value)} 
                className="input-pro text-xs font-medium" 
                placeholder="e.g. Day Scholar, Boys Hostel A" 
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Phone Number</span>
              <input 
                value={form.phone} 
                onChange={e => set('phone', e.target.value)} 
                className="input-pro text-xs font-medium" 
                placeholder="10-digit mobile" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.04] mt-4">
            <button 
              type="button"
              onClick={() => router.push('/profile')}
              className="px-6 py-2 border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="btn-premium px-8 font-bold tracking-wide flex items-center gap-1.5 h-10"
            >
              <Save size={13} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
