'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { 
  Briefcase, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Award, 
  ChevronRight, 
  CheckCircle, 
  Clock,
  X,
  Loader2,
  Users,
  Code,
  Shield,
  FileText
} from 'lucide-react'

interface Drive {
  id: string
  title: string
  company: string
  description: string | null
  location: string | null
  type: string
  duration: string | null
  stipend: string | null
  deadline: string | null
  college_id: string | null
  created_at: string
}

interface Offer {
  id: string
  student_id: string
  company: string
  role: string
  package_lpa: number
  offer_type: 'PPO' | 'FTE'
  year: number
  is_verified: boolean
  profiles?: {
    full_name: string | null
    branch: string | null
    avatar_url: string | null
  }
}

export default function PlacementsClient({ userId, profile, dbDrives, dbOffers, myRegistrations }: any) {
  const supabase = useMemo(() => createClient(), [])
  const isAdmin = profile?.role?.toUpperCase() === 'SUPER_ADMIN' || profile?.role?.toUpperCase() === 'ADMIN'

  // Dynamic Lists from Database
  const [drives, setDrives] = useState<Drive[]>(dbDrives || [])
  const [offers, setOffers] = useState<Offer[]>(dbOffers || [])
  const [registered, setRegistered] = useState<Set<string>>(new Set((myRegistrations ?? []).map((r: any) => r.drive_id)))
  const [profiles, setProfiles] = useState<any[]>([])

  // UI Control States
  const [tab, setTab] = useState<string>('drives')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Drive CRUD Modals
  const [showDriveModal, setShowDriveModal] = useState(false)
  const [editingDrive, setEditingDrive] = useState<Drive | null>(null)
  const [driveForm, setDriveForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    type: 'hybrid',
    duration: 'Full-Time',
    stipend: '',
    deadline: '',
  })

  // Offer CRUD Modals
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [offerForm, setOfferForm] = useState({
    studentId: '',
    company: '',
    role: '',
    packageLpa: '',
    offerType: 'FTE' as 'PPO' | 'FTE',
    year: new Date().getFullYear(),
    isVerified: true
  })

  // Loading indicator for submissions
  const [submitting, setSubmitting] = useState(false)

  // Fetch profiles for the Admin offer assignment dropdown
  useEffect(() => {
    if (isAdmin && showOfferModal) {
      async function fetchProfiles() {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, username, branch')
          .order('full_name', { ascending: true })
        if (data) setProfiles(data)
      }
      fetchProfiles()
    }
  }, [isAdmin, showOfferModal, supabase])

  // Filters placement drives based on search query
  const filteredDrives = drives.filter(d => {
    const matchesSearch = 
      !search ||
      d.company.toLowerCase().includes(search.toLowerCase()) ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
    
    // Status checks (e.g. Deadline checks)
    const isExpired = d.deadline ? new Date(d.deadline) < new Date() : false
    if (statusFilter === 'active') return matchesSearch && !isExpired
    if (statusFilter === 'expired') return matchesSearch && isExpired
    return matchesSearch
  })

  // Apply / Register for a placement drive
  async function handleRegister(driveId: string, companyName: string) {
    const toastId = toast.loading(`Registering for ${companyName} placement drive...`)
    try {
      const { error } = await supabase.from('placement_registrations').insert({
        user_id: userId,
        drive_id: driveId,
        company: companyName,
        status: 'registered'
      })
      if (error) {
        if (error.code === '23505') throw new Error('You are already registered for this drive')
        throw error
      }
      setRegistered(prev => new Set([...Array.from(prev), driveId]))
      toast.success(`Registered successfully for ${companyName}! 🚀`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Registration failed', { id: toastId })
    }
  }

  // CREATE or UPDATE Placement Drive
  async function handleSaveDrive(e: React.FormEvent) {
    e.preventDefault()
    if (!driveForm.company || !driveForm.title) return toast.error('Company and Title are required')
    setSubmitting(true)

    const payload = {
      title: driveForm.title,
      company: driveForm.company,
      description: driveForm.description || null,
      location: driveForm.location || null,
      type: driveForm.type,
      duration: driveForm.duration || 'Full-Time',
      stipend: driveForm.stipend || null,
      deadline: driveForm.deadline || null,
      college_id: profile?.college_id || null
    }

    try {
      if (editingDrive) {
        const { error } = await supabase
          .from('internships')
          .update(payload)
          .eq('id', editingDrive.id)
        if (error) throw error

        setDrives(prev => prev.map(d => d.id === editingDrive.id ? { ...d, ...payload } : d))
        toast.success('Placement drive updated')
      } else {
        const { data, error } = await supabase
          .from('internships')
          .insert(payload)
          .select('*')
          .single()
        if (error) throw error

        setDrives(prev => [data, ...prev])
        toast.success('Placement drive created')
      }
      setShowDriveModal(false)
      setEditingDrive(null)
      setDriveForm({ title: '', company: '', description: '', location: '', type: 'hybrid', duration: 'Full-Time', stipend: '', deadline: '' })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // DELETE Placement Drive
  async function handleDeleteDrive(driveId: string) {
    if (!confirm('Are you sure you want to delete this placement drive?')) return
    try {
      const { error } = await supabase.from('internships').delete().eq('id', driveId)
      if (error) throw error
      setDrives(prev => prev.filter(d => d.id !== driveId))
      toast.success('Drive removed')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // CREATE or UPDATE Student Offer
  async function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault()
    if (!offerForm.studentId || !offerForm.company || !offerForm.role) {
      return toast.error('All fields are required')
    }
    setSubmitting(true)

    const payload = {
      student_id: offerForm.studentId,
      company: offerForm.company,
      role: offerForm.role,
      package_lpa: parseFloat(offerForm.packageLpa) || 0,
      offer_type: offerForm.offerType,
      year: parseInt(offerForm.year.toString()) || new Date().getFullYear(),
      is_verified: offerForm.isVerified,
      college_id: profile?.college_id || null
    }

    try {
      if (editingOffer) {
        const { error } = await supabase
          .from('placements')
          .update(payload)
          .eq('id', editingOffer.id)
        if (error) throw error

        // Re-fetch offers to get joined profile details automatically
        const { data } = await supabase
          .from('placements')
          .select('id, student_id, company, role, package_lpa, offer_type, year, is_verified, profiles!placements_student_id_fkey(full_name, branch, avatar_url)')
          .eq('id', editingOffer.id)
          .single()

        if (data) {
          setOffers(prev => prev.map(o => o.id === editingOffer.id ? (data as any) : o))
        }
        toast.success('Placement offer updated')
      } else {
        const { data, error } = await supabase
          .from('placements')
          .insert(payload)
          .select('id, student_id, company, role, package_lpa, offer_type, year, is_verified, profiles!placements_student_id_fkey(full_name, branch, avatar_url)')
          .single()
        if (error) throw error

        setOffers(prev => [data as any, ...prev])
        toast.success('Student offer added to wall')
      }
      setShowOfferModal(false)
      setEditingOffer(null)
      setOfferForm({ studentId: '', company: '', role: '', packageLpa: '', offerType: 'FTE', year: new Date().getFullYear(), isVerified: true })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // DELETE Student Offer
  async function handleDeleteOffer(offerId: string) {
    if (!confirm('Are you sure you want to delete this placement offer?')) return
    try {
      const { error } = await supabase.from('placements').delete().eq('id', offerId)
      if (error) throw error
      setOffers(prev => prev.filter(o => o.id !== offerId))
      toast.success('Offer removed')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      {/* Header */}
      <div className="glass-page-header space-y-2">
        <p className="section-label text-cyan-400">Career Center</p>
        <h1 className="display-heading text-4xl flex items-center gap-3">
          <Award className="text-cyan-400 shrink-0" size={32} />
          Careers & Placements
        </h1>
        <p className="body-pro text-sm">Campus drives, preparation hubs, and verified corporate placement records.</p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Drives', val: drives.length, desc: 'Corporate postings', color: 'text-cyan-400' },
          { label: 'Verified Placements', val: offers.length, desc: 'Offers secured', color: 'text-emerald-400' },
          { label: 'Avg Package', val: offers.length > 0 ? `${(offers.reduce((a, b) => a + b.package_lpa, 0) / offers.length).toFixed(1)} LPA` : '0 LPA', desc: 'LPA Package', color: 'text-purple-400' },
          { label: 'Highest Package', val: offers.length > 0 ? `${Math.max(...offers.map(o => o.package_lpa))} LPA` : '0 LPA', desc: 'Peak package offer', color: 'text-amber-400' }
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-950/40 border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between">
            <p className="text-[10px] font-bold font-mono uppercase text-zinc-500 tracking-wider">{stat.label}</p>
            <p className={clsx("text-2xl font-bold font-display mt-2", stat.color)}>{stat.val}</p>
            <p className="text-[10px] text-zinc-500 mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] pb-px">
        <div className="flex gap-2">
          {([
            { id: 'drives', label: 'Placement Drives' },
            { id: 'offers', label: 'Offers Wall' },
            { id: 'prep', label: 'Prep Resources' },
            ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel' }] : [])
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "px-4 py-2 text-xs font-bold transition-all relative border-b-2 -mb-0.5",
                tab === t.id 
                  ? "border-cyan-500 text-white" 
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* TABS 1: PLACEMENT DRIVES */}
          {tab === 'drives' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    className="w-full bg-zinc-950/40 border border-white/[0.06] rounded-xl px-4 py-2 pl-10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                    placeholder="Search drives by company or title..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="bg-zinc-950/40 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Postings</option>
                  <option value="active">Active Drives</option>
                  <option value="expired">Expired Drives</option>
                </select>
              </div>

              {filteredDrives.length === 0 ? (
                <div className="bg-zinc-900/10 border border-white/[0.04] rounded-2xl p-16 text-center">
                  <Briefcase className="text-zinc-600 mx-auto mb-3" size={44} />
                  <p className="text-sm font-semibold text-zinc-300">No placement drives found</p>
                  <p className="text-xs text-zinc-500 mt-1">There are no active or posted career drives currently.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDrives.map(drive => {
                    const isRegistered = registered.has(drive.id)
                    const deadlineDate = drive.deadline ? new Date(drive.deadline) : null
                    const isExpired = deadlineDate ? deadlineDate < new Date() : false

                    return (
                      <div
                        key={drive.id}
                        className="bg-zinc-950/45 border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/20 transition-all group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-zinc-100 text-sm">{drive.title}</h3>
                              <p className="text-xs text-cyan-400 font-medium mt-0.5">{drive.company}</p>
                            </div>
                            <span className="text-[10px] font-mono bg-zinc-900 border border-white/5 rounded-md px-2 py-0.5 text-zinc-400 uppercase">
                              {drive.type}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 mt-3 line-clamp-3">
                            {drive.description || 'No drive job description provided.'}
                          </p>

                          <div className="flex gap-2 mt-4 flex-wrap">
                            {drive.location && (
                              <span className="text-[10px] bg-white/[0.03] text-zinc-400 border border-white/5 rounded-lg px-2.5 py-1">
                                📍 {drive.location}
                              </span>
                            )}
                            {drive.stipend && (
                              <span className="text-[10px] bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-lg px-2.5 py-1 font-bold">
                                💼 {drive.stipend}
                              </span>
                            )}
                            {drive.duration && (
                              <span className="text-[10px] bg-blue-500/5 text-blue-400 border border-blue-500/10 rounded-lg px-2.5 py-1">
                                ⏱ {drive.duration}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-white/[0.04] pt-3.5 mt-5 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <Clock size={12} />
                            {drive.deadline ? `Deadline: ${format(new Date(drive.deadline), 'MMM d, yyyy')}` : 'No deadline'}
                          </div>

                          {isRegistered ? (
                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                              <CheckCircle size={12} />
                              Registered
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRegister(drive.id, drive.company)}
                              disabled={isExpired}
                              className={clsx(
                                "text-xs font-bold px-4 py-1.5 rounded-xl transition-all",
                                isExpired
                                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                  : "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                              )}
                            >
                              {isExpired ? 'Expired' : 'Register Drive'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OFFERS WALL */}
          {tab === 'offers' && (
            <div className="space-y-4">
              {offers.length === 0 ? (
                <div className="bg-zinc-900/10 border border-white/[0.04] rounded-2xl p-16 text-center">
                  <Award className="text-zinc-600 mx-auto mb-3" size={44} />
                  <p className="text-sm font-semibold text-zinc-300">No placements recorded yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Verification records of graduating batch placement is empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {offers.map(offer => (
                    <div 
                      key={offer.id} 
                      className="bg-zinc-950/45 border border-white/[0.05] rounded-2xl p-5 text-center flex flex-col justify-between hover:border-cyan-500/20 transition-all relative group"
                    >
                      <div className="absolute top-3.5 right-3.5">
                        <span className="text-[9px] font-bold font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md px-1.5 py-0.5">
                          {offer.offer_type}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-sm font-bold text-zinc-400 mx-auto">
                          {offer.profiles?.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                        </div>

                        <div>
                          <p className="font-bold text-zinc-100 text-sm leading-tight">
                            {offer.profiles?.full_name || 'Anonymous Student'}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono tracking-wide mt-0.5 uppercase">
                            {offer.profiles?.branch || 'N/A Branch'} · Class of {offer.year}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-white/[0.04] pt-3.5 mt-5 space-y-1">
                        <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider font-bold">Placed At</p>
                        <p className="text-base font-bold text-white leading-tight">{offer.company}</p>
                        <p className="text-xs font-bold text-emerald-400">{offer.package_lpa} LPA</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PREPARATION RESOURCES */}
          {tab === 'prep' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'LeetCode Placement Guide', desc: 'Top 150 Interview Questions for Product Firms', url: 'https://leetcode.com/studyplan/top-interview-questions/' },
                { title: 'Striver DSA Sheet', desc: 'Highly curated sequence of algorithmic tasks', url: 'https://takeuforward.org/strivers-a2z-dsa-course-sheet-codeforces-leetcode-etc/' },
                { title: 'System Design Primer', desc: 'Learn architecture design concepts for tech roles', url: 'https://github.com/donnemartin/system-design-primer' },
                { title: 'Resume ATS Checker', desc: 'Check keyword match for automatic resume parsers', url: 'https://resumeworded.com' }
              ].map(res => (
                <a 
                  key={res.title} 
                  href={res.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-zinc-950/45 border border-white/[0.05] hover:border-cyan-500/20 rounded-2xl p-5 flex items-start gap-4 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/5 border border-cyan-500/15 flex items-center justify-center shrink-0">
                    <Code className="text-cyan-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                      {res.title}
                      <ChevronRight size={14} />
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{res.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* TAB 4: ADMIN PANEL (CRUD PLACEMENTS & DRIVES) */}
          {tab === 'admin' && isAdmin && (
            <div className="space-y-6">
              {/* Drives Management Grid */}
              <div className="bg-zinc-950/20 border border-white/[0.05] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                    <Shield className="text-cyan-400" size={16} />
                    Manage Job Drives
                  </h3>
                  <button 
                    onClick={() => { setEditingDrive(null); setShowDriveModal(true) }}
                    className="btn-primary text-xs px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold flex items-center gap-1 shadow-md"
                  >
                    <Plus size={14} />
                    Add Drive
                  </button>
                </div>

                {drives.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-4">No active drives posted. Click Add Drive above.</p>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {drives.map(drive => (
                      <div key={drive.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-zinc-200 text-xs">{drive.company}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{drive.title} · {drive.stipend || 'N/A Package'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingDrive(drive)
                              setDriveForm({
                                title: drive.title,
                                company: drive.company,
                                description: drive.description || '',
                                location: drive.location || '',
                                type: drive.type,
                                duration: drive.duration || 'Full-Time',
                                stipend: drive.stipend || '',
                                deadline: drive.deadline || '',
                              })
                              setShowDriveModal(true)
                            }}
                            className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-white/5 rounded-lg"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteDrive(drive.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Offers Management Grid */}
              <div className="bg-zinc-950/20 border border-white/[0.05] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                    <Award className="text-emerald-400" size={16} />
                    Manage Placement Wall
                  </h3>
                  <button 
                    onClick={() => { setEditingOffer(null); setShowOfferModal(true) }}
                    className="btn-primary text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center gap-1 shadow-md"
                  >
                    <Plus size={14} />
                    Add Offer
                  </button>
                </div>

                {offers.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-4">No verified offers on the wall. Click Add Offer above.</p>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {offers.map(offer => (
                      <div key={offer.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-zinc-200 text-xs">
                            {offer.profiles?.full_name || 'Anonymous'} placed at {offer.company}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{offer.role} · {offer.package_lpa} LPA ({offer.offer_type})</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingOffer(offer)
                              setOfferForm({
                                studentId: offer.student_id,
                                company: offer.company,
                                role: offer.role,
                                packageLpa: offer.package_lpa.toString(),
                                offerType: offer.offer_type,
                                year: offer.year,
                                isVerified: offer.is_verified
                              })
                              setShowOfferModal(true)
                            }}
                            className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-white/5 rounded-lg"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* DRIVE MODAL (ADD & EDIT) */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="font-display font-bold text-zinc-100 text-sm">
                {editingDrive ? 'Edit Placement Drive' : 'Create Placement Drive'}
              </h3>
              <button onClick={() => setShowDriveModal(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDrive} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Company Name</label>
                <input
                  type="text" required placeholder="e.g. Google India"
                  className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                  value={driveForm.company}
                  onChange={e => setDriveForm(p => ({ ...p, company: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Job Title / Role</label>
                <input
                  type="text" required placeholder="e.g. Software Development Engineer"
                  className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                  value={driveForm.title}
                  onChange={e => setDriveForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Package CTC</label>
                  <input
                    type="text" placeholder="e.g. 15 LPA"
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                    value={driveForm.stipend}
                    onChange={e => setDriveForm(p => ({ ...p, stipend: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Location</label>
                  <input
                    type="text" placeholder="e.g. Bangalore / Onsite"
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                    value={driveForm.location}
                    onChange={e => setDriveForm(p => ({ ...p, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Work Type</label>
                  <select
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-2 py-2 text-xs text-zinc-300 focus:outline-none"
                    value={driveForm.type}
                    onChange={e => setDriveForm(p => ({ ...p, type: e.target.value }))}
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-Site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Deadline Date</label>
                  <input
                    type="date"
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                    value={driveForm.deadline}
                    onChange={e => setDriveForm(p => ({ ...p, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Job Details / Eligibility</label>
                <textarea
                  placeholder="Insert eligibility or interview process description..." rows={3}
                  className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                  value={driveForm.description}
                  onChange={e => setDriveForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
                <button
                  type="button" onClick={() => setShowDriveModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs text-zinc-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-xs text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="animate-spin" size={12} />}
                  Save Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFER MODAL (ADD & EDIT) */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="font-display font-bold text-zinc-100 text-sm">
                {editingOffer ? 'Edit Placement Offer' : 'Add Placement Offer'}
              </h3>
              <button onClick={() => setShowOfferModal(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Select Student Profile</label>
                <select
                  required
                  className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-2 py-2 text-xs text-zinc-300 focus:outline-none"
                  value={offerForm.studentId}
                  onChange={e => setOfferForm(p => ({ ...p, studentId: e.target.value }))}
                >
                  <option value="">-- Choose Student Profile --</option>
                  {profiles.map(prof => (
                    <option key={prof.id} value={prof.id}>
                      {prof.full_name} ({prof.branch || 'No branch'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Company Placed</label>
                <input
                  type="text" required placeholder="e.g. Goldman Sachs"
                  className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                  value={offerForm.company}
                  onChange={e => setOfferForm(p => ({ ...p, company: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Role Title</label>
                <input
                  type="text" required placeholder="e.g. System Engineer"
                  className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                  value={offerForm.role}
                  onChange={e => setOfferForm(p => ({ ...p, role: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Package (in LPA)</label>
                  <input
                    type="number" step="0.01" required placeholder="e.g. 12.5"
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                    value={offerForm.packageLpa}
                    onChange={e => setOfferForm(p => ({ ...p, packageLpa: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Offer Type</label>
                  <select
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-2 py-2 text-xs text-zinc-300 focus:outline-none"
                    value={offerForm.offerType}
                    onChange={e => setOfferForm(p => ({ ...p, offerType: e.target.value as any }))}
                  >
                    <option value="FTE">Full-Time (FTE)</option>
                    <option value="PPO">Pre-Placement Offer (PPO)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Graduation Year</label>
                  <input
                    type="number" required placeholder="2026"
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono"
                    value={offerForm.year}
                    onChange={e => setOfferForm(p => ({ ...p, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Verified Placed Offer</label>
                  <select
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-2 py-2 text-xs text-zinc-300 focus:outline-none font-bold"
                    value={offerForm.isVerified ? 'yes' : 'no'}
                    onChange={e => setOfferForm(p => ({ ...p, isVerified: e.target.value === 'yes' }))}
                  >
                    <option value="yes">Verified Placed Offer</option>
                    <option value="no">Unverified Placed Offer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
                <button
                  type="button" onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs text-zinc-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-xs text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="animate-spin" size={12} />}
                  Publish Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
