'use client'
import { CheckCircle, X, Users, Compass, Plus, ArrowRight, Sparkles, Send } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/DynamicIcon'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Club {
  id: string
  name: string
  description: string | null
  category: string
  member_count: number
  is_official: boolean
  lead_name: string | null
  contact_email: string | null
  logo_url: string | null
  banner_url: string | null
}

const CAT_ICONS: Record<string, string> = {
  Career: 'rocket_launch',
  Technical: 'code',
  Cultural: 'theater_comedy',
  Sports: 'sports',
  Academic: 'school',
  Social: 'volunteer_activism',
}

const CAT_COLORS: Record<string, string> = {
  Career: '#22d3ee',      // Cyan
  Technical: '#8b5cf6',   // Violet
  Cultural: '#ec4899',    // Pink
  Sports: '#f59e0b',      // Amber
  Academic: '#3b82f6',    // Blue
  Social: '#10b981',      // Emerald
}

export default function ClubsClient({ clubs: dbClubs, currentUserId }: { clubs: Club[]; currentUserId: string }) {
  const clubs = dbClubs
  const [filter, setFilter] = useState('All')
  const [joined, setJoined] = useState<string[]>([])
  const [selected, setSelected] = useState<Club | null>(null)
  
  // Request club states
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [reqName, setReqName] = useState('')
  const [reqCat, setReqCat] = useState('Technical')
  const [reqDesc, setReqDesc] = useState('')
  const [submittingReq, setSubmittingReq] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // Load persisted club memberships from DB on mount
  useEffect(() => {
    async function loadJoinedClubs() {
      if (!currentUserId) return
      const { data, error } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', currentUserId)
      if (!error && data) {
        setJoined(data.map((x: any) => x.club_id))
      }
    }
    loadJoinedClubs()

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      if (id && clubs.length > 0) {
        const found = clubs.find(x => x.id === id)
        if (found) {
          setSelected(found)
        }
      }
    }
  }, [clubs, currentUserId, supabase])

  const categories = ['All', ...Object.keys(CAT_ICONS)]
  const filtered = clubs.filter(c => filter === 'All' || c.category === filter)
  const official = filtered.filter(c => c.is_official)
  const unofficial = filtered.filter(c => !c.is_official)

  const toggle = async (id: string) => {
    const isJoined = joined.includes(id)
    if (isJoined) {
      setJoined(j => j.filter(x => x !== id))
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', id)
        .eq('user_id', currentUserId)
      if (error) {
        toast.error('Failed to leave club: ' + error.message)
        setJoined(j => [...j, id])
      } else {
        toast.success('Left club successfully')
      }
    } else {
      setJoined(j => [...j, id])
      const { error } = await supabase
        .from('club_members')
        .insert({ club_id: id, user_id: currentUserId })
      if (error) {
        toast.error('Failed to join club: ' + error.message)
        setJoined(j => j.filter(x => x !== id))
      } else {
        toast.success('Joined club successfully!')
      }
    }
  }

  const handleRequestClubSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqName.trim() || !reqDesc.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setSubmittingReq(true)
    setTimeout(() => {
      toast.success('Club creation request submitted to Admin!')
      setShowRequestModal(false)
      setReqName('')
      setReqDesc('')
      setSubmittingReq(false)
    }, 800)
  }

  return (
    <div className="space-y-10 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 mb-1.5">
            <Compass size={12} className="text-brand-500" /> CAMPUS CLUBS
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">Clubs & Societies</h1>
          <p className="text-zinc-400 text-sm mt-1">Join active student groups, professional bodies, and cultural societies.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowRequestModal(true)}
          className="btn-premium self-start md:self-auto"
        >
          <Plus size={18} />
          <span>Request New Club</span>
        </motion.button>
      </header>

      {clubs.length === 0 ? (
        <div className="card-premium p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-zinc-950/80 border border-white/[0.08] flex items-center justify-center text-2xl text-zinc-500">
            📯
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-white">No clubs available yet.</h2>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
              There are currently no active clubs or student organizations on campus. Be the pioneer!
            </p>
          </div>
          <button 
            onClick={() => setShowRequestModal(true)}
            className="btn-premium px-5 py-2.5 text-xs font-bold"
          >
            Request to Create a Club
          </button>
        </div>
      ) : (
        <>
          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar border-b border-white/[0.04] pb-6">
            {categories.map(c => {
              const isSelected = filter === c
              return (
                <button 
                  key={c} 
                  onClick={() => setFilter(c)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all duration-200",
                    isSelected 
                      ? "bg-brand-500/10 text-brand-400 border-brand-500/30 shadow-[0_0_12px_rgba(59,130,246,0.1)]" 
                      : "bg-zinc-900/20 text-zinc-400 border-white/[0.05] hover:text-zinc-200 hover:border-white/[0.1]"
                  )}
                >
                  {c !== 'All' && <DynamicIcon name={CAT_ICONS[c]} size={13} style={{ color: isSelected ? undefined : CAT_COLORS[c] }} />}
                  <span>{c}</span>
                </button>
              )
            })}
          </div>

          <div className="space-y-12">
            {/* Official clubs */}
            {official.length > 0 ? (
              <div className="space-y-6">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" /> UNIVERSITY RECOGNIZED
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {official.map(club => {
                    const color = CAT_COLORS[club.category] || '#a1a1aa'
                    const isJoined = joined.includes(club.id)
                    return (
                      <motion.div 
                        layout
                        whileHover={{ y: -2 }}
                        key={club.id} 
                        className="card-elevated p-6 cursor-pointer group hover:border-brand-500/20 transition-all duration-300 relative overflow-hidden" 
                        onClick={() => setSelected(club)}
                      >
                        <div className="absolute top-0 right-0 p-4">
                          <CheckCircle className="text-brand-400" size={16} />
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md border"
                            style={{background: `${color}10`, borderColor: `${color}25`}}>
                            <DynamicIcon name={CAT_ICONS[club.category]} size={22} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <h3 className="font-display font-semibold text-base text-white group-hover:text-brand-400 transition-colors truncate">{club.name}</h3>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">{club.category}</p>
                          </div>
                        </div>

                        {club.description && <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed font-medium mb-5">{club.description}</p>}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                          <button
                            onClick={e => { e.stopPropagation(); toggle(club.id) }}
                            className={clsx(
                              "btn-ghost-pro py-1.5 px-3 text-[11px] font-bold border-white/[0.08] hover:border-brand-500/30",
                              isJoined ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20 hover:text-emerald-300" : "text-zinc-300 hover:bg-brand-500/5"
                            )}
                          >
                            {isJoined ? 'Member ✓' : 'Join Club'}
                          </button>
                          <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                            <Users size={12} className="text-zinc-500" />
                            {club.member_count} members
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ) : filter !== 'All' && (
              <div className="text-center py-10 card-premium max-w-md mx-auto">
                <p className="text-zinc-500 text-xs italic">No official organizations found in {filter}.</p>
              </div>
            )}

            {/* Unofficial clubs */}
            {unofficial.length > 0 && (
              <div className="space-y-6">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" /> STUDENT-RUN GROUPS
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {unofficial.map(club => {
                    const color = CAT_COLORS[club.category] || '#a1a1aa'
                    const isJoined = joined.includes(club.id)
                    return (
                      <motion.div 
                        layout
                        whileHover={{ y: -2 }}
                        key={club.id} 
                        className="card-elevated p-6 cursor-pointer group hover:border-brand-500/20 transition-all duration-300 relative overflow-hidden" 
                        onClick={() => setSelected(club)}
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{background: `${color}08`, borderColor: `${color}15`}}>
                            <DynamicIcon name={CAT_ICONS[club.category]} size={20} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-semibold text-base text-white group-hover:text-brand-400 transition-colors truncate">{club.name}</h3>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">{club.category}</p>
                          </div>
                        </div>

                        {club.description && <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed font-medium mb-5">{club.description}</p>}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                          <button
                            onClick={e => { e.stopPropagation(); toggle(club.id) }}
                            className={clsx(
                              "btn-ghost-pro py-1.5 px-3 text-[11px] font-bold border-white/[0.08] hover:border-brand-500/30",
                              isJoined ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20" : "text-zinc-300 hover:bg-brand-500/5"
                            )}
                          >
                            {isJoined ? 'Member ✓' : 'Join Club'}
                          </button>
                          <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                            <Users size={12} className="text-zinc-500" />
                            {club.member_count} members
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Request Club Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setShowRequestModal(false)} />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
              className="card-elevated max-w-md w-full relative z-10 p-6 md:p-8 space-y-6 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowRequestModal(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-400" /> Request a Club
                </h2>
                <p className="text-zinc-400 text-xs">Submit a proposal to launch a new student organization.</p>
              </div>

              <form onSubmit={handleRequestClubSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Club Name</label>
                  <input 
                    value={reqName} 
                    onChange={e => setReqName(e.target.value)}
                    className="input-pro text-xs"
                    placeholder="e.g. Artificial Intelligence Association"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Category</label>
                  <select 
                    value={reqCat} 
                    onChange={e => setReqCat(e.target.value)}
                    className="input-pro text-xs"
                  >
                    {Object.keys(CAT_ICONS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Proposed Mission / Purpose</label>
                  <textarea 
                    value={reqDesc} 
                    onChange={e => setReqDesc(e.target.value)}
                    className="input-pro h-24 py-2.5 text-xs resize-none"
                    placeholder="What are the goals, target audience, and planned activities for the club?"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="btn-ghost-pro flex-1 py-3 text-xs justify-center">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingReq} 
                    className="btn-premium flex-1 py-3 text-xs justify-center disabled:opacity-50"
                  >
                    {submittingReq ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setSelected(null)} />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
              className="card-elevated max-w-lg w-full relative z-10 overflow-hidden"
            >
              <div className="h-32 relative bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-white/[0.04]">
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 50%, ${CAT_COLORS[selected.category]}40, transparent 70%)` }} />
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-zinc-400 border border-white/10 hover:text-white hover:bg-black/80 transition-all">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-end gap-4 -mt-14 mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl border-4 border-zinc-950 flex items-center justify-center shadow-xl shrink-0"
                    style={{ background: 'linear-gradient(135deg, #18181b, #09090b)' }}>
                    <DynamicIcon name={CAT_ICONS[selected.category]} size={28} style={{ color: CAT_COLORS[selected.category] }} />
                  </div>
                  <div className="pb-1 min-w-0">
                    {selected.is_official && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-1">
                        <CheckCircle size={10} /> Official Organization
                      </span>
                    )}
                    <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight text-white truncate leading-tight">{selected.name}</h2>
                  </div>
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed font-medium mb-6">{selected.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                  {selected.lead_name && (
                    <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/[0.04]">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">CLUB PRESIDENT</p>
                      <p className="font-bold text-white">{selected.lead_name}</p>
                    </div>
                  )}
                  <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/[0.04]">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">COMMUNITY MEMBERS</p>
                    <p className="font-bold text-white">{selected.member_count} Students</p>
                  </div>
                  {selected.contact_email && (
                    <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/[0.04] col-span-2">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">OFFICIAL ENQUIRY EMAIL</p>
                      <p className="font-mono text-xs text-brand-400 font-medium truncate">{selected.contact_email}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { toggle(selected.id); setSelected(null) }}
                  className={clsx(
                    "w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300",
                    joined.includes(selected.id) 
                      ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" 
                      : "btn-premium"
                  )}
                >
                  {joined.includes(selected.id) ? 'Leave Organization' : 'Join Organization'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

