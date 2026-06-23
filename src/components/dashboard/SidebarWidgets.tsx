import React from 'react'
import { Calendar as CalendarIcon, MessageSquare, Trophy, Briefcase, Users } from 'lucide-react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

export const RightWidgetsColumn: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="glass-panel-base rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white tracking-tight">
            <CalendarIcon size={13} className="text-blue-400" />
            <span>Calendar</span>
          </div>
          <span className="text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/[0.05] px-1.5 py-0.5 rounded">May 2024</span>
        </div>
        
        <div className="grid grid-cols-7 gap-y-1 text-center text-[10px]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="font-bold text-neutral-600 text-[9px]">{d}</span>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const isToday = day === 16
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

      <div className="glass-panel-base rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white tracking-tight">Upcoming Events</span>
          <button className="text-[10px] font-bold text-blue-400 hover:underline">View all</button>
        </div>

        <div className="space-y-2.5">
          {[
            { title: 'HackNight 2.0', time: 'May 16 • 6:00 PM', color: 'bg-indigo-500' },
            { title: 'AI Workshop', time: 'May 22 • 4:00 PM', color: 'bg-cyan-500' },
            { title: 'Design Meetup', time: 'May 28 • 5:30 PM', color: 'bg-pink-500' },
          ].map((evt, idx) => (
            <div key={idx} className="flex gap-2.5 items-start border-b border-white/[0.04] last:border-0 pb-2.5 last:pb-0 group cursor-pointer">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${evt.color}`} />
              <div>
                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight leading-none">{evt.title}</p>
                <p className="text-[10px] text-neutral-500 font-medium mt-1">{evt.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel-base rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <MessageSquare size={13} className="text-emerald-400" />
            <span>Messages</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:underline">View all</button>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Priya Sharma', text: 'Typing...', unread: 2, status: 'typing' as const, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
            { name: 'Tech Society', text: "Let's build something great!", unread: 12, status: 'online' as const, img: undefined },
            { name: 'Arjun Verma', text: 'See you at SIH!', unread: 0, status: 'online' as const, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
            { name: 'Design Squad', text: 'New files uploaded', unread: 0, status: 'offline' as const, img: undefined },
          ].map((msg, idx) => (
            <div key={idx} className="flex items-center justify-between group cursor-pointer p-0.5 rounded-lg transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <GlobalAvatar avatarUrl={msg.img} fullName={msg.name} size="sm" status={msg.status} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight truncate">{msg.name}</p>
                  <p className={`text-[10px] truncate max-w-[130px] mt-0.5 font-medium ${msg.status === 'typing' ? 'text-cyan-400 font-bold' : 'text-neutral-500'}`}>{msg.text}</p>
                </div>
              </div>
              {msg.unread > 0 && (
                <span className="w-4 h-4 bg-blue-500 text-[9px] font-black text-white rounded-full flex items-center justify-center">
                  {msg.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel-base rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Trophy size={13} className="text-amber-400" />
            <span>Campus Activity</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:underline">View all</button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2.5 items-start border-b border-white/[0.04] pb-2.5">
            <GlobalAvatar fullName="Rohit Verma" size="sm" />
            <div>
              <p className="text-xs text-neutral-300 font-medium leading-normal">
                <span className="font-bold text-white">Rohit Verma</span> earned the <span className="text-amber-400 font-bold">Problem Solver</span> badge
              </p>
              <span className="text-[9px] text-neutral-500 font-semibold block mt-0.5">2m ago</span>
            </div>
          </div>
          <div className="flex gap-2.5 items-start">
            <GlobalAvatar avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" fullName="Ananya Singh" size="sm" />
            <div>
              <p className="text-xs text-neutral-300 font-medium leading-normal">
                <span className="font-bold text-white">Ananya Singh</span> completed <span className="text-orange-400 font-bold">50 days streak 🔥</span>
              </p>
              <span className="text-[9px] text-neutral-500 font-semibold block mt-0.5">1h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const MiddleRightWidgetsColumn: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="glass-panel-base rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Briefcase size={13} className="text-amber-400" />
            <span>Internship Matches</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:underline">View all</button>
        </div>

        <div className="space-y-2">
          {[
            { role: 'Product Intern', company: 'Linear', match: '92% Match', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { role: 'Frontend Developer', company: 'Paytm', match: '88% Match', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { role: 'UI/UX Design Intern', company: 'Swiggy', match: '85% Match', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          ].map((job, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all cursor-pointer group">
              <div>
                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">{job.role}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5 font-medium">{job.company}</p>
              </div>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border tracking-wide ${job.color}`}>
                {job.match}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel-base rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Users size={13} className="text-purple-400" />
            <span className="text-purple-400">Top Communities</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:underline">View all</button>
        </div>

        <div className="space-y-2.5">
          {[
            { name: 'Tech Society', members: '12.3K members', initial: 'TS', grad: 'from-blue-600 to-indigo-600' },
            { name: 'Design Squad', members: '8.7K members', initial: 'DS', grad: 'from-pink-600 to-purple-600' },
            { name: 'AI/ML Club', members: '6.2K members', initial: 'AI', grad: 'from-cyan-600 to-blue-600' },
          ].map((comm, idx) => (
            <div key={idx} className="flex items-center justify-between group p-0.5 rounded-xl">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${comm.grad} text-white text-[9px] font-black flex items-center justify-center shadow-md`}>
                  {comm.initial}
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer tracking-tight">{comm.name}</p>
                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{comm.members}</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] rounded-lg transition-all tracking-wide">
                Join
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
