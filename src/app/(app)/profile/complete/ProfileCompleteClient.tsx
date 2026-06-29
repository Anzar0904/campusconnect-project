'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Check, AlertTriangle, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

const BRANCHES = ['BBA', 'MBA', 'BCA', 'MCA', 'B.Com', 'BA (H)', 'B.Sc', 'Law', 'B.Tech', 'Other']
const YEARS = [1, 2, 3, 4, 5]

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  username: string | null
  branch: string | null
  year: number | null
  roll_number: string | null
  hostel: string | null
  phone: string | null
  email: string
}

interface ProfileCompleteClientProps {
  profile: Profile | null
  userId: string
}

export default function ProfileCompleteClient({ profile: initialProfile, userId }: ProfileCompleteClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const { refetch: refetchCurrentProfile, setProfile } = useCurrentProfile()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: initialProfile?.full_name || '',
    username: initialProfile?.username || '',
    branch: initialProfile?.branch || '',
    year: initialProfile?.year || 1,
    roll_number: initialProfile?.roll_number || '',
    hostel: initialProfile?.hostel || '',
    phone: initialProfile?.phone || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Real-time checklist validation helper
  const checklist = {
    fullName: form.full_name.trim().length > 0,
    username: form.username.trim().length > 0 && !form.username.includes(' '),
    branch: form.branch.trim().length > 0,
    year: form.year >= 1 && form.year <= 5,
    rollNumber: form.roll_number.trim().length > 0,
  }

  const isCompleted = Object.values(checklist).every(Boolean)

  const set = (field: string, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }))
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
  }

  // Handle Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors: Record<string, string> = {}
    if (!form.full_name.trim()) validationErrors.full_name = 'Name is required'
    if (!form.username.trim()) validationErrors.username = 'Username is required'
    if (form.username.includes(' ')) validationErrors.username = 'Username cannot contain spaces'
    if (!form.branch.trim()) validationErrors.branch = 'Branch is required'
    if (!form.roll_number.trim()) validationErrors.roll_number = 'Roll Number is required'

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('Please fill in all required fields.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles_secure')
        .update({
          full_name: form.full_name,
          username: form.username.toLowerCase(),
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
        setProfile(fresh as any)
        await refetchCurrentProfile()
      }

      toast.success('Registration completed! Welcome to IILM Connect.')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // If user somehow gets here but already is fully complete, redirect to dashboard
  useEffect(() => {
    if (
      initialProfile?.full_name?.trim() &&
      initialProfile?.username?.trim() &&
      initialProfile?.branch?.trim() &&
      initialProfile?.year &&
      initialProfile?.roll_number?.trim()
    ) {
      toast('Your profile setup is already complete!')
      router.replace('/dashboard')
    }
  }, [initialProfile, router])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 select-none animate-fade-in py-10 px-4">
      {/* Visual greeting & context */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-brand-500/10 border border-brand-500/25 rounded-2xl flex items-center justify-center mx-auto text-brand-400">
          <AlertTriangle size={24} className="animate-pulse" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display">Complete Your Profile</h1>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">
          We need a few details to verify your account and connect you with classmates.
        </p>
      </div>

      {/* Completion checklist widget */}
      <Card variant="glass" className="p-4 flex flex-wrap gap-4 items-center justify-around border-white/[0.04] bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <div className={clsx(
            "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300",
            checklist.fullName ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
          )}>
            <Check size={10} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Name</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={clsx(
            "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300",
            checklist.username ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
          )}>
            <Check size={10} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Username</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={clsx(
            "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300",
            checklist.branch ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
          )}>
            <Check size={10} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Branch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={clsx(
            "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300",
            checklist.year ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
          )}>
            <Check size={10} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Year</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={clsx(
            "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300",
            checklist.rollNumber ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
          )}>
            <Check size={10} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Roll No</span>
        </div>
      </Card>

      {/* Main onboarding card */}
      <Card variant="premium" className="p-6 sm:p-8 border border-white/[0.06] shadow-premium">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Full Name *</span>
              <input 
                value={form.full_name} 
                onChange={e => set('full_name', e.target.value)} 
                className={clsx(
                  "input-pro text-xs font-medium",
                  errors.full_name && "border-red-500/50 focus:border-red-500"
                )} 
                placeholder="Enter full name" 
              />
              {errors.full_name && (
                <span className="text-[9px] text-red-400 block font-semibold">{errors.full_name}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Username *</span>
              <input 
                value={form.username} 
                onChange={e => set('username', e.target.value)} 
                className={clsx(
                  "input-pro text-xs font-medium",
                  errors.username && "border-red-500/50 focus:border-red-500"
                )} 
                placeholder="e.g. johndoe" 
              />
              {errors.username && (
                <span className="text-[9px] text-red-400 block font-semibold">{errors.username}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Course Branch *</span>
              <select 
                value={form.branch} 
                onChange={e => set('branch', e.target.value)} 
                className={clsx(
                  "input-pro text-xs font-medium appearance-none cursor-pointer",
                  errors.branch && "border-red-500/50 focus:border-red-500"
                )}
              >
                <option value="">Select Branch</option>
                {BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.branch && (
                <span className="text-[9px] text-red-400 block font-semibold">{errors.branch}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Academic Year *</span>
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
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Roll Number *</span>
              <input 
                value={form.roll_number} 
                onChange={e => set('roll_number', e.target.value)} 
                className={clsx(
                  "input-pro text-xs font-medium",
                  errors.roll_number && "border-red-500/50 focus:border-red-500"
                )} 
                placeholder="University Roll Number" 
              />
              {errors.roll_number && (
                <span className="text-[9px] text-red-400 block font-semibold">{errors.roll_number}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Hostel Block (Optional)</span>
              <input 
                value={form.hostel} 
                onChange={e => set('hostel', e.target.value)} 
                className="input-pro text-xs font-medium" 
                placeholder="e.g. Day Scholar, Boys Hostel A" 
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Phone Number (Optional)</span>
              <input 
                value={form.phone} 
                onChange={e => set('phone', e.target.value)} 
                className="input-pro text-xs font-medium" 
                placeholder="10-digit mobile" 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.04]">
            <button 
              type="submit" 
              disabled={saving || !isCompleted}
              className={clsx(
                "w-full h-11 rounded-xl text-xs font-bold font-display tracking-widest uppercase flex items-center justify-center gap-2 select-none transition-all active:scale-98",
                isCompleted 
                  ? "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/10 cursor-pointer"
                  : "bg-zinc-800 text-zinc-500 border border-white/[0.03] cursor-not-allowed"
              )}
            >
              <span>{saving ? 'Completing Setup...' : 'Complete Profile Setup'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
