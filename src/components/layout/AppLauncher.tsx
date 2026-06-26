'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { 
  Home, MessageSquare, Users, Bell, MessageCircle, 
  GraduationCap, BookOpen, Terminal, Sparkles, FileText, 
  Briefcase, Award, Trophy, Store, Calendar, Gamepad2, 
  Compass, MapPin, Heart, EyeOff, User, Settings, Palette, 
  ShieldCheck, Bookmark, ShieldAlert, Search, X, Star, Rocket, UserCheck
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Easing, getPrefersReducedMotion } from '@/hooks/useGsapMotion'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { cn } from '@/lib/utils'

interface AppLauncherProps {
  isOpen: boolean
  onClose: () => void
}

interface ModuleItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<any>
  desc: string
  category: string
  disabled?: boolean
  requiredRole?: string[]
}

const ALL_MODULES: ModuleItem[] = [
  // Communication
  { id: 'feed', label: 'Feed', href: '/dashboard', icon: Home, desc: 'Public campus discussion and updates', category: 'Communication' },
  { id: 'messages', label: 'Messages', href: '/messages', icon: MessageSquare, desc: 'Direct messages with peers', category: 'Communication' },
  { id: 'friends', label: 'Friends', href: '/friends', icon: Users, desc: 'Connect and view friend list', category: 'Communication' },
  { id: 'notifications', label: 'Notifications', href: '#notifications', icon: Bell, desc: 'Real-time alerts and activity updates', category: 'Communication' },
  { id: 'communities', label: 'Communities', href: '/community', icon: MessageCircle, desc: 'Explore interest-based student groups', category: 'Communication' },

  // Learning
  { id: 'study', label: 'Study Hub', href: '/study', icon: GraduationCap, desc: 'Create and join virtual study rooms', category: 'Learning' },
  { id: 'notes', label: 'Notes Library', href: '/notes', icon: BookOpen, desc: 'Access and share student notes', category: 'Learning' },
  { id: 'coding', label: 'Coding Arena', href: '/coding-arena', icon: Terminal, desc: 'Practice coding and compete in challenges', category: 'Learning' },
  { id: 'ai', label: 'AI Assistant', href: '/ai', icon: Sparkles, desc: 'Get help from the Campus AI assistant', category: 'Learning' },
  { id: 'papers', label: 'Resources', href: '/papers', icon: FileText, desc: 'Browse past exams and study papers', category: 'Learning' },

  // Career
  { id: 'internships', label: 'Internships', href: '/internships', icon: Briefcase, desc: 'Apply to verified student internships', category: 'Career' },
  { id: 'mentorship', label: 'Mentorship', href: '/mentorship', icon: UserCheck, desc: 'Connect with senior mentors and guides', category: 'Career' },
  { id: 'placements', label: 'Placements', href: '/placements', icon: Briefcase, desc: 'View campus placement records and openings', category: 'Career' },
  { id: 'resume', label: 'Resume Builder', href: '#disabled', icon: Award, desc: 'Generate a professional resume (Coming Soon)', category: 'Career', disabled: true },
  { id: 'rewards', label: 'Rewards', href: '/rewards', icon: Award, desc: 'Earn points and redeem prizes', category: 'Career' },
  { id: 'leaderboard', label: 'Leaderboard', href: '/rewards?tab=leaderboard', icon: Trophy, desc: 'Compare your achievements with peers', category: 'Career' },

  // Campus
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace', icon: Store, desc: 'Buy and sell student items on campus', category: 'Campus' },
  { id: 'events', label: 'Events', href: '/events', icon: Calendar, desc: 'Discover upcoming college events', category: 'Campus' },
  { id: 'calendar', label: 'Calendar', href: '/calendar', icon: Calendar, desc: 'View scheduled classes and academic dates', category: 'Campus' },
  { id: 'clubs', label: 'Clubs', href: '/clubs', icon: Gamepad2, desc: 'Browse student organizations and clubs', category: 'Campus' },
  { id: 'startup', label: 'Startup Cell', href: '/startup', icon: Rocket, desc: 'Incubate and develop your business ideas', category: 'Campus' },
  { id: 'directory', label: 'Campus Directory', href: '/discover', icon: Compass, desc: 'Find other verified campus students', category: 'Campus' },
  { id: 'map', label: 'Campus Map', href: '#disabled', icon: MapPin, desc: 'Find campus buildings & venues (Coming Soon)', category: 'Campus', disabled: true },

  // Social
  { id: 'dating', label: 'Dating', href: '/dating', icon: Heart, desc: 'Meet other verified campus students', category: 'Social' },
  { id: 'confessions', label: 'Confessions', href: '#disabled', icon: EyeOff, desc: 'Post anonymous student confessions (Coming Soon)', category: 'Social', disabled: true },
  { id: 'groups', label: 'Groups', href: '/community', icon: Users, desc: 'Join specific student subgroups', category: 'Social' },

  // Personal
  { id: 'profile', label: 'Profile', href: '/profile', icon: User, desc: 'View your public profile and accomplishments', category: 'Personal' },
  { id: 'settings', label: 'Account Settings', href: '/settings', icon: Settings, desc: 'Edit profile info and credentials', category: 'Personal' },
  { id: 'appearance', label: 'Appearance', href: '/settings?tab=appearance', icon: Palette, desc: 'Customize themes and visual layouts', category: 'Personal' },
  { id: 'privacy', label: 'Privacy', href: '/settings?tab=appearance', icon: ShieldCheck, desc: 'Control visibility and active status', category: 'Personal' },
  { id: 'saved', label: 'Saved Posts', href: '#disabled', icon: Bookmark, desc: 'View bookmarks and saved items (Coming Soon)', category: 'Personal', disabled: true },

  // Administration (Filtered dynamically by role)
  { id: 'moderator', label: 'Moderator', href: '/super-admin?tab=moderation', icon: ShieldAlert, desc: 'Moderate reported posts and activity', category: 'Administration', requiredRole: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ADMIN', 'MODERATOR'] },
  { id: 'college_admin', label: 'College Admin', href: '/super-admin?tab=admins', icon: ShieldAlert, desc: 'Configure college settings and invites', category: 'Administration', requiredRole: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ADMIN'] },
  { id: 'platform_admin', label: 'Platform Admin', href: '/super-admin', icon: ShieldAlert, desc: 'Full root level configuration control', category: 'Administration', requiredRole: ['SUPER_ADMIN'] }
]

const CATEGORIES = ['All', 'Communication', 'Learning', 'Career', 'Campus', 'Social', 'Personal', 'Administration']

export default function AppLauncher({ isOpen, onClose }: AppLauncherProps) {
  const router = useRouter()
  const { profile } = useCurrentProfile()
  const userRole = profile?.role?.toUpperCase() || 'STUDENT'

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [favorites, setFavorites] = useState<string[]>([])
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([])
  const [focusedIndex, setFocusedIndex] = useState(0)

  const backdropRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemsContainerRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const [shouldRender, setShouldRender] = useState(isOpen)

  // Sync state and run transitions
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    } else if (shouldRender) {
      if (getPrefersReducedMotion()) {
        setShouldRender(false)
        return
      }

      const tl = gsap.timeline({
        onComplete: () => {
          setShouldRender(false)
        }
      })

      tl.to(containerRef.current, {
        opacity: 0,
        scale: 0.93,
        y: 20,
        duration: 0.3,
        ease: 'power2.inOut'
      })
      .to(backdropRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.inOut'
      }, 0)
    }
  }, [isOpen, shouldRender])

  // Load favorites & recently used from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedFavs = localStorage.getItem('campusconnect_favorites')
        if (storedFavs) setFavorites(JSON.parse(storedFavs))

        const storedRecents = localStorage.getItem('campusconnect_recently_used')
        if (storedRecents) setRecentlyUsed(JSON.parse(storedRecents))
      } catch (err) {
        console.error('Failed to load App Launcher cache', err)
      }
    }
  }, [isOpen])

  // Filter modules based on role permissions and search query
  const filteredModules = useMemo(() => {
    return ALL_MODULES.filter(mod => {
      // Role access check for Administration
      if (mod.category === 'Administration') {
        if (!mod.requiredRole) return false
        return mod.requiredRole.includes(userRole)
      }
      return true
    })
  }, [userRole])

  // Visible modules according to Category and Search Query
  const visibleModules = useMemo(() => {
    return filteredModules.filter(mod => {
      // Category filter
      if (selectedCategory !== 'All' && mod.category !== selectedCategory) {
        return false
      }
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        return (
          mod.label.toLowerCase().includes(query) ||
          mod.desc.toLowerCase().includes(query) ||
          mod.category.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [filteredModules, selectedCategory, searchQuery])

  // Separate Favorites list
  const favoriteModules = useMemo(() => {
    return filteredModules.filter(mod => favorites.includes(mod.id))
  }, [filteredModules, favorites])

  // Separate Recently Used list
  const recentlyUsedModules = useMemo(() => {
    return filteredModules
      .filter(mod => recentlyUsed.includes(mod.id))
      .sort((a, b) => recentlyUsed.indexOf(a.id) - recentlyUsed.indexOf(b.id))
      .slice(0, 4)
  }, [filteredModules, recentlyUsed])

  // Toggle favorite status
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id]
    setFavorites(updated)
    localStorage.setItem('campusconnect_favorites', JSON.stringify(updated))
  }

  // Handle launch module
  const handleLaunch = useCallback((mod: ModuleItem) => {
    if (mod.disabled) return

    // Update recently used
    const updatedRecents = [mod.id, ...recentlyUsed.filter(id => id !== mod.id)].slice(0, 8)
    setRecentlyUsed(updatedRecents)
    localStorage.setItem('campusconnect_recently_used', JSON.stringify(updatedRecents))

    // Close launcher & navigate
    onClose()
    
    if (mod.href === '#notifications') {
      window.dispatchEvent(new CustomEvent('open-notifications'))
    } else {
      router.push(mod.href)
    }
  }, [recentlyUsed, onClose, router])

  // GSAP Animations
  useGSAP(() => {
    if (!isOpen || !shouldRender) return
    if (getPrefersReducedMotion()) {
      gsap.set(backdropRef.current, { opacity: 1 })
      gsap.set(containerRef.current, { opacity: 1, scale: 1, y: 0 })
      return
    }

    // Modal Opening animations
    gsap.fromTo(backdropRef.current, 
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: 'power2.out' }
    )

    gsap.fromTo(containerRef.current,
      { opacity: 0, scale: 0.93, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: Easing.premium }
    )

    // Category button stagger reveal
    const categoryButtons = Object.values(categoryRefs.current).filter(Boolean)
    gsap.fromTo(categoryButtons,
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, stagger: 0.03, duration: 0.3, ease: 'power2.out', delay: 0.1 }
    )

    // Cards stagger reveal
    const cards = containerRef.current?.querySelectorAll('.app-card') || []
    if (cards.length > 0) {
      gsap.fromTo(cards,
        { opacity: 0, y: 15, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.02, duration: 0.4, ease: 'back.out(1.2)', delay: 0.15 }
      )
    }

    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 150)
  }, { dependencies: [isOpen, shouldRender, selectedCategory] })

  // Keyboard navigation & search handlers
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key closes the launcher
      if (e.key === 'Escape') {
        onClose()
        return
      }

      const totalItems = visibleModules.length
      if (totalItems === 0) return

      // Keyboard navigation logic
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        // For a 3-column grid on desktop, 2 on tablet, 1 on mobile. Let's do simple wrapping
        setFocusedIndex(prev => (prev + 1) % totalItems)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(prev => (prev - 1 + totalItems) % totalItems)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (visibleModules[focusedIndex]) {
          handleLaunch(visibleModules[focusedIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, visibleModules, focusedIndex, onClose, handleLaunch])

  // Scroll focused card into view if needed
  useEffect(() => {
    if (itemsContainerRef.current) {
      const activeCard = itemsContainerRef.current.querySelector('.app-card-active')
      if (activeCard) {
        activeCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [focusedIndex])

  // Reset focus index when category or search changes
  useEffect(() => {
    setFocusedIndex(0)
  }, [selectedCategory, searchQuery])

  if (!shouldRender) return null

  // Card hover entry/leave animations using GSAP
  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (getPrefersReducedMotion()) return
    const card = e.currentTarget
    gsap.to(card, {
      scale: 1.025,
      y: -2,
      borderColor: 'rgba(99, 102, 241, 0.25)',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      duration: 0.25,
      ease: 'power2.out'
    })
    const icon = card.querySelector('.app-icon-container')
    if (icon) {
      gsap.to(icon, {
        scale: 1.15,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        duration: 0.25,
        ease: 'power2.out'
      })
    }
  }

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (getPrefersReducedMotion()) return
    const card = e.currentTarget
    gsap.to(card, {
      scale: 1,
      y: 0,
      borderColor: 'rgba(255, 255, 255, 0.04)',
      backgroundColor: 'rgba(255, 255, 255, 0.01)',
      duration: 0.25,
      ease: 'power2.out'
    })
    const icon = card.querySelector('.app-icon-container')
    if (icon) {
      gsap.to(icon, {
        scale: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        duration: 0.25,
        ease: 'power2.out'
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-10 select-none">
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0 bg-[#030712]/75 backdrop-blur-[12px] transition-opacity cursor-pointer"
      />

      {/* Main Command Center Modal */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-4xl h-[85vh] max-h-[640px] glass-panel-base border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
        style={{ background: 'rgba(9, 9, 11, 0.95)' }}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
          <Search size={18} className="text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search CampusConnect apps, categories, actions... (Esc to close)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-0 w-full"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.02] px-1.5 font-mono text-[9px] font-medium text-zinc-500">
            <span>ESC</span>
          </kbd>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Category Navigation Panel */}
          <aside className="w-48 border-r border-white/[0.05] bg-white/[0.01] p-3 hidden sm:flex flex-col gap-1 overflow-y-auto custom-scrollbar shrink-0 select-none">
            <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2.5 mb-2">
              Categories
            </p>
            {CATEGORIES.map((cat) => {
              // Hide administration category if current user role does not match any admin module
              if (cat === 'Administration') {
                const hasAdminAccess = ALL_MODULES.some(mod => mod.category === 'Administration' && mod.requiredRole?.includes(userRole))
                if (!hasAdminAccess) return null
              }
              const isActive = selectedCategory === cat
              return (
                <button
                  key={cat}
                  ref={el => { categoryRefs.current[cat] = el }}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold font-display tracking-wide transition-all duration-200 hover:bg-white/[0.03]",
                    isActive 
                      ? "text-brand-400 bg-brand-500/10 border border-brand-500/15" 
                      : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                  )}
                >
                  {cat}
                </button>
              )
            })}
          </aside>

          {/* Right Main Grid Panel */}
          <div 
            ref={itemsContainerRef}
            className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-6"
          >
            {/* Mobile Category Pill Selector */}
            <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-3 -mx-2 px-2 shrink-0 select-none custom-scrollbar border-b border-white/[0.05] mb-4">
              {CATEGORIES.map((cat) => {
                if (cat === 'Administration') {
                  const hasAdminAccess = ALL_MODULES.some(mod => mod.category === 'Administration' && mod.requiredRole?.includes(userRole))
                  if (!hasAdminAccess) return null
                }
                const isActive = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                      isActive
                        ? "bg-brand-500 text-white"
                        : "bg-white/5 text-zinc-400 border border-white/[0.05]"
                    )}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>

            {/* Pinned / Favorites Section (Only when not searching & showing All) */}
            {searchQuery === '' && selectedCategory === 'All' && favoriteModules.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Favorite Apps
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {favoriteModules.map((mod) => (
                    <AppCard 
                      key={`fav-${mod.id}`}
                      mod={mod}
                      isFavorite={true}
                      isFocused={false}
                      onToggleFavorite={(e) => toggleFavorite(mod.id, e)}
                      onLaunch={() => handleLaunch(mod)}
                      onMouseEnter={handleCardMouseEnter}
                      onMouseLeave={handleCardMouseLeave}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recently Used Section (Only when not searching & showing All) */}
            {searchQuery === '' && selectedCategory === 'All' && recentlyUsedModules.length > 0 && (
              <div className="space-y-2.5">
                <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                  Recently Used
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentlyUsedModules.map((mod) => (
                    <AppCard 
                      key={`recent-${mod.id}`}
                      mod={mod}
                      isFavorite={favorites.includes(mod.id)}
                      isFocused={false}
                      onToggleFavorite={(e) => toggleFavorite(mod.id, e)}
                      onLaunch={() => handleLaunch(mod)}
                      onMouseEnter={handleCardMouseEnter}
                      onMouseLeave={handleCardMouseLeave}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Primary / Filtered Grid Section */}
            <div className="space-y-3.5">
              <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                {searchQuery !== '' ? 'Search Results' : selectedCategory === 'All' ? 'All Applications' : `${selectedCategory} Modules`}
              </p>
              
              {visibleModules.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-3">
                    <Compass className="text-zinc-500" size={20} />
                  </div>
                  <p className="text-[12px] font-medium text-zinc-300">No applications found</p>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-[240px]">
                    Try refining your search query or selecting a different category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visibleModules.map((mod, index) => {
                    const isFocused = index === focusedIndex
                    const isFav = favorites.includes(mod.id)
                    return (
                      <AppCard 
                        key={mod.id}
                        mod={mod}
                        isFavorite={isFav}
                        isFocused={isFocused}
                        onToggleFavorite={(e) => toggleFavorite(mod.id, e)}
                        onLaunch={() => handleLaunch(mod)}
                        onMouseEnter={handleCardMouseEnter}
                        onMouseLeave={handleCardMouseLeave}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Internal Helper Card Component
interface AppCardProps {
  mod: ModuleItem
  isFavorite: boolean
  isFocused: boolean
  onToggleFavorite: (e: React.MouseEvent) => void
  onLaunch: () => void
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => void
}

function AppCard({ 
  mod, 
  isFavorite, 
  isFocused, 
  onToggleFavorite, 
  onLaunch,
  onMouseEnter,
  onMouseLeave
}: AppCardProps) {
  const Icon = mod.icon
  
  // Category-specific color theme classes
  const getThemeClass = (cat: string) => {
    switch (cat) {
      case 'Communication': return 'text-blue-400 group-hover:text-blue-300'
      case 'Learning': return 'text-purple-400 group-hover:text-purple-300'
      case 'Career': return 'text-amber-400 group-hover:text-amber-300'
      case 'Campus': return 'text-emerald-400 group-hover:text-emerald-300'
      case 'Social': return 'text-pink-400 group-hover:text-pink-300'
      case 'Administration': return 'text-red-400 group-hover:text-red-300'
      default: return 'text-zinc-400 group-hover:text-zinc-300'
    }
  }

  return (
    <div
      onClick={onLaunch}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "app-card flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.01] border border-white/[0.04] active:scale-98 transition-all group relative",
        mod.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        isFocused && "app-card-active border-brand-500/40 bg-white/[0.03] scale-[1.01] shadow-premium"
      )}
    >
      {/* Icon frame */}
      <div className="app-icon-container w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.05] shrink-0 transition-transform select-none">
        <Icon size={16} className={cn("transition-colors duration-200", getThemeClass(mod.category))} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-5 select-none">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-neutral-200 group-hover:text-white leading-tight truncate">
            {mod.label}
          </p>
          {mod.disabled && (
            <span className="text-[7px] font-mono font-bold px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase leading-none shrink-0">
              Soon
            </span>
          )}
        </div>
        <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
          {mod.desc}
        </p>
      </div>

      {/* Favorite pinning button */}
      {!mod.disabled && (
        <button
          onClick={onToggleFavorite}
          className={cn(
            "absolute right-2 top-2 p-1.5 rounded-lg text-zinc-600 hover:text-amber-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200",
            isFavorite && "opacity-100 text-amber-400"
          )}
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Star size={13} className={cn(isFavorite && "fill-amber-400")} />
        </button>
      )}
    </div>
  )
}
