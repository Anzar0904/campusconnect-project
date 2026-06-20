'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'

const DRIVES = [
  { id:'d1', company:'Google', logo:'G', color:'#4cd7f6', ctc:'45 LPA', roles:['SWE','SDE-2'], branches:['CSE','ECE'], minCGPA:8.5, date:'2026-07-10', venue:'Placement Hall A', process:['Online Test','Technical Round 1','Technical Round 2','HR'], status:'upcoming', openings:5 },
  { id:'d2', company:'Microsoft', logo:'M', color:'#c3c0ff', ctc:'40 LPA', roles:['SDE','Product Analyst'], branches:['CSE','ECE','IT'], minCGPA:8.0, date:'2026-07-05', venue:'Placement Hall B', process:['Coding Test','2x Technical','HR'], status:'upcoming', openings:8 },
  { id:'d3', company:'Goldman Sachs', logo:'GS', color:'#86efac', ctc:'32 LPA', roles:['Technology Analyst'], branches:['CSE','ECE','Math'], minCGPA:8.5, date:'2026-06-28', venue:'Virtual', process:['HackerRank Test','Video Interview x2'], status:'ongoing', openings:6 },
  { id:'d4', company:'Amazon', logo:'A', color:'#fbbf24', ctc:'38 LPA', roles:['SDE-1'], branches:['CSE','ECE'], minCGPA:7.5, date:'2026-07-18', venue:'Placement Hall A', process:['Online Assessment','2x Tech','Bar Raiser','HR'], status:'upcoming', openings:12 },
  { id:'d5', company:'Deloitte', logo:'D', color:'#f472b6', ctc:'8 LPA', roles:['Business Analyst','Analyst'], branches:['All Branches'], minCGPA:6.5, date:'2026-07-02', venue:'Auditorium', process:['Aptitude Test','GD','HR'], status:'upcoming', openings:20 },
  { id:'d6', company:'Infosys', logo:'In', color:'#fb923c', ctc:'6.5 LPA', roles:['Systems Engineer'], branches:['All Branches'], minCGPA:6.0, date:'2026-06-25', venue:'Placement Hall', process:['Online Test','HR'], status:'completed', openings:50, selected:14 },
  { id:'d7', company:'Wipro', logo:'W', color:'#a78bfa', ctc:'6 LPA', roles:['Project Engineer'], branches:['All Branches'], minCGPA:6.0, date:'2026-06-20', venue:'Online', process:['NLT Test','HR'], status:'completed', openings:40, selected:22 },
]

const OFFERS = [
  { student:'Rahul Sharma', company:'Google', ctc:'45 LPA', branch:'CSE', year:4, avatar:'RS' },
  { student:'Ananya Gupta', company:'Microsoft', ctc:'40 LPA', branch:'CSE', year:4, avatar:'AG' },
  { student:'Karan Mehta', company:'Goldman Sachs', ctc:'32 LPA', branch:'ECE', year:4, avatar:'KM' },
  { student:'Priya Singh', company:'Amazon', ctc:'38 LPA', branch:'CSE', year:4, avatar:'PS' },
  { student:'Arjun Kumar', company:'Deloitte', ctc:'8 LPA', branch:'MBA', year:2, avatar:'AK' },
]

const RESOURCES = [
  { title:'DSA Sheet (Striver)', url:'https://takeuforward.org', icon:'code', desc:'450 must-do problems' },
  { title:'System Design Primer', url:'https://github.com/donnemartin/system-design-primer', icon:'architecture', desc:'Comprehensive SD guide' },
  { title:'IILM Placement Stats 2025', url:'#', icon:'bar_chart', desc:'Last year placement data' },
  { title:'Resume Templates', url:'#', icon:'description', desc:'ATS-friendly templates' },
]

export default function PlacementsClient({ userId, profile, dbDrives, dbOffers, myRegistrations }: any) {
  const mergedDrives = dbDrives && dbDrives.length > 0 ? dbDrives : DRIVES
  const mergedOffers = dbOffers && dbOffers.length > 0 ? dbOffers : OFFERS

  const [registered, setRegistered] = useState<Set<string>>(new Set((myRegistrations ?? []).map((r: any) => r.drive_id)))
  const [tab, setTab] = useState<'drives'|'offers'|'prep'|'timeline'>('drives')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const supabase = createClient()

  const filtered = mergedDrives.filter((d: any) => statusFilter === 'all' || d.status === statusFilter)

  const statusColor: Record<string,string> = { upcoming:'#4cd7f6', ongoing:'#86efac', completed:'#c7c4d8' }

  async function register(id: string, company: string) {
    const toastId = toast.loading(`Registering for ${company}...`)
    try {
      const { error } = await supabase.from('placement_registrations').insert({
        user_id: userId, drive_id: id, company: company, status: 'registered'
      })
      if (error) {
        if (error.code === '23505') throw new Error('You are already registered for this drive')
        throw error
      }
      setRegistered(prev => new Set(Array.from(prev).concat(id)))
      toast.success(`Registered for ${company} placement drive!`, { id: toastId })
      setSelected(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to register', { id: toastId })
    }
  }

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      <header className="space-y-1">
        <p className="section-label">Campus Placements</p>
        <h1 className="display-heading text-4xl">Careers Hub</h1>
        <p className="body-pro text-sm">Unified placement portal for drives, resources, and campus success tracking.</p>
      </header>

      {/* Stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Companies',val:mergedDrives.length,icon:'domain',color:'text-indigo-400'},
          {label:'New Offers',val:mergedOffers.length,icon:'handshake',color:'text-emerald-400'},
          {label:'Avg Package',val:'12.5 LPA',icon:'payments',color:'text-cyan-400'},
          {label:'Highest',val:'45 LPA',icon:'emoji_events',color:'text-amber-400'},
        ].map(s => (
          <div key={s.label} className="card-premium p-4 flex items-center gap-4 group">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-900 border border-white/[0.03] shrink-0 shadow-inner", s.color)}>
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>{s.icon}</span>
            </div>
            <div>
              <p className="text-xl font-display font-bold text-zinc-50 leading-none">{s.val}</p>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit overflow-x-auto no-scrollbar max-w-full">
        {([['drives','Drives'],['offers','Offers Wall'],['prep','Resources'],['timeline','Timeline']] as const).map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx(
              "px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-all",
              tab === t ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'drives' && (
            <div className="space-y-6">
              <div className="flex gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit">
                {(['all','upcoming','ongoing','completed'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={clsx(
                      "px-4 py-1.5 rounded-lg text-[10px] font-mono capitalize transition-all",
                      statusFilter === s ? "bg-white/[0.08] text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
                    )}>
                    {s}
                  </button>
                ))}
              </div>
              
              {filtered.length === 0 ? (
                <EmptyState icon="business_center" title="No drives found" description="There are no active placement drives matching this filter." />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((drive: any) => (
                    <div key={drive.id} className="card-premium p-5 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer group hover:border-brand-500/30 transition-all" onClick={() => setSelected(drive)}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl shrink-0 shadow-lg ring-1 ring-white/5 transition-transform group-hover:scale-105"
                        style={{background:`${drive.color}15`, border:`1px solid ${drive.color}25`, color:drive.color}}>
                        {drive.logo}
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="sub-heading text-lg tracking-tight group-hover:text-brand-400 transition-colors">{drive.company}</h3>
                          <span className="chip-pro text-[9px] font-mono uppercase py-0" style={{borderColor:`${statusColor[drive.status]}30`, color:statusColor[drive.status]}}>
                            {drive.status}
                          </span>
                          {registered.has(drive.id) && <span className="chip-pro text-[9px] font-mono py-0 bg-emerald-500/10 border-emerald-500/20 text-emerald-400">✓ REGISTERED</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {drive.roles.map((r: string) => <span key={r} className="chip-pro text-[9px] py-0">{r}</span>)}
                          <span className="text-[10px] font-mono text-zinc-600 px-2 flex items-center">{drive.branches.join(' · ')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1 border-l border-white/[0.04] pl-6 md:min-w-[120px]">
                        <p className="text-xl font-display font-bold text-zinc-50">{drive.ctc}</p>
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-tighter">{format(new Date(drive.date), 'd MMM yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'offers' && (
            <div className="space-y-6">
               <p className="body-pro text-sm">Recognizing the top placements from the graduating batch of 2026.</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {OFFERS.map((offer, i) => (
                  <div key={i} className="card-premium p-6 text-center space-y-4 group hover:border-brand-500/30 transition-all">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center font-display font-bold text-xl mx-auto ring-2 ring-white/5 shadow-2xl transition-transform group-hover:scale-110"
                      style={{background:'rgba(99,102,241,0.1)', color:'#6366f1'}}>
                      {offer.avatar}
                    </div>
                    <div className="space-y-1">
                      <p className="sub-heading text-lg">{offer.student}</p>
                      <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">{offer.branch} · Y{offer.year}</p>
                    </div>
                    <div className="pt-4 border-t border-white/[0.04] flex flex-col items-center gap-1">
                      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">PLACED AT</p>
                      <p className="display-heading text-xl text-emerald-400 tracking-tight">{offer.company}</p>
                      <p className="text-sm font-mono text-zinc-500">{offer.ctc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'prep' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {RESOURCES.map(r => (
                  <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="card-premium p-6 flex items-center gap-5 group transition-all">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-zinc-900 border border-white/[0.03] shrink-0 shadow-inner group-hover:bg-brand-500/10 transition-colors">
                      <span className="material-symbols-outlined text-[28px] text-zinc-500 group-hover:text-brand-400 transition-colors">{r.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="sub-heading text-lg tracking-tight group-hover:text-brand-400 transition-colors">{r.title}</p>
                      <p className="body-pro text-sm mt-1">{r.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
              <div className="card-premium p-8 space-y-6 bg-brand-500/[0.02]">
                <h3 className="sub-heading text-xl">Preparation Tracker</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {task:'Update resume on placement portal',done:false},
                    {task:'Complete 10 aptitude practice tests',done:false},
                    {task:'Solve 100+ DSA problems on LeetCode',done:false},
                    {task:'Prepare STAR-format HR answers',done:false},
                    {task:'Mock interview with mentors',done:false},
                    {task:'Company research & profiling',done:false},
                  ].map((item,i) => (
                    <label key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/50 border border-white/[0.02] cursor-pointer hover:border-brand-500/30 transition-all group">
                      <input type="checkbox" defaultChecked={item.done} className="w-5 h-5 rounded-lg accent-brand-500 border-white/10 bg-white/5" />
                      <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{item.task}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'timeline' && (
            <div className="relative pl-10 space-y-2 py-4">
              <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-brand-500/50 to-transparent" />
              {[...mergedDrives].sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime()).map(drive => (
                <div key={drive.id} className="relative flex gap-6 pb-10 last:pb-0">
                  <div className="absolute -left-[30px] top-2 w-4 h-4 rounded-full border-4 border-zinc-950 z-10"
                    style={{background:statusColor[drive.status], boxShadow:`0 0 20px ${statusColor[drive.status]}40`}} />
                  <div className="flex-1 card-premium p-5 group hover:border-brand-500/30 transition-all shadow-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 ring-1 ring-white/5 shadow-md"
                          style={{background:`${drive.color}15`, color:drive.color}}>
                          {drive.logo}
                        </div>
                        <div>
                          <p className="sub-heading text-base">{drive.company}</p>
                          <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">{drive.roles[0]}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-zinc-50 font-bold">{format(new Date(drive.date),'d MMM')}</p>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">{drive.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
