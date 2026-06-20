'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

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
}

export default function ProfileClient({ profile, userId }: { profile: Profile | null; userId: string }) {
  const supabase = createClient()
  const [editing, setEditing] = useState(!profile?.full_name || profile.full_name === profile?.email?.split('@')[0])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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

  const avatarUrl = currentAvatarUrl ||
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profile?.full_name || 'U')}&backgroundColor=4f46e5&textColor=ffffff`

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
    setSaving(false)
    if (!error) {
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">MY PROFILE</p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            {editing ? 'Edit Profile' : profile?.full_name || 'Your Profile'}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">IILM University · Greater Noida</p>
        </div>
        <div className="flex gap-2">
          {saved && (
            <span className="chip chip-tertiary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Saved!
            </span>
          )}
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-ghost flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[16px]">save</span>}
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Profile card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="w-24 h-24 rounded-2xl avatar-ring object-cover" />
            {editing && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50" 
                style={{ background: 'linear-gradient(135deg,#4f46e5,#4cd7f6)' }}
              >
                {uploading ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[14px] text-white">photo_camera</span>
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

          {/* Info */}
          <div className="flex-1 space-y-4">
            {editing ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="section-label block mb-1.5">FULL NAME *</label>
                    <input value={form.full_name} onChange={e => set('full_name', e.target.value)} className="input-glass" placeholder="Priya Sharma" />
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">USERNAME</label>
                    <input value={form.username} onChange={e => set('username', e.target.value)} className="input-glass" placeholder="priya.sharma" />
                  </div>
                </div>
                <div>
                  <label className="section-label block mb-1.5">BIO</label>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)} className="input-glass resize-none" rows={2} placeholder="Tell your campus what you're about…" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="font-display text-2xl font-bold text-on-surface">{profile?.full_name}</h2>
                  {profile?.username && <p className="text-sm font-mono text-on-surface-variant">@{profile.username}</p>}
                </div>
                {profile?.bio && <p className="text-sm text-on-surface-variant font-body">{profile.bio}</p>}
                <div className="flex flex-wrap gap-2">
                  {profile?.branch && <span className="chip chip-primary">{profile.branch}</span>}
                  {profile?.year && <span className="chip chip-tertiary">Year {profile.year}</span>}
                  {profile?.hostel && <span className="chip chip-secondary">{profile.hostel}</span>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Academic info */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          Academic Details
        </h3>
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-label block mb-1.5">BRANCH / PROGRAM</label>
              <select value={form.branch} onChange={e => set('branch', e.target.value)} className="input-glass">
                <option value="">Select branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1.5">YEAR</label>
              <select value={form.year} onChange={e => set('year', +e.target.value)} className="input-glass">
                {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1.5">ROLL NUMBER</label>
              <input value={form.roll_number} onChange={e => set('roll_number', e.target.value)} className="input-glass" placeholder="IILM2024BBA001" />
            </div>
            <div>
              <label className="section-label block mb-1.5">HOSTEL</label>
              <select value={form.hostel} onChange={e => set('hostel', e.target.value)} className="input-glass">
                <option value="">Select hostel</option>
                {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1.5">PHONE</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-glass" placeholder="+91 9999999999" type="tel" />
            </div>
            <div>
              <label className="section-label block mb-1.5">EMAIL</label>
              <input value={profile?.email || ''} disabled className="input-glass opacity-50 cursor-not-allowed" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Branch / Program', value: profile?.branch, icon: 'book_2' },
              { label: 'Year', value: profile?.year ? `Year ${profile.year}` : null, icon: 'calendar_today' },
              { label: 'Roll Number', value: profile?.roll_number, icon: 'badge' },
              { label: 'Hostel', value: profile?.hostel, icon: 'apartment' },
              { label: 'Phone', value: profile?.phone, icon: 'phone' },
              { label: 'Email', value: profile?.email, icon: 'mail' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
                <div>
                  <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-on-surface font-medium mt-0.5">{value || <span className="text-on-surface-variant italic">Not set</span>}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Friends', value: 0, icon: 'group' },
          { label: 'Posts', value: 0, icon: 'article' },
          { label: 'Points', value: 0, icon: 'emoji_events' },
          { label: 'Clubs', value: 0, icon: 'sports_esports' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4 rounded-lg text-center">
            <span className="material-symbols-outlined text-[20px] text-primary mb-1 block" style={{ fontVariationSettings: "'FILL' 0" }}>{stat.icon}</span>
            <p className="font-display text-2xl font-bold text-on-surface">{stat.value}</p>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
