'use client'

import React from 'react'
import { 
  Rss, MessageSquare, Users, ShoppingBag, Heart, Briefcase, 
  Code2, Bot, Calendar, ShieldAlert, Plus
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ModuleSectionProps {
  userRole?: string | null
}

const modules = [
  { icon: Rss, name: 'Home Feed', href: '/dashboard', color: 'from-blue-500 via-blue-600 to-cyan-500', count: null },
  { icon: MessageSquare, name: 'Messages', href: '/messages', color: 'from-emerald-500 to-teal-500', count: null },
  { icon: Users, name: 'Communities', href: '/community', color: 'from-purple-500 via-indigo-600 to-purple-600', count: null },
  { icon: ShoppingBag, name: 'Marketplace', href: '/marketplace', color: 'from-pink-500 to-rose-500', count: null },
  { icon: Heart, name: 'Dating', href: '/dating', color: 'from-red-500 to-pink-500', count: null },
  { icon: Briefcase, name: 'Internships', href: '/internships', color: 'from-amber-500 via-orange-500 to-amber-600', count: null },
  { icon: Code2, name: 'Coding Arena', href: '/coding-arena', color: 'from-cyan-500 via-blue-500 to-indigo-500', count: null },
  { icon: Bot, name: 'AI Assistant', href: '/ai', color: 'from-violet-500 via-fuchsia-500 to-purple-500', count: null },
  { icon: Calendar, name: 'Events', href: '/events', color: 'from-sky-500 to-indigo-600', count: null },
  { icon: ShieldAlert, name: 'Admin Dashboard', href: '/super-admin', color: 'from-rose-600 to-red-600', count: null },
]

export const ModuleSection: React.FC<ModuleSectionProps> = ({ userRole }) => {
  const pathname = usePathname()
  const normalizedRole = (userRole || '').toUpperCase()

  const visibleModules = modules.filter(mod => {
    if (mod.name === 'Admin Dashboard') {
      return normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN'
    }
    return true
  })

  return (
    <section className="w-full px-6 sm:px-12 lg:px-20 py-4 bg-[#030712]">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3.5">
        {visibleModules.map((mod, idx) => {
          const IconComponent = mod.icon
          const active = pathname === mod.href || (mod.href !== '/dashboard' && pathname.startsWith(mod.href))

          return (
            <Link key={idx} href={mod.href} className="block">
              <motion.div
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={clsx(
                  "relative group rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer border transition-all duration-300 h-full select-none overflow-hidden",
                  active 
                    ? "bg-[#090d16]/80 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
                    : "bg-[#0d121f]/35 border-white/[0.04] hover:bg-[#0d121f]/70 hover:border-white/[0.12] hover:shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                )}
              >
                {/* Glow Background Layer */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-tr ${mod.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 blur-md`} />
                
                {/* Border glowing animation */}
                {active && (
                  <div className="absolute inset-0 rounded-xl border border-cyan-500/35 animate-pulse pointer-events-none" />
                )}

                {/* Icon Container */}
                <div className={clsx(
                  "w-10 h-10 rounded-xl bg-gradient-to-tr p-2 flex items-center justify-center text-white relative shadow-md transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
                  active ? "scale-110 rotate-3" : "group-hover:scale-110",
                  mod.color
                )}>
                  <IconComponent size={18} strokeWidth={2.2} />
                  {mod.count && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[9px] text-white font-black px-1.5 py-0.5 rounded-md min-w-[14px] shadow-sm">
                      {mod.count}
                    </span>
                  )}
                </div>
                
                <span className={clsx(
                  "text-[11px] font-bold mt-2.5 transition-colors truncate w-full z-10 tracking-tight",
                  active ? "text-cyan-400 font-extrabold" : "text-neutral-400 group-hover:text-white"
                )}>
                  {mod.name}
                </span>
              </motion.div>
            </Link>
          )
        })}
        
        <Link href="/discover" className="block">
          <motion.div
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="bg-[#0d121f]/20 border border-dashed border-white/[0.08] rounded-xl p-3.5 flex flex-col items-center justify-center text-center text-neutral-500 hover:text-neutral-300 hover:border-white/[0.18] hover:bg-[#0d121f]/50 transition-all duration-300 group cursor-pointer h-full min-h-[92px] select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900/60 border border-white/[0.04] flex items-center justify-center font-black text-xs text-neutral-400 group-hover:text-white transition-all">
              <Plus size={16} />
            </div>
            <span className="text-[11px] font-bold mt-2.5 tracking-tight">More</span>
          </motion.div>
        </Link>
      </div>
    </section>
  )
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
