'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'

const INTERNSHIPS = [
  { id:'i1', company:'Google', role:'Software Engineering Intern', location:'Greater Noida (Hybrid)', stipend:80000, duration:'3 months', deadline:'2026-07-15', skills:['Python','DSA','System Design'], type:'Technical', logo:'G', color:'#4cd7f6', description:'Work with the Ads Infrastructure team on large-scale distributed systems. You will own a project end-to-end.', requirements:'3rd/4th year CS/ECE · CGPA ≥ 8.0 · Strong DSA', posted:'2026-06-01' },
  { id:'i2', company:'Microsoft', role:'Product Manager Intern', location:'Hyderabad (On-site)', stipend:70000, duration:'2 months', deadline:'2026-07-10', skills:['Product Thinking','SQL','Communication'], type:'Management', logo:'M', color:'#c3c0ff', description:'Drive product roadmap for Microsoft Teams Education features. Work with design, engineering, and data teams.', requirements:'Any branch 3rd/4th year · CGPA ≥ 7.5', posted:'2026-06-02' },
  { id:'i3', company:'Goldman Sachs', role:'Technology Analyst Intern', location:'Bengaluru', stipend:90000, duration:'3 months', deadline:'2026-06-30', skills:['Java','Finance','Problem Solving'], type:'Finance-Tech', logo:'GS', color:'#86efac', description:'Join the Technology Division to build and maintain trading systems and risk platforms.', requirements:'CS/ECE/Math 3rd/4th year · CGPA ≥ 8.5', posted:'2026-05-28' },
  { id:'i4', company:'Zomato', role:'Data Science Intern', location:'Greater Noida (Hybrid)', stipend:45000, duration:'2 months', deadline:'2026-07-20', skills:['Python','ML','SQL','Statistics'], type:'Technical', logo:'Z', color:'#f97316', description:'Work on demand forecasting, pricing algorithms, and restaurant recommendation systems.', requirements:'Any branch · Strong ML/Statistics background', posted:'2026-06-03' },
  { id:'i5', company:'McKinsey & Company', role:'Business Analyst Intern', location:'Delhi', stipend:60000, duration:'2 months', deadline:'2026-07-05', skills:['Analytics','Excel','Communication','PPT'], type:'Consulting', logo:'Mc', color:'#d0bcff', description:'Work with client engagement teams on strategy and operations projects across sectors.', requirements:'MBA/Economics 2nd year · Strong analytical skills', posted:'2026-06-01' },
  { id:'i6', company:'Amazon', role:'SDE Intern', location:'Chennai (On-site)', stipend:100000, duration:'3 months', deadline:'2026-07-25', skills:['Java/C++','LLD','OOPs','DSA'], type:'Technical', logo:'A', color:'#fbbf24', description:'Build features for Amazon.in. Work with senior engineers on real production systems.', requirements:'CS/ECE 3rd/4th year · CGPA ≥ 8.0', posted:'2026-06-04' },
  { id:'i7', company:'Deloitte', role:'Risk & Advisory Intern', location:'Mumbai (Hybrid)', stipend:35000, duration:'2 months', deadline:'2026-07-30', skills:['Risk Management','Excel','Finance'], type:'Consulting', logo:'D', color:'#4cd7f6', description:'Support client teams on risk assessments, internal audits, and compliance frameworks.', requirements:'MBA/Finance 2nd year', posted:'2026-06-05' },
  { id:'i8', company:'Flipkart', role:'Product Design Intern', location:'Greater Noida (Hybrid)', stipend:50000, duration:'2 months', deadline:'2026-07-18', skills:['Figma','UX Research','Prototyping'], type:'Design', logo:'F', color:'#c3c0ff', description:'Design and prototype features for Flipkart\'s mobile app. User research, wireframing, usability testing.', requirements:'Any branch · Portfolio required', posted:'2026-06-03' },
]

const TYPES = ['All','Technical','Management','Finance-Tech','Consulting','Design']

export default function InternshipsClient({ userId, profile, appliedMap: initApplied }: any) {
  const [applied, setApplied] = useState<Record<string,string>>(initApplied)
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedInternship, setSelectedInternship] = useState<any>(null)
  const [applying, setApplying] = useState(false)
  const [tab, setTab] = useState<'browse'|'applied'>('browse')
  const supabase: any = createClient()

  const filtered = INTERNSHIPS.filter(i => {
    const matchType = typeFilter === 'All' || i.type === typeFilter
    const matchSearch = !search || i.company.toLowerCase().includes(search.toLowerCase()) || i.role.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const appliedList = INTERNSHIPS.filter(i => applied[i.id])

  async function applyNow(internship: any) {
    setApplying(true)
    const { error } = await supabase.from('internship_applications').insert({
      user_id: userId, internship_id: internship.id,
      company: internship.company, role: internship.role, status: 'applied'
    })
    setApplying(false)
    if (error && !error.message.includes('duplicate')) { toast.error('Failed to apply'); return }
    setApplied(prev => ({ ...prev, [internship.id]: 'applied' }))
    setSelectedInternship(null)
    toast.success(`Applied to ${internship.company}!`)
  }

  const statusColor: Record<string,string> = { applied:'#6366f1', shortlisted:'#22d3ee', rejected:'#f87171', selected:'#4ade80' }
  const statusLabel: Record<string,string> = { applied:'Applied', shortlisted:'Shortlisted', rejected:'Not Selected', selected:'Hired' }

  const daysUntil = (deadline: string) => {
    const d = new Date(deadline)
    const now = new Date()
    return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86400000))
  }

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="section-label">Career Portal</p>
          <h1 className="display-heading text-4xl">Internships</h1>
          <p className="body-pro text-sm">Access exclusive internship roles from top-tier companies.</p>
        </div>
        <div className="flex gap-4">
          <div className="card-premium px-4 py-2 flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Applications</span>
            <span className="text-xl font-display font-bold text-zinc-50 leading-none">{Object.keys(applied).length}</span>
          </div>
        </div>
      </header>

      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit">
        {(['browse','applied'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx(
              "px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all",
              tab === t ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}>
            {t==='browse' ? 'Browse' : 'My Portal'}
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
          className="space-y-8"
        >
          {tab === 'browse' ? (
            <>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</span>
                  <input className="input-pro pl-11" placeholder="Search by role or company…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-x-auto no-scrollbar">
                  {TYPES.map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className={clsx(
                        "px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-tighter whitespace-nowrap transition-all",
                        typeFilter === t ? "bg-white/[0.08] text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
                      )}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {label:'Openings',val:INTERNSHIPS.length,icon:'work',color:'text-indigo-400'},
                  {label:'Tech Roles',val:INTERNSHIPS.filter(i=>i.type==='Technical').length,icon:'code',color:'text-cyan-400'},
                  {label:'Avg Stipend',val:'₹'+Math.round(INTERNSHIPS.reduce((a,i)=>a+i.stipend,0)/INTERNSHIPS.length/1000)+'K',icon:'payments',color:'text-emerald-400'},
                  {label:'Closing Soon',val:INTERNSHIPS.filter(i=>daysUntil(i.deadline)<=7).length,icon:'timer',color:'text-amber-400'},
                ].map(s => (
                  <div key={s.label} className="card-premium p-4 flex flex-col gap-3 group hover:border-white/15 transition-all">
                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-900 border border-white/[0.03] shadow-inner transition-colors group-hover:bg-white/[0.02]", s.color)}>
                      <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-xl font-display font-bold text-zinc-50 leading-none">{s.val}</p>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Listings */}
              {filtered.length === 0 ? (
                <EmptyState 
                  icon="work_off"
                  title="No opportunities found"
                  description="We couldn't find any internships matching your current search or category."
                  action={{ label: "Reset All Filters", onClick: () => { setTypeFilter('All'); setSearch('') } }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filtered.map(intern => {
                    const isApplied = !!applied[intern.id]
                    const days = daysUntil(intern.deadline)
                    return (
                      <motion.div 
                        layout
                        key={intern.id} 
                        className="card-premium p-6 flex flex-col gap-5 cursor-pointer group hover:border-brand-500/30 transition-all duration-300 shadow-xl" 
                        onClick={() => setSelectedInternship(intern)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-2xl shrink-0 shadow-lg ring-1 ring-white/5 transition-transform group-hover:scale-105 duration-500"
                            style={{background:`${intern.color}15`, border:`1px solid ${intern.color}25`, color:intern.color}}>
                            {intern.logo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="sub-heading text-lg leading-tight group-hover:text-brand-400 transition-colors truncate tracking-tight">{intern.role}</h3>
                                <p className="text-xs font-mono text-zinc-500 mt-1 uppercase tracking-wider">{intern.company}</p>
                              </div>
                              {isApplied && (
                                <span className="chip-pro text-[9px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shrink-0">✓ Applied</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {intern.skills.slice(0,3).map(s => (
                            <span key={s} className="chip-pro text-[9px] py-0">{s}</span>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-2">
                          <div className="space-y-1">
                            <p className="section-label !text-[9px]">STIPEND</p>
                            <p className="text-zinc-50 font-display font-bold">₹{(intern.stipend/1000).toFixed(0)}K</p>
                          </div>
                          <div className="space-y-1">
                            <p className="section-label !text-[9px]">DURATION</p>
                            <p className="text-zinc-50 font-display font-bold">{intern.duration}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="section-label !text-[9px]">STATUS</p>
                            <p className="text-[11px] font-bold font-mono" style={{color: days<=7?'#f87171':days<=14?'#fbbf24':'#4ade80'}}>
                              {days===0?'Deadline Today':days===1?'Ends Tomorrow':`${days}d remaining`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                            <span className="material-symbols-outlined text-[16px] text-zinc-600">location_on</span>
                            {intern.location}
                          </span>
                          <span className="chip-pro text-[9px] uppercase tracking-tighter" style={{borderColor: `${intern.color}30`, color: intern.color}}>{intern.type}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {appliedList.length === 0 ? (
                <EmptyState 
                  icon="work_history"
                  title="No active applications"
                  description="You haven't submitted any internship applications yet. Start exploring roles in the browse tab."
                  action={{ label: "Browse Roles", onClick: () => setTab('browse') }}
                />
              ) : (
                appliedList.map(intern => {
                  const status = applied[intern.id] || 'applied'
                  return (
                    <div key={intern.id} className="card-premium p-5 flex flex-col md:flex-row md:items-center gap-6 group hover:border-white/15 transition-all">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl shrink-0 ring-1 ring-white/5 shadow-lg"
                        style={{background:`${intern.color}15`, color:intern.color}}>
                        {intern.logo}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="sub-heading text-lg tracking-tight">{intern.role}</h3>
                        <p className="text-sm text-zinc-500 font-mono uppercase tracking-wider">{intern.company} · {intern.location}</p>
                        <p className="text-xs text-zinc-600 font-medium">Applied {formatDistanceToNow(new Date(intern.posted), {addSuffix:true})}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                         <div className="text-right hidden md:block">
                            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Est. Stipend</p>
                            <p className="sub-heading text-lg leading-none">₹{(intern.stipend/1000).toFixed(0)}K</p>
                         </div>
                         <div className={clsx(
                           "px-5 py-2.5 rounded-xl text-xs font-bold font-display shadow-lg",
                           status === 'rejected' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                           status === 'selected' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                           "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                         )}>
                           {statusLabel[status]}
                         </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedInternship && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setSelectedInternship(null)} />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
              className="card-premium max-w-lg w-full relative z-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl shrink-0 shadow-lg ring-1 ring-white/10"
                    style={{background:`${selectedInternship.color}15`, color:selectedInternship.color}}>
                    {selectedInternship.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="display-heading text-2xl tracking-tight leading-tight">{selectedInternship.role}</h2>
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-1">{selectedInternship.company}</p>
                  </div>
                  <button onClick={()=>setSelectedInternship(null)} className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    {label:'STIPEND',val:`₹${(selectedInternship.stipend/1000).toFixed(0)}K/mo`},
                    {label:'DURATION',val:selectedInternship.duration},
                    {label:'DEADLINE',val:format(new Date(selectedInternship.deadline),'d MMM')},
                  ].map(s => (
                    <div key={s.label} className="bg-zinc-900/50 border border-white/[0.03] rounded-2xl p-4 text-center shadow-inner">
                      <p className="section-label !text-[9px] mb-1">{s.label}</p>
                      <p className="sub-heading text-base">{s.val}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="section-label">THE OPPORTUNITY</p>
                    <p className="body-pro text-[14px] leading-relaxed text-zinc-300">{selectedInternship.description}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="section-label">ELIGIBILITY</p>
                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.04]">
                      <p className="text-sm text-zinc-100 font-medium">{selectedInternship.requirements}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="section-label">PREVIEW SKILLS</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedInternship.skills.map((s:string) => (
                        <span key={s} className="chip-pro text-[10px] font-mono">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  {applied[selectedInternship.id] ? (
                    <div className="w-full py-4 rounded-2xl text-center font-bold font-display text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-xl">
                      ✓ APPLICATION SUBMITTED
                    </div>
                  ) : (
                    <button onClick={() => applyNow(selectedInternship)} disabled={applying} className="btn-premium w-full py-4 justify-center text-base shadow-2xl shadow-brand-500/20 active:scale-95 disabled:opacity-50">
                      {applying ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Apply Now'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
