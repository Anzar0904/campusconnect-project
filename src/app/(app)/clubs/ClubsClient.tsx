'use client'
import { CheckCircle, X } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/DynamicIcon'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'

interface Club {
  id: string
  name: string
  description: string | null
  category: string
  member_count: number
  is_official: boolean
  lead_name: string | null
  contact_email: string | null
  logo_url: string | null
  banner_url: string | null
}

const IILM_CLUBS: Club[] = [
  { id: '1', name: 'Entrepreneurship Cell', category: 'Career', description: 'IILM\'s premier startup club. We run workshops, pitch competitions and connect students with mentors.', member_count: 120, is_official: true, lead_name: 'Arjun Mehta', contact_email: 'ecell@iilm.edu', logo_url: null, banner_url: null },
  { id: '2', name: 'Marketing Club', category: 'Technical', description: 'Live case competitions, brand audits, and campaigns. Learn marketing by doing it.', member_count: 95, is_official: true, lead_name: 'Sneha Kapoor', contact_email: 'marketing@iilm.edu', logo_url: null, banner_url: null },
  { id: '3', name: 'Finance & Investment Club', category: 'Career', description: 'Stock market simulations, CFA prep sessions, and industry speaker series.', member_count: 80, is_official: true, lead_name: 'Rahul Sharma', contact_email: 'fic@iilm.edu', logo_url: null, banner_url: null },
  { id: '4', name: 'Dramatics Society', category: 'Cultural', description: 'Stage plays, street theatre, monologues. Express yourself at IILM Fest every year.', member_count: 65, is_official: true, lead_name: 'Priya Singh', contact_email: null, logo_url: null, banner_url: null },
  { id: '5', name: 'Music Club', category: 'Cultural', description: 'Band practices, open mics, and performances at every college event.', member_count: 55, is_official: true, lead_name: 'Varun Nair', contact_email: null, logo_url: null, banner_url: null },
  { id: '6', name: 'Photography & Media Club', category: 'Cultural', description: 'Cover college events, learn editing, and build your portfolio.', member_count: 70, is_official: true, lead_name: 'Aditi Verma', contact_email: 'media@iilm.edu', logo_url: null, banner_url: null },
  { id: '7', name: 'Sports Committee', category: 'Sports', description: 'Organises inter-college tournaments, intra-college leagues, and fitness drives.', member_count: 150, is_official: true, lead_name: 'Kabir Rao', contact_email: 'sports@iilm.edu', logo_url: null, banner_url: null },
  { id: '8', name: 'Debate & MUN Club', category: 'Academic', description: 'Parliamentary debates, Model UN conferences, and public speaking workshops.', member_count: 45, is_official: false, lead_name: 'Riya Ghosh', contact_email: null, logo_url: null, banner_url: null },
  { id: '9', name: 'Tech & Coding Club', category: 'Technical', description: 'Hackathons, web dev bootcamps, and competitive programming for non-tech college students.', member_count: 60, is_official: false, lead_name: 'Aditya Kumar', contact_email: null, logo_url: null, banner_url: null },
  { id: '10', name: 'NSS Unit', category: 'Social', description: 'Community service, blood donation drives, village outreach and environmental campaigns.', member_count: 200, is_official: true, lead_name: 'Meera Joshi', contact_email: 'nss@iilm.edu', logo_url: null, banner_url: null },
]

const CAT_ICONS: Record<string, string> = {
  Career: 'rocket_launch',
  Technical: 'code',
  Cultural: 'theater_comedy',
  Sports: 'sports',
  Academic: 'school',
  Social: 'volunteer_activism',
}

const CAT_COLORS: Record<string, string> = {
  Career: '#22d3ee',
  Technical: '#8b5cf6',
  Cultural: '#6366f1',
  Sports: '#22d3ee',
  Academic: '#6366f1',
  Social: '#8b5cf6',
}

export default function ClubsClient({ clubs: dbClubs }: { clubs: Club[]; currentUserId: string }) {
  const clubs = dbClubs.length > 0 ? dbClubs : IILM_CLUBS
  const [filter, setFilter] = useState('All')
  const [joined, setJoined] = useState<string[]>([])
  const [selected, setSelected] = useState<Club | null>(null)

  const categories = ['All', ...Object.keys(CAT_ICONS)]
  const filtered = clubs.filter(c => filter === 'All' || c.category === filter)
  const official = filtered.filter(c => c.is_official)
  const unofficial = filtered.filter(c => !c.is_official)

  const toggle = (id: string) => setJoined(j => j.includes(id) ? j.filter(x => x !== id) : [...j, id])

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      <header className="space-y-1">
        <p className="section-label">Campus Organizations</p>
        <h1 className="display-heading text-4xl">Clubs & Societies</h1>
        <p className="body-pro text-sm">Join active student groups and official university bodies.</p>
      </header>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap p-1 rounded-2xl bg-white/[0.02] border border-white/[0.04] w-fit">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest transition-all",
              filter === c ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}>
            {c !== 'All' && <DynamicIcon name={CAT_ICONS[c]} size={16} style={{ color: filter === c ? 'white' : CAT_COLORS[c] }} />}
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {/* Official clubs */}
        {official.length > 0 ? (
          <div className="space-y-6">
            <p className="section-label px-1">UNIVERSITY RECOGNIZED</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {official.map(club => {
                const color = CAT_COLORS[club.category] || '#a1a1aa'
                const isJoined = joined.includes(club.id)
                return (
                  <motion.div 
                    layout
                    key={club.id} 
                    className="card-premium p-6 cursor-pointer group hover:border-brand-500/30 transition-all duration-300 shadow-xl" 
                    onClick={() => setSelected(club)}
                  >
                    <div className="flex items-start gap-5 mb-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-500"
                        style={{background: `${color}15`, border: `1px solid ${color}25`}}>
                        <DynamicIcon name={CAT_ICONS[club.category]} size={28} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="sub-heading text-lg group-hover:text-brand-400 transition-colors tracking-tight">{club.name}</h3>
                          <CheckCircle className="text-brand-400" size={18} />
                        </div>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-tighter">{club.member_count} Members · {club.category}</p>
                      </div>
                    </div>
                    {club.description && <p className="body-pro text-sm line-clamp-2 leading-relaxed">{club.description}</p>}
                    <div className="flex items-center justify-between pt-5 mt-5 border-t border-white/[0.04]">
                       <button
                        onClick={e => { e.stopPropagation(); toggle(club.id) }}
                        className={clsx(
                          "btn-ghost-pro py-1.5 px-4 text-xs",
                          isJoined ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "hover:bg-brand-500/5"
                        )}
                      >
                        {isJoined ? 'Member ✓' : 'Join Club'}
                      </button>
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Official Entity</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ) : filter !== 'All' && (
          <EmptyState icon="group_off" title="No official clubs" description={`We couldn't find any official clubs in the ${filter} category.`} />
        )}

        {/* Unofficial clubs */}
        {unofficial.length > 0 && (
          <div className="space-y-6">
            <p className="section-label px-1">STUDENT-RUN GROUPS</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {unofficial.map(club => {
                const color = CAT_COLORS[club.category] || '#a1a1aa'
                const isJoined = joined.includes(club.id)
                return (
                  <motion.div 
                    layout
                    key={club.id} 
                    className="card-premium p-6 cursor-pointer group hover:border-brand-500/20 transition-all duration-300 shadow-lg" 
                    onClick={() => setSelected(club)}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-zinc-900 border border-white/[0.05] shadow-inner group-hover:bg-white/[0.03] transition-colors"
                        style={{ color }}>
                        <DynamicIcon name={CAT_ICONS[club.category]} size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="sub-heading text-base leading-tight tracking-tight group-hover:text-brand-400 transition-colors truncate">{club.name}</h3>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">{club.member_count} Members</p>
                      </div>
                    </div>
                    {club.description && <p className="body-pro text-[13px] line-clamp-2 opacity-80">{club.description}</p>}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setSelected(null)} />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
              className="card-premium max-w-lg w-full relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="h-32 relative bg-gradient-to-br from-brand-500/20 to-cyan-500/20">
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8">
                <div className="flex items-end gap-5 -mt-14 mb-6">
                  <div className="w-20 h-20 rounded-3xl border-4 border-zinc-950 flex items-center justify-center shadow-2xl ring-1 ring-white/5"
                    style={{ background: 'linear-gradient(135deg, #18181b, #09090b)' }}>
                    <DynamicIcon name={CAT_ICONS[selected.category]} size={36} style={{ color: CAT_COLORS[selected.category] }} />
                  </div>
                  <div className="pb-1 min-w-0">
                    {selected.is_official && <span className="chip-pro text-[9px] bg-brand-500/10 border-brand-500/20 text-brand-400 mb-1.5 flex items-center gap-1 w-fit"><CheckCircle size={12} /> OFFICIAL</span>}
                    <h2 className="display-heading text-2xl tracking-tight leading-none truncate">{selected.name}</h2>
                  </div>
                </div>

                <p className="body-pro text-base leading-relaxed text-zinc-300 mb-8">{selected.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {selected.lead_name && (
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.03] shadow-inner">
                      <p className="section-label !text-[9px] mb-1">CLUB LEAD</p>
                      <p className="sub-heading text-sm">{selected.lead_name}</p>
                    </div>
                  )}
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.03] shadow-inner">
                    <p className="section-label !text-[9px] mb-1">MEMBERSHIP</p>
                    <p className="sub-heading text-sm">{selected.member_count} Students</p>
                  </div>
                  {selected.contact_email && (
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.03] shadow-inner col-span-2">
                      <p className="section-label !text-[9px] mb-1">CONTACT EMAIL</p>
                      <p className="text-sm text-brand-400 font-mono">{selected.contact_email}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { toggle(selected.id); setSelected(null) }}
                  className={clsx(
                    "w-full py-4 rounded-2xl font-bold font-display shadow-2xl transition-all active:scale-95",
                    joined.includes(selected.id) ? "btn-ghost-pro !text-red-400 hover:!bg-red-500/5 hover:!border-red-500/20" : "btn-premium"
                  )}
                >
                  {joined.includes(selected.id) ? 'Leave Society' : 'Join Community'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
