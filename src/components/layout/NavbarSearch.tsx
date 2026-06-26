'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { 
  Search, Loader2, User, Users, BookOpen, Calendar, 
  Store, Briefcase, GraduationCap, X, BookMarked, 
  MessageCircle, FileText, Terminal, Sparkles, Clock, Compass,
  CornerDownLeft, Command, MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useGsapMagnetic } from '@/hooks/useGsapMotion'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  category: 'USERS' | 'COMMUNITIES' | 'CLUBS' | 'STUDY_GROUPS' | 'EVENTS' | 'INTERNSHIPS' | 'MARKETPLACE' | 'NOTES' | 'PAST_PAPERS' | 'MESSAGES'
  href: string
  score?: number
}

// Static platform modules list for quick local search matching
const STATIC_MODULES = [
  { title: 'Home Feed', category: 'COMMUNITIES', href: '/dashboard', subtitle: 'Realtime campus feed' },
  { title: 'Messages', category: 'MESSAGES', href: '/messages', subtitle: 'Direct peer chats' },
  { title: 'Communities', category: 'COMMUNITIES', href: '/community', subtitle: 'Interest groups & channels' },
  { title: 'Clubs', category: 'CLUBS', href: '/clubs', subtitle: 'Student-run clubs & societies' },
  { title: 'Events', category: 'EVENTS', href: '/events', subtitle: 'Campus events calendar' },
  { title: 'Notes Library', category: 'NOTES', href: '/notes', subtitle: 'Shared lecture notes & files' },
  { title: 'Past Papers', category: 'PAST_PAPERS', href: '/papers', subtitle: 'Exam question papers' },
  { title: 'Study Hub', category: 'STUDY_GROUPS', href: '/study', subtitle: 'Collaborative study rooms' },
  { title: 'Academic Calendar', category: 'EVENTS', href: '/calendar', subtitle: 'Timetables & schedules' },
  { title: 'Marketplace', category: 'MARKETPLACE', href: '/marketplace', subtitle: 'Buy & sell on campus' },
  { title: 'Internships', category: 'INTERNSHIPS', href: '/internships', subtitle: 'Recruiter internship postings' },
  { title: 'Placements Drive', category: 'INTERNSHIPS', href: '/placements', subtitle: 'Jobs package tracker' },
  { title: 'Dating Connect', category: 'USERS', href: '/dating', subtitle: 'Connect with campus singles' },
  { title: 'AI Assistant', category: 'USERS', href: '/ai', subtitle: 'Generative AI helper' }
] as const

const DEFAULT_RECENT = ['Computer', 'Hackathon', 'Software']

const CATEGORY_HEADINGS: Record<SearchResult['category'], string> = {
  USERS: 'Users',
  COMMUNITIES: 'Communities',
  CLUBS: 'Clubs',
  STUDY_GROUPS: 'Study Groups',
  EVENTS: 'Events',
  INTERNSHIPS: 'Internships',
  MARKETPLACE: 'Marketplace',
  NOTES: 'Notes',
  PAST_PAPERS: 'Past Papers',
  MESSAGES: 'Messages'
}

function getFuzzyScore(text: string | null | undefined, query: string): number {
  if (!text || typeof text !== 'string') return 0
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 60
  
  let score = 0
  let qIdx = 0
  for (let i = 0; i < t.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++
      score += 5
      if (qIdx === q.length) {
        return score + 10
      }
    }
  }
  return 0
}

interface PaletteItem {
  id: string
  title: string
  subtitle?: string
  category?: SearchResult['category']
  href?: string
  action?: () => void
  icon: React.ReactNode
  type: 'action' | 'module' | 'result' | 'recent'
}

export function NavbarSearch() {
  const searchBtnRef = useGsapMagnetic(0.12) as React.RefObject<HTMLButtonElement>
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  
  const modalInputRef = useRef<HTMLInputElement>(null)
  const lastQueryRef = useRef('')
  const cacheRef = useRef<Record<string, SearchResult[]>>({})
  const router = useRouter()
  
  // Memoize the supabase client instance to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])

  // Load user profile, role, & recent searches on mount
  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(async (res: any) => {
      const data = res.data
      if (data?.user) {
        setCurrentUserId(data.user.id)
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()
          if (profile?.role) {
            setUserRole(profile.role.toUpperCase())
          }
        } catch (e) {
          console.error('Error fetching role in NavbarSearch:', e)
        }
      }
    })
    try {
      const stored = localStorage.getItem('recent_searches')
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      } else {
        setRecentSearches(DEFAULT_RECENT)
      }
    } catch {
      setRecentSearches(DEFAULT_RECENT)
    }
  }, [supabase])

  // Handle Ctrl+K / Cmd+K shortcuts & lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        return
      }

      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
      const timer = setTimeout(() => {
        modalInputRef.current?.focus()
      }, 80)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Query database in parallel for all entities on query change (Debounced)
  useEffect(() => {
    const searchQuery = query.trim()
    if (!searchQuery) {
      setResults([])
      setLoading(false)
      lastQueryRef.current = ''
      return
    }

    if (searchQuery === lastQueryRef.current) {
      return
    }

    // 1. Check client-side query cache first
    if (cacheRef.current[searchQuery]) {
      setResults(cacheRef.current[searchQuery])
      setLoading(false)
      lastQueryRef.current = searchQuery
      return
    }

    // 2. Short queries (< 3 characters) only do static modules lookup
    if (searchQuery.length < 3) {
      const matchedList: SearchResult[] = []
      STATIC_MODULES.forEach(mod => {
        const score = Math.max(getFuzzyScore(mod.title, searchQuery), getFuzzyScore(mod.subtitle, searchQuery))
        if (score > 0) {
          matchedList.push({
            id: mod.href,
            title: mod.title,
            subtitle: mod.subtitle,
            category: mod.category as any,
            href: mod.href,
            score: score + 10
          })
        }
      })
      cacheRef.current[searchQuery] = matchedList
      setResults(matchedList)
      setSelectedIndex(0)
      setLoading(false)
      lastQueryRef.current = searchQuery
      return
    }

    setLoading(true)
    const delayDebounce = setTimeout(async () => {
      lastQueryRef.current = searchQuery
      try {
        const runQuery = async (queryBuilder: any) => {
          try {
            const res = await queryBuilder
            return res.error ? { data: null } : res
          } catch (e) {
            console.error('Search sub-query failed:', e)
            return { data: null }
          }
        }

        const [
          usersRes,
          commsRes,
          clubsRes,
          notesRes,
          eventsRes,
          marketRes,
          internRes,
          studyRes,
          papersRes,
          messagesRes
        ] = await Promise.all([
          runQuery(supabase.from('profiles').select('id, full_name, username').or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`).limit(3)),
          runQuery(supabase.from('communities').select('id, name, description').or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`).limit(3)),
          runQuery(supabase.from('clubs').select('id, name, description').or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`).limit(3)),
          runQuery(supabase.from('notes').select('id, title, subject').or(`title.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`).limit(3)),
          runQuery(supabase.from('events').select('id, title, description').or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`).limit(3)),
          runQuery(supabase.from('marketplace_items').select('id, title, price, description').eq('status', 'available').or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`).limit(3)),
          runQuery(supabase.from('internships').select('id, title, company').or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`).limit(3)),
          runQuery(supabase.from('study_groups').select('id, subject, venue').or(`subject.ilike.%${searchQuery}%,venue.ilike.%${searchQuery}%`).limit(3)),
          runQuery(supabase.from('exam_papers').select('id, subject, course_code').or(`subject.ilike.%${searchQuery}%,course_code.ilike.%${searchQuery}%`).limit(3)),
          runQuery(supabase.from('messages').select('id, content, sender_id, receiver_id').ilike('content', `%${searchQuery}%`).limit(3))
        ])

        const matchedList: SearchResult[] = []

        // 1. Fuzzy match local static modules/pages
        STATIC_MODULES.forEach(mod => {
          const score = Math.max(getFuzzyScore(mod.title, searchQuery), getFuzzyScore(mod.subtitle, searchQuery))
          if (score > 0) {
            matchedList.push({
              id: mod.href,
              title: mod.title,
              subtitle: mod.subtitle,
              category: mod.category as any,
              href: mod.href,
              score: score + 10 // Slight preference to static modules
            })
          }
        })

        // 2. Map Database results
        if (usersRes.data) {
          usersRes.data.forEach((u: any) => {
            matchedList.push({
              id: u.id,
              title: u.full_name || u.username || 'Anonymous User',
              subtitle: u.username ? `@${u.username}` : 'Student Portfolio',
              category: 'USERS',
              href: `/profile?id=${u.id}`
            })
          })
        }

        if (commsRes.data) {
          commsRes.data.forEach((c: any) => {
            matchedList.push({
              id: c.id,
              title: c.name || 'Unnamed Community',
              subtitle: c.description || 'Campus Community Hub',
              category: 'COMMUNITIES',
              href: `/community/${c.id}`
            })
          })
        }

        if (clubsRes.data) {
          clubsRes.data.forEach((c: any) => {
            matchedList.push({
              id: c.id,
              title: c.name || 'Unnamed Club',
              subtitle: c.description || 'Official student club',
              category: 'CLUBS',
              href: `/clubs?id=${c.id}`
            })
          })
        }

        if (notesRes.data) {
          notesRes.data.forEach((n: any) => {
            matchedList.push({
              id: n.id,
              title: n.title || 'Untitled Note',
              subtitle: n.subject || 'Lecture notes',
              category: 'NOTES',
              href: `/notes?id=${n.id}`
            })
          })
        }

        if (eventsRes.data) {
          eventsRes.data.forEach((e: any) => {
            matchedList.push({
              id: e.id,
              title: e.title || 'Untitled Event',
              subtitle: e.description || 'Upcoming campus event',
              category: 'EVENTS',
              href: `/events?id=${e.id}`
            })
          })
        }

        if (marketRes.data) {
          marketRes.data.forEach((m: any) => {
            matchedList.push({
              id: m.id,
              title: m.title || 'Untitled Item',
              subtitle: m.price ? `₹${m.price}` : 'Classified posting',
              category: 'MARKETPLACE',
              href: `/marketplace?id=${m.id}`
            })
          })
        }

        if (internRes.data) {
          internRes.data.forEach((i: any) => {
            matchedList.push({
              id: i.id,
              title: i.title || 'Untitled Position',
              subtitle: i.company || 'Campus Recruiter',
              category: 'INTERNSHIPS',
              href: `/internships?id=${i.id}`
            })
          })
        }

        if (studyRes.data) {
          studyRes.data.forEach((s: any) => {
            matchedList.push({
              id: s.id,
              title: s.subject || 'Untitled Study Group',
              subtitle: s.venue || 'Study Room',
              category: 'STUDY_GROUPS',
              href: `/study/${s.id}`
            })
          })
        }

        if (papersRes.data) {
          papersRes.data.forEach((p: any) => {
            matchedList.push({
              id: p.id,
              title: p.subject || 'Untitled Past Paper',
              subtitle: p.course_code || 'Exam Archive',
              category: 'PAST_PAPERS',
              href: `/papers?id=${p.id}`
            })
          })
        }

        if (messagesRes.data) {
          messagesRes.data.forEach((msg: any) => {
            const chatPartnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
            matchedList.push({
              id: msg.id,
              title: msg.content || 'Empty Message',
              subtitle: 'Chat Message',
              category: 'MESSAGES',
              href: `/messages?userId=${chatPartnerId}`
            })
          })
        }

        // Apply fuzzy scoring to database records & merge
        const finalRanked = matchedList
          .map(r => ({
            ...r,
            score: r.score !== undefined ? r.score : getFuzzyScore(r.title, searchQuery)
          }))
          .filter(r => r.score > 0)
          .sort((a, b) => (b.score || 0) - (a.score || 0))

        cacheRef.current[searchQuery] = finalRanked
        setResults(finalRanked)
        setSelectedIndex(0)
      } catch (err) {
        console.error('Unified lookup query error:', err)
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => clearTimeout(delayDebounce)
  }, [query, supabase, currentUserId])

  const getCategoryIcon = (category?: SearchResult['category']) => {
    switch (category) {
      case 'USERS': return <User size={14} />
      case 'COMMUNITIES': return <Users size={14} />
      case 'CLUBS': return <Users size={14} />
      case 'STUDY_GROUPS': return <BookMarked size={14} />
      case 'EVENTS': return <Calendar size={14} />
      case 'INTERNSHIPS': return <Briefcase size={14} />
      case 'MARKETPLACE': return <Store size={14} />
      case 'NOTES': return <BookOpen size={14} />
      case 'PAST_PAPERS': return <FileText size={14} />
      case 'MESSAGES': return <MessageSquare size={14} />
      default: return <Compass size={14} />
    }
  }

  // Calculate visible items for flat list navigation
  const visibleItems = useMemo(() => {
    const items: PaletteItem[] = []
    const sq = query.toLowerCase().trim()
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'

    if (!sq) {
      // 1. Suggested Actions
      items.push({
        id: 'action-create-community',
        title: 'Create Community',
        subtitle: 'Launch a new interest group or batch channel',
        href: '/community?create=true',
        type: 'action',
        icon: <Users size={14} className="text-purple-400" />
      })

      if (isAdmin) {
        items.push({
          id: 'action-create-event',
          title: 'Create Event',
          subtitle: 'Create a new campus event (Admin Only)',
          href: '/events?create=true',
          type: 'action',
          icon: <Calendar size={14} className="text-rose-400" />
        })
        items.push({
          id: 'action-create-internship',
          title: 'Create Internship',
          subtitle: 'Post a new internship opening (Admin Only)',
          href: '/internships?create=true',
          type: 'action',
          icon: <Briefcase size={14} className="text-cyan-400" />
        })
      }

      items.push(
        {
          id: 'action-messages',
          title: 'Go to Messages',
          subtitle: 'Open direct peer messages and chats',
          href: '/messages',
          type: 'action',
          icon: <MessageCircle size={14} className="text-blue-400" />
        },
        {
          id: 'action-profile',
          title: 'View My Profile',
          subtitle: 'Manage your student portfolio and resume',
          href: '/profile',
          type: 'action',
          icon: <User size={14} className="text-emerald-400" />
        }
      )

      // 2. Popular Modules
      const popularMods = STATIC_MODULES.slice(0, 8).map(mod => ({
        id: `module-${mod.href}`,
        title: mod.title,
        subtitle: mod.subtitle,
        href: mod.href,
        type: 'module' as const,
        icon: getCategoryIcon(mod.category)
      }))
      items.push(...popularMods)

      // 3. Recent Searches
      recentSearches.forEach((term, index) => {
        items.push({
          id: `recent-${index}-${term}`,
          title: term,
          subtitle: 'Execute previous search query',
          type: 'recent',
          action: () => {
            setQuery(term)
          },
          icon: <Clock size={14} className="text-zinc-500" />
        })
      })

    } else {
      // Query active quick actions
      if ('create event'.includes(sq) && isAdmin) {
        items.push({
          id: 'action-create-event-query',
          title: 'Create Event',
          subtitle: 'Launch the event creation wizard',
          href: '/events?create=true',
          type: 'action',
          icon: <Calendar size={14} className="text-rose-400" />
        })
      }
      if ('create internship'.includes(sq) && isAdmin) {
        items.push({
          id: 'action-create-internship-query',
          title: 'Create Internship',
          subtitle: 'Post a new internship listing',
          href: '/internships?create=true',
          type: 'action',
          icon: <Briefcase size={14} className="text-cyan-400" />
        })
      }
      if ('create community'.includes(sq)) {
        items.push({
          id: 'action-create-community-query',
          title: 'Create Community',
          subtitle: 'Start a new campus community',
          href: '/community?create=true',
          type: 'action',
          icon: <Users size={14} className="text-purple-400" />
        })
      }

      // Add database & matching results
      results.forEach(res => {
        items.push({
          id: `result-${res.category}-${res.id}`,
          title: res.title,
          subtitle: res.subtitle,
          category: res.category,
          href: res.href,
          type: 'result',
          icon: getCategoryIcon(res.category)
        })
      })
    }

    return items
  }, [query, results, userRole, recentSearches])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1 < visibleItems.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : visibleItems.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < visibleItems.length) {
        executeItem(visibleItems[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  const executeItem = (item: PaletteItem) => {
    if (item.action) {
      item.action()
    } else if (item.href) {
      // Add query to recent searches
      if (query.trim() && item.type === 'result') {
        const term = query.trim()
        setRecentSearches(prev => {
          const next = [term, ...prev.filter(x => x.toLowerCase() !== term.toLowerCase())].slice(0, 5)
          localStorage.setItem('recent_searches', JSON.stringify(next))
          return next
        })
      }
      router.push(item.href)
      setIsOpen(false)
      setQuery('')
    }
  }

  const removeRecentSearch = (term: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(x => x !== term)
      localStorage.setItem('recent_searches', JSON.stringify(next))
      return next
    })
  }

  // Group search results to render correct headings
  const groupedResults = useMemo(() => {
    const groups: Record<SearchResult['category'], PaletteItem[]> = {
      USERS: [],
      COMMUNITIES: [],
      CLUBS: [],
      STUDY_GROUPS: [],
      EVENTS: [],
      INTERNSHIPS: [],
      MARKETPLACE: [],
      NOTES: [],
      PAST_PAPERS: [],
      MESSAGES: []
    }
    visibleItems.forEach(item => {
      if (item.type === 'result' && item.category && groups[item.category]) {
        groups[item.category].push(item)
      }
    })
    return groups
  }, [visibleItems])

  const suggestedActionQueryItems = useMemo(() => {
    return visibleItems.filter(item => item.type === 'action' && query.trim().length > 0)
  }, [visibleItems, query])

  return (
    <div className="md:flex-1 md:max-w-xl md:mx-8 relative">
      {/* Rotating neon outline border */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rotatingGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .glowing-border {
          background: linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #06b6d4, #ec4899);
          background-size: 300% 300%;
          animation: rotatingGlow 4s linear infinite;
        }
        .palette-blur {
          backdrop-filter: blur(20px) saturate(190%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.3);
        }
      `}} />

      {/* Mobile search trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden w-11 h-11 text-neutral-400 hover:text-white transition-all rounded-xl hover:bg-white/[0.03] flex items-center justify-center border border-white/[0.05]"
        aria-label="Search"
      >
        <Search size={18} />
      </button>

      <button 
        ref={searchBtnRef}
        onClick={() => setIsOpen(true)}
        className="hidden md:block w-full max-w-[240px] p-[1.5px] rounded-full transition-all duration-300 relative glowing-border shadow-[0_0_10px_rgba(99,102,241,0.15)] hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-[1.005] active:scale-[0.995]"
      >
        <div className="bg-zinc-900/95 rounded-full flex items-center justify-between relative pl-4 pr-3 py-1.5 w-full border border-white/[0.04] text-left">
          <div className="flex items-center text-zinc-400">
            <Search size={13} strokeWidth={2.5} className="mr-2 shrink-0 text-zinc-400" />
            <span className="text-[11px] text-zinc-500 font-semibold tracking-wide">Search campus...</span>
          </div>
          <div className="pointer-events-none text-[8px] font-mono font-bold text-zinc-400 tracking-wider bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5 shadow-sm select-none">
            ⌘ K
          </div>
        </div>
      </button>

      {/* Command Palette Modal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-zinc-950/75 backdrop-blur-[12px]"
              />

              {/* Centered glassmorphic container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="palette-blur bg-zinc-900/90 border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden relative shadow-premium w-full max-w-[900px] h-[500px] max-h-[80vh]"
              >
                {/* Top Search Input */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.08] bg-zinc-950/40 relative">
                  <Search className="text-cyan-400 w-5 h-5 shrink-0" />
                  <input
                    ref={modalInputRef}
                    type="text"
                    placeholder="Search or type a command (e.g. 'create event')..."
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      setSelectedIndex(0)
                    }}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none text-base text-white placeholder-neutral-500 focus:outline-none focus:ring-0 min-w-0"
                  />
                  {loading && <Loader2 className="animate-spin text-cyan-400 w-4 h-4 shrink-0 mr-2" />}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-11 h-11 -mr-2 rounded-xl text-neutral-500 hover:text-white hover:bg-white/[0.03] transition-colors flex items-center justify-center"
                    aria-label="Close search"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable Content View */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {!query.trim() ? (
                    /* Empty state / Dashboard view: 2-column layout */
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 h-full">
                      {/* Left side: Suggested Actions & Recent Searches */}
                      <div className="flex flex-col space-y-6 md:col-span-5">
                        {/* Suggested Actions */}
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1.5 flex items-center gap-1.5">
                            <Sparkles size={11} className="text-cyan-400" /> Suggested Actions
                          </h4>
                          <div className="flex flex-col gap-1">
                            {visibleItems.filter(item => item.type === 'action').map(item => {
                              const idx = visibleItems.findIndex(x => x.id === item.id)
                              return (
                                <PaletteItemRow 
                                  key={item.id}
                                  item={item}
                                  index={idx}
                                  selectedIndex={selectedIndex}
                                  onHover={() => setSelectedIndex(idx)}
                                  onClick={() => executeItem(item)}
                                />
                              )
                            })}
                          </div>
                        </div>

                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-1.5">
                              <h4 className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase flex items-center gap-1.5">
                                <Clock size={11} className="text-cyan-400" /> Recent Searches
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setRecentSearches([])
                                  localStorage.removeItem('recent_searches')
                                }}
                                className="text-[9px] font-mono text-zinc-500 hover:text-red-400 transition-colors uppercase font-bold"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="flex flex-col gap-1 max-h-[110px] overflow-y-auto custom-scrollbar pr-1">
                              {visibleItems.filter(item => item.type === 'recent').map(item => {
                                const idx = visibleItems.findIndex(x => x.id === item.id)
                                return (
                                  <PaletteItemRow 
                                    key={item.id}
                                    item={item}
                                    index={idx}
                                    selectedIndex={selectedIndex}
                                    onHover={() => setSelectedIndex(idx)}
                                    onClick={() => executeItem(item)}
                                    onRemoveRecent={removeRecentSearch}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right side: Popular Modules */}
                      <div className="flex flex-col space-y-2.5 md:col-span-7">
                        <h4 className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1.5 flex items-center gap-1.5">
                          <Command size={11} className="text-cyan-400" /> Popular Modules
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {visibleItems.filter(item => item.type === 'module').map(item => {
                            const idx = visibleItems.findIndex(x => x.id === item.id)
                            return (
                              <PaletteItemRow 
                                key={item.id}
                                item={item}
                                index={idx}
                                selectedIndex={selectedIndex}
                                onHover={() => setSelectedIndex(idx)}
                                onClick={() => executeItem(item)}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Active Search view: Single-column grouped list */
                    <div className="space-y-6">
                      {/* Suggested Quick Actions */}
                      {suggestedActionQueryItems.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-2 flex items-center gap-1.5">
                            <Sparkles size={11} className="text-cyan-400" /> Suggested Action
                          </h4>
                          <div className="flex flex-col gap-1">
                            {suggestedActionQueryItems.map(item => {
                              const idx = visibleItems.findIndex(x => x.id === item.id)
                              return (
                                <PaletteItemRow 
                                  key={item.id}
                                  item={item}
                                  index={idx}
                                  selectedIndex={selectedIndex}
                                  onHover={() => setSelectedIndex(idx)}
                                  onClick={() => executeItem(item)}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Database Results Grouped by Category Heading */}
                      {visibleItems.some(item => item.type === 'result') ? (
                        <div className="space-y-5">
                          {Object.entries(groupedResults).map(([catKey, items]) => {
                            if (items.length === 0) return null
                            const heading = CATEGORY_HEADINGS[catKey as SearchResult['category']]
                            return (
                              <div key={catKey} className="space-y-2">
                                <h4 className="text-[10px] font-mono font-bold tracking-widest text-cyan-400/80 uppercase px-2 py-0.5 w-fit border border-cyan-500/20 bg-cyan-500/5 rounded">
                                  {heading}
                                </h4>
                                <div className="flex flex-col gap-1">
                                  {items.map(item => {
                                    const idx = visibleItems.findIndex(x => x.id === item.id)
                                    return (
                                      <PaletteItemRow 
                                        key={item.id}
                                        item={item}
                                        index={idx}
                                        selectedIndex={selectedIndex}
                                        onHover={() => setSelectedIndex(idx)}
                                        onClick={() => executeItem(item)}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        !loading && suggestedActionQueryItems.length === 0 && (
                          <div className="text-center py-16 text-neutral-500 text-sm">
                            <Search size={32} className="mx-auto text-zinc-700 mb-3" />
                            No matching platform entries found for &ldquo;{query}&rdquo;
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Statusbar footer */}
                <div className="flex items-center justify-between px-6 py-3 bg-zinc-950/50 border-t border-white/[0.08] text-[10px] text-neutral-400 font-mono">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="bg-white/[0.05] border border-white/[0.08] px-1 py-0.2 rounded">↑↓</span> Navigate</span>
                    <span className="flex items-center gap-1.5"><span className="bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.2 rounded font-sans">↵</span> Select</span>
                    <span className="flex items-center gap-1.5"><span className="bg-white/[0.05] border border-white/[0.08] px-1 py-0.2 rounded">esc</span> Close</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-400/80 font-semibold uppercase tracking-wider">
                    <Command size={10} /> Command Palette
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

function PaletteItemRow({
  item,
  index,
  selectedIndex,
  onHover,
  onClick,
  onRemoveRecent
}: {
  item: PaletteItem
  index: number
  selectedIndex: number
  onHover: () => void
  onClick: () => void
  onRemoveRecent?: (term: string) => void
}) {
  const isSelected = index === selectedIndex
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 border ${
        isSelected
          ? 'bg-cyan-500/10 text-white border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] pl-3.5'
          : 'bg-white/[0.01] hover:bg-white/[0.02] border-transparent text-neutral-400'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-950/80 border border-white/[0.04] text-neutral-400'
        }`}>
          {item.icon}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-semibold truncate leading-tight transition-colors">{item.title}</p>
          {item.subtitle && (
            <p className="text-[10px] text-neutral-500 truncate leading-none mt-1 font-medium">{item.subtitle}</p>
          )}
        </div>
      </div>
      {item.type === 'recent' ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemoveRecent?.(item.title)
          }}
          className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors z-10"
          title="Remove search"
        >
          <X size={12} />
        </button>
      ) : (
        isSelected && (
          <span className="text-[9px] font-mono font-bold tracking-wider text-cyan-400 uppercase shrink-0 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 animate-pulse flex items-center gap-1">
            Jump <CornerDownLeft size={8} />
          </span>
        )
      )}
    </div>
  )
}
