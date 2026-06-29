'use client'
import { Rocket, UserPlus, X, TrendingUp, Users, DollarSign, Briefcase, ExternalLink, Calendar, ChevronRight } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

const STARTUPS = [
  { id: 's1', name: 'EduRush', stage: 'MVP', sector: 'EdTech', team: 3, description: 'AI-powered personalised learning paths for JEE/NEET aspirants. 2K users in beta.', looking: ['Frontend Dev', 'Marketing'], logo: '🎓', founded: '2026', traction: '2,000 beta users' },
  { id: 's2', name: 'CampusBite', stage: 'Pre-Revenue', sector: 'FoodTech', team: 2, description: 'Connecting mess cooks with students for home-cooked meals. Solving the hostel food problem.', looking: ['Backend Dev', 'Operations'], logo: '🍱', founded: '2025', traction: '3 hostels onboarded' },
  { id: 's3', name: 'GreenRide', stage: 'Idea', sector: 'CleanTech', team: 1, description: 'Peer-to-peer cycle and EV sharing platform within campus. Zero carbon last-mile.', looking: ['Co-founder', 'Full Stack Dev', 'Business Dev'], logo: '🚲', founded: '2026', traction: 'Concept stage' },
  { id: 's4', name: 'NotesAI', stage: 'MVP', sector: 'AI/ML', team: 4, description: 'AI that converts lecture audio to structured notes with key concepts highlighted.', looking: ['ML Engineer'], logo: '🤖', founded: '2025', traction: '500 active users' },
  { id: 's5', name: 'LocalKart', stage: 'Revenue', sector: 'Commerce', team: 5, description: 'Hyperlocal e-commerce connecting campus students with nearby shop owners. ₹50K GMV/month.', looking: ['Growth Hacker'], logo: '🛍️', founded: '2024', traction: '₹50K GMV/month' },
]

const EVENTS = [
  { title: 'Startup Pitch Night #8', date: '2026-06-20', desc: 'Five-minute pitches to a panel of investors and alumni. Register by June 18.', type: 'Pitch' },
  { title: 'Founder Fireside: Kabir Malhotra', date: '2026-06-25', desc: 'IILM alum, CTO & co-founder of an EdTech startup, shares his journey from campus to Series A.', type: 'Fireside' },
  { title: 'Design Thinking Workshop', date: '2026-07-02', desc: '2-day intensive workshop on customer discovery, problem framing and rapid prototyping.', type: 'Workshop' },
  { title: 'IILM Startup Summit 2026', date: '2026-08-15', desc: 'Annual startup showcase. 20 teams compete for ₹5L in funding and mentorship prizes.', type: 'Summit' },
]

const RESOURCES = [
  { title: 'YC Startup School', url: 'https://startupschool.org', icon: 'school', desc: 'Free YC curriculum for founders' },
  { title: 'First Round Review', url: 'https://review.firstround.com', icon: 'article', desc: 'Deep startup insights & frameworks' },
  { title: 'IILM E-Cell Notion', url: '#', icon: 'edit_note', desc: 'Templates, guides, pitch decks' },
  { title: 'Startup India Portal', url: 'https://startupindia.gov.in', icon: 'account_balance', desc: 'Govt schemes & DPIIT registration' },
]

const stageConfig: Record<string, { color: string; bg: string; border: string }> = {
  'Idea': { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  'MVP': { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  'Pre-Revenue': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  'Revenue': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
}

const typeConfig: Record<string, { color: string; bg: string; border: string }> = {
  Pitch: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  Fireside: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  Workshop: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  Summit: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
}

export default function StartupClient({ userId }: any) {
  const supabase: any = createClient()
  const [tab, setTab] = useState<'startups' | 'events' | 'resources' | 'pitch'>('startups')
  const [selected, setSelected] = useState<any>(null)
  const [pitchForm, setPitchForm] = useState({ name: '', sector: '', stage: 'Idea', problem: '', solution: '', traction: '', team: '', ask: '' })
  const [submitting, setSubmitting] = useState(false)

  async function submitPitch() {
    if (!pitchForm.name || !pitchForm.problem) { toast.error('Fill required fields'); return }
    setSubmitting(true)
    const { team, ...rest } = pitchForm
    const { error } = await supabase.from('startup_pitches').insert({ ...rest, founder_id: userId })
    setSubmitting(false)
    if (error) { toast.error('Failed to submit pitch'); return }
    toast.success('Pitch submitted! E-Cell will review and reach out.')
    setPitchForm({ name: '', sector: '', stage: 'Idea', problem: '', solution: '', traction: '', team: '', ask: '' })
  }

  const TABS = [
    { key: 'startups', label: '🚀 Startups' },
    { key: 'events', label: '📅 Events' },
    { key: 'resources', label: '📚 Resources' },
    { key: 'pitch', label: '💡 Pitch Idea' },
  ] as const

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="glass-page-header flex-1 space-y-2">
          <p className="section-label">E-Cell · Entrepreneurship</p>
          <h1 className="display-heading text-4xl">Startup Cell</h1>
          <p className="body-pro text-sm">Build, discover, and collaborate on campus startups.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setTab('pitch')}
          className="btn-premium px-6 self-start md:self-auto shrink-0"
        >
          <Rocket size={18} />
          Pitch Your Idea
        </motion.button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Active Startups', v: STARTUPS.length, icon: 'rocket_launch', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
          { l: 'Total Founders', v: STARTUPS.reduce((s, st) => s + st.team, 0), icon: 'group', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
          { l: 'In Revenue', v: STARTUPS.filter(s => s.stage === 'Revenue').length, icon: 'payments', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { l: 'Open Roles', v: STARTUPS.reduce((s, st) => s + st.looking.length, 0), icon: 'work', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        ].map(s => (
          <div key={s.l} className="card-premium p-4 flex items-center gap-3">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', s.color)}>
              <DynamicIcon name={s.icon} size={18} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-white tracking-tight">{s.v}</p>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl w-fit bg-white/[0.03] border border-white/[0.06]">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-mono transition-all duration-200',
              tab === key
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Startups Tab */}
      {tab === 'startups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {STARTUPS.map(startup => {
            const stage = stageConfig[startup.stage] || stageConfig['Idea']
            return (
              <motion.div
                key={startup.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelected(startup)}
                className="card-premium p-5 cursor-pointer group flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-white/[0.04] border border-white/[0.06]">
                    {startup.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-white text-sm group-hover:text-brand-400 transition-colors">{startup.name}</h3>
                      <span className={clsx('text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider', stage.color, stage.bg, stage.border)}>
                        {startup.stage}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500">{startup.sector} · {startup.team} founders</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{startup.description}</p>
                <div className="pt-3 border-t border-white/[0.04]">
                  <p className="section-label mb-2">LOOKING FOR</p>
                  <div className="flex flex-wrap gap-1.5">
                    {startup.looking.map(r => (
                      <span key={r} className="chip-pro text-[9px] py-0.5 bg-brand-500/10 border-brand-500/20 text-brand-400">{r}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Events Tab */}
      {tab === 'events' && (
        <div className="space-y-4">
          {EVENTS.map((ev, i) => {
            const tc = typeConfig[ev.type] || typeConfig['Pitch']
            return (
              <div key={i} className="card-premium p-5 flex gap-4 group hover:border-brand-500/20 transition-all duration-300">
                <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border', tc.color, tc.bg, tc.border)}>
                  <DynamicIcon
                    name={ev.type === 'Pitch' ? 'mic' : ev.type === 'Fireside' ? 'local_fire_department' : ev.type === 'Workshop' ? 'build' : 'event'}
                    size={20}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-bold text-white text-sm group-hover:text-brand-400 transition-colors">{ev.title}</h3>
                    <span className={clsx('text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider', tc.color, tc.bg, tc.border)}>
                      {ev.type}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 mb-1 flex items-center gap-1">
                    <Calendar size={10} /> {ev.date}
                  </p>
                  <p className="text-xs text-zinc-400">{ev.desc}</p>
                </div>
                <button className="btn-premium text-xs px-4 py-2 self-center shrink-0">Register</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Resources Tab */}
      {tab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RESOURCES.map(r => (
            <a
              key={r.title}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-premium p-5 flex items-center gap-4 no-underline group hover:border-brand-500/20 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <DynamicIcon name={r.icon} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm group-hover:text-brand-400 transition-colors">{r.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{r.desc}</p>
              </div>
              <ExternalLink size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
            </a>
          ))}
        </div>
      )}

      {/* Pitch Tab */}
      {tab === 'pitch' && (
        <div className="max-w-2xl">
          <div className="card-premium p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="sub-heading text-xl flex items-center gap-2">
                <Rocket size={18} className="text-brand-400" />
                Submit Your Startup Idea
              </h2>
              <p className="text-xs text-zinc-500">E-Cell reviews all submissions. Selected ideas get mentorship, resources, and a chance to pitch at Startup Night.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="section-label block px-1">STARTUP NAME *</label>
                <input className="input-pro" placeholder="What's your startup called?" value={pitchForm.name} onChange={e => setPitchForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="section-label block px-1">SECTOR</label>
                <select className="input-pro appearance-none cursor-pointer" value={pitchForm.sector} onChange={e => setPitchForm(p => ({ ...p, sector: e.target.value }))}>
                  <option value="" className="bg-zinc-900">Select sector</option>
                  {['EdTech', 'FinTech', 'HealthTech', 'FoodTech', 'CleanTech', 'AI/ML', 'SaaS', 'Commerce', 'Other'].map(s => (
                    <option key={s} className="bg-zinc-900">{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label block px-1">STAGE</label>
                <select className="input-pro appearance-none cursor-pointer" value={pitchForm.stage} onChange={e => setPitchForm(p => ({ ...p, stage: e.target.value }))}>
                  {['Idea', 'MVP', 'Pre-Revenue', 'Revenue'].map(s => (
                    <option key={s} className="bg-zinc-900">{s}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="section-label block px-1">PROBLEM YOU&apos;RE SOLVING *</label>
                <textarea className="input-pro resize-none py-3" rows={3} placeholder="What pain point does your startup address?" value={pitchForm.problem} onChange={e => setPitchForm(p => ({ ...p, problem: e.target.value }))} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="section-label block px-1">YOUR SOLUTION</label>
                <textarea className="input-pro resize-none py-3" rows={3} placeholder="How are you solving it?" value={pitchForm.solution} onChange={e => setPitchForm(p => ({ ...p, solution: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="section-label block px-1">TRACTION</label>
                <input className="input-pro" placeholder="Users, revenue, pilots…" value={pitchForm.traction} onChange={e => setPitchForm(p => ({ ...p, traction: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="section-label block px-1">WHAT DO YOU NEED?</label>
                <input className="input-pro" placeholder="Funding, co-founder, dev…" value={pitchForm.ask} onChange={e => setPitchForm(p => ({ ...p, ask: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setTab('startups')} className="btn-ghost-pro px-6">Cancel</button>
              <button onClick={submitPitch} disabled={submitting} className="btn-premium px-8 disabled:opacity-60">
                {submitting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Rocket size={16} /> Submit Pitch</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Startup Detail Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card-elevated max-w-md w-full relative z-10 p-6 space-y-6 overflow-hidden"
            >
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all">
                <X size={16} />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 bg-white/[0.05] border border-white/[0.08]">
                  {selected.logo}
                </div>
                <div>
                  <h2 className="font-bold text-white text-xl tracking-tight">{selected.name}</h2>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">{selected.sector} · Founded {selected.founded}</p>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">{selected.description}</p>

              <div className="grid grid-cols-3 gap-3">
                {[{ l: 'Stage', v: selected.stage }, { l: 'Team', v: `${selected.team} people` }, { l: 'Traction', v: selected.traction }].map(s => (
                  <div key={s.l} className="p-3 rounded-xl text-center bg-white/[0.03] border border-white/[0.05]">
                    <p className="section-label mb-1">{s.l}</p>
                    <p className="text-xs font-bold text-white">{s.v}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="section-label mb-2">OPEN POSITIONS</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.looking.map((r: string) => (
                    <span key={r} className="chip-pro text-xs bg-brand-500/10 border-brand-500/20 text-brand-400">{r}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { toast.success(`Application sent to ${selected.name}!`); setSelected(null) }}
                className="btn-premium w-full py-3 justify-center"
              >
                <UserPlus size={16} />
                Apply to Join Team
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
