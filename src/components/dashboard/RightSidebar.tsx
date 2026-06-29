import React, { useMemo } from 'react'
import { Calendar as CalendarIcon, MessageSquare, Trophy } from 'lucide-react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

// ── Tiny pure helpers (no library deps) ──────────────────────────────────────

/** Number of days in a given month (handles leap years automatically). */
function daysInMonth(year: number, month: number): number {
  // Month is 0-based (same as Date API). Day 0 of next month = last day of this month.
  return new Date(year, month + 1, 0).getDate()
}

/** 0 = Sunday, 6 = Saturday — the weekday the 1st of the month falls on. */
function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

/** "June 2026" style label from a real Date. */
function formatMonthYear(date: Date): string {
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────────────────────

export const RightSidebar: React.FC = () => {
  // Derive the real current date once per render cycle.
  // If the component is mounted across a midnight boundary,
  // the next render will automatically reflect the new day.
  const today = useMemo(() => new Date(), [])
  const todayDate  = today.getDate()
  const todayMonth = today.getMonth()   // 0-based
  const todayYear  = today.getFullYear()

  // Total days and starting offset for the current real month
  const totalDays   = daysInMonth(todayYear, todayMonth)
  const leadingBlanks = firstWeekdayOfMonth(todayYear, todayMonth)

  // Build the flat grid cells: nulls for leading blanks + day numbers 1..N
  const gridCells = useMemo(() => {
    const blanks: (null)[] = Array(leadingBlanks).fill(null)
    const days: number[]   = Array.from({ length: totalDays }, (_, i) => i + 1)
    return [...blanks, ...days] as (number | null)[]
  }, [leadingBlanks, totalDays])

  return (
    <div className="space-y-5">
      {/* ── Mini Calendar ───────────────────────────────────────────────── */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white tracking-tight">
            <CalendarIcon size={14} className="text-blue-400" />
            <span>Calendar</span>
          </div>
          {/* Dynamic month + year label — always reflects the real system date */}
          <span className="text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/[0.05] px-2 py-0.5 rounded-md">
            {formatMonthYear(today)}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-y-1.5 text-center text-[10px]">
          {/* Day-of-week headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="font-bold text-neutral-600 text-[9px] uppercase tracking-wider">{d}</span>
          ))}

          {/* Leading blank cells to align day 1 to the correct weekday column */}
          {gridCells.map((cell, idx) => {
            if (cell === null) {
              return <span key={`blank-${idx}`} />
            }
            // Highlight only the real today — evaluated from the system clock,
            // never hardcoded.
            const isCurrentDay = cell === todayDate
            return (
              <span
                key={cell}
                className={`py-0.5 font-bold rounded-lg mx-auto w-5.5 h-5.5 flex items-center justify-center text-xs tracking-tighter cursor-pointer transition-all ${
                  isCurrentDay
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 ring-1 ring-white/10'
                    : 'hover:bg-white/5 text-neutral-300 font-semibold'
                }`}
              >
                {cell}
              </span>
            )
          })}
        </div>
      </div>

      {/* ── Upcoming Events ─────────────────────────────────────────────── */}
      {/* Note: this section shows placeholder UI; real events are rendered   */}
      {/* by the dedicated Calendar page which fetches from the database.     */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white tracking-tight">Upcoming Events</span>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">View all</button>
        </div>

        <div className="space-y-3.5">
          {[
            { title: 'HackNight 2.0', time: 'Jul 10 • 6:00 PM', color: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' },
            { title: 'AI Workshop',   time: 'Jul 18 • 4:00 PM', color: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'   },
            { title: 'Design Meetup', time: 'Jul 25 • 5:30 PM', color: 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]' },
          ].map((evt, idx) => (
            <div key={idx} className="flex gap-3 items-start border-b border-white/[0.04] last:border-0 pb-3 last:pb-0 group cursor-pointer">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${evt.color}`} />
              <div>
                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight leading-tight">{evt.title}</p>
                <p className="text-[10px] text-neutral-500 font-medium mt-1">{evt.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <MessageSquare size={14} className="text-emerald-400" />
            <span>Messages</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">View all</button>
        </div>

        <div className="space-y-3.5">
          {[
            { name: 'Priya Sharma', text: 'Typing...', status: 'typing' as const, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
            { name: 'Tech Society', text: "Let's build something great!", status: 'online' as const, img: undefined },
            { name: 'Arjun Verma',  text: 'See you at SIH!',              status: 'online' as const, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
          ].map((msg, idx) => (
            <div key={idx} className="flex items-center justify-between group cursor-pointer p-1 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <GlobalAvatar avatarUrl={msg.img} fullName={msg.name} size="sm" status={msg.status} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight truncate">{msg.name}</p>
                  <p className={`text-[10px] truncate max-w-[140px] mt-0.5 font-medium ${msg.status === 'typing' ? 'text-cyan-400 font-bold animate-pulse' : 'text-neutral-500'}`}>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Campus Activity ─────────────────────────────────────────────── */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Trophy size={14} className="text-amber-400" />
            <span>Campus Activity</span>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="flex gap-3 items-start border-b border-white/[0.04] pb-3">
            <GlobalAvatar fullName="Rohit Verma" size="sm" />
            <div>
              <p className="text-xs text-neutral-300 font-medium leading-normal">
                <span className="font-bold text-white">Rohit Verma</span> earned the <span className="text-amber-400 font-bold">Problem Solver</span> badge
              </p>
              <span className="text-[9px] text-neutral-500 font-semibold block mt-1">2m ago</span>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <GlobalAvatar avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" fullName="Ananya Singh" size="sm" />
            <div>
              <p className="text-xs text-neutral-300 font-medium leading-normal">
                <span className="font-bold text-white">Ananya Singh</span> completed <span className="text-orange-400 font-bold">50 days streak 🔥</span>
              </p>
              <span className="text-[9px] text-neutral-500 font-semibold block mt-1">1h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
