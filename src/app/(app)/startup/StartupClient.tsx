'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const STARTUPS = [
  { id:'s1', name:'EduRush', stage:'MVP', sector:'EdTech', team:3, description:'AI-powered personalised learning paths for JEE/NEET aspirants. 2K users in beta.', looking:['Frontend Dev','Marketing'], logo:'🎓', founded:'2026', traction:'2,000 beta users' },
  { id:'s2', name:'CampusBite', stage:'Pre-Revenue', sector:'FoodTech', team:2, description:'Connecting mess cooks with students for home-cooked meals. Solving the hostel food problem.', looking:['Backend Dev','Operations'], logo:'🍱', founded:'2025', traction:'3 hostels onboarded' },
  { id:'s3', name:'GreenRide', stage:'Idea', sector:'CleanTech', team:1, description:'Peer-to-peer cycle and EV sharing platform within campus. Zero carbon last-mile.', looking:['Co-founder','Full Stack Dev','Business Dev'], logo:'🚲', founded:'2026', traction:'Concept stage' },
  { id:'s4', name:'NotesAI', stage:'MVP', sector:'AI/ML', team:4, description:'AI that converts lecture audio to structured notes with key concepts highlighted.', looking:['ML Engineer'], logo:'🤖', founded:'2025', traction:'500 active users' },
  { id:'s5', name:'LocalKart', stage:'Revenue', sector:'Commerce', team:5, description:'Hyperlocal e-commerce connecting campus students with nearby shop owners. ₹50K GMV/month.', looking:['Growth Hacker'], logo:'🛍️', founded:'2024', traction:'₹50K GMV/month' },
]

const EVENTS = [
  { title:'Startup Pitch Night #8', date:'2026-06-20', desc:'5-minute pitches to a panel of investors and alumni. Register by June 18.', type:'Pitch' },
  { title:'Founder Fireside: Kabir Malhotra', date:'2026-06-25', desc:'IILM alum, CTO & co-founder of an EdTech startup, shares his journey from campus to Series A.', type:'Fireside' },
  { title:'Design Thinking Workshop', date:'2026-07-02', desc:'2-day intensive workshop on customer discovery, problem framing and rapid prototyping.', type:'Workshop' },
  { title:'IILM Startup Summit 2026', date:'2026-08-15', desc:'Annual startup showcase. 20 teams compete for ₹5L in funding and mentorship prizes.', type:'Summit' },
]

const RESOURCES = [
  { title:'YC Startup School', url:'https://startupschool.org', icon:'school', desc:'Free YC curriculum for founders' },
  { title:'First Round Review', url:'https://review.firstround.com', icon:'article', desc:'Deep startup insights & frameworks' },
  { title:'IILM E-Cell Notion', url:'#', icon:'edit_note', desc:'Templates, guides, pitch decks' },
  { title:'Startup India Portal', url:'https://startupindia.gov.in', icon:'account_balance', desc:'Govt schemes & DPIIT registration' },
]

const stageColor: Record<string,string> = { 'Idea':'#c3c0ff', 'MVP':'#4cd7f6', 'Pre-Revenue':'#fbbf24', 'Revenue':'#86efac' }

export default function StartupClient({ userId }: any) {
  const supabase = createClient()
  const [tab, setTab] = useState<'startups'|'events'|'resources'|'pitch'>('startups')
  const [selected, setSelected] = useState<any>(null)
  const [pitchForm, setPitchForm] = useState({ name:'', sector:'', stage:'Idea', problem:'', solution:'', traction:'', team:'', ask:'' })
  const [submitting, setSubmitting] = useState(false)

  async function submitPitch() {
    if (!pitchForm.name || !pitchForm.problem) { toast.error('Fill required fields'); return }
    setSubmitting(true)
    const { team, ...rest } = pitchForm;
    const { error } = await supabase.from('startup_pitches').insert({ ...rest, founder_id: userId })
    setSubmitting(false)
    if (error) { toast.error('Failed to submit pitch'); return }
    toast.success('Pitch submitted! E-Cell will review and reach out.')
    setPitchForm({ name:'', sector:'', stage:'Idea', problem:'', solution:'', traction:'', team:'', ask:'' })
  }

  const typeColor: Record<string,string> = { Pitch:'#f472b6', Fireside:'#fbbf24', Workshop:'#4cd7f6', Summit:'#c3c0ff' }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Startup Cell</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Build, discover, and collaborate on campus startups</p>
        </div>
        <button onClick={()=>setTab('pitch')} className="btn-primary text-sm">
          <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
          Pitch Your Idea
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {l:'Active Startups',v:STARTUPS.length,icon:'rocket_launch',color:'#c3c0ff'},
          {l:'Founders',v:STARTUPS.reduce((s,st)=>s+st.team,0),icon:'group',color:'#4cd7f6'},
          {l:'In Revenue',v:STARTUPS.filter(s=>s.stage==='Revenue').length,icon:'payments',color:'#86efac'},
          {l:'Open Roles',v:STARTUPS.reduce((s,st)=>s+st.looking.length,0),icon:'work',color:'#fbbf24'},
        ].map(s=>(
          <div key={s.l} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:`${s.color}18`,border:`1px solid ${s.color}30`}}>
              <span className="material-symbols-outlined text-[18px]" style={{color:s.color,fontVariationSettings:"'FILL' 1"}}>{s.icon}</span>
            </div>
            <div>
              <p className="font-display font-bold text-on-surface">{s.v}</p>
              <p className="text-[10px] font-mono text-on-surface-variant">{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
        {([['startups','🚀 Startups'],['events','📅 Events'],['resources','📚 Resources'],['pitch','💡 Pitch Idea']] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-mono transition-all"
            style={tab===t?{background:'rgba(79,70,229,0.4)',color:'#c3c0ff',border:'1px solid rgba(195,192,255,0.2)'}:{color:'#c7c4d8'}}>
            {label}
          </button>
        ))}
      </div>

      {tab==='startups' && (
        <div className="grid grid-cols-2 gap-4">
          {STARTUPS.map(startup=>(
            <div key={startup.id} className="glass-card rounded-xl p-5 cursor-pointer flex flex-col gap-3" onClick={()=>setSelected(startup)}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  {startup.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-display font-semibold text-on-surface text-sm">{startup.name}</h3>
                    <span className="chip text-[10px]" style={{background:`${stageColor[startup.stage]}15`,color:stageColor[startup.stage],border:`1px solid ${stageColor[startup.stage]}25`}}>{startup.stage}</span>
                  </div>
                  <p className="text-xs font-mono text-on-surface-variant">{startup.sector} · {startup.team} founders</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{startup.description}</p>
              <div className="pt-2 border-t border-white/[0.06]">
                <p className="section-label mb-1.5">LOOKING FOR</p>
                <div className="flex flex-wrap gap-1">
                  {startup.looking.map(r=>(
                    <span key={r} className="chip chip-tertiary text-[10px]">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='events' && (
        <div className="space-y-3">
          {EVENTS.map((ev,i)=>(
            <div key={i} className="glass-card rounded-xl p-5 flex gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:`${typeColor[ev.type]}15`,border:`1px solid ${typeColor[ev.type]}25`}}>
                <span className="material-symbols-outlined text-[22px]" style={{color:typeColor[ev.type],fontVariationSettings:"'FILL' 1"}}>
                  {ev.type==='Pitch'?'mic':ev.type==='Fireside'?'local_fire_department':ev.type==='Workshop'?'build':'event'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-display font-semibold text-on-surface text-sm">{ev.title}</h3>
                  <span className="chip text-[10px]" style={{background:`${typeColor[ev.type]}15`,color:typeColor[ev.type],border:`1px solid ${typeColor[ev.type]}25`}}>{ev.type}</span>
                </div>
                <p className="text-xs font-mono text-on-surface-variant mb-1">{ev.date}</p>
                <p className="text-xs text-on-surface-variant">{ev.desc}</p>
              </div>
              <button className="btn-primary text-xs px-3 py-1.5 self-center flex-shrink-0">Register</button>
            </div>
          ))}
        </div>
      )}

      {tab==='resources' && (
        <div className="grid grid-cols-2 gap-4">
          {RESOURCES.map(r=>(
            <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer" className="glass-card rounded-xl p-5 flex items-center gap-3 no-underline">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'rgba(195,192,255,0.12)',border:'1px solid rgba(195,192,255,0.2)'}}>
                <span className="material-symbols-outlined text-[22px] text-primary">{r.icon}</span>
              </div>
              <div>
                <p className="font-display font-semibold text-on-surface text-sm">{r.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{r.desc}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {tab==='pitch' && (
        <div className="max-w-lg space-y-4">
          <div className="glass-elevated rounded-xl p-5 space-y-4 border border-primary/20">
            <h2 className="font-display font-semibold text-on-surface">Submit Your Startup Idea</h2>
            <p className="text-xs text-on-surface-variant">E-Cell reviews all submissions. Selected ideas get mentorship, resources, and a chance to pitch at Startup Night.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="section-label block mb-1">STARTUP NAME *</label><input className="input-glass" placeholder="What's your startup called?" value={pitchForm.name} onChange={e=>setPitchForm(p=>({...p,name:e.target.value}))} /></div>
              <div><label className="section-label block mb-1">SECTOR</label>
                <select className="input-glass" value={pitchForm.sector} onChange={e=>setPitchForm(p=>({...p,sector:e.target.value}))}>
                  <option value="">Select</option>
                  {['EdTech','FinTech','HealthTech','FoodTech','CleanTech','AI/ML','SaaS','Commerce','Other'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="section-label block mb-1">STAGE</label>
                <select className="input-glass" value={pitchForm.stage} onChange={e=>setPitchForm(p=>({...p,stage:e.target.value}))}>
                  {['Idea','MVP','Pre-Revenue','Revenue'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="section-label block mb-1">PROBLEM YOU&apos;RE SOLVING *</label><textarea className="input-glass resize-none" rows={2} placeholder="What pain point does your startup address?" value={pitchForm.problem} onChange={e=>setPitchForm(p=>({...p,problem:e.target.value}))} /></div>
              <div className="col-span-2"><label className="section-label block mb-1">YOUR SOLUTION</label><textarea className="input-glass resize-none" rows={2} placeholder="How are you solving it?" value={pitchForm.solution} onChange={e=>setPitchForm(p=>({...p,solution:e.target.value}))} /></div>
              <div><label className="section-label block mb-1">TRACTION</label><input className="input-glass" placeholder="Users, revenue, pilots…" value={pitchForm.traction} onChange={e=>setPitchForm(p=>({...p,traction:e.target.value}))} /></div>
              <div><label className="section-label block mb-1">WHAT DO YOU NEED?</label><input className="input-glass" placeholder="Funding, co-founder, dev…" value={pitchForm.ask} onChange={e=>setPitchForm(p=>({...p,ask:e.target.value}))} /></div>
            </div>
            <button onClick={submitPitch} disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
              <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
              {submitting ? 'Submitting…' : 'Submit Pitch'}
            </button>
          </div>
        </div>
      )}

      {/* Startup detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'}} onClick={()=>setSelected(null)}>
          <div className="glass-elevated rounded-2xl p-6 max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
                {selected.logo}
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-on-surface">{selected.name}</h2>
                <p className="text-sm font-mono text-on-surface-variant">{selected.sector} · Founded {selected.founded}</p>
              </div>
              <button onClick={()=>setSelected(null)}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span></button>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">{selected.description}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[{l:'Stage',v:selected.stage},{l:'Team',v:`${selected.team} people`},{l:'Traction',v:selected.traction}].map(s=>(
                <div key={s.l} className="p-2.5 rounded-lg text-center" style={{background:'rgba(255,255,255,0.04)'}}>
                  <p className="section-label">{s.l}</p>
                  <p className="font-display font-semibold text-on-surface text-xs mt-1">{s.v}</p>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <p className="section-label mb-2">OPEN POSITIONS</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.looking.map((r:string)=><span key={r} className="chip chip-tertiary text-xs">{r}</span>)}
              </div>
            </div>
            <button onClick={()=>{toast.success(`Application sent to ${selected.name}!`);setSelected(null)}} className="btn-primary w-full justify-center text-sm">
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Apply to Join Team
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
