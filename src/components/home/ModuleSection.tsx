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

const PRIMARY_MODULES = [
  { icon: MessageSquare, name: 'Messages', href: '/messages' },
  { icon: Users, name: 'Communities', href: '/community' },
  { icon: Calendar, name: 'Events', href: '/events' },
  { icon: Store, name: 'Marketplace', href: '/marketplace' },
  { icon: Briefcase, name: 'Internships', href: '/internships' },
  { icon: Sparkles, name: 'AI Assistant', href: '/ai', isAi: true },
  { icon: Terminal, name: 'Coding Arena', href: '/coding-arena' },
]

const ALL_MODULES = [
  { icon: Rss, name: 'Home Feed', href: '/dashboard', desc: 'Realtime campus feed' },
  { icon: MessageSquare, name: 'Messages', href: '/messages', desc: 'Direct peer chats' },
  { icon: Users, name: 'Communities', href: '/community', desc: 'Interest groups & channels' },
  { icon: Gamepad2, name: 'Clubs & Societies', href: '/clubs', desc: 'Student-run clubs' },
  { icon: Calendar, name: 'Events', href: '/events', desc: 'Campus events calendar' },
  { icon: BookOpen, name: 'Notes Library', href: '/notes', desc: 'Shared lecture notes' },
  { icon: FileText, name: 'Past Papers', href: '/papers', desc: 'Exam question papers' },
  { icon: GraduationCap, name: 'Study Hub', href: '/study', desc: 'Collaborative rooms' },
  { icon: Calendar, name: 'Academic Calendar', href: '/calendar', desc: 'Timetables & schedules' },
  { icon: Store, name: 'Marketplace', href: '/marketplace', desc: 'Campus classifieds grid' },
  { icon: Briefcase, name: 'Internships', href: '/internships', desc: 'Internship postings' },
  { icon: Award, name: 'Placements', href: '/placements', desc: 'Jobs and package tracker' },
  { icon: Bot, name: 'Mentorship', href: '/mentorship', desc: 'Alumni career guides' },
  { icon: Heart, name: 'Dating', href: '/dating', desc: 'Connect on campus' },
  { icon: Terminal, name: 'Coding Arena', href: '/coding-arena', desc: 'Coding challenges' },
  { icon: Sparkles, name: 'AI Assistant', href: '/ai', desc: 'Generative AI helper', isAi: true },
  { icon: ShieldAlert, name: 'Platform Admin', href: '/super-admin', desc: 'System settings & roles', roleOnly: true }
]

export const ModuleSection: React.FC<ModuleSectionProps> = ({ userRole }) => {
  const pathname = usePathname()
  const normalizedRole = (userRole || '').toUpperCase()
  const [showAll, setShowAll] = useState(false)

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3">
      <div className="flex flex-wrap items-center gap-2 select-none">
        {PRIMARY_MODULES.map((mod, idx) => {
          const IconComponent = mod.icon
          const isActive = pathname === mod.href || (mod.href !== '/dashboard' && pathname.startsWith(mod.href))
          
          return (
            <Link key={idx} href={mod.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer select-none",
                  isActive
                    ? mod.isAi
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                      : "bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]"
                    : "bg-[#15181D] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-[#1B1F24] hover:border-white/[0.1]"
                )}
              >
                <IconComponent size={14} className="shrink-0" />
                <span>{mod.name}</span>
              </motion.div>
            </Link>
          )
        })}

        {/* More button */}
        <motion.button
          onClick={() => setShowAll(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-transparent border border-dashed border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.2] hover:bg-[#1B1F24] transition-all cursor-pointer"
        >
          <Plus size={14} className="shrink-0" />
          <span>More</span>
        </motion.button>
      </div>

      {/* Modern, Minimalist All-Modules Panel Modal */}
      <AnimatePresence>
        {showAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAll(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-3xl bg-[#15181D] border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-none"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/[0.04]">
                <div>
                  <h2 className="text-base font-bold font-display text-white tracking-tight">Campus Modules</h2>
                  <p className="text-xs text-zinc-400 mt-1 font-medium">Quick access to all sections of the platform.</p>
                </div>
                <button 
                  onClick={() => setShowAll(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_MODULES.filter(mod => {
                  if (mod.roleOnly) {
                    return normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN'
                  }
                  return true
                }).map((mod, idx) => {
                  const Icon = mod.icon
                  const isAi = mod.isAi
                  return (
                    <Link
                      key={idx}
                      href={mod.href}
                      onClick={() => setShowAll(false)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#1B1F24] border border-white/[0.04] hover:bg-zinc-800/40 hover:border-[#3B82F6]/20 transition-all group"
                    >
                      <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm",
                        isAi ? "bg-purple-500/10 text-purple-400" : "bg-[#3B82F6]/10 text-[#3B82F6]"
                      )}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-200 group-hover:text-white leading-tight truncate">
                          {mod.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5 leading-none font-semibold">
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
