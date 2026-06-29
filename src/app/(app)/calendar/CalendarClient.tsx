'use client'
import { ChevronLeft, ChevronRight, Plus, X, Calendar, MapPin, Clock, Tag } from 'lucide-react'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

const CAT_COLORS: Record<string, string> = {
  Academic: '#6366f1',
  Technical: '#22d3ee',
  Social: '#8b5cf6',
  Placements: '#4ade80',
  Sports: '#fbbf24',
  Cultural: '#f472b6'
}

const CAT_BG: Record<string, string> = {
  Academic: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  Technical: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  Social: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  Placements: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  Sports: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  Cultural: 'bg-pink-500/10 border-pink-500/20 text-pink-400'
}

export default function CalendarClient({ events, userId }: any) {
  const allEvents = events
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    start_time: '',
    venue: '',
    category: 'Academic',
    description: ''
  })
  const supabase = createClient()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const startPad = monthStart.getDay()
  const paddingDays = Array(startPad).fill(null)

  function getEventsForDay(day: Date) {
    return allEvents.filter((e: any) => isSameDay(new Date(e.start_time), day))
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  async function addEvent() {
    if (!newEvent.title || !newEvent.start_time) { toast.error('Fill title and date'); return }
    const eventData = {
      title: newEvent.title,
      start_time: newEvent.start_time,
      venue: newEvent.venue,
      category: newEvent.category,
      description: newEvent.description,
      organizer_id: userId,
    }

    const { error } = await (supabase as any)
      .from('events')
      .insert([eventData])
    if (error) { toast.error('Failed to add event'); return }
    toast.success('Event added!')
    setShowAddEvent(false)
    setNewEvent({ title: '', start_time: '', venue: '', category: 'Academic', description: '' })
  }

  const upcomingEvents = [...allEvents]
    .filter((e: any) => new Date(e.start_time) >= new Date())
    .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 6)

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="glass-page-header flex-1 space-y-2">
          <p className="section-label">Academic Schedule</p>
          <h1 className="display-heading text-4xl">Campus Calendar</h1>
          <p className="body-pro text-sm">Events, exams, fests and important dates.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddEvent(!showAddEvent)}
          className="btn-premium px-6 self-start md:self-auto shrink-0"
        >
          <Plus size={18} />
          Add Event
        </motion.button>
      </header>

      {/* Add Event Form */}
      <AnimatePresence>
        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card-premium p-6 space-y-5 bg-brand-500/[0.02]">
              <div className="flex items-center justify-between">
                <h2 className="sub-heading text-lg">New Event</h2>
                <button onClick={() => setShowAddEvent(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="section-label block px-1">EVENT TITLE *</label>
                  <input className="input-pro" placeholder="Event name" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="section-label block px-1">DATE & TIME *</label>
                  <input type="datetime-local" className="input-pro" value={newEvent.start_time} onChange={e => setNewEvent(p => ({ ...p, start_time: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="section-label block px-1">VENUE</label>
                  <input className="input-pro" placeholder="Location or online link" value={newEvent.venue} onChange={e => setNewEvent(p => ({ ...p, venue: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="section-label block px-1">CATEGORY</label>
                  <select className="input-pro appearance-none cursor-pointer" value={newEvent.category} onChange={e => setNewEvent(p => ({ ...p, category: e.target.value }))}>
                    {Object.keys(CAT_COLORS).map(c => <option key={c} className="bg-zinc-900">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="section-label block px-1">DESCRIPTION</label>
                  <input className="input-pro" placeholder="Optional notes" value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddEvent(false)} className="btn-ghost-pro px-6">Cancel</button>
                <button onClick={addEvent} className="btn-premium px-8">Add Event</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 card-premium p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-100 transition-all border border-white/[0.05] hover:border-white/[0.1]"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-bold text-white text-lg tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-100 transition-all border border-white/[0.05] hover:border-white/[0.1]"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest py-2">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const dayEvents = getEventsForDay(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const isTodayDay = isToday(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay || new Date(0)) ? null : day)}
                  className={clsx(
                    "aspect-square flex flex-col items-center justify-start p-1.5 rounded-xl text-xs transition-all hover:bg-white/[0.05]",
                    isSelected && "bg-brand-500/20 border border-brand-500/30",
                    isTodayDay && !isSelected && "bg-cyan-500/5 border border-cyan-500/20",
                    !isSelected && !isTodayDay && "border border-transparent"
                  )}
                >
                  <span className={clsx(
                    "font-mono text-xs leading-none mb-1",
                    isTodayDay ? "text-cyan-400 font-bold" :
                    isCurrentMonth ? "text-zinc-200" : "text-zinc-700"
                  )}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((e: any, i: number) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: CAT_COLORS[e.category] || '#a1a1aa' }}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Day Events */}
          <AnimatePresence>
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="card-premium p-5"
              >
                <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                  <Calendar size={14} className="text-brand-400" />
                  {format(selectedDay, 'd MMMM yyyy')}
                </h3>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic text-center py-4">No events on this day.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDayEvents.map((e: any) => (
                      <div
                        key={e.id}
                        className="p-3.5 rounded-xl border"
                        style={{
                          background: `${CAT_COLORS[e.category] || '#a1a1aa'}08`,
                          borderColor: `${CAT_COLORS[e.category] || '#a1a1aa'}20`
                        }}
                      >
                        <p className="text-sm font-semibold text-white mb-1">{e.title}</p>
                        {e.venue && (
                          <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                            <MapPin size={10} /> {e.venue}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={clsx("text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", CAT_BG[e.category])}
                          >
                            {e.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upcoming Events */}
          <div className="card-premium p-5">
            <h3 className="section-label mb-4 flex items-center gap-2">
              <Clock size={11} /> UPCOMING EVENTS
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-zinc-600 italic text-center py-4">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((e: any) => {
                  const color = CAT_COLORS[e.category] || '#a1a1aa'
                  return (
                    <div key={e.id} className="flex gap-3 group">
                      <div
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center justify-center border"
                        style={{ background: `${color}10`, borderColor: `${color}20` }}
                      >
                        <span className="text-[8px] font-mono font-bold uppercase" style={{ color }}>
                          {format(new Date(e.start_time), 'MMM')}
                        </span>
                        <span className="text-sm font-bold text-white leading-none">
                          {format(new Date(e.start_time), 'd')}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-brand-400 transition-colors">{e.title}</p>
                        {e.venue && <p className="text-[10px] text-zinc-600 font-mono truncate mt-0.5">{e.venue}</p>}
                        <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                          {format(new Date(e.start_time), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Category Legend */}
          <div className="card-premium p-5">
            <h3 className="section-label mb-4 flex items-center gap-2">
              <Tag size={11} /> CATEGORIES
            </h3>
            <div className="space-y-2">
              {Object.entries(CAT_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-zinc-400">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
