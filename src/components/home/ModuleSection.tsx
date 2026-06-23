'use client'

import React, { useState } from 'react'
import { 
  Rss, MessageSquare, Users, Store, Heart, Briefcase, 
  Terminal, Sparkles, Calendar, BookOpen, FileText, 
  GraduationCap, Award, Bot, ShieldAlert, Plus, X, Gamepad2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

interface ModuleSectionProps {
  userRole?: string | null
}

const visibleGridModules = [
  { icon: Rss, name: 'Home Feed', href: '/dashboard', color: 'from-blue-500 via-blue-600 to-cyan-500' },
  { icon: MessageSquare, name: 'Messages', href: '/messages', color: 'from-emerald-500 to-teal-500' },
  { icon: Users, name: 'Communities', href: '/community', color: 'from-purple-500 via-indigo-600 to-purple-600' },
  { icon: Store, name: 'Marketplace', href: '/marketplace', color: 'from-pink-500 to-rose-500' },
  { icon: Heart, name: 'Dating', href: '/dating', color: 'from-red-500 to-pink-500' },
  { icon: Briefcase, name: 'Internships', href: '/internships', color: 'from-amber-500 via-orange-500 to-amber-600' },
  { icon: Terminal, name: 'Coding Arena', href: '/coding-arena', color: 'from-cyan-500 via-blue-500 to-indigo-500' },
  { icon: Sparkles, name: 'AI Assistant', href: '/ai', color: 'from-violet-500 via-fuchsia-500 to-purple-500' },
  { icon: Calendar, name: 'Events', href: '/events', color: 'from-sky-500 to-indigo-600' },
]

const ALL_MODULES = [
  { icon: Rss, name: 'Home Feed', href: '/dashboard', color: 'from-blue-500 via-blue-600 to-cyan-500', desc: 'Realtime campus feed' },
  { icon: MessageSquare, name: 'Messages', href: '/messages', color: 'from-emerald-500 to-teal-500', desc: 'Direct peer chats' },
  { icon: Users, name: 'Communities', href: '/community', color: 'from-purple-500 via-indigo-600 to-purple-600', desc: 'Interest groups & channels' },
  { icon: Gamepad2, name: 'Clubs & Societies', href: '/clubs', color: 'from-cyan-500 to-blue-500', desc: 'Student-run clubs' },
  { icon: Calendar, name: 'Events', href: '/events', color: 'from-sky-500 to-indigo-600', desc: 'Campus events calendar' },
  { icon: BookOpen, name: 'Notes Library', href: '/notes', color: 'from-amber-500 to-yellow-500', desc: 'Shared lecture notes' },
  { icon: FileText, name: 'Past Papers', href: '/papers', color: 'from-indigo-500 to-blue-600', desc: 'Exam question papers' },
  { icon: GraduationCap, name: 'Study Hub', href: '/study', color: 'from-teal-500 to-emerald-600', desc: 'Collaborative rooms' },
  { icon: Calendar, name: 'Academic Calendar', href: '/calendar', color: 'from-sky-400 to-blue-500', desc: 'Timetables & schedules' },
  { icon: Store, name: 'Marketplace', href: '/marketplace', color: 'from-pink-500 to-rose-500', desc: 'Campus classifieds grid' },
  { icon: Briefcase, name: 'Internships', href: '/internships', color: 'from-amber-500 via-orange-500 to-amber-600', desc: 'Internship postings' },
  { icon: Award, name: 'Placements', href: '/placements', color: 'from-rose-500 to-orange-500', desc: 'Jobs and package tracker' },
  { icon: Bot, name: 'Mentorship', href: '/mentorship', color: 'from-purple-400 to-indigo-500', desc: 'Alumni career guides' },
  { icon: Heart, name: 'Dating', href: '/dating', color: 'from-red-500 to-pink-500', desc: 'Connect on campus' },
  { icon: Terminal, name: 'Coding Arena', href: '/coding-arena', color: 'from-cyan-500 via-blue-500 to-indigo-500', desc: 'Coding challenges' },
  { icon: Sparkles, name: 'AI Assistant', href: '/ai', color: 'from-violet-500 via-fuchsia-500 to-purple-500', desc: 'Generative AI helper' },
  { icon: ShieldAlert, name: 'Platform Admin', href: '/super-admin', color: 'from-rose-600 to-red-600', desc: 'System settings & roles', roleOnly: true }
]

export const ModuleSection: React.FC<ModuleSectionProps> = ({ userRole }) => {
  const pathname = usePathname()
  const normalizedRole = (userRole || '').toUpperCase()
  const [showAll, setShowAll] = useState(false)

  // Filter modules based on user permissions
  const filteredGrid = visibleGridModules.filter(mod => {
    if (mod.name === 'Admin Dashboard') {
      return normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN'
    }
    return true
  })

  return (
    <section className="w-full px-6 sm:px-12 lg:px-20 py-4 bg-[#030712]">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3.5">
        {filteredGrid.map((mod, idx) => {
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
        
        {/* More Button triggers slide-up panel / modal */}
        <div onClick={() => setShowAll(true)} className="block">
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
        </div>
      </div>

      {/* Glassmorphic All-Modules Panel Modal */}
      <AnimatePresence>
        {showAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAll(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-4xl bg-[#090d16]/95 border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/[0.04]">
                <div>
                  <h2 className="text-xl font-bold font-display text-white">All Platform Modules</h2>
                  <p className="text-xs text-neutral-400 mt-1">Navigate to any functional node in the student operating system.</p>
                </div>
                <button 
                  onClick={() => setShowAll(false)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ALL_MODULES.filter(mod => {
                  if (mod.roleOnly) {
                    return normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN'
                  }
                  return true
                }).map((mod, idx) => {
                  const Icon = mod.icon
                  return (
                    <Link
                      key={idx}
                      href={mod.href}
                      onClick={() => setShowAll(false)}
                      className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-cyan-500/20 active:scale-[0.98] transition-all group"
                    >
                      <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr shadow-md group-hover:scale-105 transition-transform shrink-0",
                        mod.color
                      )}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-200 group-hover:text-white leading-tight truncate">
                          {mod.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate mt-1 leading-none font-medium">
                          {mod.desc}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
