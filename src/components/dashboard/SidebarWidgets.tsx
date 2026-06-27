'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Calendar as CalendarIcon, MessageSquare, Trophy, Briefcase, Users, MapPin, UserPlus } from 'lucide-react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Easing, getPrefersReducedMotion } from '@/hooks/useGsapMotion'

export const RightWidgetsColumn: React.FC = () => {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadWidgetsData() {
      try {
        // Fetch upcoming events
        const { data: dbEvents } = await supabase
          .from('events')
          .select('id, title, start_time, venue')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(3)
        if (dbEvents) setEvents(dbEvents)

        // Fetch recent active student profiles for recent activity
        const { data: dbProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, created_at, branch')
          .order('created_at', { ascending: false })
          .limit(2)
        if (dbProfiles) setActivities(dbProfiles)
      } catch (err) {
        console.error('Error loading right sidebar widgets data:', err)
      }
    }
    loadWidgetsData()
  }, [supabase])

  useGSAP(() => {
    if (getPrefersReducedMotion() || !containerRef.current) return
    gsap.fromTo(containerRef.current.children,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: Easing.premium }
    )
  }, { scope: containerRef, dependencies: [events, activities] })

  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const month = date.toLocaleString('default', { month: 'short' })
      const day = date.getDate()
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return { month, day, time }
    } catch {
      return { month: 'May', day: 16, time: '6:00 PM' }
    }
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Mini Calendar */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white tracking-tight">
            <CalendarIcon size={13} className="text-blue-400" />
            <span>Calendar</span>
          </div>
          <span className="text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/[0.05] px-1.5 py-0.5 rounded">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        
        <div className="grid grid-cols-7 gap-y-1 text-center text-[10px]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="font-bold text-neutral-600 text-[9px]">{d}</span>
          ))}
          {/* Weekday offset buffer */}
          {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
            <span key={`offset-${i}`} />
          ))}
          {/* Days of the month */}
          {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((day) => {
            const isToday = day === new Date().getDate()
            return (
              <span
                key={day}
                className={`py-0.5 font-bold rounded-md mx-auto w-5 h-5 flex items-center justify-center text-xs tracking-tighter ${
                  isToday ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 ring-1 ring-white/10' : 'hover:bg-white/5 text-neutral-300'
                }`}
              >
                {day}
              </span>
            )
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white tracking-tight">Upcoming Events</span>
          <Link href="/events" className="text-[10px] font-bold text-blue-400 hover:underline">View all</Link>
        </div>

        <div className="space-y-2.5">
          {events.length > 0 ? (
            events.map((evt) => {
              const { month, day, time } = formatEventDate(evt.start_time)
              return (
                <div key={evt.id} className="flex gap-2.5 items-start border-b border-white/[0.04] last:border-0 pb-2.5 last:pb-0 group cursor-pointer">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-cyan-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight truncate leading-tight">{evt.title}</p>
                    <p className="text-[10px] text-neutral-500 font-medium mt-1">{month} {day} • {time} {evt.venue ? `• ${evt.venue}` : ''}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-[10px] text-neutral-500 italic">No upcoming events scheduled.</p>
          )}
        </div>
      </div>

      {/* Campus Activity (Recent Signups) */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Trophy size={13} className="text-amber-400" />
            <span>Campus Activity</span>
          </div>
          <Link href="/discover" className="text-[10px] font-bold text-blue-400 hover:underline">View all</Link>
        </div>

        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div key={act.id} className="flex gap-2.5 items-start border-b border-white/[0.04] pb-2.5 last:border-0 last:pb-0">
                <GlobalAvatar avatarUrl={act.avatar_url} fullName={act.full_name} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-300 font-medium leading-normal">
                    <span className="font-bold text-white">{act.full_name}</span> joined the campus connection network in <span className="text-cyan-400 font-bold">{act.branch || 'General'}</span>
                  </p>
                  <span className="text-[9px] text-neutral-500 font-semibold block mt-0.5">Newly Active</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-neutral-500 italic">No recent activity logged.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export const MiddleRightWidgetsColumn: React.FC = () => {
  const supabase = createClient()
  const [internships, setInternships] = useState<any[]>([])
  const [communities, setCommunities] = useState<any[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMiddleWidgetsData() {
      try {
        // Fetch internships
        const { data: dbInterns } = await supabase
          .from('internships')
          .select('id, title, company, type')
          .limit(3)
        if (dbInterns) setInternships(dbInterns)

        // Fetch top communities
        const { data: dbComms } = await supabase
          .from('communities')
          .select('id, name, member_count')
          .order('member_count', { ascending: false })
          .limit(3)
        if (dbComms) setCommunities(dbComms)
      } catch (err) {
        console.error('Error loading middle sidebar widgets data:', err)
      }
    }
    loadMiddleWidgetsData()
  }, [supabase])

  useGSAP(() => {
    if (getPrefersReducedMotion() || !containerRef.current) return
    gsap.fromTo(containerRef.current.children,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: Easing.premium }
    )
  }, { scope: containerRef, dependencies: [internships, communities] })

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Internship Matches */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Briefcase size={13} className="text-amber-400" />
            <span>Internship Matches</span>
          </div>
          <Link href="/internships" className="text-[10px] font-bold text-blue-400 hover:underline">View all</Link>
        </div>

        <div className="space-y-2">
          {internships.length > 0 ? (
            internships.map((job) => (
              <Link href="/internships" key={job.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all cursor-pointer group">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight truncate">{job.title}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5 font-medium truncate">{job.company}</p>
                </div>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border tracking-wide text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shrink-0">
                  Live Match
                </span>
              </Link>
            ))
          ) : (
            <p className="text-[10px] text-neutral-500 italic">No active internship listings.</p>
          )}
        </div>
      </div>

      {/* Top Communities */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Users size={13} className="text-purple-400" />
            <span className="text-purple-400">Top Communities</span>
          </div>
          <Link href="/community" className="text-[10px] font-bold text-blue-400 hover:underline">View all</Link>
        </div>

        <div className="space-y-2.5">
          {communities.length > 0 ? (
            communities.map((comm, idx) => {
              const initial = comm.name.slice(0, 2).toUpperCase()
              const gradients = [
                'from-blue-600 to-indigo-600',
                'from-pink-600 to-purple-600',
                'from-cyan-600 to-blue-600'
              ]
              const grad = gradients[idx % gradients.length]
              
              return (
                <div key={comm.id} className="flex items-center justify-between group p-0.5 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} text-white text-[9px] font-black flex items-center justify-center shadow-md shrink-0`}>
                      {initial}
                    </div>
                    <div className="min-w-0 text-left">
                      <Link href={`/community/${comm.id}`} className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer tracking-tight block truncate max-w-[120px]">{comm.name}</Link>
                      <p className="text-[10px] text-neutral-500 font-medium mt-0.5 truncate">{comm.member_count} nodes</p>
                    </div>
                  </div>
                  <Link href={`/community/${comm.id}`} className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] rounded-lg transition-all tracking-wide shrink-0">
                    Join
                  </Link>
                </div>
              )
            })
          ) : (
            <p className="text-[10px] text-neutral-500 italic">No communities created yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
