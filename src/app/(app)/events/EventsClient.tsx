'use client'
import { Check, Clock, MapPin, Users } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/DynamicIcon'

import { useState } from 'react'
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
  Sports: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
}

export default function EventsClient({ 
  events: dbEvents, 
  currentUserId,
  initialRSVPs = [] 
}: { 
  events: Event[]; 
  currentUserId: string;
  initialRSVPs?: string[];
}) {
  const supabase: any = createClient()
  const events = dbEvents
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [cat, setCat] = useState('All')
  const [interested, setInterested] = useState<string[]>(initialRSVPs)
  const now = new Date()

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

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={e.id} 
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
                  {e.attendee_count} attending
                </span>
              </div>

              {e.description && (
                <p className="body-pro text-[13px] line-clamp-2 max-w-2xl">{e.description}</p>
              )}

              <div className="flex items-center gap-3 pt-2">
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
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="animate-fade-in space-y-8 pb-24">
      <header className="space-y-1">
        <p className="section-label">Campus Calendar</p>
        <h1 className="display-heading text-4xl">Events</h1>
        <p className="body-pro text-sm">Discover and register for upcoming university events.</p>
      </header>

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
          title="No events found"
          description="We couldn't find any events matching your selected category or timeframe."
          action={{
            label: "Reset Filters",
            onClick: () => { setCat('All'); setFilter('upcoming') }
          }}
        />
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filtered.map(renderEvent)}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
