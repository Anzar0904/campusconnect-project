'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const ANNOUNCEMENTS = [
  { id:1, title:'End Semester Exams Schedule Released', body:'The end-semester examination timetable for all programmes has been published on the academic portal. Students are requested to check their individual schedules and download admit cards.', category:'Academic', urgent:true, time:'2 hours ago', author:'Academic Office' },
  { id:2, title:'Inter-College Hackathon – Registrations Open', body:'IILM Tech Fest 2026 hackathon registrations are now open. Form teams of 2-4, register at the portal by June 15th. Prize pool of ₹1,00,000!', category:'Events', urgent:false, time:'5 hours ago', author:'Tech Club' },
  { id:3, title:'Campus WiFi Maintenance – Sunday 2 AM', body:'Planned network maintenance on Sunday 8 June, 2:00 AM to 6:00 AM. Internet services will be temporarily unavailable during this window.', category:'Infrastructure', urgent:true, time:'Yesterday', author:'IT Department' },
  { id:4, title:'Placement Drive – TCS & Infosys Next Week', body:'On-campus placement drives for TCS and Infosys are scheduled for June 12-13. Eligible students (CGPA ≥ 7.0, no active backlogs) must pre-register on the placement portal by June 10.', category:'Placements', urgent:false, time:'Yesterday', author:'Placement Cell' },
  { id:5, title:'Library Extended Hours – Exam Season', body:'The central library will remain open 24/7 starting June 8 through the exam period. Students must carry valid ID cards.', category:'Academic', urgent:false, time:'2 days ago', author:'Library Administration' },
]

const POLLS = [
  { id:1, question:'How would you rate the mess food this week?', options:['Excellent 🔥','Good 👍','Average 😐','Poor 👎'], votes:[45,123,89,34], total:291, hasVoted:false },
  { id:2, question:'Best time for extra library hours?', options:['6 AM – 8 AM','10 PM – 12 AM','12 AM – 2 AM','All night'], votes:[67,156,98,41], total:362, hasVoted:false },
  { id:3, question:'Preferred sports fest day?', options:['Saturday','Sunday','Public Holiday'], votes:[201,289,178], total:668, hasVoted:false },
]

const CAT_COLORS: Record<string,string> = { Academic:'#c3c0ff', Events:'#4cd7f6', Infrastructure:'#fbbf24', Placements:'#86efac', Social:'#f472b6' }

export default function PulseClient({ userId }: any) {
  const [polls, setPolls] = useState(POLLS)
  const [activeTab, setActiveTab] = useState<'announcements'|'polls'>('announcements')
  const [filter, setFilter] = useState('All')

  function vote(pollId:number, optionIdx:number) {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId || p.hasVoted) return p
      const newVotes = [...p.votes]
      newVotes[optionIdx]++
      return { ...p, votes: newVotes, total: p.total + 1, hasVoted: true }
    }))
    toast.success('Vote recorded!')
  }

  const categories = ['All', ...Array.from(new Set(ANNOUNCEMENTS.map(a => a.category)))]
  const filtered = ANNOUNCEMENTS.filter(a => filter === 'All' || a.category === filter)

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">Campus Pulse</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Official announcements, news, and campus polls</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',width:'fit-content'}}>
        {(['announcements','polls'] as const).map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-mono capitalize transition-all"
            style={activeTab===tab
              ?{background:'rgba(79,70,229,0.4)',color:'#c3c0ff',border:'1px solid rgba(195,192,255,0.2)'}
              :{color:'#c7c4d8'}}>
            {tab==='announcements'?'📢 Announcements':'📊 Polls'}
          </button>
        ))}
      </div>

      {activeTab==='announcements' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat=>(
              <button key={cat} onClick={()=>setFilter(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-mono transition-all"
                style={filter===cat
                  ?{background:'rgba(79,70,229,0.3)',color:'#c3c0ff',border:'1px solid rgba(195,192,255,0.2)'}
                  :{background:'rgba(255,255,255,0.04)',color:'#c7c4d8',border:'1px solid rgba(255,255,255,0.06)'}}>
                {cat}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filtered.map(ann=>{
              const color = CAT_COLORS[ann.category]||'#c7c4d8'
              return (
                <div key={ann.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${color}18`,border:`1px solid ${color}30`}}>
                      <span className="material-symbols-outlined text-[20px]" style={{color,fontVariationSettings:"'FILL' 1"}}>
                        {ann.category==='Academic'?'school':ann.category==='Events'?'event':ann.category==='Infrastructure'?'build':ann.category==='Placements'?'business_center':'campaign'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {ann.urgent && <span className="chip text-[10px]" style={{background:'rgba(255,180,171,0.15)',color:'#ffb4ab',border:'1px solid rgba(255,180,171,0.3)'}}>🔴 URGENT</span>}
                        <span className="chip text-[10px]" style={{background:`${color}15`,color,border:`1px solid ${color}25`}}>{ann.category}</span>
                      </div>
                      <h3 className="font-display font-semibold text-on-surface text-sm leading-snug">{ann.title}</h3>
                      <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{ann.body}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs font-mono text-on-surface-variant">
                        <span>{ann.author}</span><span>·</span><span>{ann.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab==='polls' && (
        <div className="space-y-4">
          {polls.map(poll=>(
            <div key={poll.id} className="glass-card rounded-xl p-5">
              <h3 className="font-display font-semibold text-on-surface text-sm mb-4">{poll.question}</h3>
              <div className="space-y-2">
                {poll.options.map((opt,idx)=>{
                  const pct = poll.total>0 ? Math.round((poll.votes[idx]/poll.total)*100) : 0
                  return (
                    <button key={idx} onClick={()=>vote(poll.id,idx)} disabled={poll.hasVoted}
                      className="w-full text-left transition-all relative overflow-hidden rounded-lg"
                      style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                      {poll.hasVoted && (
                        <div className="absolute inset-0 rounded-lg" style={{width:`${pct}%`,background:'rgba(79,70,229,0.25)',transition:'width 0.5s ease'}} />
                      )}
                      <div className="relative flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-on-surface">{opt}</span>
                        {poll.hasVoted && <span className="text-xs font-mono text-on-surface-variant">{pct}%</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs font-mono text-on-surface-variant mt-3">{poll.total} votes · {poll.hasVoted?'You voted':'Click to vote'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
