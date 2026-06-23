'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  LayoutGrid, 
  MessageSquare, 
  User, 
  X, 
  MessageCircle, 
  Gamepad2, 
  Calendar, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Store, 
  Briefcase, 
  Award, 
  Bot, 
  Heart, 
  Terminal, 
  Sparkles 
} from 'lucide-react'

const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'More', href: '#more', icon: LayoutGrid },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Profile', href: '/profile', icon: User },
]

const MODULE_SECTIONS = [
  {
    label: 'Campus Life',
    items: [
      { label: 'Communities', href: '/community', icon: MessageCircle, desc: 'Interest groups' },
      { label: 'Clubs', href: '/clubs', icon: Gamepad2, desc: 'Clubs & societies' },
      { label: 'Events', href: '/events', icon: Calendar, desc: 'Campus events' },
    ]
  },
  {
    label: 'Academics',
    items: [
      { label: 'Notes Library', href: '/notes', icon: BookOpen, desc: 'Shared notes' },
      { label: 'Past Papers', href: '/papers', icon: FileText, desc: 'Exam archives' },
      { label: 'Study Hub', href: '/study', icon: GraduationCap, desc: 'Study rooms' },
      { label: 'Calendar', href: '/calendar', icon: Calendar, desc: 'Schedules' },
    ]
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Buy & Sell', href: '/marketplace', icon: Store, desc: 'Classifieds' },
    ]
  },
  {
    label: 'Career',
    items: [
      { label: 'Internships', href: '/internships', icon: Briefcase, desc: 'Intern openings' },
      { label: 'Placements', href: '/placements', icon: Award, desc: 'Jobs feed' },
      { label: 'Mentorship', href: '/mentorship', icon: Bot, desc: 'Alumni guides' },
    ]
  },
  {
    label: 'Special',
    items: [
      { label: 'Dating', href: '/dating', icon: Heart, desc: 'Connect on campus' },
      { label: 'Coding Arena', href: '/coding-arena', icon: Terminal, desc: 'Challenges' },
      { label: 'AI Assistant', href: '/ai', icon: Sparkles, desc: 'AI assistant' },
    ]
  }
]

export function BottomNav() {
  const pathname = usePathname()
  const [showModules, setShowModules] = useState(false)

  return (
    <>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-[400px]">
        <div className="flex items-center justify-around px-2 py-1.5 rounded-2xl border border-white/[0.08] bg-zinc-950/90 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isMore = item.href === '#more'
            const active = isMore ? showModules : pathname === item.href
            const Icon = item.icon
            
            const handleItemClick = (e: React.MouseEvent) => {
              if (isMore) {
                e.preventDefault()
                setShowModules(!showModules)
              } else {
                setShowModules(false)
              }
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleItemClick}
                className={clsx(
                  "relative flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all duration-300",
                  active ? "text-brand-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 bg-brand-500/10 rounded-xl border border-brand-500/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon size={20} className="relative z-10" />
                <span className="text-[9px] font-mono font-medium uppercase tracking-wider relative z-10">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Hidden Modules Bottom Sheet */}
      <AnimatePresence>
        {showModules && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModules(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
            />
            
            {/* Slide-up panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#090d16]/95 border-t border-white/[0.08] rounded-t-[32px] p-6 pb-28 backdrop-blur-2xl shadow-2xl z-40 overflow-y-auto custom-scrollbar md:hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold font-display text-white">Campus Modules</h3>
                  <p className="text-xs text-zinc-500">Explore all feature modules</p>
                </div>
                <button 
                  onClick={() => setShowModules(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-6">
                {MODULE_SECTIONS.map((section) => (
                  <div key={section.label} className="space-y-2.5">
                    <p className="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">
                      {section.label}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowModules(false)}
                            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] active:bg-white/[0.05] transition-all group"
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.05] text-neutral-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all shrink-0">
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-200 group-hover:text-white leading-tight truncate">
                                {item.label}
                              </p>
                              <p className="text-[9px] text-neutral-500 truncate mt-0.5 font-medium leading-none">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
