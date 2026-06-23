import React from 'react'
import { Calendar as CalendarIcon, MessageSquare, Trophy } from 'lucide-react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

export const RightSidebar: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="glass-panel-base rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white tracking-tight">
            <CalendarIcon size={14} className="text-blue-400" />
            <span>Calendar</span>
          </div>
          <span className="text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/[0.05] px-2 py-0.5 rounded-md">May 2024</span>
        </div>
        
        <div className="grid grid-cols-7 gap-y-1.5 text-center text-[10px]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="font-bold text-neutral-600 text-[9px] uppercase tracking-wider">{d}</span>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const isToday = day === 16
            return (
              <span
                key={day}
                className={`py-0.5 font-bold rounded-lg mx-auto w-5.5 h-5.5 flex items-center justify-center text-xs tracking-tighter cursor-pointer transition-all ${
                  isToday 
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 ring-1 ring-white/10' 
                    : 'hover:bg-white/5 text-neutral-300 font-semibold'
                }`}
              >
                {day}
              </span>
            )
          })}
        </div>
      </div>

      <div className="glass-panel-base rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white tracking-tight">Upcoming Events</span>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">View all</button>
        </div>

        <div className="space-y-3.5">
          {[
            { title: 'HackNight 2.0', time: 'May 16 • 6:00 PM', color: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' },
            { title: 'AI Workshop', time: 'May 22 • 4:00 PM', color: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' },
            { title: 'Design Meetup', time: 'May 28 • 5:30 PM', color: 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]' },
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

      <div className="glass-panel-base rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <MessageSquare size={14} className="text-emerald-400" />
            <span>Messages</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">View all</button>
        </div>

        <div className="space-y-3.5">
          {[
            { name: 'Priya Sharma', text: 'Typing...', unread: 2, status: 'typing' as const, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
            { name: 'Tech Society', text: "Let's build something great!", unread: 12, status: 'online' as const, img: undefined },
            { name: 'Arjun Verma', text: 'See you at SIH!', unread: 0, status: 'online' as const, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
          ].map((msg, idx) => (
            <div key={idx} className="flex items-center justify-between group cursor-pointer p-1 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <GlobalAvatar avatarUrl={msg.img} fullName={msg.name} size="sm" status={msg.status} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight truncate">{msg.name}</p>
                  <p className={`text-[10px] truncate max-w-[140px] mt-0.5 font-medium ${msg.status === 'typing' ? 'text-cyan-400 font-bold animate-pulse' : 'text-neutral-500'}`}>{msg.text}</p>
                </div>
              </div>
              {msg.unread > 0 && (
                <span className="w-4 h-4 bg-blue-500 text-[9px] font-black text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/20">
                  {msg.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel-base rounded-2xl p-4">
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
