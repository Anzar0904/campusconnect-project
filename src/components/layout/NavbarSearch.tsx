'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User, Users, BookOpen, Calendar, Store, Briefcase, GraduationCap, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  category: 'Users' | 'Communities' | 'Clubs' | 'Notes' | 'Events' | 'Marketplace' | 'Internships'
  href: string
}

export function NavbarSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Handle command K shortcut
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const searchQuery = query.trim()
        const [
          usersRes,
          commsRes,
          clubsRes,
          notesRes,
          eventsRes,
          marketRes,
          internRes
        ] = await Promise.all([
          supabase.from('profiles').select('id, full_name, username').ilike('full_name', `%${searchQuery}%`).limit(3),
          supabase.from('communities').select('id, name, description').ilike('name', `%${searchQuery}%`).limit(3),
          supabase.from('clubs').select('id, name, description').ilike('name', `%${searchQuery}%`).limit(3),
          supabase.from('notes').select('id, title, subject').ilike('title', `%${searchQuery}%`).limit(3),
          supabase.from('events').select('id, title, description').ilike('title', `%${searchQuery}%`).limit(3),
          supabase.from('marketplace_items').select('id, title, price').eq('status', 'active').ilike('title', `%${searchQuery}%`).limit(3),
          supabase.from('internships').select('id, title, company').ilike('title', `%${searchQuery}%`).limit(3)
        ])

        const mappedResults: SearchResult[] = []

        // Map users
        if (usersRes.data) {
          usersRes.data.forEach((u: any) => {
            mappedResults.push({
              id: u.id,
              title: u.full_name,
              subtitle: u.username ? `@${u.username}` : undefined,
              category: 'Users',
              href: `/profile?id=${u.id}`
            })
          })
        }

        // Map communities
        if (commsRes.data) {
          commsRes.data.forEach((c: any) => {
            mappedResults.push({
              id: c.id,
              title: c.name,
              subtitle: c.description || undefined,
              category: 'Communities',
              href: `/community/${c.id}`
            })
          })
        }

        // Map clubs
        if (clubsRes.data) {
          clubsRes.data.forEach((c: any) => {
            mappedResults.push({
              id: c.id,
              title: c.name,
              subtitle: c.description || undefined,
              category: 'Clubs',
              href: `/clubs`
            })
          })
        }

        // Map notes
        if (notesRes.data) {
          notesRes.data.forEach((n: any) => {
            mappedResults.push({
              id: n.id,
              title: n.title,
              subtitle: n.subject || undefined,
              category: 'Notes',
              href: `/notes`
            })
          })
        }

        // Map events
        if (eventsRes.data) {
          eventsRes.data.forEach((e: any) => {
            mappedResults.push({
              id: e.id,
              title: e.title,
              subtitle: e.description || undefined,
              category: 'Events',
              href: `/events`
            })
          })
        }

        // Map marketplace
        if (marketRes.data) {
          marketRes.data.forEach((m: any) => {
            mappedResults.push({
              id: m.id,
              title: m.title,
              subtitle: m.price ? `₹${m.price}` : undefined,
              category: 'Marketplace',
              href: `/marketplace`
            })
          })
        }

        // Map internships
        if (internRes.data) {
          internRes.data.forEach((i: any) => {
            mappedResults.push({
              id: i.id,
              title: i.title,
              subtitle: i.company,
              category: 'Internships',
              href: `/internships`
            })
          })
        }

        setResults(mappedResults)
        setSelectedIndex(-1)
      } catch (err) {
        console.error('Search query error:', err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [query, supabase])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1 < results.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        navigate(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const navigate = (result: SearchResult) => {
    router.push(result.href)
    setIsOpen(false)
    setQuery('')
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Users': return <User size={13} className="text-blue-400" />
      case 'Communities': return <Users size={13} className="text-purple-400" />
      case 'Clubs': return <GraduationCap size={13} className="text-emerald-400" />
      case 'Notes': return <BookOpen size={13} className="text-amber-400" />
      case 'Events': return <Calendar size={13} className="text-rose-400" />
      case 'Marketplace': return <Store size={13} className="text-pink-400" />
      case 'Internships': return <Briefcase size={13} className="text-cyan-400" />
      default: return <Search size={13} />
    }
  }

  return (
    <div ref={containerRef} className="flex-1 max-w-xl mx-8 relative hidden md:block">
      {/* Dynamic styles injection for moving glow rotation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rotatingGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .glowing-border-active {
          background: linear-gradient(90deg, #06b6d4, #3b82f6, #6366f1, #06b6d4);
          background-size: 300% 300%;
          animation: rotatingGlow 3s linear infinite;
        }
      `}} />

      {/* Main Search Input Wrapper with Glow border effect */}
      <div className={`p-[1px] rounded-xl transition-all duration-300 relative ${
        isOpen ? 'glowing-border-active shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'bg-white/[0.08]'
      }`}>
        <div className="bg-[#0b0f19] rounded-[11px] flex items-center relative pl-3.5 pr-2 py-1.5 w-full">
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
            placeholder="Search users, groups, clubs, events..."
            className="w-full bg-transparent border-none text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-0 min-w-0 pr-8"
          />

          {query ? (
            <button 
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute right-3 text-neutral-500 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          ) : (
            <div className="absolute right-3 pointer-events-none text-[9px] font-mono font-bold text-neutral-500 tracking-widest border border-white/5 bg-white/[0.02] rounded px-1.5 py-0.5">
              ⌘K
            </div>
          )}
        </div>
      </div>

      {/* Floating suggestion list with glassmorphism */}
      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#090d16]/95 border border-white/[0.08] rounded-2xl p-2.5 backdrop-blur-2xl shadow-2xl z-50 max-h-[350px] overflow-y-auto custom-scrollbar animate-fade-in">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center py-6 text-neutral-400 text-xs gap-2">
              <Loader2 size={14} className="animate-spin text-cyan-400" />
              <span>Optimizing matches...</span>
            </div>
          )}

          {!loading && results.length === 0 && query.trim() && (
            <div className="text-center py-6 text-neutral-500 text-xs">
              No live matches found for &ldquo;{query}&rdquo;
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div
                  key={`${result.category}-${result.id}-${idx}`}
                  onClick={() => navigate(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-150 ${
                    selectedIndex === idx 
                      ? 'bg-cyan-500/10 text-white border-l-2 border-cyan-400 pl-3' 
                      : 'hover:bg-white/[0.03] text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-zinc-950/80 border border-white/[0.04] flex items-center justify-center shrink-0">
                      {getCategoryIcon(result.category)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-[10px] text-neutral-500 truncate leading-none mt-0.5">{result.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold tracking-wider text-neutral-500 uppercase shrink-0 bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.04]">
                    {result.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
