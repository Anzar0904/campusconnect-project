'use client'

import React, { useState, useEffect } from 'react'
import { 
  MapPin, Search, X, Bookmark, Plus, Edit, Trash2, Briefcase, 
  Calendar, CreditCard, Clock, Star, ExternalLink, Save, BookOpen
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

  // Load saved bookmarks from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('saved_internships')
    if (saved) {
      try {
        setSavedIds(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  // Auto-select internship or trigger creation modal from query parameter
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

  // Helper serialization/deserialization for Category & Eligibility
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

  // Admin: Create or edit posting
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

  // Admin: Delete posting
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
    return `₹${(num/1000).toFixed(0)}K`
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="section-label">Career Hub</p>
          <h1 className="display-heading text-4xl">Internships Portal</h1>
          <p className="body-pro text-sm">Real-time internship openings sourced directly from recruiters.</p>
        </div>
        <div className="flex gap-4 items-center">
          {isAdmin && (
            <button 
              onClick={() => {
                setEditingInternship(null)
                setForm({
                  company: '', title: '', location: '', stipend: '',
                  duration: '', deadline: '', type: 'hybrid', description: '', apply_link: '',
                  category: 'Technical', eligibility: ''
                })
                setShowAddModal(true)
              }}
              className="btn-premium px-5 py-2.5 text-xs flex items-center gap-2"
            >
              <Plus size={14} /> Create Internship
            </button>
          )}
          <div className="card-premium px-4 py-2 flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Openings</span>
            <span className="text-xl font-display font-bold text-zinc-50 leading-none">{internships.length}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit">
          {([
            { id: 'browse', label: 'Browse' },
            { id: 'applied', label: 'My Applications' },
            { id: 'saved', label: 'Bookmarks' }
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={clsx(
                "px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all",
                tab === t.id ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}>
              {t.label}
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => setTab('admin')}
              className={clsx(
                "px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all border border-brand-500/20",
                tab === 'admin' ? "bg-brand-500/20 text-brand-400" : "text-brand-500 hover:bg-brand-500/10"
              )}>
              Admin Console
            </button>
          )}
        </div>

        {tab === 'admin' && (
          <button 
            onClick={() => {
              setEditingInternship(null)
              setForm({
                company: '', title: '', location: '', stipend: '',
                duration: '', deadline: '', type: 'hybrid', description: '', apply_link: '',
                category: 'Technical', eligibility: ''
              })
              setShowAddModal(true)
            }}
            className="btn-premium px-4 py-2 text-xs flex items-center gap-2"
          >
            <Plus size={14} /> Add Internship
          </button>
        )}
      </div>

      {/* Browse Views */}
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  className="input-pro pl-11 py-3 text-xs w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl" 
                  placeholder="Search roles or companies..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
              <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-x-auto no-scrollbar">
                {TYPES.map(t => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className={clsx(
                      "px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-tighter whitespace-nowrap transition-all",
                      typeFilter === t ? "bg-white/[0.08] text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
                    )}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Listings */}
          {filtered.length === 0 ? (
            <EmptyState 
              icon="work_outline"
              title="No internships available"
              description={
                tab === 'applied' 
                  ? "You have not submitted any applications yet." 
                  : tab === 'saved' 
                    ? "You haven't bookmarked any internships yet." 
                    : "No internships available yet"
              }
              action={
                isAdmin 
                  ? {
                      label: "Create Internship",
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
                      label: "Browse Internships",
                      onClick: () => {
                        setTab('browse')
                        setTypeFilter('All')
                        setSearch('')
                      }
                    }
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((intern: any) => {
                const isApplied = !!applied[intern.id]
                const isSaved = savedIds.includes(intern.id)
                const days = daysUntil(intern.deadline)
                const { category, eligibility, description: cleanDesc } = parseDescription(intern.description)
                const skills = deriveSkills(intern.title, category)
                
                return (
                  <motion.div 
                    layout
                    key={intern.id} 
                    className="card-premium p-6 flex flex-col justify-between cursor-pointer group hover:border-cyan-500/30 transition-all duration-300 shadow-xl relative" 
                    onClick={() => setSelectedInternship(intern)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform duration-300">
                            {intern.company.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors truncate tracking-tight">{intern.title}</h3>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">{intern.company}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {isApplied && (
                            <span className="chip-pro text-[9px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shrink-0">Applied</span>
                          )}
                          {tab !== 'admin' && (
                            <button 
                              onClick={(e) => toggleSave(e, intern.id)}
                              className={clsx(
                                "p-2 rounded-lg border transition-all active:scale-90",
                                isSaved ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-white/[0.02] border-white/[0.04] text-neutral-500 hover:text-white"
                              )}
                            >
                              <Bookmark size={13} fill={isSaved ? "currentColor" : "none"} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-3 gap-2 py-1">
                        <div>
                          <p className="text-[8px] font-mono text-zinc-500 uppercase">Stipend</p>
                          <p className="text-xs text-white font-bold">{parseStipendDisplay(intern.stipend)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-mono text-zinc-500 uppercase">Duration</p>
                          <p className="text-xs text-white font-bold">{intern.duration || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-mono text-zinc-500 uppercase">Deadline</p>
                          <p className="text-xs font-mono font-bold" style={{ color: days <= 7 ? '#f87171' : days <= 14 ? '#fbbf24' : '#4ade80' }}>
                            {days === 0 ? 'Closed' : `${days}d left`}
                          </p>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="chip-pro text-[9px] py-0">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.04]">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                        <MapPin size={12} />
                        {intern.location || 'Remote'}
                      </span>
                      
                      {isAdmin ? (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditClick(intern) }}
                            className="p-1.5 rounded bg-white/5 border border-white/10 text-neutral-400 hover:text-white"
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeletePosting(intern.id) }}
                            className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="chip-pro text-[9px] uppercase tracking-tighter text-cyan-400 border-cyan-500/25 bg-cyan-500/5">{intern.type}</span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Details / Apply Modal */}
      <AnimatePresence>
        {selectedInternship && (() => {
          const { category, eligibility, description: cleanDesc } = parseDescription(selectedInternship.description)
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setSelectedInternship(null)} />
              <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
                className="card-premium max-w-lg w-full relative z-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#090d16]"
              >
                <div className="p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0 shadow-lg">
                      {selectedInternship.company.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="display-heading text-xl tracking-tight leading-tight">{selectedInternship.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{selectedInternship.company}</p>
                        <span className="text-zinc-600">•</span>
                        <span className="chip-pro text-[9px] uppercase tracking-tighter text-cyan-400 border-cyan-500/25 bg-cyan-500/5">{selectedInternship.type}</span>
                      </div>
                    </div>
                    <button onClick={()=>setSelectedInternship(null)} className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'STIPEND', val: parseStipendDisplay(selectedInternship.stipend) },
                      { label: 'DURATION', val: selectedInternship.duration || 'N/A' },
                      { label: 'DEADLINE', val: selectedInternship.deadline ? format(new Date(selectedInternship.deadline), 'd MMM yyyy') : 'N/A' }
                    ].map(s => (
                      <div key={s.label} className="bg-zinc-900/50 border border-white/[0.03] rounded-2xl p-3 text-center shadow-inner">
                        <p className="section-label !text-[8px] mb-1">{s.label}</p>
                        <p className="text-xs font-bold text-white leading-tight">{s.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase">Category</p>
                      <span className="chip-pro text-[10px] uppercase tracking-tighter text-cyan-400 border-cyan-500/25 bg-cyan-500/5 inline-block">{category}</span>
                    </div>
                    {eligibility && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase">Eligibility</p>
                        <p className="text-xs leading-relaxed text-zinc-300">{eligibility}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase">Description</p>
                      <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">{cleanDesc || 'No description available.'}</p>
                    </div>
                    {selectedInternship.apply_link && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase">Apply Link</p>
                        <a href={selectedInternship.apply_link} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1.5 break-all">
                          {selectedInternship.apply_link} <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/[0.04] flex justify-between items-center gap-4">
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                      <MapPin size={12} /> {selectedInternship.location || 'Remote'}
                    </span>

                    {applied[selectedInternship.id] ? (
                      <span className="px-5 py-2.5 rounded-xl font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-xs">
                        ✓ APPLIED
                      </span>
                    ) : (
                      <button 
                        onClick={() => applyNow(selectedInternship)} 
                        disabled={applying} 
                        className="btn-premium px-6 py-2.5 justify-center text-xs shadow-2xl active:scale-95 disabled:opacity-50"
                      >
                        {applying ? <Clock className="animate-spin" size={14} /> : 'Apply Now'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>

      {/* Admin Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setShowAddModal(false)} />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
              className="card-premium max-w-lg w-full relative z-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto bg-[#090d16]"
            >
              <form onSubmit={handleSavePosting} className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="display-heading text-xl">{editingInternship ? 'Edit Posting' : 'Create Internship Posting'}</h2>
                  <button type="button" onClick={()=>setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white">
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Company Name</label>
                      <input 
                        value={form.company} 
                        onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="Google"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Role Title</label>
                      <input 
                        value={form.title} 
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="Software Engineering Intern"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Location</label>
                      <input 
                        value={form.location} 
                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="Remote / Noida"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Stipend (Monthly)</label>
                      <input 
                        value={form.stipend} 
                        onChange={e => setForm(f => ({ ...f, stipend: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Duration</label>
                      <input 
                        value={form.duration} 
                        onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="3 months"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Deadline Date</label>
                      <input 
                        type="date"
                        value={form.deadline} 
                        onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Internship Type</label>
                      <select 
                        value={form.type} 
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full bg-[#030712]/95 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                      >
                        <option value="remote" className="bg-[#030712]">Remote</option>
                        <option value="hybrid" className="bg-[#030712]">Hybrid</option>
                        <option value="onsite" className="bg-[#030712]">Onsite</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Category / Department</label>
                      <select 
                        value={form.category} 
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full bg-[#030712]/95 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                      >
                        {TYPES.slice(1).map(x => <option key={x} value={x} className="bg-[#030712]">{x}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Apply Link (External)</label>
                      <input 
                        value={form.apply_link} 
                        onChange={e => setForm(f => ({ ...f, apply_link: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="https://careers.google.com/..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Eligibility Requirements</label>
                    <input 
                      value={form.eligibility} 
                      onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))}
                      className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                      placeholder="B.Tech (CSE) / MCA · CGPA > 8.0"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Opportunity Description</label>
                    <textarea 
                      value={form.description} 
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none h-24 resize-none"
                      placeholder="Detail opportunity requirements, duties, and project scopes..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={()=>setShowAddModal(false)} className="btn-ghost-pro flex-1 py-3 justify-center text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="btn-premium flex-1 py-3 justify-center text-xs">
                    Save Opportunity
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
