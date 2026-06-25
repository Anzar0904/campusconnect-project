'use client'
import { ExternalLink, UserPlus, Users, Search, BookOpen, Compass, Clock, Award, ShieldAlert, Sparkles, Plus, GraduationCap, X } from 'lucide-react'
import { useState, useMemo } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const RESOURCES = [
  { icon: GraduationCap, title: 'NPTEL Courses', desc: 'Free IIT-level MOOCs', url: 'https://nptel.ac.in', color: '#a78bfa' },
  { icon: BookOpen, title: 'MIT OpenCourseWare', desc: 'World-class lecture notes', url: 'https://ocw.mit.edu', color: '#3b82f6' },
  { icon: Compass, title: 'Khan Academy', desc: 'Concept videos for all subjects', url: 'https://khanacademy.org', color: '#10b981' },
  { icon: Code, title: 'GeeksForGeeks', desc: 'CS & coding reference', url: 'https://geeksforgeeks.org', color: '#f59e0b' },
]

import { Code } from 'lucide-react'

export default function StudyClient({ userId, profile, initialGroups }: any) {
  const supabase: any = createClient()
  const [groups, setGroups] = useState<any[]>(initialGroups || [])
  const [groupForm, setGroupForm] = useState({ subject: '', venue: '', time: '', max_members: 4 })
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  async function handleCreateGroup() {
    if (!groupForm.subject.trim()) { toast.error('Subject is required'); return }
    setCreating(true)
    try {
      const { data: newGroup, error } = await supabase
        .from('study_groups')
        .insert({
          subject: groupForm.subject.trim(),
          venue: groupForm.venue.trim() || null,
          meeting_time: groupForm.time || null,
          max_members: groupForm.max_members,
          creator_id: userId,
          college_id: profile.college_id,
        })
        .select('*, study_group_members(user_id)')
        .single()

      if (error) throw error

      await supabase.from('study_group_members').insert({
        group_id: newGroup.id,
        user_id: userId,
      })

      setGroups(prev => [{ ...newGroup, study_group_members: [{ user_id: userId }] }, ...prev])
      toast.success('Study group created!')
      setShowCreate(false)
      setGroupForm({ subject: '', venue: '', time: '', max_members: 4 })
    } catch (err: any) {
      toast.error('Failed to create group: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleJoinGroup(groupId: string) {
    const toastId = toast.loading('Joining group...')
    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({ group_id: groupId, user_id: userId })
      
      if (error) {
        if (error.code === '23505') throw new Error('You are already a member of this group')
        throw error
      }

      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, study_group_members: [...(g.study_group_members || []), { user_id: userId }] }
          : g
      ))
      toast.success('Joined successfully! 🤝', { id: toastId })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    }
  }

  const filteredGroups = useMemo(() => {
    return groups.filter(g => 
      g.subject.toLowerCase().includes(search.toLowerCase()) ||
      (g.venue && g.venue.toLowerCase().includes(search.toLowerCase()))
    )
  }, [groups, search])

  return (
    <div className="space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 mb-1.5">
            <Sparkles size={12} className="text-brand-500" /> VIRTUAL LIBRARIES
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">Study Hub</h1>
          <p className="text-zinc-400 text-sm mt-1">Collaborate in real-time, share resources, and track focus sessions.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(!showCreate)} 
          className="btn-premium self-start md:self-auto"
        >
          <UserPlus size={18} />
          <span>Create Study Group</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focus dashboard & groups */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Progress / Stats Card */}
          <div className="card-elevated p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 relative overflow-hidden">
            <div className="absolute -right-24 -bottom-24 w-48 h-48 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Completed Sessions</span>
              <p className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                8 <span className="text-xs font-medium text-zinc-500">Pomodoros</span>
              </p>
              <p className="text-[10px] text-emerald-400 font-mono mt-1">✓ Goal met this week</p>
            </div>
            <div className="space-y-1 sm:border-l sm:border-white/[0.04] sm:pl-6">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Focused Time</span>
              <p className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                200 <span className="text-xs font-medium text-zinc-500">Mins</span>
              </p>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">+45m vs last week</p>
            </div>
            <div className="space-y-1 sm:border-l sm:border-white/[0.04] sm:pl-6">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Study Streak</span>
              <p className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                5 <span className="text-xs font-medium text-zinc-500">Days</span>
              </p>
              <p className="text-[10px] text-brand-400 font-mono mt-1">🔥 On fire</p>
            </div>
          </div>

          {/* Active Study Groups */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-white">Active Rooms</h2>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-pro pl-9 h-9 text-xs rounded-xl bg-zinc-950/45 border-white/[0.06] w-full"
                  placeholder="Search subject or venue..."
                />
              </div>
            </div>

            {/* Create form modal-like popup inside container */}
            <AnimatePresence>
              {showCreate && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="card-elevated p-5 md:p-6 space-y-4 border-brand-500/20"
                >
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                    <h3 className="font-display font-semibold text-white text-sm">Launch Study Room</h3>
                    <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Subject / Topic *</label>
                      <input className="input-pro text-xs" placeholder="e.g. MTH201 – Calculus Revision" value={groupForm.subject} onChange={e=>setGroupForm(p=>({...p,subject:e.target.value}))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Venue / Link</label>
                      <input className="input-pro text-xs" placeholder="e.g. Library Room 4, GMeet Link..." value={groupForm.venue} onChange={e=>setGroupForm(p=>({...p,venue:e.target.value}))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Meeting Time</label>
                      <input type="datetime-local" className="input-pro text-xs" value={groupForm.time} onChange={e=>setGroupForm(p=>({...p,time:e.target.value}))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowCreate(false)} className="btn-ghost-pro text-xs px-4 py-2">Cancel</button>
                    <button onClick={handleCreateGroup} disabled={creating} className="btn-premium text-xs px-5 py-2">
                      {creating ? 'Creating...' : 'Start Group'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {filteredGroups.length === 0 ? (
                <EmptyState 
                  icon="school"
                  title="No active study groups"
                  description="Start a collaborative virtual study room for your subject or revision batch."
                  action={{
                    label: "Create Group",
                    onClick: () => setShowCreate(true)
                  }}
                />
              ) : (
                filteredGroups.map(g => {
                  const isMember = g.study_group_members?.some((m: any) => m.user_id === userId)
                  const isFull = (g.study_group_members?.length || 0) >= g.max_members
                  const spots = g.max_members - (g.study_group_members?.length || 0)

                  return (
                    <motion.div 
                      layout
                      whileHover={{ y: -1 }}
                      key={g.id} 
                      className="card-premium p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-brand-500/10 border border-brand-500/20 text-brand-400">
                          <Users size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold text-white text-base group-hover:text-brand-400 transition-colors truncate">{g.subject}</h3>
                          
                          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-500 mt-1">
                            <span className="truncate">📍 {g.venue || 'Virtual / TBD'}</span>
                            <span>·</span>
                            <span>⏰ {g.meeting_time ? format(new Date(g.meeting_time), 'MMM d, h:mm a') : 'TBD'}</span>
                            <span>·</span>
                            <span className="text-brand-400 font-bold">{spots} spots left</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        {isMember ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Joined
                            </span>
                            <Link 
                              href={`/study/${g.id}`}
                              className="btn-premium px-4 py-2 text-xs font-bold"
                            >
                              Enter Room
                            </Link>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleJoinGroup(g.id)}
                            disabled={isFull}
                            className="btn-ghost-pro px-4 py-2 text-xs font-bold border-white/[0.08] hover:border-brand-500/30 hover:bg-brand-500/5 text-brand-400"
                          >
                            {isFull ? 'Full' : 'Join'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Resources */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-premium p-6 space-y-4">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-white border-b border-white/[0.04] pb-2">
              External Resources
            </h2>
            <div className="flex flex-col gap-3">
              {RESOURCES.map(r => {
                const Icon = r.icon
                return (
                  <a 
                    key={r.title} 
                    href={r.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-3.5 rounded-xl bg-zinc-950/30 border border-white/[0.04] hover:border-brand-500/15 flex items-center gap-3 transition-all group no-underline"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border" 
                      style={{ background: `${r.color}08`, borderColor: `${r.color}18` }}>
                      <Icon style={{ color: r.color }} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-brand-400 transition-colors truncate">{r.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{r.desc}</p>
                    </div>
                    <ExternalLink size={12} className="text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

