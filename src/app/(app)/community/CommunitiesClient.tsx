'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Community {
  id: string
  name: string
  description: string | null
  category: string
  member_count: number
  is_private: boolean
  banner_url: string | null
  icon_url: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  Academic: '#c3c0ff',
  Social: '#4cd7f6',
  Technical: '#d0bcff',
  Cultural: '#93e8ff',
  Sports: '#c3c0ff',
  Career: '#4cd7f6',
  General: '#c7c4d8',
}

const IILM_COMMUNITIES: Community[] = [
  { id: 'mock_placements', name: 'IILM Placements 2025', category: 'Career', description: 'Latest placement news, company visits and prep resources for IILM students.', member_count: 0, is_private: false, banner_url: null, icon_url: null },
  { id: 'mock_bba2026', name: 'BBA Batch 2023–26', category: 'Academic', description: 'Official group for the BBA 2023 batch. Notes, assignments and updates.', member_count: 0, is_private: false, banner_url: null, icon_url: null },
  { id: 'mock_finance', name: 'MBA Finance Hub', category: 'Academic', description: 'Finance specialisation discussions, case studies and guest lecture updates.', member_count: 0, is_private: false, banner_url: null, icon_url: null },
  { id: 'mock_confessions', name: 'Campus Confessions', category: 'Social', description: 'Anonymous confessions from the IILM campus. Keep it civil! 🤫', member_count: 0, is_private: false, banner_url: null, icon_url: null },
  { id: 'mock_startups', name: 'IILM Startups & Entrepreneurship', category: 'Career', description: 'For aspiring founders. Share ideas, find co-founders, pitch practice.', member_count: 0, is_private: false, banner_url: null, icon_url: null },
  { id: 'mock_fitness', name: 'Sports & Fitness', category: 'Sports', description: 'Gym routines, match updates, team selections and sports events.', member_count: 0, is_private: false, banner_url: null, icon_url: null },
]

export default function CommunitiesClient({
  communities: initial,
  myMemberships,
  currentUserId,
}: {
  communities: Community[]
  myMemberships: string[]
  currentUserId: string
}) {
  const supabase = createClient()
  const [communities, setCommunities] = useState<Community[]>(
    initial.length > 0 ? initial : IILM_COMMUNITIES
  )
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initial.length >= 10)
  const [loadingMore, setLoadingMore] = useState(false)
  const [joined, setJoined] = useState<string[]>(myMemberships)

  const loadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    const start = nextPage * 10
    const end = start + 9
    const { data } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })
      .range(start, end)
    
    if (data) {
      setCommunities(prev => {
        const existingIds = new Set(prev.map(c => c.id))
        const newComms = data.filter(c => !existingIds.has(c.id))
        return [...prev, ...newComms as Community[]]
      })
      setPage(nextPage)
      if (data.length < 10) setHasMore(false)
    }
    setLoadingMore(false)
  }

  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState('General')
  const [saving, setSaving] = useState(false)

  const categories = ['All', ...Object.keys(CATEGORY_COLORS)]

  const filtered = communities.filter(c => {
    if (filter !== 'All' && c.category !== filter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const joinCommunity = async (id: string) => {
    setJoined(j => [...j, id])
    if (id.includes('-')) { // real uuid
      await supabase.from('community_members').insert({ community_id: id, user_id: currentUserId })
      await supabase.from('communities').update({ member_count: communities.find(c => c.id === id)!.member_count + 1 }).eq('id', id)
    }
  }

  const leaveCommunity = async (id: string) => {
    setJoined(j => j.filter(x => x !== id))
    if (id.includes('-')) {
      await supabase.from('community_members').delete().eq('community_id', id).eq('user_id', currentUserId)
    }
  }

  const createCommunity = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('communities')
      .insert({ name: newName.trim(), description: newDesc.trim() || null, category: newCat, created_by: currentUserId, member_count: 1 })
      .select()
      .single()
    if (data) {
      setCommunities(c => [data, ...c])
      setJoined(j => [...j, data.id])
    }
    setSaving(false)
    setCreating(false)
    setNewName(''); setNewDesc(''); setNewCat('General')
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">CAMPUS LIFE</p>
          <h1 className="font-display text-3xl font-bold text-on-surface">Communities</h1>
          <p className="text-on-surface-variant text-sm mt-1">{communities.length} communities at IILM</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Community
        </button>
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-elevated rounded-2xl p-6 w-full max-w-md space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-on-surface">Create Community</h2>
              <button onClick={() => setCreating(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <label className="section-label block mb-1.5">COMMUNITY NAME *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="input-glass" placeholder="e.g. BBA 2026 Batch" autoFocus />
            </div>
            <div>
              <label className="section-label block mb-1.5">DESCRIPTION</label>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="input-glass resize-none" rows={2} placeholder="What's this community about?" />
            </div>
            <div>
              <label className="section-label block mb-1.5">CATEGORY</label>
              <select value={newCat} onChange={e => setNewCat(e.target.value)} className="input-glass">
                {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setCreating(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={createCommunity} disabled={!newName.trim() || saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-glass pl-9" placeholder="Search communities…" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === c ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:bg-white/[0.06]'}`}
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Joined communities */}
      {joined.length > 0 && (
        <div>
          <p className="section-label mb-3">YOUR COMMUNITIES</p>
          <div className="grid grid-cols-2 gap-3">
            {communities.filter(c => joined.includes(c.id)).map(c => (
              <div key={c.id} className="glass-card rounded-xl p-4 flex items-center gap-3"
                style={{ border: '1px solid rgba(76,215,246,0.15)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(76,215,246,0.15)', border: '1px solid rgba(76,215,246,0.3)' }}>
                  <span className="text-tertiary font-display font-bold text-base">{c.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-on-surface truncate">{c.name}</p>
                  <p className="text-xs text-on-surface-variant font-mono">{c.member_count} members</p>
                </div>
                <button onClick={() => leaveCommunity(c.id)} className="text-xs text-on-surface-variant hover:text-error transition-colors font-mono">Leave</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All communities */}
      <div>
        {joined.length > 0 && <p className="section-label mb-3">DISCOVER</p>}
        <div className="grid grid-cols-2 gap-4">
          {filtered.filter(c => !joined.includes(c.id)).map(c => {
            const color = CATEGORY_COLORS[c.category] || '#c7c4d8'
            return (
              <div key={c.id} className="glass-card rounded-xl overflow-hidden">
                {/* Banner */}
                <div className="h-16 relative flex items-end px-4 pb-0"
                  style={{ background: `linear-gradient(135deg, rgba(79,70,229,0.3), rgba(76,215,246,0.15))` }}>
                  <div className="absolute inset-0 opacity-20"
                    style={{ background: `radial-gradient(circle at 30% 50%, ${color}40, transparent 70%)` }} />
                  <div className="w-12 h-12 rounded-xl border-2 border-surface flex items-center justify-center relative z-10 translate-y-1/2"
                    style={{ background: `linear-gradient(135deg, ${color}40, rgba(23,31,51,0.9))`, borderColor: '#0b1326' }}>
                    <span className="font-display font-bold text-lg" style={{ color }}>{c.name[0]}</span>
                  </div>
                </div>

                <div className="p-4 pt-8">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-display font-semibold text-on-surface text-sm leading-snug">{c.name}</h3>
                    {c.is_private && (
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant flex-shrink-0">lock</span>
                    )}
                  </div>
                  <span className="chip text-[10px] py-0.5" style={{ background: `${color}20`, border: `1px solid ${color}50`, color }}>
                    {c.category}
                  </span>
                  {c.description && (
                    <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 font-body">{c.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-mono text-on-surface-variant">{c.member_count} members</span>
                    <button
                      onClick={() => joinCommunity(c.id)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      + Join
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.filter(c => !joined.includes(c.id)).length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center col-span-2">
            <p className="text-on-surface-variant text-sm">No communities found. Try a different filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
