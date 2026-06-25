'use client'

import React, { useState } from 'react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { 
  Home, 
  Users, 
  MessageSquare, 
  User, 
  MessageCircle, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Store, 
  Briefcase, 
  Sparkles, 
  ShieldAlert,
  Bell,
  ChevronDown,
  LogIn,
  Settings,
  LogOut,
  Plus,
  Clock,
  PlusCircle,
  FileUp,
  Tags,
  CalendarPlus,
  FolderPlus
} from 'lucide-react'
import Link from 'next/navigation'
import { useRouter, usePathname } from 'next/navigation'
import LinkComponent from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { clsx } from 'clsx'
import { NavbarSearch } from './NavbarSearch'
import { useNotifications } from '@/hooks/useNotifications'
import { format } from 'date-fns'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { motion, AnimatePresence } from 'framer-motion'

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

const PRIMARY_LINKS = [
  { label: 'Feed', href: '/dashboard', icon: Home },
  { label: 'Communities', href: '/community', icon: MessageCircle },
  { label: 'Study Hub', href: '/study', icon: GraduationCap },
  { label: 'Marketplace', href: '/marketplace', icon: Store },
  { label: 'Internships', href: '/internships', icon: Briefcase },
]

export const Navbar: React.FC<NavbarProps> = ({ profile: initialProfile }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { profile: currentProfile } = useCurrentProfile()
  const profile = currentProfile || initialProfile
  const userRole = profile?.role?.toUpperCase() || 'STUDENT'
  const pathname = usePathname()
  const router = useRouter()

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

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-8 max-w-7xl mx-auto pointer-events-none">
      <nav className="pointer-events-auto h-16 w-full glass-panel-base rounded-2xl px-4 sm:px-6 flex items-center justify-between gap-4 transition-all duration-300">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <LinkComponent href="/" className="flex items-center gap-2.5">
            <svg className="w-8 h-8 shrink-0 drop-shadow-[0_0_10px_rgba(99,102,241,0.45)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M75,28 C62,13 38,13 25,28 C12,43 12,63 25,78 C38,93 62,93 75,78 C82,71 85,62 84,53 C83,48 78,49 79,54 C80,60 78,66 73,71 C63,81 43,81 33,71 C23,61 23,45 33,35 C43,25 63,25 73,35 C77,39 79,45 79,51 C79,56 84,55 84,50 C84,41 81,34 75,28 Z"
                fill="url(#c-gradient-nav)"
                strokeWidth="1"
              />
              <defs>
                <linearGradient id="c-gradient-nav" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-white font-display font-bold text-base tracking-tight hidden lg:block">
              Campus<span className="text-zinc-400 font-normal">Connect</span>
            </span>
          </LinkComponent>
        </div>

        {/* Desktop Primary Nav Tabs */}
        {profile && (
          <div className="hidden md:flex items-center gap-1">
            {PRIMARY_LINKS.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`)
              return (
                <LinkComponent
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "relative px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all duration-300 select-none",
                    active ? "text-brand-400 bg-brand-500/10" : "text-zinc-400 hover:text-zinc-50 hover:bg-white/[0.03]"
                  )}
                >
                  {link.label}
                </LinkComponent>
              )
            })}
          </div>
        )}

        {/* Global Search input trigger (integrated beautifully) */}
        {profile && <NavbarSearch />}

        {/* Actions Menu */}
        <div className="flex items-center gap-2 relative">
          {profile ? (
            <>
              {/* Quick Create Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowQuickCreate(!showQuickCreate)
                    setShowNotifications(false)
                    setShowProfileMenu(false)
                  }}
                  className={clsx(
                    "w-9 h-9 sm:w-10 sm:h-10 text-zinc-400 hover:text-zinc-50 hover:bg-white/[0.04] transition-all rounded-xl flex items-center justify-center border border-white/[0.05]",
                    showQuickCreate && "text-white bg-white/[0.05]"
                  )}
                  aria-label="Quick Create"
                >
                  <Plus size={18} />
                </button>

                <AnimatePresence>
                  {showQuickCreate && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowQuickCreate(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="absolute right-0 mt-3 w-56 glass-panel-base rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 border border-white/[0.08]"
                      >
                        <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-3 py-1.5 select-none">
                          Quick Create
                        </p>
                        
                        <LinkComponent
                          href="/dashboard?create=true"
                          onClick={() => setShowQuickCreate(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.03] transition-all"
                        >
                          <PlusCircle size={15} className="text-zinc-500" />
                          <span>Create Post</span>
                        </LinkComponent>

                        <LinkComponent
                          href="/community?create=true"
                          onClick={() => setShowQuickCreate(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.03] transition-all"
                        >
                          <FolderPlus size={15} className="text-zinc-500" />
                          <span>New Community</span>
                        </LinkComponent>

                        <LinkComponent
                          href="/notes?upload=true"
                          onClick={() => setShowQuickCreate(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.03] transition-all"
                        >
                          <FileUp size={15} className="text-zinc-500" />
                          <span>Upload Notes</span>
                        </LinkComponent>

                        <LinkComponent
                          href="/marketplace?create=true"
                          onClick={() => setShowQuickCreate(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.03] transition-all"
                        >
                          <Tags size={15} className="text-zinc-500" />
                          <span>Sell an Item</span>
                        </LinkComponent>

                        {isAdmin && (
                          <LinkComponent
                            href="/events?create=true"
                            onClick={() => setShowQuickCreate(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.03] transition-all border-t border-white/[0.04] pt-2"
                          >
                            <CalendarPlus size={15} className="text-zinc-500" />
                            <span>Create Event</span>
                          </LinkComponent>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Dedicated Sparkly AI Shortcut */}
              <LinkComponent
                href="/ai"
                className={clsx(
                  "w-9 h-9 sm:w-10 sm:h-10 text-zinc-400 hover:text-zinc-50 hover:bg-brand-500/10 hover:border-brand-500/20 hover:text-brand-400 transition-all rounded-xl flex items-center justify-center border border-white/[0.05]",
                  pathname === '/ai' && "text-brand-400 bg-brand-500/10 border-brand-500/20"
                )}
                aria-label="AI Assistant"
              >
                <Sparkles size={16} className="animate-pulse" />
              </LinkComponent>

              {/* Notifications Popover */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowQuickCreate(false)
                    setShowProfileMenu(false)
                  }}
                  className={clsx(
                    "relative w-9 h-9 sm:w-10 sm:h-10 text-zinc-400 hover:text-zinc-50 hover:bg-white/[0.04] transition-all rounded-xl flex items-center justify-center border border-white/[0.05]",
                    showNotifications && "text-white bg-white/[0.05]"
                  )}
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 bg-cyan-400 text-[8px] text-zinc-950 rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <NotificationsDropdown 
                      showNotifications={showNotifications} 
                      setShowNotifications={setShowNotifications} 
                      unreadCount={unreadCount} 
                      notifications={notifications} 
                      markAsRead={markAsRead} 
                      markAllAsRead={markAllAsRead} 
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Vertical line divider */}
              <div className="h-5 w-px bg-white/[0.08] mx-1 hidden sm:block" />

              {/* Profile Avatar Menu */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu)
                    setShowQuickCreate(false)
                    setShowNotifications(false)
                  }}
                  className="flex items-center gap-2 pl-1 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-500/40 rounded-xl"
                >
                  <GlobalAvatar
                    avatarUrl={profile.avatar_url}
                    fullName={profile.full_name || undefined}
                    username={profile.username || undefined}
                    size="sm"
                    className="border border-white/10"
                  />
                  <ChevronDown size={12} className="text-zinc-500 group-hover:text-zinc-300 transition-colors hidden sm:block" />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <ProfileMenu 
                      showProfileMenu={showProfileMenu} 
                      setShowProfileMenu={setShowProfileMenu} 
                      handleLogout={handleLogout} 
                      isAdmin={isAdmin}
                    />
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <LinkComponent href="/auth/login" className="btn-premium px-4 py-2 text-xs">
              <LogIn size={14} />
              <span>Sign In</span>
            </LinkComponent>
          )}
        </div>
      </nav>
    </div>
  )
}

// Subcomponents
interface ProfileMenuProps {
  showProfileMenu: boolean
  setShowProfileMenu: (show: boolean) => void
  handleLogout: () => void
  isAdmin: boolean
}

const ProfileMenu = React.memo(({ showProfileMenu, setShowProfileMenu, handleLogout, isAdmin }: ProfileMenuProps) => {
  if (!showProfileMenu) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowProfileMenu(false)} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="absolute right-0 mt-3 w-56 glass-panel-base rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 border border-white/[0.08]"
      >
        <LinkComponent
          href="/profile"
          onClick={() => setShowProfileMenu(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.03] transition-all"
        >
          <User size={14} className="text-zinc-500" />
          <span>View Profile</span>
        </LinkComponent>
        <LinkComponent
          href="/profile?edit=true"
          onClick={() => setShowProfileMenu(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.03] transition-all"
        >
          <Settings size={14} className="text-zinc-500" />
          <span>Account Settings</span>
        </LinkComponent>

        {isAdmin && (
          <LinkComponent
            href="/super-admin"
            onClick={() => setShowProfileMenu(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.03] transition-all"
          >
            <ShieldAlert size={14} className="text-zinc-500" />
            <span>Platform Admin</span>
          </LinkComponent>
        )}

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
      </motion.div>
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="absolute right-0 mt-3 w-80 glass-panel-base rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-2 border border-white/[0.08] max-h-[420px] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-2 select-none">
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
            <div className="py-8 text-center select-none">
              <Bell className="mx-auto text-zinc-700 mb-2" size={24} />
              <p className="text-[11px] text-zinc-500 italic">No new notifications</p>
            </div>
          ) : (
            notifications.map(notif => (
              <LinkComponent 
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
                    : "bg-brand-500/[0.03] border-brand-500/10 hover:bg-brand-500/[0.06] hover:border-brand-500/15"
                )}
              >
                <div className="shrink-0 mt-1">
                  <span className={clsx(
                    "w-1.5 h-1.5 rounded-full block",
                    notif.read ? "bg-zinc-700" : "bg-brand-400"
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
              </LinkComponent>
            ))
          )}
        </div>
      </motion.div>
    </>
  )
})
NotificationsDropdown.displayName = 'NotificationsDropdown'

