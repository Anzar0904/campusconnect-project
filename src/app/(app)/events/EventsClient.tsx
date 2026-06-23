'use client'
import { Check, Clock, MapPin, Users, Plus, Edit, Trash2, X, Calendar, Share2 } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/DynamicIcon'

import { useState, useEffect } from 'react'
import { format, isAfter, isBefore, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'

interface Event {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  venue: string | null
  category: string
  registration_link: string | null
  attendee_count: number
  banner_url: string | null
}

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  Career: { bg: 'rgba(76,215,246,0.1)', text: '#4cd7f6' },
  Academic: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
  Cultural: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
  Social: { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee' },
  Sports: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
}

// Helpers for Capacity
function parseEventDescription(desc: string | null) {
  if (!desc) {
    return { capacity: '', description: '' }
  }
  const capacityMatch = desc.match(/^Capacity:\s*(.*?)(?:\r?\n|$)/)
  const capacity = capacityMatch ? capacityMatch[1].trim() : ''
  let cleanDesc = desc.replace(/^Capacity:\s*(.*?)(?:\r?\n|$)/, '').trim()
  return { capacity, description: cleanDesc }
}

function serializeEventDescription(capacity: string, description: string) {
  if (!capacity) return description
  return `Capacity: ${capacity}\n\n${description}`
}

export default function EventsClient({ 
  events: dbEvents, 
  currentUserId,
  initialRSVPs = [],
  profile
}: { 
  events: Event[]; 
  currentUserId: string;
  initialRSVPs?: string[];
  profile?: any;
}) {
  const supabase: any = createClient()
  const [events, setEvents] = useState<Event[]>(dbEvents)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [cat, setCat] = useState('All')
  const [interested, setInterested] = useState<string[]>(initialRSVPs)
  const now = new Date()

  const isAdmin = profile?.role?.toUpperCase() === 'SUPER_ADMIN' || profile?.role?.toUpperCase() === 'ADMIN'

  // Modal / Creation States
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  
  const [form, setForm] = useState({
    title: '',
    category: 'Academic',
    description: '',
    date: '',
    time: '',
    venue: '',
    registration_link: '',
    banner_url: '',
    capacity: ''
  })

  // Auto-scroll and highlight event from query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      const createAction = params.get('create')
      
      if (id && events.length > 0) {
        setFilter('all')
        setCat('All')
        setTimeout(() => {
          const el = document.getElementById(`event-${id}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('ring-2', 'ring-cyan-500', 'ring-offset-2', 'ring-offset-[#090d16]')
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-cyan-500', 'ring-offset-2', 'ring-offset-[#090d16]')
            }, 6000)
          }
        }, 500)
      }

      if (createAction === 'true' && isAdmin) {
        setEditingEvent(null)
        setForm({
          title: '', category: 'Academic', description: '', date: '', time: '',
          venue: '', registration_link: '', banner_url: '', capacity: ''
        })
        setShowAddModal(true)
      }
    }
  }, [events, isAdmin])

  async function handleToggleRSVP(eventId: string) {
    const isInterested = interested.includes(eventId)
    setInterested(prev => isInterested ? prev.filter(id => id !== eventId) : [...prev, eventId])

    if (isInterested) {
      const { error } = await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', currentUserId)
      if (error) { toast.error('Failed to remove RSVP'); setInterested(prev => [...prev, eventId]) }
    } else {
      const { error } = await supabase.from('event_attendees').insert({ event_id: eventId, user_id: currentUserId })
      if (error) { toast.error('Failed to RSVP'); setInterested(prev => prev.filter(id => id !== eventId)) }
    }
  }

  // Admin handlers
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) {
      toast.error('Event Name and Date are required')
      return
    }

    try {
      const start_time = new Date(`${form.date}T${form.time || '12:00'}`).toISOString()
      const serializedDesc = serializeEventDescription(form.capacity.trim(), form.description.trim())

      const dataPayload = {
        title: form.title.trim(),
        category: form.category,
        description: serializedDesc,
        start_time,
        venue: form.venue.trim() || null,
        banner_url: form.banner_url.trim() || null,
        registration_link: form.registration_link.trim() || null,
        college_id: profile?.college_id || null,
        organizer_id: currentUserId
      }

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(dataPayload)
          .eq('id', editingEvent.id)
        if (error) throw error
        setEvents(prev => prev.map(x => x.id === editingEvent.id ? { ...x, ...dataPayload } : x))
        toast.success('Event updated successfully!')
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert([dataPayload])
          .select()
          .single()
        if (error) throw error
        if (data) setEvents(prev => [data, ...prev].sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()))
        toast.success('Event created successfully!')
      }

      setShowAddModal(false)
      setEditingEvent(null)
      setForm({
        title: '', category: 'Academic', description: '', date: '', time: '',
        venue: '', registration_link: '', banner_url: '', capacity: ''
      })
    } catch (err: any) {
      toast.error('Failed to save event: ' + err.message)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      setEvents(prev => prev.filter(x => x.id !== id))
      toast.success('Event deleted successfully')
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  const handleEditClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation()
    setEditingEvent(event)
    const dt = parseISO(event.start_time)
    const { capacity, description: cleanDesc } = parseEventDescription(event.description)
    setForm({
      title: event.title || '',
      category: event.category || 'Academic',
      description: cleanDesc || '',
      date: format(dt, 'yyyy-MM-dd'),
      time: format(dt, 'HH:mm'),
      venue: event.venue || '',
      registration_link: event.registration_link || '',
      banner_url: event.banner_url || '',
      capacity: capacity || ''
    })
    setShowAddModal(true)
  }

  const cats = ['All', 'Career', 'Academic', 'Cultural', 'Social', 'Sports']

  const filtered = events.filter((e: any) => {
    const dt = parseISO(e.start_time)
    if (filter === 'upcoming' && isBefore(dt, now)) return false
    if (filter === 'past' && isAfter(dt, now)) return false
    if (cat !== 'All' && e.category !== cat) return false
    return true
  })

  const upcoming = filtered.filter((e: any) => isAfter(parseISO(e.start_time), now))
  const past = filtered.filter((e: any) => isBefore(parseISO(e.start_time), now))

  const renderEvent = (e: Event) => {
    const dt = parseISO(e.start_time)
    const isPast = isBefore(dt, now)
    const isIn = interested.includes(e.id)
    const color = CAT_COLORS[e.category] || { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' }
    const { capacity, description: cleanDesc } = parseEventDescription(e.description)

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={e.id}
        id={`event-${e.id}`}
        className="card-premium overflow-hidden group"
      >
        <div className="h-1.5" style={{ background: isPast ? 'rgba(70,69,85,0.5)' : `linear-gradient(90deg, ${color.text}, transparent)` }} />
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className={clsx(
              "w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-105 shadow-lg",
              isPast ? "bg-zinc-900 border-white/5" : "bg-white/[0.03] border-white/[0.08]"
            )}>
              <span className={clsx("text-[10px] font-mono font-bold uppercase", isPast ? "text-zinc-600" : "text-brand-400")}>
                {format(dt, 'MMM')}
              </span>
              <span className={clsx("text-2xl font-display font-bold", isPast ? "text-zinc-500" : "text-zinc-50")}>
                {format(dt, 'd')}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                   <span className="chip-pro text-[9px] font-mono py-0.5" style={{ background: color.bg, borderColor: `${color.text}30`, color: color.text }}>
                    {e.category}
                  </span>
                  {isIn && <span className="chip-pro text-[9px] font-mono py-0.5 bg-brand-500/10 border-brand-500/20 text-brand-400 flex items-center gap-1"><Check size={10} /> GOING</span>}
                </div>
                <h3 className={clsx("display-heading text-xl tracking-tight group-hover:text-brand-400 transition-colors", isPast && "opacity-50")}>
                  {e.title}
                </h3>
              </div>

              <div className="flex items-center gap-4 flex-wrap text-zinc-500">
                <span className="flex items-center gap-1.5 text-xs font-mono">
                  <Clock className="text-zinc-600" size={16} />
                  {format(dt, 'h:mm a')}
                </span>
                {e.venue && (
                  <span className="flex items-center gap-1.5 text-xs font-mono">
                    <MapPin className="text-zinc-600" size={16} />
                    {e.venue}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-mono">
                  <Users className="text-zinc-600" size={16} />
                  {e.attendee_count}{capacity ? ` / ${capacity}` : ''} attending
                </span>
              </div>

              {cleanDesc && (
                <p className="body-pro text-[13px] line-clamp-2 max-w-2xl whitespace-pre-wrap">{cleanDesc}</p>
              )}

              <div className="flex items-center justify-between pt-2 flex-wrap gap-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-3">
                  {!isPast ? (
                    <>
                      <button
                        onClick={() => handleToggleRSVP(e.id)}
                        className={clsx(
                          "btn-ghost-pro py-1.5 px-4 text-xs flex items-center gap-2",
                          isIn ? "bg-brand-500/10 text-brand-400 border-brand-500/30" : "hover:bg-brand-500/5"
                        )}
                      >
                        <DynamicIcon name={isIn ? 'check_circle' : 'add_circle'} size={16} />
                        {isIn ? 'Attending' : 'RSVP'}
                      </button>
                      {e.registration_link && (
                        <a href={e.registration_link} target="_blank" rel="noopener noreferrer" className="btn-premium py-1.5 px-4 text-xs">
                          Register
                        </a>
                      )}
                    </>
                  ) : (
                    <span className="text-xs font-mono text-zinc-600 italic">This event has ended</span>
                  )}
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/events?id=${e.id}`
                      navigator.clipboard.writeText(url)
                      toast.success('Event link copied to clipboard!')
                    }}
                    className="btn-ghost-pro py-1.5 px-4 text-xs flex items-center gap-2 hover:bg-white/5"
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(evt) => handleEditClick(evt, e)}
                      className="btn-ghost-pro py-1.5 px-3 text-xs flex items-center gap-1.5 text-zinc-400 hover:text-white"
                    >
                      <Edit size={13} />
                      Edit
                    </button>
                    <button 
                      onClick={(evt) => { evt.stopPropagation(); handleDeleteEvent(e.id) }}
                      className="btn-ghost-pro py-1.5 px-3 text-xs flex items-center gap-1.5 text-red-400 hover:bg-red-500/10 border-red-500/20 hover:text-red-300"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="animate-fade-in space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <header className="space-y-1">
          <p className="section-label">Campus Calendar</p>
          <h1 className="display-heading text-4xl">Events</h1>
          <p className="body-pro text-sm">Discover and register for upcoming university events.</p>
        </header>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingEvent(null)
              setForm({
                title: '', category: 'Academic', description: '', date: '', time: '',
                venue: '', registration_link: '', banner_url: '', capacity: ''
              })
              setShowAddModal(true)
            }}
            className="btn-premium flex items-center gap-2 py-2.5 px-5 text-xs shrink-0"
          >
            <Plus size={14} />
            Create Event
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          {(['upcoming', 'past', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={clsx(
                "px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all",
                filter === f ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-x-auto no-scrollbar max-w-full">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs font-mono tracking-tighter whitespace-nowrap transition-all",
                cat === c ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon="event_busy"
          title="No events scheduled yet"
          description="We couldn't find any events scheduled matching your selected category or timeframe."
          action={
            isAdmin 
              ? {
                  label: "Create Event",
                  onClick: () => {
                    setEditingEvent(null)
                    setForm({
                      title: '', category: 'Academic', description: '', date: '', time: '',
                      venue: '', registration_link: '', banner_url: '', capacity: ''
                    })
                    setShowAddModal(true)
                  }
                }
              : {
                  label: "Browse Events",
                  onClick: () => { setCat('All'); setFilter('upcoming') }
                }
          }
        />
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filtered.map(renderEvent)}
          </AnimatePresence>
        </div>
      )}

      {/* Admin Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setShowAddModal(false)} />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
              className="card-premium max-w-lg w-full relative z-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto bg-[#090d16]"
            >
              <form onSubmit={handleSaveEvent} className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="display-heading text-xl">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
                  <button type="button" onClick={()=>setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white">
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Event Name</label>
                      <input 
                        value={form.title} 
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="Hackathon 2026"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Event Type</label>
                      <select 
                        value={form.category} 
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full bg-[#030712]/95 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                      >
                        {cats.slice(1).map(x => <option key={x} value={x} className="bg-[#030712]">{x}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Date</label>
                      <input 
                        type="date"
                        value={form.date} 
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Time</label>
                      <input 
                        type="time"
                        value={form.time} 
                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Venue</label>
                      <input 
                        value={form.venue} 
                        onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="Seminar Hall A"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Capacity</label>
                      <input 
                        value={form.capacity} 
                        onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Registration Link</label>
                      <input 
                        value={form.registration_link} 
                        onChange={e => setForm(f => ({ ...f, registration_link: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Poster URL</label>
                      <input 
                        value={form.banner_url} 
                        onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))}
                        className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Event Description</label>
                    <textarea 
                      value={form.description} 
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none h-24 resize-none"
                      placeholder="Enter event details, guidelines, and agenda..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={()=>setShowAddModal(false)} className="btn-ghost-pro flex-1 py-3 justify-center text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="btn-premium flex-1 py-3 justify-center text-xs">
                    Save Event
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
