'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const ELECTIONS = [
  {
    id:'e1', title:'Student Council President 2026–27', status:'active', deadline:'2026-06-20',
    description:'Vote for your Student Council President. The elected president will represent IILM students in all administrative matters.',
    candidates:[
      { id:'c1', name:'Aryan Mehta', branch:'CSE', year:4, manifesto:'Better WiFi, more study spaces, transparent administration, and a 24/7 hackathon lab.', votes:234, avatar:'AM' },
      { id:'c2', name:'Priya Kapoor', branch:'MBA', year:2, manifesto:'Mental health support, women\'s safety improvements, inter-college fests, and stronger placement cell.', votes:189, avatar:'PK' },
      { id:'c3', name:'Rohan Singh', branch:'ECE', year:4, manifesto:'Upgrade campus tech infrastructure, introduce coding bootcamps, industry partnerships and better canteen food.', votes:156, avatar:'RS' },
    ]
  },
  {
    id:'e2', title:'Cultural Committee Head', status:'active', deadline:'2026-06-22',
    description:'Choose the head of IILM\'s Cultural Committee who will organise fests and cultural events for the year.',
    candidates:[
      { id:'c4', name:'Sneha Patel', branch:'CSE', year:3, manifesto:'Bigger annual fest, inter-college competitions, more cultural diversity and spotlight on traditional arts.', votes:178, avatar:'SP' },
      { id:'c5', name:'Kabir Verma', branch:'ECE', year:3, manifesto:'Revamp Fresher\'s Night, introduce Battle of Bands, bring national-level artists for cultural events.', votes:203, avatar:'KV' },
    ]
  },
  {
    id:'e3', title:'Tech Club President', status:'upcoming', deadline:'2026-07-01',
    description:'Nominations open. The Tech Club President leads all technical events, hackathons, and coding competitions.',
    candidates:[]
  },
  {
    id:'e4', title:'Sports Secretary 2025–26', status:'completed', deadline:'2026-03-01',
    description:'Completed election from previous semester.',
    candidates:[
      { id:'c6', name:'Dev Kumar', branch:'ME', year:3, manifesto:'', votes:312, avatar:'DK' },
      { id:'c7', name:'Ananya Roy', branch:'CSE', year:2, manifesto:'', votes:198, avatar:'AR' },
    ],
    winner:'c6'
  },
]

const statusColor: Record<string,string> = { active:'#86efac', upcoming:'#4cd7f6', completed:'#c7c4d8' }

export default function ElectionsClient({ userId, profile }: any) {
  const [votes, setVotes] = useState<Record<string,string>>({})
  const [selected, setSelected] = useState<any>(null)

  function castVote(electionId: string, candidateId: string, candidateName: string) {
    if (votes[electionId]) { toast.error('You have already voted in this election'); return }
    setVotes(prev => ({...prev, [electionId]: candidateId}))
    toast.success(`Vote cast for ${candidateName}! 🗳️`)
  }

  function getTotalVotes(election: any) {
    return election.candidates.reduce((s: number, c: any) => s + c.votes, 0)
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">Campus Elections</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Vote for your student representatives. Every verified student gets one vote.</p>
      </div>

      {/* Active elections callout */}
      {ELECTIONS.filter(e => e.status==='active').length > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{background:'rgba(134,239,172,0.08)',border:'1px solid rgba(134,239,172,0.2)'}}>
          <span className="material-symbols-outlined text-[22px]" style={{color:'#86efac',fontVariationSettings:"'FILL' 1"}}>how_to_vote</span>
          <div>
            <p className="text-sm font-display font-semibold text-on-surface">
              {ELECTIONS.filter(e=>e.status==='active').length} active election{ELECTIONS.filter(e=>e.status==='active').length>1?'s':''} — voting is open!
            </p>
            <p className="text-xs text-on-surface-variant font-mono">Your vote is anonymous and counted securely.</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {ELECTIONS.map(election => {
          const totalVotes = getTotalVotes(election)
          const myVote = votes[election.id]
          const isActive = election.status === 'active'

          return (
            <div key={election.id} className="glass-card rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-display font-bold text-on-surface">{election.title}</h2>
                      <span className="chip text-[10px] capitalize" style={{background:`${statusColor[election.status]}12`,color:statusColor[election.status],border:`1px solid ${statusColor[election.status]}25`}}>
                        {election.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{election.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-on-surface">{totalVotes}</p>
                    <p className="text-[10px] font-mono text-on-surface-variant">total votes</p>
                    {isActive && <p className="text-[10px] font-mono mt-1" style={{color:'#fbbf24'}}>Closes {election.deadline}</p>}
                  </div>
                </div>
              </div>

              {/* Candidates */}
              {election.candidates.length > 0 ? (
                <div className="p-5 space-y-4">
                  {election.candidates.map(candidate => {
                    const pct = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0
                    const isVotedFor = myVote === candidate.id
                    const isWinner = (election as any).winner === candidate.id

                    return (
                      <div key={candidate.id} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
                            style={{background:'rgba(79,70,229,0.18)',border:'1px solid rgba(195,192,255,0.2)',color:'#c3c0ff'}}>
                            {candidate.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-display font-semibold text-on-surface text-sm">{candidate.name}</p>
                              {isWinner && <span className="chip text-[10px]" style={{background:'rgba(251,191,36,0.15)',color:'#fbbf24',border:'1px solid rgba(251,191,36,0.25)'}}>🏆 Winner</span>}
                              {isVotedFor && <span className="chip chip-success text-[10px]">✓ Your Vote</span>}
                            </div>
                            <p className="text-xs font-mono text-on-surface-variant">{candidate.branch} · Year {candidate.year}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-on-surface font-bold">{pct}%</span>
                            {isActive && !myVote && (
                              <button onClick={() => castVote(election.id, candidate.id, candidate.name)}
                                className="btn-primary text-xs px-3 py-1.5">Vote</button>
                            )}
                            {candidate.manifesto && (
                              <button onClick={() => setSelected(candidate)} className="btn-ghost text-xs px-3 py-1.5">Manifesto</button>
                            )}
                          </div>
                        </div>
                        {/* Vote bar */}
                        <div className="ml-13 pl-13">
                          <div className="h-1.5 rounded-full ml-[52px]" style={{background:'rgba(255,255,255,0.06)'}}>
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{width:`${pct}%`,background: isWinner?'linear-gradient(90deg,#fbbf24,#f97316)':isVotedFor?'linear-gradient(90deg,#4f46e5,#4cd7f6)':'rgba(195,192,255,0.4)'}} />
                          </div>
                          <p className="text-[10px] font-mono text-on-surface-variant ml-[52px] mt-0.5">{candidate.votes} votes</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-[36px] text-on-surface-variant mb-2 block">how_to_reg</span>
                  <p className="text-sm text-on-surface-variant">Nominations open soon. Want to run?</p>
                  <button className="btn-primary text-sm mt-3">Nominate Yourself</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Manifesto modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'}} onClick={()=>setSelected(null)}>
          <div className="glass-elevated rounded-2xl p-6 max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl flex-shrink-0"
                style={{background:'rgba(79,70,229,0.18)',border:'1px solid rgba(195,192,255,0.25)',color:'#c3c0ff'}}>
                {selected.avatar}
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-on-surface">{selected.name}</h2>
                <p className="text-sm font-mono text-on-surface-variant">{selected.branch} · Year {selected.year}</p>
              </div>
              <button onClick={()=>setSelected(null)}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span></button>
            </div>
            <div className="p-4 rounded-xl mb-4" style={{background:'rgba(255,255,255,0.04)'}}>
              <p className="section-label mb-2">MANIFESTO</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{selected.manifesto}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
