'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const RESOURCES = [
  { icon:'link', title:'NPTEL Courses', desc:'Free IIT-level MOOCs', url:'https://nptel.ac.in', color:'#4cd7f6' },
  { icon:'link', title:'MIT OpenCourseWare', desc:'World-class lecture notes', url:'https://ocw.mit.edu', color:'#c3c0ff' },
  { icon:'link', title:'Khan Academy', desc:'Concept videos for all subjects', url:'https://khanacademy.org', color:'#86efac' },
  { icon:'link', title:'GeeksForGeeks', desc:'CS & coding reference', url:'https://geeksforgeeks.org', color:'#fbbf24' },
]

const POMODORO_MINS = [25, 30, 45, 60]

export default function StudyClient({ userId, profile, initialGroups }: any) {
  const supabase = createClient()
  const [groups, setGroups] = useState<any[]>(initialGroups || [])
  const [groupForm, setGroupForm] = useState({ subject:'', venue:'', time:'', max_members: 4 })
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  async function handleCreateGroup() {
    if (!groupForm.subject.trim()) { toast.error('Subject is required'); return }
    setCreating(true)
    try {
      const { data: newGroup, error } = await supabase
        .from('study_groups')
        .insert({
          subject: groupForm.subject.trim(),
          venue: groupForm.venue.trim() || null,
          meeting_time: groupForm.time || null,
          max_members: groupForm.max_members,
          creator_id: userId,
          college_id: profile.college_id,
        })
        .select('*, study_group_members(user_id)')
        .single()

      if (error) throw error

      await supabase.from('study_group_members').insert({
        group_id: newGroup.id,
        user_id: userId,
      })

      setGroups(prev => [{ ...newGroup, study_group_members: [{ user_id: userId }] }, ...prev])
      toast.success('Study group created!')
      setShowCreate(false)
      setGroupForm({ subject:'', venue:'', time:'', max_members: 4 })
    } catch (err: any) {
      toast.error('Failed to create group: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleJoinGroup(groupId: string) {
    const toastId = toast.loading('Joining group...')
    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({ group_id: groupId, user_id: userId })
      
      if (error) {
        if (error.code === '23505') throw new Error('You are already a member of this group')
        throw error
      }

      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, study_group_members: [...(g.study_group_members || []), { user_id: userId }] }
          : g
      ))
      toast.success('Joined successfully! 🤝', { id: toastId })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    }
  }

  // Pomodoro timer state
  const [selectedMins, setSelectedMins] = useState(25)
  const [running, setRunning] = useState(false)
  const [secsLeft, setSecsLeft] = useState(25*60)
  const [intervalId, setIntervalId] = useState<any>(null)

  function startTimer() {
    if (running) { clearInterval(intervalId); setRunning(false); return }
    setSecsLeft(selectedMins*60)
    const id = setInterval(() => {
      setSecsLeft(s => {
        if (s<=1) { clearInterval(id); setRunning(false); toast.success('Pomodoro complete! Take a break 🎉'); return selectedMins*60 }
        return s-1
      })
    }, 1000)
    setIntervalId(id)
    setRunning(true)
  }

  const mins = Math.floor(secsLeft/60).toString().padStart(2,'0')
  const secs = (secsLeft%60).toString().padStart(2,'0')
  const pct = ((selectedMins*60-secsLeft)/(selectedMins*60))*100

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">Study Hub</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Pomodoro timer, study groups, and learning resources</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          {/* Study Groups */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-on-surface">Active Study Groups</h2>
              <button onClick={()=>setShowCreate(!showCreate)} className="btn-primary text-sm">
                <span className="material-symbols-outlined text-[16px]">group_add</span>
                Create Group
              </button>
            </div>

            {showCreate && (
              <div className="glass-elevated rounded-xl p-4 mb-4 space-y-3 border border-primary/20">
                <h3 className="font-display font-semibold text-on-surface text-sm">New Study Group</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="section-label block mb-1">SUBJECT / TOPIC</label><input className="input-glass" placeholder="e.g. MTH201 – Calculus revision" value={groupForm.subject} onChange={e=>setGroupForm(p=>({...p,subject:e.target.value}))} /></div>
                  <div><label className="section-label block mb-1">VENUE</label><input className="input-glass" placeholder="Library, Hostel, Lab…" value={groupForm.venue} onChange={e=>setGroupForm(p=>({...p,venue:e.target.value}))} /></div>
                  <div><label className="section-label block mb-1">TIME</label><input type="datetime-local" className="input-glass" value={groupForm.time} onChange={e=>setGroupForm(p=>({...p,time:e.target.value}))} /></div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={()=>setShowCreate(false)} className="btn-ghost text-sm">Cancel</button>
                  <button onClick={handleCreateGroup} disabled={creating} className="btn-primary text-sm">
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {groups.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center border border-white/[0.04]">
                  <p className="text-on-surface-variant text-sm italic">No active study groups. Create one to start collaborating!</p>
                </div>
              ) : (
                groups.map(g => {
                  const isMember = g.study_group_members?.some((m: any) => m.user_id === userId)
                  const isFull = (g.study_group_members?.length || 0) >= g.max_members
                  const spots = g.max_members - (g.study_group_members?.length || 0)

                  return (
                    <div key={g.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'rgba(195,192,255,0.12)',border:'1px solid rgba(195,192,255,0.2)'}}>
                        <span className="material-symbols-outlined text-[20px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>groups</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-on-surface text-sm">{g.subject}</h3>
                        <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                          📍 {g.venue || 'TBD'} · ⏰ {g.meeting_time ? format(new Date(g.meeting_time), 'MMM d, h:mm a') : 'TBD'} · 👥 {g.study_group_members?.length || 0} members, {spots} spots left
                        </p>
                      </div>
                      {isMember ? (
                        <span className="chip chip-tertiary text-xs py-1.5 px-3">Joined</span>
                      ) : (
                        <button 
                          onClick={() => handleJoinGroup(g.id)}
                          disabled={isFull}
                          className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                        >
                          {isFull ? 'Full' : 'Join'}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h2 className="font-display font-semibold text-on-surface mb-3">Learning Resources</h2>
            <div className="grid grid-cols-2 gap-3">
              {RESOURCES.map(r=>(
                <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer" className="glass-card rounded-xl p-4 flex items-center gap-3 no-underline">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${r.color}18`,border:`1px solid ${r.color}30`}}>
                    <span className="material-symbols-outlined text-[20px]" style={{color:r.color}}>open_in_new</span>
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-on-surface">{r.title}</p>
                    <p className="text-xs text-on-surface-variant">{r.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Pomodoro */}
        <div className="col-span-4">
          <div className="glass-card rounded-xl p-6 sticky top-6">
            <h2 className="font-display font-semibold text-on-surface mb-4 text-center">Pomodoro Timer</h2>
            {/* Circle */}
            <div className="relative w-36 h-36 mx-auto mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="72" cy="72" r="60" fill="none" stroke="#4f46e5" strokeWidth="8"
                  strokeDasharray={`${2*Math.PI*60}`}
                  strokeDashoffset={`${2*Math.PI*60*(1-pct/100)}`}
                  strokeLinecap="round"
                  style={{transition:'stroke-dashoffset 1s linear'}} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-3xl font-bold text-on-surface">{mins}:{secs}</span>
              </div>
            </div>
            {/* Duration selector */}
            <div className="flex gap-1 justify-center mb-4">
              {POMODORO_MINS.map(m=>(
                <button key={m} onClick={()=>{if(!running){setSelectedMins(m);setSecsLeft(m*60)}}}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono transition-all"
                  style={selectedMins===m
                    ?{background:'rgba(79,70,229,0.4)',color:'#c3c0ff',border:'1px solid rgba(195,192,255,0.2)'}
                    :{background:'rgba(255,255,255,0.04)',color:'#c7c4d8',border:'1px solid rgba(255,255,255,0.06)'}}>
                  {m}m
                </button>
              ))}
            </div>
            <button onClick={startTimer} style={running?{...{},background:'transparent',border:'1px solid rgba(255,180,171,0.4)',color:'#ffb4ab',padding:'10px 16px',borderRadius:'8px',cursor:'pointer',fontFamily:'Hanken Grotesk',fontWeight:'600'}:{}} {...(!running?{className:'btn-primary w-full justify-center text-sm'}:{className:'w-full justify-center text-sm'})}>
              {running ? '⏸ Pause' : '▶ Start Focus'}
            </button>
            {running && <p className="text-center text-xs text-on-surface-variant font-mono mt-2">Stay focused! 🎯</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
