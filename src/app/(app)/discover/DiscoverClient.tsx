'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient, checkRateLimit } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

interface Student {
  id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  branch: string | null
  year: number | null
  bio: string | null
  hostel: string | null
}

interface Friendship {
  requester_id: string
  addressee_id: string
  status: string
}

export default function DiscoverClient({
  students,
  currentUserId,
  myFriendships,
}: {
  students: Student[]
  currentUserId: string
  myFriendships: Friendship[]
}) {
  const supabase: any = createClient()
  const [search, setSearch] = useState('')
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState('')
  const [sent, setSent] = useState<string[]>([])

  const getRelation = (studentId: string) => {
    const f = myFriendships.find(
      f => (f.requester_id === studentId && f.addressee_id === currentUserId) ||
           (f.requester_id === currentUserId && f.addressee_id === studentId)
    )
    if (!f) return 'none'
    if (f.status === 'accepted') return 'friends'
    if (f.requester_id === currentUserId) return 'sent'
    return 'received'
  }

  const sendRequest = async (toId: string) => {
    const allowed = await checkRateLimit(supabase, 'friend_request', 10, '1 hour')
    if (!allowed) {
      toast.error('You have sent too many requests. Try again later.')
      return
    }

    const { error } = await supabase
  .from('friendships')
  .insert([
    {
      requester_id: currentUserId,
      addressee_id: toId,
      status: 'pending',
    }
  ])

if (error) {
  toast.error(error.message)
  return
}

window.location.reload()
  }

  const filtered = students.filter(s => {
    const name = s.full_name.toLowerCase()
    const q = search.toLowerCase()
    if (q && !name.includes(q) && !(s.username || '').toLowerCase().includes(q)) return false
    if (branch && s.branch !== branch) return false
    if (year && s.year !== +year) return false
    return true
  })

  const branches = [...new Set(students.map(s => s.branch).filter(Boolean))]

  return (
    <div className="animate-fade-in space-y-8 pb-24">
      <header className="space-y-1">
        <p className="section-label">Campus Directory</p>
        <h1 className="display-heading text-4xl">Discover</h1>
        <p className="body-pro text-sm">Find and connect with {students.length} verified students across the campus.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, username or bio…"
            className="
input-pro
pl-11
bg-white/5
border-white/10
focus:border-violet-500
focus:ring-2
focus:ring-violet-500/20
"
          />
        </div>
        <div className="flex gap-3">
          <select value={branch} onChange={e => setBranch(e.target.value)} className="input-pro w-auto min-w-[140px] appearance-none cursor-pointer">
            <option value="" className="bg-zinc-900">All Branches</option>
            {branches.map(b => <option key={b} value={b!} className="bg-zinc-900">{b}</option>)}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)} className="input-pro w-auto min-w-[120px] appearance-none cursor-pointer">
            <option value="" className="bg-zinc-900">All Years</option>
            {[1,2,3,4,5].map(y => <option key={y} value={y} className="bg-zinc-900">Year {y}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon="person_search"
          title="No students found"
          description="We couldn't find any students matching your search criteria."
          action={{
            label: "Reset Filters",
            onClick: () => { setSearch(''); setBranch(''); setYear('') }
          }}className="
card-premium
p-6
flex
flex-col
items-center
text-center
space-y-5
group
hover:border-brand-500/30
hover:-translate-y-1
hover:shadow-[0_0_40px_rgba(124,58,237,0.15)]
transition-all
duration-300
"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map(s => {
              const relation = getRelation(s.id)
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={s.id} 
                  className="card-premium p-6 flex flex-col items-center text-center space-y-5 group hover:border-brand-500/30 transition-all duration-300 shadow-lg"
                >
                  <GlobalAvatar
                    profile={s}
                    size="xl"
                    className="ring-2 ring-white/5 group-hover:ring-brand-500/20 transition-all duration-500 shadow-2xl"
                    imageClassName="transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  <div className="space-y-1">
                    <h3 className="sub-heading text-lg tracking-tight group-hover:text-brand-400 transition-colors">{s.full_name}</h3>
                    {s.username && <p className="text-xs font-mono text-zinc-500 lowercase tracking-tighter">@{s.username}</p>}
                  </div>

                  <div className="min-h-[40px] flex items-center justify-center">
                    {s.bio ? (
                      <p className="text-[13px] text-zinc-400 leading-relaxed line-clamp-2 italic">&ldquo;{s.bio}&rdquo;</p>
                    ) : (
                      <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">No bio provided</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center pt-1">
                    {s.branch && <span className="chip-pro text-[9px] py-0.5 bg-brand-500/10 border-brand-500/20 text-brand-400">{s.branch}</span>}
                    {s.year && <span className="chip-pro text-[9px] py-0.5">Year {s.year}</span>}
                    {s.hostel && <span className="chip-pro text-[9px] py-0.5 border-cyan-500/20 text-cyan-400">{s.hostel}</span>}
                  </div>

                  <div className="w-full pt-2">
                    {relation === 'none' && (
                     <button
  onClick={() => sendRequest(s.id)}
  className="btn-premium w-full text-xs py-2.5 flex items-center justify-center gap-2"
>
  <span className="material-symbols-outlined text-[16px] leading-none">
    person_add
  </span>
  <span className="leading-none">
    Connect
  </span>
</button>
                    )}
                    {relation === 'sent' && (
                      <button
  disabled
  className="btn-ghost-pro w-full text-xs py-2.5 opacity-60 flex items-center justify-center gap-2"
>
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        Pending
                      </button>
                    )}
                    {relation === 'friends' && (
                      <button
  disabled
  className="btn-ghost-pro w-full text-xs py-2.5 opacity-60 border-brand-500/20 text-brand-400 flex items-center justify-center gap-2"
>
  <span className="material-symbols-outlined text-[16px] leading-none">
    verified
  </span>
  <span className="leading-none">
    Connected
  </span>
</button>
                    )}
                    {relation === 'received' && (
                      <Link href="/friends" className="btn-premium w-full text-xs py-2.5">
                        Accept Request
                      </Link>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
