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
  Search,
  Settings,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { clsx } from 'clsx'
import { NavbarSearch } from './NavbarSearch'
import { useNotifications } from '@/hooks/useNotifications'
import { Clock, Check } from 'lucide-react'
import { format } from 'date-fns'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useAutoAnimate } from '@formkit/auto-animate/react'

interface NavbarProps {
  profile?: {
    id?: string | null
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
    ]
  },
  {
    label: 'Special',
    items: [
      { label: 'Dating', href: '/dating', icon: Heart, desc: 'Connect on campus' },
      { label: 'AI Assistant', href: '/ai', icon: Sparkles, desc: 'AI queries' },
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

export const Navbar: React.FC<NavbarProps> = ({ profile: initialProfile }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { profile: currentProfile } = useCurrentProfile()
  const profile = currentProfile || initialProfile
  const userRole = profile?.role?.toUpperCase() || 'STUDENT'

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
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#030712]/65 backdrop-blur-xl px-6 py-2.5 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <svg className="w-8.5 h-8.5 shrink-0 drop-shadow-[0_0_10px_rgba(6,182,212,0.45)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M75,28 C62,13 38,13 25,28 C12,43 12,63 25,78 C38,93 62,93 75,78 C82,71 85,62 84,53 C83,48 78,49 79,54 C80,60 78,66 73,71 C63,81 43,81 33,71 C23,61 23,45 33,35 C43,25 63,25 73,35 C77,39 79,45 79,51 C79,56 84,55 84,50 C84,41 81,34 75,28 Z"
              fill="url(#c-gradient-nav)"
              strokeWidth="1"
            />
            <defs>
              <linearGradient id="c-gradient-nav" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
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
              onClick={() => { setIsOpen(!isOpen); setShowNotifications(false) }}
              className={clsx(
                "p-2 text-neutral-400 hover:text-white transition-all rounded-xl hover:bg-white/[0.03] flex items-center justify-center hidden md:flex",
                isOpen && "text-white bg-white/[0.05]"
              )}
              aria-label="Toggle Navigation Grid"
            >
              <LayoutGrid size={18} />
            </button>

              {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setIsOpen(false) }}
                className={clsx(
                  "relative w-11 h-11 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-white/[0.03] flex items-center justify-center",
                  showNotifications && "text-white bg-white/[0.05]"
                )}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 bg-cyan-500 text-[8px] text-zinc-950 rounded-full flex items-center justify-center font-black animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <NotificationsDropdown 
                showNotifications={showNotifications} 
                setShowNotifications={setShowNotifications} 
                unreadCount={unreadCount} 
                notifications={notifications} 
                markAsRead={markAsRead} 
                markAllAsRead={markAllAsRead} 
              />
            </div>

            <Link href="/messages" className="p-2 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-white/[0.03] flex items-center justify-center hidden md:flex">
              <MessageSquare size={18} />
            </Link>
            
            <div className="h-5 w-px bg-white/[0.08] hidden md:block" />

            <div className="relative">
              <button 
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu)
                  setIsOpen(false)
                  setShowNotifications(false)
                }}
                className="w-11 h-11 lg:w-auto lg:h-auto flex items-center justify-center lg:justify-start gap-3 pl-1 cursor-pointer group focus:outline-none"
              >
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
              </button>

              <ProfileMenu 
                showProfileMenu={showProfileMenu} 
                setShowProfileMenu={setShowProfileMenu} 
                handleLogout={handleLogout} 
              />
            </div>

            <MegaMenu 
              isOpen={isOpen} 
              setIsOpen={setIsOpen} 
              userRole={userRole} 
            />
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

// Subcomponents extracted for rendering memoization and preventing cascade re-renders
interface MegaMenuProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  userRole: string
}

const MegaMenu = React.memo(({ isOpen, setIsOpen, userRole }: MegaMenuProps) => {
  if (!isOpen) return null
  return (
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
  )
})
MegaMenu.displayName = 'MegaMenu'

interface ProfileMenuProps {
  showProfileMenu: boolean
  setShowProfileMenu: (show: boolean) => void
  handleLogout: () => void
}

const ProfileMenu = React.memo(({ showProfileMenu, setShowProfileMenu, handleLogout }: ProfileMenuProps) => {
  if (!showProfileMenu) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowProfileMenu(false)} />
      <div className="absolute top-full right-0 mt-3.5 w-56 bg-[#090d16]/95 border border-white/[0.08] rounded-2xl p-2 backdrop-blur-2xl shadow-2xl z-50 animate-fade-in flex flex-col gap-1">
        <Link
          href="/profile"
          onClick={() => setShowProfileMenu(false)}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/[0.03] transition-all"
        >
          <User size={14} className="text-neutral-400" />
          <span>View Profile</span>
        </Link>
        <Link
          href="/profile?edit=true"
          onClick={() => setShowProfileMenu(false)}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/[0.03] transition-all"
        >
          <Settings size={14} className="text-neutral-400" />
          <span>Settings</span>
        </Link>
        <div className="h-px bg-white/[0.06] my-1" />
        <button
          onClick={() => {
            setShowProfileMenu(false)
            handleLogout()
          }}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left w-full"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </>
  )
})
ProfileMenu.displayName = 'ProfileMenu'

interface NotificationsDropdownProps {
  showNotifications: boolean
  setShowNotifications: (show: boolean) => void
  unreadCount: number
  notifications: any[]
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationsDropdown = React.memo(({
  showNotifications,
  setShowNotifications,
  unreadCount,
  notifications,
  markAsRead,
  markAllAsRead
}: NotificationsDropdownProps) => {
  const [parent] = useAutoAnimate()
  if (!showNotifications) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
      <div className="absolute top-full right-0 mt-3.5 w-80 bg-[#090d16]/95 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-2xl shadow-2xl z-50 animate-fade-in max-h-[420px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
          <p className="text-[10px] font-bold font-mono uppercase text-zinc-400 tracking-wider">Notifications</p>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 font-bold uppercase transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div ref={parent} className="flex flex-col gap-1.5 overflow-y-auto max-h-[320px] custom-scrollbar pr-0.5">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto text-zinc-700 mb-2" size={24} />
              <p className="text-[11px] text-zinc-500 italic">No new notifications</p>
            </div>
          ) : (
            notifications.map(notif => (
              <Link 
                key={notif.id}
                href={notif.link || '#'}
                onClick={() => {
                  markAsRead(notif.id)
                  setShowNotifications(false)
                }}
                className={clsx(
                  "flex gap-2.5 p-2 rounded-xl transition-all border border-transparent text-left",
                  notif.read 
                    ? "bg-transparent hover:bg-white/[0.02]" 
                    : "bg-cyan-500/[0.03] border-cyan-500/10 hover:bg-cyan-500/[0.06] hover:border-cyan-500/15"
                )}
              >
                <div className="shrink-0 mt-1">
                  <span className={clsx(
                    "w-1.5 h-1.5 rounded-full block",
                    notif.read ? "bg-zinc-700" : "bg-cyan-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    "text-[11px] leading-snug truncate",
                    notif.read ? "text-zinc-400 font-normal" : "text-zinc-100 font-bold"
                  )}>
                    {notif.title}
                  </p>
                  {notif.content && (
                    <p className="text-[9px] text-zinc-500 mt-0.5 line-clamp-2 leading-normal">
                      {notif.content}
                    </p>
                  )}
                  <p className="text-[8px] font-mono text-zinc-600 mt-1 flex items-center gap-1">
                    <Clock size={8} />
                    {format(new Date(notif.created_at), 'd MMM, h:mm a')}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  )
})
NotificationsDropdown.displayName = 'NotificationsDropdown'
