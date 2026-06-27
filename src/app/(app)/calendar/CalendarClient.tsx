'use client'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const CAT_COLORS: Record<string,string> = { Academic:'#c3c0ff', Technical:'#4cd7f6', Social:'#d0bcff', Placements:'#86efac', Sports:'#fbbf24', Cultural:'#f472b6' }

export default function CalendarClient({ events, userId }: any) {
  const allEvents = events
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date|null>(null)
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

  // Pad start
  const startPad = monthStart.getDay()
  const paddingDays = Array(startPad).fill(null)

  function getEventsForDay(day:Date) {
    return allEvents.filter((e:any) => isSameDay(new Date(e.start_time), day))
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
    setNewEvent({ title:'', start_time:'', venue:'', category:'Academic', description:'' })
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Academic Calendar</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Events, exams, fests and important dates</p>
        </div>
        <button onClick={()=>setShowAddEvent(!showAddEvent)} className="btn-primary text-sm">
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {showAddEvent && (
        <div className="card-premium p-5 space-y-3">
          <h2 className="font-display font-semibold text-on-surface">New Event</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="section-label block mb-1">TITLE *</label><input className="input-glass" placeholder="Event name" value={newEvent.title} onChange={e=>setNewEvent(p=>({...p,title:e.target.value}))} /></div>
            <div><label className="section-label block mb-1">DATE & TIME *</label><input type="datetime-local" className="input-glass" value={newEvent.start_time} onChange={e=>setNewEvent(p=>({...p,start_time:e.target.value}))} /></div>
            <div><label className="section-label block mb-1">VENUE</label><input className="input-glass" placeholder="Location" value={newEvent.venue} onChange={e=>setNewEvent(p=>({...p,venue:e.target.value}))} /></div>
            <div><label className="section-label block mb-1">CATEGORY</label>
              <select className="input-glass" value={newEvent.category} onChange={e=>setNewEvent(p=>({...p,category:e.target.value}))}>
                {Object.keys(CAT_COLORS).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="section-label block mb-1">DESCRIPTION</label><input className="input-glass" value={newEvent.description} onChange={e=>setNewEvent(p=>({...p,description:e.target.value}))} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setShowAddEvent(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={addEvent} className="btn-primary text-sm">Add Event</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Calendar */}
        <div className="col-span-8 card-premium p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={()=>setCurrentMonth(subMonths(currentMonth,1))} className="w-11 h-11 md:w-8 md:h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] text-on-surface-variant hover:text-on-surface transition-colors" aria-label="Previous month">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-display font-bold text-on-surface">{format(currentMonth,'MMMM yyyy')}</h2>
            <button onClick={()=>setCurrentMonth(addMonths(currentMonth,1))} className="w-11 h-11 md:w-8 md:h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] text-on-surface-variant hover:text-on-surface transition-colors" aria-label="Next month">
              <ChevronRight size={20} />
            </button>
          </div>
          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
              <div key={d} className="text-center text-xs font-mono text-on-surface-variant py-1">{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_,i)=><div key={`pad-${i}`} />)}
            {days.map(day=>{
              const dayEvents = getEventsForDay(day)
              const selected = selectedDay && isSameDay(day, selectedDay)
              const todayDay = isToday(day)
              return (
                <button key={day.toISOString()} onClick={()=>setSelectedDay(isSameDay(day,selectedDay||new Date(0))?null:day)}
                  className="aspect-square flex flex-col items-center justify-start p-1 rounded-lg text-xs transition-all hover:bg-white/[0.06]"
                  style={selected?{background:'rgba(79,70,229,0.35)',border:'1px solid rgba(195,192,255,0.3)'}:todayDay?{background:'rgba(76,215,246,0.1)',border:'1px solid rgba(76,215,246,0.3)'}:{border:'1px solid transparent'}}>
                  <span className={`font-mono text-xs ${todayDay?'text-tertiary font-bold':isSameMonth(day,currentMonth)?'text-on-surface':'text-on-surface-variant'}`}>
                    {format(day,'d')}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0,3).map((e:any,i:number)=>(
                      <div key={i} className="w-1 h-1 rounded-full" style={{background:CAT_COLORS[e.category]||'#c7c4d8'}} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          {selectedDay && (
            <div className="card-premium p-4">
              <h3 className="font-display font-semibold text-on-surface text-sm mb-3">{format(selectedDay,'d MMMM yyyy')}</h3>
              {selectedDayEvents.length===0 ? (
                <p className="text-xs text-on-surface-variant">No events on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((e:any)=>{
                    const color = CAT_COLORS[e.category]||'#c7c4d8'
                    return (
                      <div key={e.id} className="p-3 rounded-lg" style={{background:`${color}10`,border:`1px solid ${color}20`}}>
                        <p className="text-sm font-semibold text-on-surface">{e.title}</p>
                        {e.venue && <p className="text-xs text-on-surface-variant font-mono mt-0.5">📍 {e.venue}</p>}
                        <span className="chip text-[10px] mt-1" style={{background:`${color}15`,color,border:`1px solid ${color}25`}}>{e.category}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="card-premium p-4">
            <h3 className="font-display font-semibold text-on-surface text-sm mb-3">Upcoming Events</h3>
            <div className="space-y-3">
              {allEvents.slice(0,5).map((e:any)=>{
                const color = CAT_COLORS[e.category]||'#c7c4d8'
                return (
                  <div key={e.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 flex flex-col items-center justify-center" style={{background:`${color}18`,border:`1px solid ${color}30`}}>
                      <span className="text-[9px] font-mono" style={{color}}>{format(new Date(e.start_time),'MMM')}</span>
                      <span className="text-xs font-display font-bold text-on-surface">{format(new Date(e.start_time),'d')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">{e.title}</p>
                      {e.venue && <p className="text-[10px] text-on-surface-variant font-mono">{e.venue}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="card-premium p-4">
            <h3 className="section-label mb-2">CATEGORIES</h3>
            <div className="space-y-1.5">
              {Object.entries(CAT_COLORS).map(([cat,color])=>(
                <div key={cat} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{background:color}} />
                  <span className="text-xs text-on-surface-variant">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
