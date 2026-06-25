'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  User, Settings, ShieldCheck, Bell, Palette, LogOut, Trash2, 
  Camera, Check, X, Sparkles, Mail, Lock, Info, AlertTriangle, ArrowRight, Eye, EyeOff
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'

const BRANCHES = ['BBA', 'MBA', 'BCA', 'MCA', 'B.Com', 'BA (H)', 'B.Sc', 'Law', 'B.Tech', 'Other']
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
}

interface SettingsClientProps {
  profile: Profile | null
  userId: string
}

export default function SettingsClient({ profile: initialProfile, userId }: SettingsClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const { refetch: refetchCurrentProfile, setProfile } = useCurrentProfile()
  
  const [profile, setLocalProfile] = useState<Profile | null>(initialProfile)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance' | 'danger'>('profile')
  
  // Forms state
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

  // Security Form
  const [emailForm, setEmailForm] = useState(profile?.email || '')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPass, setShowPass] = useState(false)

  // Notifications Toggles
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushAlerts: true,
    chatPreviews: true,
    eventReminders: true,
    communityActivity: false
  })

  // Privacy & Appearance Toggles
  const [privacyTheme, setPrivacyTheme] = useState({
    privateProfile: false,
    hideActiveStatus: false,
    darkMode: true,
    motionRedux: false
  })

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
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
      setEmailForm(profile.email || '')
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
    } catch (err: any) {
      console.error(err)
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })
      if (error) throw error

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password updated successfully!')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle email update
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForm.trim() || emailForm === profile?.email) return

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailForm
      })
      if (error) throw error
      toast.success('Confirmation email sent to both current and new addresses')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      supabase.removeAllChannels()
      localStorage.removeItem('recent_searches')
      window.location.href = '/'
    } catch (err: any) {
      toast.error('Sign out failed: ' + err.message)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setSaving(true)
    try {
      // 1. Delete user profile securely using supabase client
      const { error } = await supabase
        .from('profiles_secure')
        .delete()
        .eq('id', userId)

      if (error) throw error

      // 2. Sign out
      await supabase.auth.signOut()
      supabase.removeAllChannels()
      toast.success('Your profile has been deleted')
      window.location.href = '/'
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to delete account: ' + err.message)
    } finally {
      setSaving(false)
      setDeleteConfirmOpen(false)
    }
  }

  const tabsConfig = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'security', label: 'Security & Auth', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Theme & Privacy', icon: Palette },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ] as const

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none animate-fade-in">
      
      {/* Left Navigation Menu (Col-4) */}
      <div className="lg:col-span-3 card-premium p-4.5 space-y-2.5">
        <div className="flex items-center gap-3 px-2.5 pb-4 border-b border-white/[0.04] mb-2.5">
          <GlobalAvatar profile={profile} className="w-10 h-10 border border-white/10" />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight truncate">{profile?.full_name}</h2>
            <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">@{profile?.username || 'username'}</p>
          </div>
        </div>

        <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 scrollbar-none">
          {tabsConfig.map(t => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={clsx(
                  "flex items-center justify-center lg:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all shrink-0 whitespace-nowrap active:scale-95 cursor-pointer w-full text-left",
                  isActive
                    ? t.id === 'danger' 
                      ? "bg-red-500/10 border border-red-500/20 text-red-400" 
                      : "bg-brand-500/10 border border-brand-500/20 text-brand-400"
                    : "bg-transparent border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right Content Panel (Col-9) */}
      <div className="lg:col-span-9 space-y-6">
        
        {/* Profile Settings Pane */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="card-premium p-6 sm:p-8 space-y-6 border border-white/[0.06] shadow-premium">
            <div className="border-b border-white/[0.04] pb-4.5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Profile Details</h2>
                <p className="text-xs text-zinc-400 mt-1 font-medium">Keep your university credentials and basic information accurate.</p>
              </div>
            </div>

            {/* Avatar block */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-white/[0.01] border border-white/[0.03] p-4.5 rounded-2xl">
              <div className="relative group">
                <GlobalAvatar profile={profile} className="w-20 h-20 border-2 border-white/10 cursor-pointer shadow-lg" />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/10"
                >
                  <Camera size={18} />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs font-bold text-zinc-200">Avatar Image</p>
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

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={saving}
                className="btn-premium px-8 font-semibold tracking-wide"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}

        {/* Security & Authentication Pane */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            
            {/* Email update */}
            <form onSubmit={handleUpdateEmail} className="card-premium p-6 sm:p-8 space-y-5 border border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Email Address</h3>
                <p className="text-[11px] text-zinc-400 mt-1">View or update your registered campus email address.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-3 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Registered Email</span>
                  <input 
                    type="email" 
                    value={emailForm} 
                    onChange={e => setEmailForm(e.target.value)} 
                    className="input-pro text-xs" 
                    placeholder="name@university.edu" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={saving || emailForm === profile?.email}
                  className="btn-premium h-11 text-xs"
                >
                  {saving ? 'Updating...' : 'Update Email'}
                </button>
              </div>
            </form>

            {/* Password update */}
            <form onSubmit={handleUpdatePassword} className="card-premium p-6 sm:p-8 space-y-5 border border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Change Password</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Keep your campus connection credential strong and secure.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">New Password</span>
                  <div className="relative">
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      value={passwordForm.newPassword} 
                      onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} 
                      className="input-pro text-xs pr-10" 
                      placeholder="Minimum 6 characters" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Confirm New Password</span>
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    value={passwordForm.confirmPassword} 
                    onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} 
                    className="input-pro text-xs pr-10" 
                    placeholder="Verify password match" 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={saving || !passwordForm.newPassword}
                  className="btn-premium px-8 font-semibold tracking-wide text-xs"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications Settings Pane */}
        {activeTab === 'notifications' && (
          <div className="card-premium p-6 sm:p-8 space-y-6 border border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Notification Settings</h2>
              <p className="text-xs text-zinc-400 mt-1 font-medium">Control what events and items trigger notification updates.</p>
            </div>

            <div className="divide-y divide-white/[0.04] space-y-4">
              {[
                { id: 'emailAlerts', title: 'Email Notifications', desc: 'Receive security logs, event updates, and placement invites in your mailbox.' },
                { id: 'pushAlerts', title: 'Push Notifications', desc: 'Receive real-time popups when friends post or message you.' },
                { id: 'chatPreviews', title: 'Message Previews', desc: 'Display sender name and text snippet in incoming notification popups.' },
                { id: 'eventReminders', title: 'Event Reminders', desc: 'Get notified 30 minutes before your registered campus events start.' },
                { id: 'communityActivity', title: 'Community Activity Digests', desc: 'Weekly digests of technical and cultural society posts.' },
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between pt-4 first:pt-0">
                  <div className="space-y-1 pr-6">
                    <p className="text-xs font-bold text-zinc-200">{item.title}</p>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-lg">{item.desc}</p>
                  </div>
                  <button 
                    onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof notifications] }))}
                    className={clsx(
                      "w-11 h-6 rounded-xl p-0.5 transition-colors focus:outline-none flex items-center shrink-0 border border-white/5",
                      notifications[item.id as keyof typeof notifications] ? "bg-brand-500" : "bg-zinc-800"
                    )}
                  >
                    <div 
                      className={clsx(
                        "w-5 h-5 rounded-lg bg-white shadow-md transform transition-transform",
                        notifications[item.id as keyof typeof notifications] ? "translate-x-5" : "translate-x-0"
                      )} 
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appearance & Privacy Settings Pane */}
        {activeTab === 'appearance' && (
          <div className="card-premium p-6 sm:p-8 space-y-6 border border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Theme & Privacy</h2>
              <p className="text-xs text-zinc-400 mt-1 font-medium">Control the visual aesthetics and public privacy of your connection profile.</p>
            </div>

            <div className="divide-y divide-white/[0.04] space-y-4">
              {[
                { id: 'privateProfile', title: 'Private Profile Mode', desc: 'Hide your notes library uploads, past papers contributions, and clubs listings from guest discover searches.' },
                { id: 'hideActiveStatus', title: 'Hide Active Presence', desc: 'Do not show your green online indicator ring to peers in chats or groups lists.' },
                { id: 'darkMode', title: 'Premium Dark Theme', desc: 'Ensure CampusConnect renders with spatial depth background tokens (#0B0D10).' },
                { id: 'motionRedux', title: 'Reduce Motion Settings', desc: 'Force CSS keyframe animations and spring physics translations to render statically.' },
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between pt-4 first:pt-0">
                  <div className="space-y-1 pr-6">
                    <p className="text-xs font-bold text-zinc-200">{item.title}</p>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-lg">{item.desc}</p>
                  </div>
                  <button 
                    disabled={item.id === 'darkMode'} // Dark theme is mandatory for premium look
                    onClick={() => setPrivacyTheme(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof privacyTheme] }))}
                    className={clsx(
                      "w-11 h-6 rounded-xl p-0.5 transition-colors focus:outline-none flex items-center shrink-0 border border-white/5",
                      privacyTheme[item.id as keyof typeof privacyTheme] ? "bg-brand-500" : "bg-zinc-800",
                      item.id === 'darkMode' && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div 
                      className={clsx(
                        "w-5 h-5 rounded-lg bg-white shadow-md transform transition-transform",
                        privacyTheme[item.id as keyof typeof privacyTheme] ? "translate-x-5" : "translate-x-0"
                      )} 
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danger Zone Settings Pane */}
        {activeTab === 'danger' && (
          <div className="card-premium p-6 sm:p-8 space-y-6 border border-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.04)]">
            <div>
              <h2 className="text-base font-bold text-red-400 tracking-tight flex items-center gap-2">
                <AlertTriangle size={18} />
                Danger Zone
              </h2>
              <p className="text-xs text-zinc-400 mt-1 font-medium font-sans">High-risk actions that can terminate your digital profile permanently.</p>
            </div>

            <div className="divide-y divide-white/[0.04] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 first:pt-0">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-200">Logout of Account</p>
                  <p className="text-[10px] text-zinc-500 font-medium max-w-lg leading-relaxed">Terminate active cookie and authentication tokens on this client and redirect.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleLogout}
                  className="btn-premium bg-zinc-900 border border-white/[0.08] hover:bg-zinc-800 text-zinc-200 hover:text-white px-6 text-xs h-10 w-fit shrink-0 cursor-pointer"
                >
                  <LogOut size={13} />
                  Log Out
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-red-400">Delete Connection Profile</p>
                  <p className="text-[10px] text-zinc-500 font-medium max-w-lg leading-relaxed">Permanently purge your posts, notes, credentials, and achievements. This cannot be undone.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-6 h-10 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-semibold tracking-wide transition-all select-none active:scale-95 flex items-center justify-center gap-2 cursor-pointer w-fit shrink-0"
                >
                  <Trash2 size={13} />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#1B1F24] border border-red-500/20 rounded-2xl p-6 shadow-2xl relative z-10 text-center space-y-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto shadow-inner">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white tracking-tight font-display">Are you absolutely sure?</h3>
                <p className="text-zinc-400 text-xs leading-relaxed leading-relaxed font-sans">
                  This will wipe out all connection metrics, rewards points, chat threads, and study notes uploads. This action is irreversible.
                </p>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Type DELETE to confirm</span>
                <input 
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="input-pro text-center text-xs uppercase" 
                  placeholder="DELETE" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="btn-ghost-pro flex-1 text-xs py-2.5 justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="btn-premium bg-red-600 hover:bg-red-500 border-red-600/10 text-white flex-1 text-xs py-2.5 justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
