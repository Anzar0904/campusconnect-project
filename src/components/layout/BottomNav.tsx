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
  Sparkles,
  Compass,
  Users,
  Brain,
  Rocket,
  LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'More', href: '#more', icon: LayoutGrid },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Profile', href: '/profile', icon: User },
]

const MODULE_SECTIONS = [
  {
    label: 'Social',
    items: [
      { label: 'Friends', href: '/friends', icon: Users, desc: 'Classmates & requests' },
      { label: 'Discover', href: '/discover', icon: Compass, desc: 'Campus search & map' },
    ]
  },
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
      { label: 'Coding Arena', href: '/coding-arena', icon: Terminal, desc: 'Code playground' },
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
      { label: 'Mentorship', href: '/mentorship', icon: Brain, desc: 'Alumni mentors' },
      { label: 'Startup Cell', href: '/startup', icon: Rocket, desc: 'Campus startups' },
    ]
  },
  {
    label: 'Special',
    items: [
      { label: 'Dating', href: '/dating', icon: Heart, desc: 'Connect on campus' },
      { label: 'AI Assistant', href: '/ai', icon: Sparkles, desc: 'AI assistant' },
    ]
  }
]

export function BottomNav() {
  const pathname = usePathname()
  const [showModules, setShowModules] = useState(false)

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      supabase.removeAllChannels()
      localStorage.removeItem('recent_searches')
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <>
      <nav className="fixed left-1/2 -translate-x-1/2 z-50 md:hidden w-[92%] max-w-[400px]" style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center justify-around px-2.5 py-2 rounded-2xl border border-white/[0.08] bg-zinc-900/65 backdrop-blur-xl shadow-premium">
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
              <motion.div
                key={item.href}
                whileTap={{ scale: 0.92 }}
                className="relative flex"
              >
                <Link
                  href={item.href}
                  onClick={handleItemClick}
                  className={clsx(
                    "relative flex flex-col items-center gap-1.5 p-2 min-w-[64px] rounded-xl transition-all duration-300",
                    active ? "text-brand-400 font-semibold" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 bg-brand-500/10 rounded-xl border border-brand-500/20"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <Icon size={18} className="relative z-10 animate-scale-up" />
                  <span className="text-[9px] font-display font-bold uppercase tracking-wider relative z-10">
                    {item.label}
                  </span>
                </Link>
              </motion.div>
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
              className="fixed inset-0 bg-[#030712]/60 backdrop-blur-sm z-40 md:hidden"
            />
            
            {/* Slide-up panel */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.85 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 140) {
                  setShowModules(false)
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-[#09090b]/98 border-t border-white/[0.08] rounded-t-[32px] p-6 pb-28 shadow-2xl z-40 overflow-y-auto custom-scrollbar md:hidden flex flex-col"
            >
              {/* Drag Handle Bar at top */}
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-5 shrink-0 cursor-grab active:cursor-grabbing" />

              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <h3 className="text-lg font-bold font-display text-white">Campus Modules</h3>
                  <p className="text-xs text-zinc-500">Explore all feature modules</p>
                </div>
                <button 
                  onClick={() => setShowModules(false)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                {MODULE_SECTIONS.map((section) => (
                  <div key={section.label} className="space-y-2.5">
                    <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-1">
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
                            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] active:bg-white/[0.04] transition-all group"
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.05] text-neutral-400 group-hover:text-brand-400 group-hover:bg-brand-500/10 group-hover:border-brand-500/20 transition-all shrink-0">
                              <Icon size={15} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-200 group-hover:text-white leading-tight truncate">
                                {item.label}
                              </p>
                              <p className="text-[9px] text-zinc-500 truncate mt-0.5 font-medium leading-none">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setShowModules(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 active:bg-red-500/20 text-red-400 font-bold text-sm transition-all"
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
