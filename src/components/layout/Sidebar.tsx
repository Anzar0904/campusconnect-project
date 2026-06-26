'use client'
import React, { useState, useEffect } from 'react'
import { LogOut, Network, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

interface NavItem { label: string; href: string; icon: string; badge?: number; phase?: number }
interface NavSection { label: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Social',
    items: [
      { label: 'Home Feed',    href: '/dashboard', icon: 'home' },
      { label: 'Friends',      href: '/friends',   icon: 'group' },
      { label: 'Discover',     href: '/discover',  icon: 'travel_explore' },
      { label: 'Messages', href: '/messages', icon: 'chat_bubble' },
      { label: 'My Profile',   href: '/profile',   icon: 'person' },
    ],
  },
  {
    label: 'Campus Life',
    items: [
      { label: 'Communities',  href: '/community',  icon: 'diversity_3' },
      { label: 'Clubs',        href: '/clubs',      icon: 'sports_esports' },
      { label: 'Events',       href: '/events',     icon: 'event' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Notes Library', href: '/notes',    icon: 'menu_book' },
      { label: 'Past Papers',   href: '/papers',   icon: 'description' },
      { label: 'Study Hub',     href: '/study',    icon: 'school' },
      { label: 'Coding Arena',  href: '/coding-arena', icon: 'terminal' },
      { label: 'Calendar',      href: '/calendar', icon: 'calendar_month' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Buy & Sell',   href: '/marketplace', icon: 'storefront' },
    ],
  },
  {
    label: 'Career',
    items: [
      { label: 'Internships',  href: '/internships', icon: 'work_outline' },
      { label: 'Placements',   href: '/placements',  icon: 'business_center' },
      { label: 'Mentorship',   href: '/mentorship',  icon: 'psychology' },
      { label: 'Startup Cell', href: '/startup',     icon: 'rocket_launch' },
    ],
  },
  {
    label: 'Special',
    items: [
      { label: 'Dating',        href: '/dating',       icon: 'favorite' },
      { label: 'AI Assistant',  href: '/ai',           icon: 'smart_toy' },
      { label: 'Super Admin', href: '/super-admin', icon: 'admin_panel_settings' },
    ],
  },
]

interface SidebarProps {
  collegeName: string
  userName?: string | null
  userAvatar?: string | null
  isVerified?: boolean
  userRole?: string
  notificationCount?: number
}

export function Sidebar({ 
  collegeName, 
  userName, 
  userAvatar, 
  isVerified, 
  userRole,
  notificationCount = 0 
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load and apply initial collapse setting
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('cc_sidebar_collapsed') === 'true'
    setIsCollapsed(stored)
    document.documentElement.style.setProperty('--sidebar-width', stored ? '78px' : '256px')
  }, [])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('cc_sidebar_collapsed', String(next))
    document.documentElement.style.setProperty('--sidebar-width', next ? '78px' : '256px')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const filteredNavSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.label === 'Dating' && !isVerified && userRole !== 'SUPER_ADMIN') return false;
      if (item.label === 'Super Admin' && userRole !== 'SUPER_ADMIN' && userRole !== 'COLLEGE_ADMIN')
        return false;
      return true;
    }).map(item => {
      if (item.href === '/messages' && notificationCount > 0) {
        return { ...item, badge: notificationCount }
      }
      return item
    })
  })).filter(section => section.items.length > 0)

  return (
    <aside 
      className="fixed left-0 top-0 h-screen hidden md:flex flex-col z-40 overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.25,1,0.5,1)]"
      style={{ 
        width: 'var(--sidebar-width, 256px)',
        background: 'rgba(9,9,11,0.95)', 
        borderRight: '1px solid rgba(255,255,255,0.06)', 
        backdropFilter: 'blur(40px)' 
      }}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-5 py-6 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300"
            style={{ 
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', 
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
              transform: isCollapsed ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            <Network className="text-white" size={18} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="font-display font-bold text-[14px] text-zinc-50 leading-tight tracking-wide uppercase">CampusConnect</p>
              <p className="text-[9px] font-mono text-zinc-500 truncate mt-0.5">{collegeName}</p>
            </div>
          )}
        </div>
        <button 
          onClick={toggleCollapse}
          className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 ml-1.5 shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {filteredNavSections.map(section => (
          <div key={section.label}>
            {!isCollapsed ? (
              <p className="font-mono text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-4 mb-2 animate-fade-in">
                {section.label}
              </p>
            ) : (
              <div className="h-px bg-white/[0.06] my-4 mx-2" />
            )}
            
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={clsx(
                      'relative flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 group',
                      active ? 'text-brand-400 bg-brand-500/5 font-semibold' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]',
                      isCollapsed && 'justify-center px-2'
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute left-0 w-1 h-4 bg-brand-500 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span 
                      className={clsx(
                        "material-symbols-outlined text-[20px] transition-all duration-300",
                        active ? "text-brand-400 scale-110 rotate-[5deg]" : "text-zinc-500 group-hover:text-zinc-300 group-hover:scale-105"
                      )}
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    
                    {!isCollapsed && (
                      <span className="flex-1 text-[13px] font-medium tracking-tight truncate animate-fade-in">
                        {item.label}
                      </span>
                    )}

                    {(item.badge ?? 0) > 0 && (
                      !isCollapsed ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          {item.badge}
                        </span>
                      ) : (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 border border-zinc-950 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/[0.04] bg-white/[0.01] shrink-0">
        <div className={clsx(
          "flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.03] shadow-premium transition-all duration-300",
          isCollapsed && "justify-center"
        )}>
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-tr from-brand-500 to-cyan-400 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity" />
            <GlobalAvatar 
              avatarUrl={userAvatar}
              fullName={userName}
              size="sm"
              className="relative w-8 h-8 rounded-full ring-1 ring-white/10"
            />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-[12px] font-display font-semibold text-zinc-100 truncate tracking-tight">{userName || 'Student'}</p>
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter mt-0.5">Verified</p>
              </div>
              <button 
                onClick={signOut} 
                title="Sign out"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 shrink-0"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
