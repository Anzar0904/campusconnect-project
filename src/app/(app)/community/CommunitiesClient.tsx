'use client'
import { Lock, Plus, Search, X, Users, BookOpen, Code, Palette, Trophy, Briefcase, Layers, Sparkles, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

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
  Academic: '#a78bfa',  // Violet
  Social: '#22d3ee',    // Cyan
  Technical: '#3b82f6', // Blue
  Cultural: '#ec4899',  // Pink
  Sports: '#f59e0b',    // Amber
  Career: '#10b981',    // Emerald
  General: '#94a3b8',   // Slate
}

const CATEGORY_ICONS: Record<string, any> = {
  Academic: BookOpen,
  Social: Users,
  Technical: Code,
  Cultural: Palette,
  Sports: Trophy,
  Career: Briefcase,
  General: Layers,
}

export default function CommunitiesClient({
  communities: initial,
  myMemberships,
  currentUserId,
}: {
  communities: Community[]
  myMemberships: string[]
  currentUserId: string
}) {
  const supabase: any = createClient()
  const router = useRouter()
  const [communities, setCommunities] = useState<Community[]>(initial)
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
        const newComms = (data as Community[]).filter(
          c => !existingIds.has(c.id)
        )
        return [...prev, ...newComms]
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const createAction = params.get('create')
      if (createAction === 'true') {
        setCreating(true)
      }
    }
  }, [])

  const categories = ['All', ...Object.keys(CATEGORY_COLORS)]

  const filtered = communities.filter(c => {
    if (filter !== 'All' && c.category !== filter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const joinCommunity = async (id: string) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Please login first')
        return
      }

      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: id,
          user_id: user.id,
          role: 'member'
        })

      if (error) {
        console.error(error)
        alert(error.message)
        return
      }

      setJoined(j => [...j, id])

      setCommunities(prev =>
        prev.map(c =>
          c.id === id
            ? { ...c, member_count: c.member_count + 1 }
            : c
        )
      )

      await supabase
        .from('communities')
        .update({
          member_count:
            (communities.find(c => c.id === id)?.member_count || 0) + 1
        })
        .eq('id', id)

    } catch (err) {
      console.error(err)
    }
  }

  const leaveCommunity = async (id: string) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error(error)
        alert(error.message)
        return
      }

      setJoined(j => j.filter(x => x !== id))

      setCommunities(prev =>
        prev.map(c =>
          c.id === id
            ? { ...c, member_count: Math.max(0, c.member_count - 1) }
            : c
        )
      )

      await supabase
        .from('communities')
        .update({
          member_count: Math.max(
            0,
            (communities.find(c => c.id === id)?.member_count || 1) - 1
          )
        })
        .eq('id', id)

    } catch (err) {
      console.error(err)
    }
  }

  const createCommunity = async () => {
    if (!newName.trim()) return

    try {
      setSaving(true)

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: newName.trim(),
          description: newDesc.trim() || null,
          category: newCat,
          created_by: currentUserId,
          member_count: 1
        })
        .select()
        .single()

      if (error) {
        alert(error.message)
        return
      }

      if (data) {
        setCommunities(c => [data, ...c])
        setJoined(j => [...j, data.id])
      }

      setCreating(false)
      setNewName('')
      setNewDesc('')
      setNewCat('General')

    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 mb-1.5">
            <Sparkles size={12} className="text-brand-500" /> CAMPUS CLUSTERS
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">
            Communities
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-lg">
            Find and join official batch groups, study teams, or social circles at IILM.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCreating(true)}
          className="btn-premium self-start md:self-auto"
        >
          <Plus size={18} />
          <span>New Community</span>
        </motion.button>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setCreating(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="card-elevated max-w-md w-full relative z-10 p-6 md:p-8 space-y-6 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={() => setCreating(false)}
                  className="text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-white">Create Community</h2>
                <p className="text-zinc-400 text-xs">Establish a new space for collaboration and networking.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Community Name *</label>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="input-pro"
                    placeholder="e.g. CSE Batch of 2027"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="input-pro h-20 py-2.5 resize-none"
                    placeholder="Describe what members will share or discuss here..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Category</label>
                  <select
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    className="input-pro"
                  >
                    {Object.keys(CATEGORY_COLORS).map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setCreating(false)} className="btn-ghost-pro flex-1 py-3 text-xs justify-center">
                  Cancel
                </button>
                <button
                  onClick={createCommunity}
                  disabled={!newName.trim() || saving}
                  className="btn-premium flex-1 py-3 text-xs justify-center disabled:opacity-50"
                >
                  {saving ? 'Creating…' : 'Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search + filter */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-white/[0.04] pb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-pro pl-10 h-10 w-full rounded-xl bg-zinc-950/45 border-white/[0.06] hover:border-white/[0.1] focus:border-brand-500 text-xs"
            placeholder="Search communities by title..."
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map(c => {
            const Icon = CATEGORY_ICONS[c] || Layers
            const isSelected = filter === c
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all duration-200",
                  isSelected
                    ? "bg-brand-500/10 text-brand-400 border-brand-500/30 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                    : "bg-zinc-900/20 text-zinc-400 border-white/[0.05] hover:text-zinc-200 hover:border-white/[0.1]"
                )}
              >
                {c !== 'All' && <Icon size={13} style={{ color: isSelected ? undefined : CATEGORY_COLORS[c] }} />}
                <span>{c}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Joined communities */}
      {joined.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
            YOUR COMMUNITIES
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communities
              .filter(c => joined.includes(c.id))
              .map(c => {
                const color = CATEGORY_COLORS[c.category] || '#94a3b8'
                const Icon = CATEGORY_ICONS[c.category] || Layers
                return (
                  <motion.div
                    layout
                    whileHover={{ y: -1 }}
                    key={c.id}
                    onClick={() => router.push(`/community/${c.id}`)}
                    className="card-premium p-5 flex items-center gap-4 cursor-pointer hover:border-brand-500/20 group relative overflow-hidden"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300"
                      style={{
                        background: `${color}10`,
                        borderColor: `${color}25`
                      }}
                    >
                      <Icon size={20} style={{ color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors truncate">
                          {c.name}
                        </p>
                        {c.is_private && <Lock size={12} className="text-zinc-500" />}
                      </div>

                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {c.member_count || 0} members
                        </span>
                        <span className="text-zinc-600 font-mono text-[10px]">·</span>
                        <span className="text-zinc-500 text-[10px]">{c.category}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          leaveCommunity(c.id)
                        }}
                        className="text-xs text-zinc-500 hover:text-red-400 transition-colors font-mono hover:bg-red-500/5 px-2 py-1 rounded"
                      >
                        Leave
                      </button>
                      <ArrowRight size={14} className="text-zinc-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.div>
                )
              })}
          </div>
        </div>
      )}

      {/* All communities */}
      <div className="space-y-4">
        {joined.length > 0 && (
          <p className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
            DISCOVER
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered
            .filter(c => !joined.includes(c.id))
            .map(c => {
              const color = CATEGORY_COLORS[c.category] || '#94a3b8'
              const Icon = CATEGORY_ICONS[c.category] || Layers
              return (
                <motion.div
                  layout
                  whileHover={{ y: -2 }}
                  key={c.id}
                  onClick={() => router.push(`/community/${c.id}`)}
                  className="card-premium flex flex-col rounded-2xl overflow-hidden cursor-pointer group"
                >
                  {/* Banner */}
                  <div
                    className="h-20 relative flex items-end px-5 pb-0 border-b border-white/[0.04]"
                    style={{
                      background: `linear-gradient(135deg, ${color}15, rgba(15,23,42,0.6))`
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        background: `radial-gradient(circle at 10% 20%, ${color}30, transparent 80%)`
                      }}
                    />
                    <div
                      className="w-12 h-12 rounded-xl border border-zinc-950 flex items-center justify-center relative z-10 translate-y-1/3 shadow-xl"
                      style={{
                        background: 'linear-gradient(135deg, #18181b, #09090b)'
                      }}
                    >
                      <Icon size={20} style={{ color }} />
                    </div>
                  </div>

                  <div className="p-5 pt-8 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display font-semibold text-white text-base leading-tight group-hover:text-brand-400 transition-colors">
                          {c.name}
                        </h3>
                        {c.is_private && (
                          <Lock className="text-zinc-500 flex-shrink-0" size={14} />
                        )}
                      </div>
                      <div className="mt-1.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border"
                          style={{
                            background: `${color}08`,
                            borderColor: `${color}18`,
                            color
                          }}
                        >
                          {c.category}
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-zinc-400 text-xs mt-3 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                      <span className="text-xs font-mono text-zinc-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {c.member_count} members
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          joinCommunity(c.id)
                        }}
                        className="btn-ghost-pro text-xs px-3.5 py-1.5 border-white/[0.08] hover:border-brand-500/30 hover:bg-brand-500/5 text-brand-400 font-bold"
                      >
                        + Join
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
        </div>

        {filtered.filter(c => !joined.includes(c.id)).length === 0 && (
          <EmptyState
            icon="group_off"
            title="No communities found"
            description="Be the first to establish a community for your batch, subject, or hobbies!"
            action={{
              label: "Create Community",
              onClick: () => setCreating(true)
            }}
          />
        )}
      </div>
    </div>
  )
}

