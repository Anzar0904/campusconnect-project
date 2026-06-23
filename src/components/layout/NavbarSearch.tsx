'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, Loader2, User, Users, BookOpen, Calendar, 
  Store, Briefcase, GraduationCap, X, BookMarked, 
  MessageCircle, FileText, Terminal, Sparkles, Clock, Compass 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  category: 'USERS' | 'COMMUNITIES' | 'EVENTS' | 'INTERNSHIPS' | 'MARKETPLACE' | 'NOTES' | 'PAST PAPERS' | 'STUDY GROUPS'
  href: string
  score?: number
}

// Static platform modules list for quick local search matching
const STATIC_MODULES = [
  { title: 'Home Feed', category: 'COMMUNITIES', href: '/dashboard', subtitle: 'Realtime campus feed' },
  { title: 'Messages', category: 'USERS', href: '/messages', subtitle: 'Direct peer chats' },
  { title: 'Communities', category: 'COMMUNITIES', href: '/community', subtitle: 'Interest groups & channels' },
  { title: 'Clubs', category: 'COMMUNITIES', href: '/clubs', subtitle: 'Student-run clubs & societies' },
  { title: 'Events', category: 'EVENTS', href: '/events', subtitle: 'Campus events calendar' },
  { title: 'Notes Library', category: 'NOTES', href: '/notes', subtitle: 'Shared lecture notes & files' },
  { title: 'Past Papers', category: 'PAST PAPERS', href: '/papers', subtitle: 'Exam question papers' },
  { title: 'Study Hub', category: 'STUDY GROUPS', href: '/study', subtitle: 'Collaborative study rooms' },
  { title: 'Academic Calendar', category: 'EVENTS', href: '/calendar', subtitle: 'Timetables & schedules' },
  { title: 'Marketplace', category: 'MARKETPLACE', href: '/marketplace', subtitle: 'Buy & sell on campus' },
  { title: 'Internships', category: 'INTERNSHIPS', href: '/internships', subtitle: 'Recruiter internship postings' },
  { title: 'Placements Drive', category: 'INTERNSHIPS', href: '/placements', subtitle: 'Jobs package tracker' },
  { title: 'Mentorship', category: 'INTERNSHIPS', href: '/mentorship', subtitle: 'Alumni career guides' },
  { title: 'Dating Connect', category: 'USERS', href: '/dating', subtitle: 'Connect with campus singles' },
  { title: 'Coding Arena', category: 'COMMUNITIES', href: '/coding-arena', subtitle: 'Coding arena challenges' },
  { title: 'AI Assistant', category: 'USERS', href: '/ai', subtitle: 'Generative AI helper' }
] as const

// Real seeded entity fallbacks for empty query dashboard
const POPULAR_COMMUNITIES = [
  { id: '71c2a7fd-c53b-4c2e-91ed-62a214f93a76', name: 'Computer Science Hub', category: 'Technology', href: '/community/71c2a7fd-c53b-4c2e-91ed-62a214f93a76' },
  { id: '1460904f-eeab-40ad-b0d1-d7bab133ff9d', name: 'Photography Club Members', category: 'Arts', href: '/community/1460904f-eeab-40ad-b0d1-d7bab133ff9d' },
  { id: 'd9cb8eb4-5553-48b3-921d-8a87c68d19ce', name: 'Campus Placement Prep', category: 'Career', href: '/community/d9cb8eb4-5553-48b3-921d-8a87c68d19ce' }
]

const POPULAR_EVENTS = [
  { id: 'fb6579e7-1b42-4396-afcb-be497ffde91d', name: 'Annual Coding Hackathon', category: 'Coding', href: '/events?id=fb6579e7-1b42-4396-afcb-be497ffde91d' },
  { id: '096861be-6e1f-48a1-a122-96c8f08d9bdc', name: 'AI and Future Seminar', category: 'Academic', href: '/events?id=096861be-6e1f-48a1-a122-96c8f08d9bdc' }
]

const SUGGESTED_USERS = [
  { id: 'ce63e132-3a93-44fd-a1ac-4db3d752d5da', name: 'Anzar0904 (Super Admin)', email: 'anzar0904@gmail.com', href: '/profile?id=ce63e132-3a93-44fd-a1ac-4db3d752d5da' },
  { id: '50e6463c-91c0-45c4-92ff-0365a07a1dfe', name: 'Mohammad Anzar (Student)', email: 'mohammad.anzar.cs28@iilm.edu', href: '/profile?id=50e6463c-91c0-45c4-92ff-0365a07a1dfe' }
]

const DEFAULT_RECENT = ['Computer', 'Hackathon', 'Software']

function getFuzzyScore(text: string, query: string): number {
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

export function NavbarSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastQueryRef = useRef('')
  const router = useRouter()
  const supabase = createClient()

  // Load user profile & recent searches on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id)
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

  // Handle Ctrl+K/Cmd+K shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close search suggestions on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search trigger (200ms debounce, prevents duplicate runs)
  useEffect(() => {
    const searchQuery = query.trim()
    if (!searchQuery) {
      setResults([])
      setLoading(false)
      lastQueryRef.current = ''
      return
    }

    if (searchQuery === lastQueryRef.current) {
      return // Prevent duplicate query run
    }

    setLoading(true)
    const delayDebounce = setTimeout(async () => {
      lastQueryRef.current = searchQuery
      try {
        // Query database in parallel for all entities
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
          supabase.from('profiles').select('id, full_name, username').ilike('full_name', `%${searchQuery}%`).limit(3),
          supabase.from('communities').select('id, name, description').ilike('name', `%${searchQuery}%`).limit(3),
          supabase.from('clubs').select('id, name, description').ilike('name', `%${searchQuery}%`).limit(3),
          supabase.from('notes').select('id, title, subject').ilike('title', `%${searchQuery}%`).limit(3),
          supabase.from('events').select('id, title, description').ilike('title', `%${searchQuery}%`).limit(3),
          supabase.from('marketplace_items').select('id, title, price').eq('status', 'available').ilike('title', `%${searchQuery}%`).limit(3),
          supabase.from('internships').select('id, title, company').ilike('title', `%${searchQuery}%`).limit(3),
          supabase.from('study_groups').select('id, subject, venue').ilike('subject', `%${searchQuery}%`).limit(3),
          supabase.from('exam_papers').select('id, subject, course_code').ilike('subject', `%${searchQuery}%`).limit(3),
          supabase.from('messages').select('id, content, sender_id, receiver_id').ilike('content', `%${searchQuery}%`).limit(3)
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
              score: score + 10 // Give slight preference to static modules
            })
          }
        })

        // 2. Map Database results
        if (usersRes.data) {
          usersRes.data.forEach((u: any) => {
            matchedList.push({
              id: u.id,
              title: u.full_name,
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
              title: c.name,
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
              title: c.name,
              subtitle: c.description || 'Official student club',
              category: 'COMMUNITIES',
              href: `/clubs?id=${c.id}`
            })
          })
        }

        if (notesRes.data) {
          notesRes.data.forEach((n: any) => {
            matchedList.push({
              id: n.id,
              title: n.title,
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
              title: e.title,
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
              title: m.title,
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
              title: i.title,
              subtitle: i.company,
              category: 'INTERNSHIPS',
              href: `/internships?id=${i.id}`
            })
          })
        }

        if (studyRes.data) {
          studyRes.data.forEach((s: any) => {
            matchedList.push({
              id: s.id,
              title: s.subject,
              subtitle: s.venue || 'Study Room',
              category: 'STUDY GROUPS',
              href: `/study/${s.id}`
            })
          })
        }

        if (papersRes.data) {
          papersRes.data.forEach((p: any) => {
            matchedList.push({
              id: p.id,
              title: p.subject,
              subtitle: p.course_code || 'Exam Archive',
              category: 'PAST PAPERS',
              href: `/papers?id=${p.id}`
            })
          })
        }

        if (messagesRes.data) {
          messagesRes.data.forEach((msg: any) => {
            const chatPartnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
            matchedList.push({
              id: msg.id,
              title: msg.content,
              subtitle: 'Chat Message',
              category: 'USERS',
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

        setResults(finalRanked)
        setSelectedIndex(-1)
      } catch (err) {
        console.error('Unified lookup query error:', err)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(delayDebounce)
  }, [query, supabase, currentUserId])

  // Group results based on requested 8 headings
  const groupedResults = useMemo(() => {
    const groups: Record<SearchResult['category'], SearchResult[]> = {
      USERS: [],
      COMMUNITIES: [],
      EVENTS: [],
      INTERNSHIPS: [],
      MARKETPLACE: [],
      NOTES: [],
      'PAST PAPERS': [],
      'STUDY GROUPS': []
    }
    results.forEach(r => {
      if (groups[r.category]) {
        groups[r.category].push(r)
      }
    })
    return groups
  }, [results])

  // Count items to map flat index to grouped index for keyboard navigation
  const flatResultList = useMemo(() => {
    return Object.values(groupedResults).flat()
  }, [groupedResults])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1 < flatResultList.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : flatResultList.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < flatResultList.length) {
        navigate(flatResultList[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const navigate = (result: { href: string; title?: string; name?: string }) => {
    // Add to recent searches (up to 5 history items)
    if (query.trim()) {
      const term = query.trim()
      setRecentSearches(prev => {
        const next = [term, ...prev.filter(x => x.toLowerCase() !== term.toLowerCase())].slice(0, 5)
        localStorage.setItem('recent_searches', JSON.stringify(next))
        return next
      })
    }
    router.push(result.href)
    setIsOpen(false)
    setQuery('')
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'USERS': return <User size={13} className="text-blue-400" />
      case 'COMMUNITIES': return <Users size={13} className="text-purple-400" />
      case 'EVENTS': return <Calendar size={13} className="text-rose-400" />
      case 'INTERNSHIPS': return <Briefcase size={13} className="text-cyan-400" />
      case 'MARKETPLACE': return <Store size={13} className="text-pink-400" />
      case 'NOTES': return <BookOpen size={13} className="text-amber-400" />
      case 'PAST PAPERS': return <FileText size={13} className="text-indigo-400" />
      case 'STUDY GROUPS': return <BookMarked size={13} className="text-teal-400" />
      default: return <Search size={13} />
    }
  }

  return (
    <div ref={containerRef} className="flex-1 max-w-xl mx-8 relative hidden md:block">
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
      `}} />

      <div className={`p-[1.5px] rounded-full transition-all duration-300 relative ${
        isOpen ? 'glowing-border shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.01]' : 'glowing-border shadow-[0_0_10px_rgba(37,99,235,0.1)]'
      }`}>
        <div className="bg-[#030712]/95 rounded-full flex items-center relative pl-4 pr-3 py-1.5 w-full border border-white/[0.04]">
          <div className="text-neutral-400 mr-2 shrink-0">
            {loading ? <Loader2 size={14} className="animate-spin text-cyan-400" /> : <Search size={14} strokeWidth={2.5} />}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search communities, notes, internships, marketplace..."
            className="w-full bg-transparent border-none text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-0 min-w-0 pr-8"
          />

          {query ? (
            <button 
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute right-3.5 text-neutral-500 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          ) : (
            <div className="absolute right-3.5 pointer-events-none text-[9px] font-mono font-bold text-neutral-400 tracking-widest bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-0.5 shadow-sm">
              ⌘ K
            </div>
          )}
        </div>
      </div>

      {/* suggestion panel dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-[#090d16]/98 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-3xl shadow-2xl z-50 max-h-[460px] overflow-y-auto custom-scrollbar animate-fade-in">
          
          {/* PHASE 3: Empty query behavior (Dashboard view) */}
          {!query.trim() ? (
            <div className="grid grid-cols-2 gap-5 py-2">
              {/* Left Column: Recent searches & Suggested users */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1 flex items-center gap-1.5">
                    <Clock size={10} /> Recent Searches
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => { setQuery(term); inputRef.current?.focus(); }}
                        className="text-[10px] font-mono font-medium bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.1] text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1 flex items-center gap-1.5">
                    <User size={10} /> Suggested Users
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTED_USERS.map(user => (
                      <div
                        key={user.id}
                        onClick={() => navigate(user)}
                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <User size={12} className="text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-neutral-200 group-hover:text-white truncate">{user.name}</p>
                          <p className="text-[9px] text-neutral-500 truncate leading-none mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Popular Communities & Popular Events */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1 flex items-center gap-1.5">
                    <Users size={10} /> Popular Communities
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {POPULAR_COMMUNITIES.map(comm => (
                      <div
                        key={comm.id}
                        onClick={() => navigate(comm)}
                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <Users size={12} className="text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-neutral-200 group-hover:text-white truncate">{comm.name}</p>
                          <p className="text-[9px] text-neutral-500 truncate leading-none mt-0.5">{comm.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1 flex items-center gap-1.5">
                    <Calendar size={10} /> Popular Events
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {POPULAR_EVENTS.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => navigate(ev)}
                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                          <Calendar size={12} className="text-rose-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-neutral-200 group-hover:text-white truncate">{ev.name}</p>
                          <p className="text-[9px] text-neutral-500 truncate leading-none mt-0.5">{ev.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Search Active query mode
            <>
              {loading && results.length === 0 && (
                <div className="flex items-center justify-center py-10 text-neutral-400 text-xs gap-2.5">
                  <Loader2 size={16} className="animate-spin text-cyan-400" />
                  <span>Scanning platform index...</span>
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="text-center py-10 text-neutral-500 text-xs">
                  No matching entries found for &ldquo;{query}&rdquo;
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-4">
                  {Object.entries(groupedResults).map(([category, items]) => {
                    if (items.length === 0) return null
                    return (
                      <div key={category} className="space-y-1.5">
                        <h4 className="text-[9px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-2 py-0.5 bg-white/[0.02] rounded border border-white/[0.04] w-fit mb-1 shadow-sm">
                          {category}
                        </h4>
                        <div className="flex flex-col gap-1">
                          {items.map((result) => {
                            const idx = flatResultList.indexOf(result)
                            return (
                              <div
                                key={`${result.category}-${result.id}-${idx}`}
                                onClick={() => navigate(result)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-150 border border-transparent ${
                                  selectedIndex === idx 
                                    ? 'bg-cyan-500/10 text-white border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] pl-3' 
                                    : 'hover:bg-white/[0.02] text-neutral-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/[0.04] flex items-center justify-center shrink-0">
                                    {getCategoryIcon(result.category)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold truncate leading-tight">{result.title}</p>
                                    {result.subtitle && (
                                      <p className="text-[10px] text-neutral-500 truncate leading-none mt-0.5 font-medium">{result.subtitle}</p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[8px] font-mono font-bold tracking-wider text-neutral-500 uppercase shrink-0 bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity">
                                  Jump
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
