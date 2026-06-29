'use client'
import { Check, Clock, MapPin, Users, Plus, Edit, Trash2, X, Calendar as CalendarIcon, Share2, ChevronLeft, ChevronRight, Award, Compass } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { useState, useEffect } from 'react'
import { format, isAfter, isBefore, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, formatDistanceToNow } from 'date-fns'
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

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Career: { bg: 'rgba(34,211,238,0.06)', text: '#22d3ee', border: 'rgba(34,211,238,0.15)' },
  Academic: { bg: 'rgba(99,102,241,0.06)', text: '#6366f1', border: 'rgba(99,102,241,0.15)' },
  Cultural: { bg: 'rgba(139,92,246,0.06)', text: '#8b5cf6', border: 'rgba(139,92,246,0.15)' },
  Social: { bg: 'rgba(236,72,153,0.06)', text: '#ec4899', border: 'rgba(236,72,153,0.15)' },
  Sports: { bg: 'rgba(239,68,68,0.06)', text: '#ef4444', border: 'rgba(239,68,68,0.15)' },
}

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

function CountdownTimer({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    const target = new Date(startTime).getTime()
    
    function update() {
      const now = new Date().getTime()
      const diff = target - now
      
      if (diff <= 0) {
        // If event started less than 3 hours ago, call it live
        if (diff > -10800000) {
          setIsLive(true)
          setTimeLeft('LIVE NOW')
        } else {
          setIsLive(false)
          setTimeLeft('Ended')
        }
        return
      }

      setIsLive(false)
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`)
      } else {
        setTimeLeft(`${minutes}m left`)
      }
    }

    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [startTime])

  return (
    <span className={clsx(
      "text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5",
      isLive 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 animate-pulse" 
        : timeLeft === 'Ended' 
          ? "bg-zinc-800 text-zinc-500 border border-white/[0.04]"
          : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
    )}>
      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />}
      {timeLeft}
    </span>
  )
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
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>(dbEvents)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [cat, setCat] = useState('All')
  const [interested, setInterested] = useState<string[]>(initialRSVPs)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  const now = new Date()
  const isAdmin = profile?.role?.toUpperCase() === 'SUPER_ADMIN' || profile?.role?.toUpperCase() === 'ADMIN'

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      if (id) {
        setSelectedEventId(id)
      }
    }
  }, [events])

  const handleBack = () => {
    setSelectedEventId(null)
    router.push('/events')
  }

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

  // Auto-scroll/highlight event
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
            el.classList.add('ring-1', 'ring-indigo-500', 'border-indigo-500/50')
            setTimeout(() => {
              el.classList.remove('ring-1', 'ring-indigo-500', 'border-indigo-500/50')
            }, 5000)
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
      else {
        setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, attendee_count: Math.max(0, ev.attendee_count - 1) } : ev))
        toast.success('RSVP removed')
      }
    } else {
      const { error } = await supabase.from('event_attendees').insert({ event_id: eventId, user_id: currentUserId })
      if (error) { toast.error('Failed to RSVP'); setInterested(prev => prev.filter(id => id !== eventId)) }
      else {
        setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, attendee_count: ev.attendee_count + 1 } : ev))
        toast.success('RSVP confirmed!')
      }
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
    if (selectedDate && !isSameDay(dt, selectedDate)) return false
    return true
  })

  // Calendar rendering helpers
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Find if a day has events
  const getDayEvents = (day: Date) => {
    return events.filter(e => isSameDay(parseISO(e.start_time), day))
  }

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null

  return (
    <div className="space-y-8 pb-24 text-zinc-50">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.04] pb-6">
        <div className="glass-page-header flex-1 space-y-2">
          <p className="section-label text-brand-400">Campus Calendar</p>
          <h1 className="display-heading text-4xl">
            Events Hub
          </h1>
          <p className="body-pro text-sm">Discover academic conferences, hackathons, and cultural activities happening around you.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-zinc-900/60 border border-white/[0.05] text-[11px] font-mono uppercase tracking-wider">
            <button 
              onClick={() => { setViewMode('list'); setSelectedDate(null) }}
              className={clsx("px-3.5 py-1.5 rounded-lg transition-all", viewMode === 'list' ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300")}
            >
              List View
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={clsx("px-3.5 py-1.5 rounded-lg transition-all", viewMode === 'calendar' ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300")}
            >
              Calendar layout
            </button>
          </div>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingEvent(null)
                setForm({
                  title: '', category: 'Academic', description: '', date: '', time: '',
                  venue: '', registration_link: '', banner_url: '', capacity: ''
                })
                setShowAddModal(true)
              }}
              className="btn-premium py-2.5 px-5 text-xs font-semibold rounded-xl flex items-center gap-2"
            >
              <Plus size={16} />
              Create Event
            </motion.button>
          )}
        </div>
      </header>

      {/* Main Grid View Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Middle: Listings or Interactive Calendar Grid */}
        <div className={clsx("space-y-6", viewMode === 'calendar' ? "lg:col-span-8" : "lg:col-span-12")}>
          {viewMode === 'calendar' ? (
            <div className="card-premium p-6 bg-zinc-900/20 border-white/[0.06] shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="text-indigo-400" size={18} />
                  <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-300 font-bold">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-lg border border-white/[0.05] hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-lg border border-white/[0.05] hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Monthly calendar structure */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider pb-2 border-b border-white/[0.04]">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {/* Empty days padding for first week */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square bg-transparent rounded-lg" />
                ))}
                
                {daysInMonth.map((day) => {
                  const dayEvs = getDayEvents(day)
                  const isToday = isSameDay(day, new Date())
                  const isSel = selectedDate && isSameDay(day, selectedDate)
                  
                  return (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedDate(isSel ? null : day)}
                      key={day.toString()}
                      className={clsx(
                        "aspect-square rounded-xl p-1.5 flex flex-col justify-between cursor-pointer border relative transition-all duration-200",
                        isSel 
                          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200 shadow-md"
                          : isToday
                            ? "bg-zinc-900 border-white/[0.12] text-zinc-50 font-bold"
                            : "bg-white/[0.01] border-white/[0.04] text-zinc-400 hover:border-white/[0.08]"
                      )}
                    >
                      <span className="text-xs font-mono font-semibold">{format(day, 'd')}</span>
                      
                      {dayEvs.length > 0 && (
                        <div className="flex gap-1 justify-center flex-wrap pb-0.5">
                          {dayEvs.slice(0, 3).map(e => {
                            const colors = CAT_COLORS[e.category] || { text: '#a1a1aa' }
                            return (
                              <span 
                                key={e.id} 
                                className="w-1.5 h-1.5 rounded-full" 
                                style={{ backgroundColor: colors.text }} 
                                title={`${e.title} (${e.category})`}
                              />
                            )
                          })}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
              
              {selectedDate && (
                <div className="flex items-center justify-between bg-zinc-950/40 border border-white/[0.04] p-3.5 rounded-xl text-xs">
                  <span className="text-zinc-400">
                    Showing events for <strong className="text-zinc-200">{format(selectedDate, 'do MMMM yyyy')}</strong>
                  </span>
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className="text-[10px] uppercase font-mono text-zinc-500 hover:text-white"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Filtering bar (standard) */}
          <div className="bg-zinc-900/20 border border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
            <div className="flex gap-1 p-1 rounded-xl bg-zinc-950/60 border border-white/[0.04] overflow-x-auto w-full md:w-auto no-scrollbar">
              {(['upcoming', 'past', 'all'] as const).map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-all",
                    filter === f ? "bg-white/[0.08] text-white shadow-sm font-semibold" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-zinc-950/60 border border-white/[0.04] overflow-x-auto w-full md:w-auto no-scrollbar">
              {cats.map(c => (
                <button 
                  key={c} 
                  onClick={() => setCat(c)}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-[10px] font-mono tracking-tighter whitespace-nowrap transition-all",
                    cat === c ? "bg-white/[0.08] text-white shadow-sm font-semibold" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Event Listing Grid */}
          {filtered.length === 0 ? (
            <EmptyState 
              icon="event"
              title="No events matching filters"
              description="Check back later or change your selected category, date, or timeframe filters."
              action={
                isAdmin 
                  ? {
                      label: "Create New Event",
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
                      label: "Browse Upcoming",
                      onClick: () => { setCat('All'); setFilter('upcoming'); setSelectedDate(null) }
                    }
              }
            />
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((e) => {
                  const dt = parseISO(e.start_time)
                  const isPast = isBefore(dt, now)
                  const isIn = interested.includes(e.id)
                  const color = CAT_COLORS[e.category] || { bg: 'rgba(99,102,241,0.06)', text: '#6366f1', border: 'rgba(99,102,241,0.15)' }
                  const { capacity, description: cleanDesc } = parseEventDescription(e.description)
                  const capNumber = capacity ? parseInt(capacity.replace(/[^0-9]/g, '')) : 0

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      key={e.id}
                      id={`event-${e.id}`}
                      className="card-premium overflow-hidden flex flex-col justify-between h-[390px] border-white/[0.06] bg-zinc-900/20"
                      onClick={() => setSelectedEventId(e.id)}
                    >
                      <div>
                        {/* Event visual header / banner */}
                        <div className="h-32 relative bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-white/[0.04]">
                          {e.banner_url ? (
                            <img src={e.banner_url} alt={e.title} className="object-cover w-full h-full opacity-60 transition-transform duration-700 hover:scale-105" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900/40 to-indigo-950/20" />
                          )}
                          
                          <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <span 
                              className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase border"
                              style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                            >
                              {e.category}
                            </span>
                            {isIn && (
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                                Going
                              </span>
                            )}
                          </div>

                          <div className="absolute top-4 right-4 z-10">
                            <CountdownTimer startTime={e.start_time} />
                          </div>

                          <div className="absolute bottom-4 left-4 z-10 flex gap-2 items-center">
                            <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center w-12 h-12">
                              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase leading-none">{format(dt, 'MMM')}</span>
                              <span className="text-lg font-display font-extrabold text-white leading-none mt-1">{format(dt, 'd')}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-mono text-zinc-400 font-bold">{format(dt, 'EEEE')}</p>
                              <p className="text-[9px] font-mono text-zinc-600 uppercase">{format(dt, 'h:mm a')}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          <h3 className="text-base font-bold text-white tracking-tight leading-snug line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            {e.title}
                          </h3>
                          {cleanDesc && (
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                              {cleanDesc}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Details Footer */}
                      <div className="px-5 pb-5 pt-4 border-t border-white/[0.04] bg-zinc-950/20 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                          <span className="flex items-center gap-1 truncate max-w-[150px]">
                            <MapPin size={12} className="text-zinc-600" />
                            {e.venue || 'TBA'}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Users size={12} className="text-zinc-600" />
                            {e.attendee_count} {capNumber ? `/ ${capNumber}` : ''} attending
                          </span>
                        </div>

                        {/* Capacity meter */}
                        {capNumber > 0 && (
                          <div className="space-y-1">
                            <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.02]">
                              <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, (e.attendee_count / capNumber) * 100)}%` }} 
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={(evt) => { evt.stopPropagation(); handleToggleRSVP(e.id) }}
                            disabled={isPast}
                            className={clsx(
                              "px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all active:scale-95",
                              isPast
                                ? "bg-transparent border-white/[0.03] text-zinc-600 cursor-not-allowed"
                                : isIn
                                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                                  : "bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-white"
                            )}
                          >
                            {isPast ? 'Ended' : isIn ? '✓ Going' : 'RSVP'}
                          </button>

                          {isAdmin && (
                            <div className="flex items-center gap-1.5" onClick={evt => evt.stopPropagation()}>
                              <button 
                                onClick={(evt) => handleEditClick(evt, e)}
                                className="p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={(evt) => handleDeleteEvent(e.id)}
                                className="p-1.5 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Event detail page (Side panel / overlay) */}
      <AnimatePresence>
        {selectedEvent && (() => {
          const dt = parseISO(selectedEvent.start_time)
          const isPast = isBefore(dt, now)
          const isIn = interested.includes(selectedEvent.id)
          const color = CAT_COLORS[selectedEvent.category] || { bg: 'rgba(99,102,241,0.06)', text: '#6366f1', border: 'rgba(99,102,241,0.15)' }
          const { capacity, description: cleanDesc } = parseEventDescription(selectedEvent.description)
          const capNumber = capacity ? parseInt(capacity.replace(/[^0-9]/g, '')) : 0

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setSelectedEventId(null)}
              />
              <motion.div 
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="card-premium h-full max-w-lg w-full relative z-10 overflow-hidden shadow-2xl bg-zinc-950 border-white/[0.08] flex flex-col justify-between"
              >
                {/* Visual Header */}
                <div className="overflow-y-auto custom-scrollbar flex-1 pb-10">
                  <div className="h-64 relative bg-zinc-950 flex items-center justify-center border-b border-white/[0.04]">
                    {selectedEvent.banner_url ? (
                      <img src={selectedEvent.banner_url} alt={selectedEvent.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900/60 to-indigo-950/20" />
                    )}
                    
                    <button 
                      onClick={() => setSelectedEventId(null)}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                    
                    <div className="absolute bottom-4 left-4 z-10">
                      <CountdownTimer startTime={selectedEvent.start_time} />
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border"
                          style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                        >
                          {selectedEvent.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-white/[0.03] border border-white/[0.08] text-zinc-400">
                          {isPast ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>
                      <h2 className="display-heading text-2xl font-bold tracking-tight text-white leading-tight">{selectedEvent.title}</h2>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 space-y-4 shadow-inner">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-zinc-400">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Date & Time</p>
                          <p className="text-sm font-semibold text-zinc-200 mt-1">{format(dt, 'do MMMM yyyy')}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{format(dt, 'h:mm a')} ({formatDistanceToNow(dt, {addSuffix: true})})</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-zinc-400">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Location / Venue</p>
                          <p className="text-sm font-semibold text-zinc-200 mt-1">{selectedEvent.venue || 'To Be Announced'}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Physical location on campus</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {cleanDesc && (
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">About the event</h4>
                        <p className="body-pro text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                          {cleanDesc}
                        </p>
                      </div>
                    )}

                    {/* Organizer Section */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Organizer</h4>
                      <div className="flex items-center gap-3.5 p-3 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold">
                          <Award size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">University Campus Committee</p>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">IILM Campus Administrator</p>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Indicator / Registration Card */}
                    {capNumber > 0 && (
                      <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono uppercase text-zinc-500 font-bold">
                          <span>REGISTRATION PROGRESS</span>
                          <span>{selectedEvent.attendee_count} / {capNumber} Filled</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.02]">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (selectedEvent.attendee_count / capNumber) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="px-6 py-4 border-t border-white/[0.04] bg-zinc-950 flex gap-3 shrink-0">
                  <button
                    onClick={() => handleToggleRSVP(selectedEvent.id)}
                    disabled={isPast}
                    className={clsx(
                      "btn-ghost-pro flex-1 py-3 justify-center text-xs font-semibold rounded-xl",
                      isIn ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : ""
                    )}
                  >
                    {isPast ? 'Event ended' : isIn ? '✓ Registered' : 'RSVP / Express Interest'}
                  </button>
                  
                  {selectedEvent.registration_link && !isPast && (
                    <a 
                      href={selectedEvent.registration_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-premium flex-1 py-3 justify-center text-xs font-semibold rounded-xl"
                    >
                      Official Register <Share2 size={12} className="ml-1.5" />
                    </a>
                  )}

                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/events?id=${selectedEvent.id}`
                      navigator.clipboard.writeText(url)
                      toast.success('Event link copied to clipboard!')
                    }}
                    className="p-3 rounded-xl border border-white/[0.08] hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    title="Share event link"
                  >
                    <Share2 size={16} />
                  </button>
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
            <motion.div 
              initial={{opacity:0, scale:0.96, y:15}} 
              animate={{opacity:1, scale:1, y:0}} 
              exit={{opacity:0, scale:0.96, y:15}} 
              className="card-premium max-w-lg w-full relative z-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-white/[0.08]"
            >
              <form onSubmit={handleSaveEvent} className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="display-heading text-xl font-bold text-white">{editingEvent ? 'Edit Event Details' : 'Publish Campus Event'}</h2>
                  <button type="button" onClick={()=>setShowAddModal(false)} className="p-1 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Event Title</label>
                      <input 
                        value={form.title} 
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="e.g. Hackfest 2026"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Category</label>
                      <select 
                        value={form.category} 
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60 appearance-none cursor-pointer"
                      >
                        {cats.slice(1).map(x => <option key={x} value={x} className="bg-zinc-950">{x}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Date</label>
                      <input 
                        type="date"
                        value={form.date} 
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Time</label>
                      <input 
                        type="time"
                        value={form.time} 
                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Venue / Room</label>
                      <input 
                        value={form.venue} 
                        onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="e.g. Main Auditorium"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Capacity</label>
                      <input 
                        value={form.capacity} 
                        onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="e.g. 150"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Registration Link (Optional)</label>
                      <input 
                        value={form.registration_link} 
                        onChange={e => setForm(f => ({ ...f, registration_link: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Poster / Banner Image URL</label>
                      <input 
                        value={form.banner_url} 
                        onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))}
                        className="input-pro w-full bg-zinc-900/60"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Description</label>
                    <textarea 
                      value={form.description} 
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="input-pro w-full bg-zinc-900/60 h-28 resize-none py-2"
                      placeholder="Detail guidelines, schedule, registration fee, rewards, or other agenda items..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-white/[0.04]">
                  <button type="button" onClick={()=>setShowAddModal(false)} className="btn-ghost-pro flex-1 py-3 justify-center text-xs font-semibold rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" className="btn-premium flex-1 py-3 justify-center text-xs font-semibold rounded-xl">
                    Publish Event
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
