'use client'

import React, { useState } from 'react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { 
  Home, 
  Users, 
  Compass, 
  MessageSquare, 
  User, 
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
  Rocket, 
  Sparkles, 
  Trophy, 
  ShieldAlert,
  LayoutGrid,
  Bell,
  ChevronDown,
  LogIn,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { NavbarSearch } from './NavbarSearch'

interface NavbarProps {
  profile?: {
    avatar_url?: string | null
    full_name?: string | null
    username?: string | null
    branch?: string | null
    year?: number | null
    role?: string | null
  } | null
}

const NAV_SECTIONS = [
  {
    label: 'Social',
    items: [
      { label: 'Home Feed', href: '/dashboard', icon: Home, desc: 'Realtime campus feed' },
      { label: 'Friends', href: '/friends', icon: Users, desc: 'Your connections' },
      { label: 'Discover', href: '/discover', icon: Compass, desc: 'Find new peers' },
      { label: 'Messages', href: '/messages', icon: MessageSquare, desc: 'Direct chat' },
      { label: 'My Profile', href: '/profile', icon: User, desc: 'Manage your portfolio' },
    ]
  },
  {
    label: 'Campus Life',
    items: [
      { label: 'Communities', href: '/community', icon: MessageCircle, desc: 'Interest groups & chats' },
      { label: 'Clubs', href: '/clubs', icon: Gamepad2, desc: 'Clubs & societies' },
      { label: 'Events', href: '/events', icon: Calendar, desc: 'Events schedule' },
    ]
  },
  {
    label: 'Academics',
    items: [
      { label: 'Notes Library', href: '/notes', icon: BookOpen, desc: 'Shared notes library' },
      { label: 'Past Papers', href: '/papers', icon: FileText, desc: 'Exam archives' },
      { label: 'Study Hub', href: '/study', icon: GraduationCap, desc: 'Virtual study sessions' },
      { label: 'Calendar', href: '/calendar', icon: Calendar, desc: 'Schedules & timetables' },
    ]
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Buy & Sell', href: '/marketplace', icon: Store, desc: 'Campus classifieds' },
    ]
  },
  {
    label: 'Career',
    items: [
      { label: 'Internships', href: '/internships', icon: Briefcase, desc: 'Exclusive internships' },
      { label: 'Placements', href: '/placements', icon: Award, desc: 'Career opportunities' },
      { label: 'Mentorship', href: '/mentorship', icon: Bot, desc: 'Guide from alumni' },
    ]
  },
  {
    label: 'Special',
    items: [
      { label: 'Dating', href: '/dating', icon: Heart, desc: 'Connect on campus' },
      { label: 'Coding Arena', href: '/coding-arena', icon: Terminal, desc: 'Coding challenges' },
      { label: 'Startup Cell', href: '/startup', icon: Rocket, desc: 'Build your startup' },
      { label: 'AI Assistant', href: '/ai', icon: Sparkles, desc: 'AI queries' },
      { label: 'Rewards', href: '/rewards', icon: Trophy, desc: 'Earning point systems' },
    ]
  },
  {
    label: 'Platform',
    roleRequired: 'SUPER_ADMIN',
    items: [
      { label: 'Platform Admin', href: '/super-admin', icon: ShieldAlert, desc: 'System management' },
    ]
  }
]

export const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false)
  const userRole = profile?.role?.toUpperCase() || 'STUDENT'

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#030712]/65 backdrop-blur-xl px-6 py-2.5 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-600 to-indigo-600 flex items-center justify-center neon-glow-cyan">
            <span className="text-white font-black text-lg italic tracking-tighter">C</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight hidden sm:block">
            Campus<span className="text-neutral-400 font-normal">Connect</span>
          </span>
        </Link>
      </div>

      <NavbarSearch />

      <div className="flex items-center gap-4 relative">
        {profile ? (
          <>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className={clsx(
                "p-2 text-neutral-400 hover:text-white transition-all rounded-xl hover:bg-white/[0.03] flex items-center justify-center",
                isOpen && "text-white bg-white/[0.05]"
              )}
              aria-label="Toggle Navigation Grid"
            >
              <LayoutGrid size={18} />
            </button>

            <button className="relative p-2 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-white/[0.03] flex items-center justify-center">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-[9px] text-white rounded-full flex items-center justify-center font-black">
                3
              </span>
            </button>
            <Link href="/messages" className="p-2 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-white/[0.03] flex items-center justify-center">
              <MessageSquare size={18} />
            </Link>
            
            <div className="h-5 w-px bg-white/[0.08]" />

            <Link href="/profile" className="flex items-center gap-3 pl-1 cursor-pointer group">
              <GlobalAvatar
                avatarUrl={profile.avatar_url}
                fullName={profile.full_name || undefined}
                username={profile.username || undefined}
                size="sm"
              />
              <div className="hidden lg:block text-left whitespace-nowrap">
                <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tight">
                  {profile.full_name || 'Student'}
                </p>
                <p className="text-[10px] text-neutral-400 font-medium tracking-normal mt-0.5">
                  {profile.branch ? `${profile.branch}` : ''}
                  {profile.year ? `, ${profile.year} Year` : ''}
                </p>
              </div>
              <ChevronDown size={12} className="text-neutral-500 group-hover:text-neutral-300 transition-colors hidden lg:block" />
            </Link>

            {/* Mega Dropdown menu */}
            {isOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
                <div className="absolute top-full right-0 mt-3.5 w-[560px] max-w-[calc(100vw-2rem)] bg-[#090d16]/95 border border-white/[0.08] rounded-2xl p-5 backdrop-blur-2xl shadow-2xl z-50 animate-fade-in max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {NAV_SECTIONS.filter(section => {
                      if (!section.roleRequired) return true
                      const req = section.roleRequired.toUpperCase()
                      return userRole === req || (req === 'SUPER_ADMIN' && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'))
                    }).map((section) => (
                      <div key={section.label} className="space-y-2.5">
                        <p className="font-mono text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">
                          {section.label}
                        </p>
                        <div className="flex flex-col gap-1">
                          {section.items.map((item) => {
                            const Icon = item.icon
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.03] transition-all group"
                              >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.02] border border-white/[0.04] text-neutral-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all shrink-0">
                                  <Icon size={15} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-neutral-300 group-hover:text-white transition-colors leading-tight truncate">
                                    {item.label}
                                  </p>
                                  <p className="text-[8px] text-neutral-500 truncate mt-0.5 font-medium leading-none">
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
                </div>
              </>
            )}
          </>
        ) : (
          <Link href="/auth/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md">
            <LogIn size={14} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
