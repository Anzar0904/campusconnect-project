'use client'
import React, { useState, useEffect } from 'react'
import { 
  MapPin, Search, X, Bookmark, Plus, Edit, Trash2, Briefcase, 
  Calendar, CreditCard, Clock, Star, ExternalLink, Save, BookOpen, ChevronLeft, Sparkles, Building2, CheckCircle2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'

const TYPES = ['All', 'Technical', 'Management', 'Finance-Tech', 'Consulting', 'Design']

function deriveSkills(title: string, type: string): string[] {
  const t = title.toLowerCase()
  if (t.includes('software') || t.includes('sde') || t.includes('web') || t.includes('developer') || t.includes('engineering') || type === 'Technical') {
    return ['React', 'Node.js', 'TypeScript', 'SQL']
  }
  if (t.includes('product') || t.includes('pm') || type === 'Management') {
    return ['Product Strategy', 'Roadmapping', 'User Research']
  }
  if (t.includes('finance') || t.includes('analyst') || type === 'Finance-Tech') {
    return ['Excel', 'SQL', 'Financial Modeling']
  }
  if (t.includes('design') || t.includes('ux') || t.includes('ui') || type === 'Design') {
    return ['Figma', 'UX Research', 'Prototyping']
  }
  return ['Communication', 'Problem Solving', 'Teamwork']
}

// Fade in animations for lists
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as any, stiffness: 300, damping: 28 }
  }
}

export default function InternshipsClient({ 
  userId, 
  profile, 
  appliedMap: initApplied, 
  dbInternships: initialDbInternships 
}: any) {
  const supabase = createClient()
  const isAdmin = profile?.role?.toUpperCase() === 'SUPER_ADMIN' || profile?.role?.toUpperCase() === 'ADMIN'

  const [internships, setInternships] = useState<any[]>(initialDbInternships || [])
  const [applied, setApplied] = useState<Record<string, string>>(initApplied)
  const [savedIds, setSavedIds] = useState<string[]>([])
  
  // Tabs & filters
  const [tab, setTab] = useState<'browse' | 'applied' | 'saved' | 'admin'>('browse')
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [userSkills, setUserSkills] = useState<string[]>(['React', 'TypeScript', 'TailwindCSS', 'Next.js', 'Python'])
  
  // Selected details modal
  const [selectedInternship, setSelectedInternship] = useState<any>(null)
  
  // Modals / forms for Admin management
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInternship, setEditingInternship] = useState<any>(null)
  const [applying, setApplying] = useState(false)
  
  const [form, setForm] = useState({
    company: '',
    title: '',
    location: '',
    stipend: '',
    duration: '',
    deadline: '',
    type: 'hybrid', // remote, hybrid, onsite
    description: '',
    apply_link: '',
    category: 'Technical',
    eligibility: ''
  })

  // Load saved bookmarks & skills
  useEffect(() => {
    const saved = localStorage.getItem('saved_internships')
    if (saved) {
      try {
        setSavedIds(JSON.parse(saved))
      } catch (e) {}
    }

    const storedSkills = localStorage.getItem(`cc_skills_${userId}`)
    if (storedSkills) {
      try {
        setUserSkills(JSON.parse(storedSkills))
      } catch (e) {}
    }
  }, [userId])

  // Auto-select or trigger modal from query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      const createAction = params.get('create')

      if (id && internships.length > 0) {
        const found = internships.find(x => x.id === id)
        if (found) {
          setSelectedInternship(found)
        }
      }

      if (createAction === 'true' && isAdmin) {
        setEditingInternship(null)
        setForm({
          company: '', title: '', location: '', stipend: '',
          duration: '', deadline: '', type: 'hybrid', description: '', apply_link: '',
          category: 'Technical', eligibility: ''
        })
        setShowAddModal(true)
      }
    }
  }, [internships, isAdmin])

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    let next = [...savedIds]
    if (next.includes(id)) {
      next = next.filter(x => x !== id)
      toast.success('Removed from bookmarks')
    } else {
      next.push(id)
      toast.success('Saved to bookmarks')
    }
    setSavedIds(next)
    localStorage.setItem('saved_internships', JSON.stringify(next))
  }

  // Parse details
  const parseDescription = (desc: string | null) => {
    if (!desc) {
      return { category: 'Technical', eligibility: '', description: '' }
    }
    const categoryMatch = desc.match(/^Category:\s*(.*?)(?:\r?\n|$)/)
    const eligibilityMatch = desc.match(/Eligibility:\s*([\s\S]*?)(?:\r?\nDescription:|\r?\n\r?\n|$)/)
    
    const category = categoryMatch ? categoryMatch[1].trim() : 'Technical'
    const eligibility = eligibilityMatch ? eligibilityMatch[1].trim() : ''
    
    let cleanDesc = desc
      .replace(/^Category:\s*(.*?)(?:\r?\n|$)/, '')
      .replace(/Eligibility:\s*(.*?)(?:\r?\n|$)/, '')
      .replace(/^Description:\r?\n/, '')
      .trim()
      
    return { category, eligibility, description: cleanDesc }
  }

  const serializeDescription = (category: string, eligibility: string, description: string) => {
    return `Category: ${category}\nEligibility: ${eligibility}\n\nDescription:\n${description}`
  }

  // Helper match percent calculation
  const getMatchPercent = (title: string, category: string) => {
    const skills = deriveSkills(title, category)
    const matched = skills.filter(s => userSkills.some(us => us.toLowerCase() === s.toLowerCase()))
    const score = Math.round(55 + (matched.length / skills.length) * 40)
    return Math.min(100, score)
  }

  // Filter listings
  const filtered = internships.filter((intern: any) => {
    const { category } = parseDescription(intern.description)
    const matchType = typeFilter === 'All' || category === typeFilter
    const matchSearch = !search || 
      intern.company.toLowerCase().includes(search.toLowerCase()) || 
      intern.title.toLowerCase().includes(search.toLowerCase()) ||
      category.toLowerCase().includes(search.toLowerCase())
    
    if (tab === 'browse') return matchType && matchSearch
    if (tab === 'applied') return !!applied[intern.id]
    if (tab === 'saved') return savedIds.includes(intern.id) && matchSearch
    return true // admin
  })

  const daysUntil = (deadline: string | null) => {
    if (!deadline) return 30
    const d = new Date(deadline)
    const now = new Date()
    return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86400000))
  }

  // Apply workflow
  const applyNow = async (internship: any) => {
    setApplying(true)
    const { error } = await supabase.from('internship_applications').insert({
      user_id: userId,
      internship_id: internship.id,
      company: internship.company,
      role: internship.title,
      status: 'applied'
    })
    setApplying(false)
    if (error && !error.message.includes('duplicate')) {
      toast.error('Failed to apply: ' + error.message)
      return
    }
    setApplied(prev => ({ ...prev, [internship.id]: 'applied' }))
    setSelectedInternship(null)
    toast.success(`Applied successfully to ${internship.company}!`)
  }

  // Admin save
  const handleSavePosting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company.trim() || !form.title.trim()) {
      toast.error('Company and Title are required')
      return
    }

    try {
      const dbType = ['remote', 'hybrid', 'onsite'].includes(form.type.toLowerCase()) ? form.type.toLowerCase() : 'hybrid'
      const serializedDesc = serializeDescription(form.category, form.eligibility, form.description.trim())

      const dataPayload: any = {
        company: form.company.trim(),
        title: form.title.trim(),
        location: form.location.trim() || null,
        stipend: form.stipend.trim() || null,
        duration: form.duration.trim() || null,
        deadline: form.deadline || null,
        type: dbType,
        description: serializedDesc,
        apply_link: form.apply_link.trim() || null,
        college_id: profile?.college_id || null,
        posted_by: userId
      }

      if (editingInternship) {
        const { error } = await supabase
          .from('internships')
          .update(dataPayload)
          .eq('id', editingInternship.id)
        if (error) throw error
        setInternships(prev => prev.map(x => x.id === editingInternship.id ? { ...x, ...dataPayload } : x))
        toast.success('Internship updated!')
      } else {
        const { data, error } = await supabase
          .from('internships')
          .insert([dataPayload])
          .select()
          .single()
        if (error) throw error
        if (data) setInternships(prev => [data, ...prev])
        toast.success('Internship added!')
      }

      setShowAddModal(false)
      setEditingInternship(null)
      setForm({
        company: '', title: '', location: '', stipend: '',
        duration: '', deadline: '', type: 'hybrid', description: '', apply_link: '',
        category: 'Technical', eligibility: ''
      })
    } catch (err: any) {
      toast.error('Failed to save posting: ' + err.message)
    }
  }

  const handleDeletePosting = async (id: string) => {
    if (!confirm('Are you sure you want to delete this internship?')) return
    try {
      const { error } = await supabase.from('internships').delete().eq('id', id)
      if (error) throw error
      setInternships(prev => prev.filter(x => x.id !== id))
      toast.success('Internship deleted successfully')
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  const handleEditClick = (internship: any) => {
    setEditingInternship(internship)
    const { category, eligibility, description: cleanDesc } = parseDescription(internship.description)
    setForm({
      company: internship.company || '',
      title: internship.title || '',
      location: internship.location || '',
      stipend: internship.stipend || '',
      duration: internship.duration || '',
      deadline: internship.deadline || '',
      type: internship.type || 'hybrid',
      description: cleanDesc || '',
      apply_link: internship.apply_link || '',
      category: category || 'Technical',
      eligibility: eligibility || ''
    })
    setShowAddModal(true)
  }

  const parseStipendDisplay = (stipend: string | null) => {
    if (!stipend) return 'Unpaid'
    const num = parseInt(stipend.replace(/[^0-9]/g, ''))
    if (isNaN(num)) return stipend
    return `₹${(num/1000).toFixed(0)}K/mo`
  }

  // Render Status tracker steps
  const renderStatusTracker = (status: string) => {
    const stages = ['applied', 'under_review', 'interviewing', 'decided']
    const stageLabels = ['Applied', 'Under Review', 'Interviewing', 'Decision']
    
    let activeIdx = 0
    if (status.toLowerCase().includes('review')) activeIdx = 1
    else if (status.toLowerCase().includes('interview')) activeIdx = 2
    else if (status.toLowerCase().includes('offer') || status.toLowerCase().includes('decide') || status.toLowerCase().includes('accept') || status.toLowerCase().includes('reject')) activeIdx = 3

    return (
      <div className="space-y-3 pt-2">
        <p className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Application Progress</p>
        <div className="relative flex justify-between items-center w-full px-2">
          {/* Progress bar line */}
          <div className="absolute left-4 right-4 h-0.5 bg-white/[0.04] z-0 top-1/2 -translate-y-1/2" />
          <div 
            className="absolute left-4 h-0.5 bg-cyan-500 z-0 top-1/2 -translate-y-1/2 transition-all duration-500" 
            style={{ width: `${(activeIdx / (stages.length - 1)) * 90}%` }}
          />

          {stageLabels.map((lbl, idx) => {
            const isDone = idx <= activeIdx
            const isCurrent = idx === activeIdx
            
            return (
              <div key={lbl} className="flex flex-col items-center z-10 relative">
                <div className={clsx(
                  "w-5 h-5 rounded-full flex items-center justify-center border transition-all text-[10px] font-bold",
                  isCurrent 
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 scale-110 shadow-lg shadow-cyan-500/10" 
                    : isDone
                      ? "bg-cyan-500 border-cyan-600 text-zinc-950"
                      : "bg-zinc-950 border-white/[0.08] text-zinc-600"
                )}>
                  {isDone && !isCurrent ? '✓' : idx + 1}
                </div>
                <span className={clsx(
                  "text-[9px] font-mono tracking-tighter mt-1.5",
                  isCurrent ? "text-cyan-400 font-bold" : isDone ? "text-zinc-300" : "text-zinc-600"
                )}>
                  {lbl}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-24 text-zinc-50">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.04] pb-6">
        <div className="space-y-2">
          <p className="section-label text-cyan-400 font-mono tracking-widest text-[10px]">Career Portal</p>
          <h1 className="display-heading text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-300">
            Internships & Careers
          </h1>
          <p className="body-pro text-sm text-zinc-400 font-normal">Apply to curated internship opportunities aligned with your branch and skills.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          {isAdmin && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingInternship(null)
                setForm({
                  company: '', title: '', location: '', stipend: '',
                  duration: '', deadline: '', type: 'hybrid', description: '', apply_link: '',
                  category: 'Technical', eligibility: ''
                })
                setShowAddModal(true)
              }}
              className="btn-premium px-5 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2"
            >
              <Plus size={14} /> Create Posting
            </motion.button>
          )}
          <div className="card-premium px-4 py-2 bg-zinc-900/40 border-white/[0.06] flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Roles</span>
            <span className="text-xl font-display font-bold text-white leading-none">{internships.length}</span>
          </div>
        </div>
      </header>

      {/* Tabs Layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.04] pb-2 gap-4">
        <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/60 border border-white/[0.05] overflow-x-auto w-full sm:w-auto no-scrollbar">
          {([
            { id: 'browse', label: 'Browse Positions' },
            { id: 'applied', label: 'My Applications' },
            { id: 'saved', label: 'Bookmarks' }
          ] as const).map(t => (
            <button 
              key={t.id} 
              onClick={() => { setTab(t.id); setSearch('') }}
              className={clsx(
                "px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-all",
                tab === t.id ? "bg-white/[0.08] text-white shadow-sm font-semibold" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {t.label}
            </button>
          ))}
          {isAdmin && (
            <button 
              onClick={() => { setTab('admin'); setSearch('') }}
              className={clsx(
                "px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-all border border-cyan-500/20",
                tab === 'admin' ? "bg-cyan-500/20 text-cyan-300" : "text-cyan-500 hover:bg-cyan-500/10"
              )}
            >
              Recruiter Console
            </button>
          )}
        </div>
      </div>

      {/* Main content view */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {tab !== 'admin' && (
            <div className="bg-zinc-900/20 border border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  className="input-pro pl-11 bg-zinc-950/40 border-white/[0.08] placeholder:text-zinc-600 focus:border-cyan-500/40 text-xs py-3 w-full" 
                  placeholder="Search roles, companies, or keywords..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
              <div className="flex gap-1 p-1 rounded-xl bg-zinc-950/60 border border-white/[0.04] overflow-x-auto max-w-full no-scrollbar">
                {TYPES.map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTypeFilter(t)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-tight whitespace-nowrap transition-all",
                      typeFilter === t ? "bg-white/[0.08] text-white shadow-sm font-semibold" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState 
              icon="work_outline"
              title={tab === 'applied' ? "No submitted applications" : tab === 'saved' ? "No bookmarked positions" : "No internships open"}
              description={tab === 'applied' ? "You haven't applied to any job postings yet. Find open postings in the Browse tab." : tab === 'saved' ? "Bookmark postings while browsing to access them easily here." : "No active career opportunities matched your current search filters."}
              action={
                isAdmin 
                  ? {
                      label: "Create Internship Posting",
                      onClick: () => {
                        setEditingInternship(null)
                        setForm({
                          company: '', title: '', location: '', stipend: '',
                          duration: '', deadline: '', type: 'hybrid', description: '', apply_link: '',
                          category: 'Technical', eligibility: ''
                        })
                        setShowAddModal(true)
                      }
                    }
                  : {
                      label: "Browse Opportunities",
                      onClick: () => { setTab('browse'); setTypeFilter('All'); setSearch('') }
                    }
              }
            />
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filtered.map((intern: any) => {
                const isApplied = !!applied[intern.id]
                const isSaved = savedIds.includes(intern.id)
                const days = daysUntil(intern.deadline)
                const { category, eligibility, description: cleanDesc } = parseDescription(intern.description)
                const skills = deriveSkills(intern.title, category)
                const matchPct = getMatchPercent(intern.title, category)

                return (
                  <motion.div 
                    variants={itemVariants}
                    key={intern.id} 
                    className="card-premium p-6 flex flex-col justify-between cursor-pointer border-white/[0.06] hover:border-cyan-500/20 bg-zinc-900/20 h-[340px]" 
                    onClick={() => setSelectedInternship(intern)}
                  >
                    <div className="space-y-4">
                      {/* Logo and title */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-extrabold text-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                            {intern.company.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-white truncate leading-snug group-hover:text-cyan-400 transition-colors">
                              {intern.title}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate max-w-[120px]">{intern.company}</span>
                              <span className="text-zinc-700">•</span>
                              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight uppercase border border-white/[0.08] text-zinc-400 bg-white/[0.02]">
                                {intern.type}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top corner action */}
                        <div className="flex gap-2 items-center">
                          {/* Match indicator */}
                          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold px-2 py-1 rounded-full">
                            <Sparkles size={9} />
                            {matchPct}% Match
                          </div>

                          {tab !== 'admin' && (
                            <button 
                              onClick={(e) => toggleSave(e, intern.id)}
                              className={clsx(
                                "p-2 rounded-lg border transition-all active:scale-90",
                                isSaved 
                                  ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" 
                                  : "bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-white"
                              )}
                              aria-label="Save posting"
                            >
                              <Bookmark size={12} fill={isSaved ? "currentColor" : "none"} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Job details stats */}
                      <div className="grid grid-cols-3 gap-2 bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl text-center shadow-inner">
                        <div>
                          <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Stipend</p>
                          <p className="text-xs text-white font-bold font-mono mt-0.5">{parseStipendDisplay(intern.stipend)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Duration</p>
                          <p className="text-xs text-white font-bold mt-0.5">{intern.duration || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Timeline</p>
                          <p className="text-xs font-mono font-bold mt-0.5" style={{ color: days <= 5 ? '#f87171' : days <= 12 ? '#fbbf24' : '#4ade80' }}>
                            {days === 0 ? 'Closed' : `${days}d left`}
                          </p>
                        </div>
                      </div>

                      {/* Skills match highlights */}
                      <div className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 3).map((s: string) => {
                          const hasSkill = userSkills.some(us => us.toLowerCase() === s.toLowerCase())
                          return (
                            <span 
                              key={s} 
                              className={clsx(
                                "px-2 py-0.5 rounded text-[8px] font-mono border",
                                hasSkill 
                                  ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300 font-bold" 
                                  : "bg-white/[0.01] border-white/[0.05] text-zinc-500"
                              )}
                            >
                              {s}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className="border-t border-white/[0.04] pt-4 mt-2">
                      {tab === 'applied' ? (
                        /* Show visual timeline progress for applied items */
                        renderStatusTracker(applied[intern.id] || 'applied')
                      ) : (
                        /* Standard location/category details */
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">
                            <MapPin size={12} className="text-zinc-600" />
                            {intern.location || 'Remote'}
                          </span>
                          
                          {isAdmin ? (
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditClick(intern) }}
                                className="p-1.5 rounded hover:bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeletePosting(intern.id) }}
                                className="p-1.5 rounded hover:bg-red-950/20 border border-red-950/40 text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                              {category}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Details / Apply Modal overlay */}
      <AnimatePresence>
        {selectedInternship && (() => {
          const { category, eligibility, description: cleanDesc } = parseDescription(selectedInternship.description)
          const skills = deriveSkills(selectedInternship.title, category)
          const matchPct = getMatchPercent(selectedInternship.title, category)
          const isApplied = !!applied[selectedInternship.id]

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={()=>setSelectedInternship(null)} />
              <motion.div 
                initial={{opacity:0, scale:0.96, y:15}} 
                animate={{opacity:1, scale:1, y:0}} 
                exit={{opacity:0, scale:0.96, y:15}} 
                className="card-premium max-w-lg w-full relative z-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-white/[0.08]"
              >
                <div className="p-6 md:p-8 space-y-6">
                  {/* Top Company Info */}
                  <div className="flex items-start gap-4 justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-extrabold text-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                        {selectedInternship.company.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="display-heading text-xl font-bold text-white tracking-tight leading-snug">{selectedInternship.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest truncate">{selectedInternship.company}</p>
                          <span className="text-zinc-700">•</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">{selectedInternship.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={()=>setSelectedInternship(null)}
                      className="p-1 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Skills Alignment & Match details */}
                  <div className="bg-gradient-to-r from-cyan-950/20 to-zinc-900/40 border border-cyan-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-cyan-400 animate-pulse" size={16} />
                        <span className="text-sm font-bold text-white">{matchPct}% Match Score</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal mt-1">
                        Based on your profile skills matching this position&apos;s job requirements.
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-sm text-cyan-300 bg-cyan-500/5">
                      {matchPct}%
                    </div>
                  </div>

                  {/* Specs grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'STIPEND', val: parseStipendDisplay(selectedInternship.stipend) },
                      { label: 'DURATION', val: selectedInternship.duration || 'N/A' },
                      { label: 'DEADLINE', val: selectedInternship.deadline ? format(new Date(selectedInternship.deadline), 'd MMM yyyy') : 'N/A' }
                    ].map(s => (
                      <div key={s.label} className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-3.5 text-center shadow-inner">
                        <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-xs font-bold text-white leading-tight font-mono">{s.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {/* Skills Checklist */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Core Requirements</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s: string) => {
                          const hasSkill = userSkills.some(us => us.toLowerCase() === s.toLowerCase())
                          return (
                            <span 
                              key={s} 
                              className={clsx(
                                "px-3 py-1 rounded-full text-xs font-mono border flex items-center gap-1.5",
                                hasSkill 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium" 
                                  : "bg-white/[0.01] border-white/[0.05] text-zinc-500"
                              )}
                            >
                              <CheckCircle2 size={12} className={hasSkill ? "text-emerald-400" : "text-zinc-700"} />
                              {s}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {/* Eligibility specs */}
                    {eligibility && (
                      <div className="space-y-1 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                        <p className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Eligibility Criteria</p>
                        <p className="text-xs leading-relaxed text-zinc-200 mt-1">{eligibility}</p>
                      </div>
                    )}

                    {/* Description */}
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Role Description</p>
                      <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                        {cleanDesc || 'No role description details listed.'}
                      </p>
                    </div>

                    {/* Links */}
                    {selectedInternship.apply_link && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Apply Portal URL</p>
                        <a href={selectedInternship.apply_link} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1.5 break-all mt-1">
                          {selectedInternship.apply_link} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-white/[0.04] flex justify-between items-center gap-4">
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                      <MapPin size={12} /> {selectedInternship.location || 'Remote'}
                    </span>

                    {isApplied ? (
                      <span className="px-5 py-2.5 rounded-xl font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-xs">
                        ✓ Applied
                      </span>
                    ) : (
                      <button 
                        onClick={() => applyNow(selectedInternship)} 
                        disabled={applying} 
                        className="btn-premium px-6 py-3 justify-center text-xs font-semibold rounded-xl"
                      >
                        {applying ? <Clock className="animate-spin" size={14} /> : 'Submit Application'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>

      {/* Admin Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={()=>setShowAddModal(false)} />
            <motion.div 
              initial={{opacity:0, scale:0.96, y:15}} 
              animate={{opacity:1, scale:1, y:0}} 
              exit={{opacity:0, scale:0.96, y:15}} 
              className="card-premium max-w-lg w-full relative z-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-white/[0.08]"
            >
              <form onSubmit={handleSavePosting} className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="display-heading text-xl font-bold text-white">{editingInternship ? 'Edit Opportunity Posting' : 'Post Internship Opportunity'}</h2>
                  <button type="button" onClick={()=>setShowAddModal(false)} className="p-1 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Company Name</label>
                      <input 
                        value={form.company} 
                        onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="Google"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Role Title</label>
                      <input 
                        value={form.title} 
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="Software Engineer Intern"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Location</label>
                      <input 
                        value={form.location} 
                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="Remote / Noida"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Stipend (Monthly)</label>
                      <input 
                        value={form.stipend} 
                        onChange={e => setForm(f => ({ ...f, stipend: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="e.g. 45000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Duration</label>
                      <input 
                        value={form.duration} 
                        onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="e.g. 6 months"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Deadline Date</label>
                      <input 
                        type="date"
                        value={form.deadline} 
                        onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Workspace Type</label>
                      <select 
                        value={form.type} 
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60 appearance-none cursor-pointer"
                      >
                        <option value="remote" className="bg-[#030712]">Remote</option>
                        <option value="hybrid" className="bg-[#030712]">Hybrid</option>
                        <option value="onsite" className="bg-[#030712]">Onsite</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Category</label>
                      <select 
                        value={form.category} 
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60 appearance-none cursor-pointer"
                      >
                        {TYPES.slice(1).map(x => <option key={x} value={x} className="bg-zinc-950">{x}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Application URL (External)</label>
                      <input 
                        value={form.apply_link} 
                        onChange={e => setForm(f => ({ ...f, apply_link: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Eligibility Criteria</label>
                    <input 
                      value={form.eligibility} 
                      onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))}
                      className="input-pro w-full bg-zinc-900/60"
                      placeholder="e.g. B.Tech/Dual degree, CGPA > 8.0"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Opportunity Description</label>
                    <textarea 
                      value={form.description} 
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="input-pro w-full bg-zinc-900/60 h-28 resize-none py-2"
                      placeholder="Describe projects, responsibilities, culture, and required qualification details..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-white/[0.04]">
                  <button type="button" onClick={()=>setShowAddModal(false)} className="btn-ghost-pro flex-1 py-3 justify-center text-xs font-semibold rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" className="btn-premium flex-1 py-3 justify-center text-xs font-semibold rounded-xl">
                    Publish Posting
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
