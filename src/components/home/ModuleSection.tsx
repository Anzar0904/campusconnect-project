import React from 'react'
import { 
  Rss, MessageSquare, Users, ShoppingBag, Heart, Briefcase, 
  Code2, Bot, Calendar, ShieldAlert 
} from 'lucide-react'

const modules = [
  { icon: Rss, name: 'Home Feed', color: 'from-blue-500 via-blue-600 to-cyan-500', count: null },
  { icon: MessageSquare, name: 'Messages', color: 'from-emerald-500 to-teal-500', count: 12 },
  { icon: Users, name: 'Communities', color: 'from-purple-500 via-indigo-600 to-purple-600', count: null },
  { icon: ShoppingBag, name: 'Marketplace', color: 'from-pink-500 to-rose-500', count: null },
  { icon: Heart, name: 'Dating', color: 'from-red-500 to-pink-500', count: null },
  { icon: Briefcase, name: 'Internships', color: 'from-amber-500 via-orange-500 to-amber-600', count: null },
  { icon: Code2, name: 'Coding Arena', color: 'from-cyan-500 via-blue-500 to-indigo-500', count: null },
  { icon: Bot, name: 'AI Assistant', color: 'from-violet-500 via-fuchsia-500 to-purple-500', count: null },
  { icon: Calendar, name: 'Events', color: 'from-sky-500 to-indigo-600', count: null },
  { icon: ShieldAlert, name: 'Admin Dashboard', color: 'from-rose-600 to-red-600', count: null },
]

export const ModuleSection: React.FC = () => {
  return (
    <section className="w-full px-6 sm:px-12 lg:px-20 py-4 bg-[#030712]">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3.5">
        {modules.map((mod, idx) => {
          const IconComponent = mod.icon
          return (
            <div
              key={idx}
              className="relative group glass-card-interactive rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mod.color} p-2 flex items-center justify-center text-white relative shadow-md group-hover:scale-105 transition-transform duration-300 z-10`}>
                <IconComponent size={18} strokeWidth={2.2} />
              </div>
              
              <span className="text-[11px] font-bold text-neutral-400 mt-2.5 group-hover:text-white transition-colors truncate w-full z-10 tracking-tight">
                {mod.name}
              </span>
            </div>
          )
        })}
        
        <div className="bg-white/[0.01] border border-dashed border-white/[0.06] rounded-xl p-3.5 flex flex-col items-center justify-center text-center text-neutral-500 hover:text-neutral-300 transition-all duration-300 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-neutral-900/60 border border-white/[0.04] flex items-center justify-center font-black text-xs text-neutral-400 group-hover:text-white transition-all">
            +10
          </div>
          <span className="text-[11px] font-bold mt-2.5 tracking-tight">More</span>
        </div>
      </div>
    </section>
  )
}
