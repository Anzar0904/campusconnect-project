import React from 'react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { Search, Bell, MessageSquare, ChevronDown } from 'lucide-react'

export const Navbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#030712]/65 backdrop-blur-xl px-6 py-2.5 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-600 to-indigo-600 flex items-center justify-center neon-glow-cyan">
          <span className="text-white font-black text-lg italic tracking-tighter">C</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight hidden sm:block">
          Campus<span className="text-neutral-400 font-normal">Connect</span>
        </span>
      </div>

      <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-neutral-400">
          <Search size={14} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full bg-[#0d121f]/50 border border-white/[0.06] rounded-xl py-1.5 pl-10 pr-12 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[9px] font-bold text-neutral-500 tracking-widest border border-white/5 bg-white/[0.02] rounded px-1.5 h-4.5 my-auto">
          ⌘K
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-white/[0.03]">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-[9px] text-white rounded-full flex items-center justify-center font-black">
            3
          </span>
        </button>
        <button className="p-2 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-white/[0.03]">
          <MessageSquare size={18} />
        </button>
        
        <div className="h-5 w-px bg-white/[0.08]" />

        <div className="flex items-center gap-3 pl-1 cursor-pointer group">
          <GlobalAvatar
            avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
            fullName="Ananya Singh"
            size="sm"
          />
          <div className="hidden lg:block text-left whitespace-nowrap">
            <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tight">Ananya Singh</p>
            <p className="text-[10px] text-neutral-400 font-medium tracking-normal mt-0.5">B.Tech CSE, 3rd Year</p>
          </div>
          <ChevronDown size={12} className="text-neutral-500 group-hover:text-neutral-300 transition-colors hidden lg:block" />
        </div>
      </div>
    </nav>
  )
}
