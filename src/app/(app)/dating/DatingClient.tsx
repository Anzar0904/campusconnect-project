'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

const INTERESTS = ['Music','Photography','Coding','Travel','Movies','Fitness','Gaming','Books','Art','Cricket','Cooking','Hiking','Dance','Coffee','Startups','Anime']

const SAMPLE_PROFILES = [
  { id:'dp1', name:'Aanya Sharma', branch:'CSE', year:3, bio:'Coffee addict ☕ · Amateur photographer · DSA grinder by day, stargazer by night', interests:['Photography','Coffee','Coding'], avatar:'AS', verified:true },
  { id:'dp2', name:'Riya Verma', branch:'ECE', year:2, bio:'Music is my therapy 🎵 · Exploring campus one chai at a time · Let\'s debate about anything', interests:['Music','Travel','Books'], avatar:'RV', verified:true },
  { id:'dp3', name:'Kavya Nair', branch:'MBA', year:1, bio:'Aspiring entrepreneur 🚀 · Bookworm · Will bake for friends', interests:['Startups','Books','Cooking'], avatar:'KN', verified:true },
  { id:'dp4', name:'Ishita Roy', branch:'CSE', year:4, bio:'Final year chaos 📚 · Placement survivor · Love hiking and sunsets', interests:['Hiking','Fitness','Travel'], avatar:'IR', verified:true },
  { id:'dp5', name:'Pooja Gupta', branch:'ME', year:3, bio:'Engineer by day, artist by night 🎨 · Cat person · Bad at replying, great at overthinking', interests:['Art','Coffee','Music'], avatar:'PG', verified:true },
]

const AVATAR_COLORS = ['#4f46e5','#571bc1','#0ea5e9','#7c3aed','#db2777']

export default function DatingClient({ 
  userId, 
  profile, 
  datingProfile: initDP,
  initialDiscoverable,
  initialMatches,
}: any) {
  const [datingProfile, setDatingProfile] = useState(initDP)
  const [setupStep, setSetupStep] = useState<'idle'|'setup'|'browse'>(initDP ? 'browse' : 'idle')
  const [form, setForm] = useState({ 
    bio: profile?.bio || '', 
    interests: initDP?.interests || [] as string[], 
    looking_for: initDP?.looking_for || 'friendship', 
    gender: profile?.gender || '', 
    show_to: initDP?.show_to || 'everyone' 
  })
  const [cardIdx, setCardIdx] = useState(0)
  const [discoverable, setDiscoverable] = useState<any[]>(initialDiscoverable || [])
  const [matches, setMatches] = useState<any[]>(initialMatches || [])
  const [swipeDir, setSwipeDir] = useState<'left'|'right'|null>(null)
  const [activeTab, setActiveTab] = useState<'browse'|'matches'|'settings'>('browse')
  const supabase: any = createClient()

  const current = discoverable[cardIdx]

  async function swipe(dir: 'left' | 'right') {
    if (!current) return
    const liked = dir === 'right'
    setSwipeDir(dir)

    // 1. Persist the swipe
    const { error: swipeError } = await supabase
      .from('dating_swipes')
      .insert({
        swiper_id: userId,
        swiped_id: current.user_id,
        liked: liked
      })

    if (swipeError) {
      if (swipeError.code !== '23505') { // Ignore duplicate swipes
        toast.error('Failed to save swipe')
        setSwipeDir(null)
        return
      }
    }

    // 2. Check for mutual like if current swipe is a like
    if (liked) {
      const { data: reciprocal } = await supabase
        .from('dating_swipes')
        .select('*')
        .eq('swiper_id', current.user_id)
        .eq('swiped_id', userId)
        .eq('liked', true)
        .maybeSingle()

      if (reciprocal) {
        // It's a match! Create match record
        const user1_id = userId < current.user_id ? userId : current.user_id
        const user2_id = userId < current.user_id ? current.user_id : userId

        const { data: newMatch, error: matchError } = await supabase
          .from('dating_matches')
          .insert({ user1_id, user2_id })
          .select('*, user1:profiles!dating_matches_user1_id_fkey(id, full_name, branch, year, avatar_url), user2:profiles!dating_matches_user2_id_fkey(id, full_name, branch, year, avatar_url)')
          .single()

        if (!matchError && newMatch) {
          setMatches(prev => [newMatch, ...prev])
          toast.success(`💕 It's a match with ${current.profiles.full_name}!`, { duration: 4000 })
        }
      }
    }

    setTimeout(() => {
      setSwipeDir(null)
      setCardIdx(i => i + 1)
    }, 350)
  }

  async function saveProfile() {
    const { error } = await supabase.from('dating_profiles').upsert({
      user_id: userId,
      bio: form.bio,
      interests: form.interests,
      looking_for: form.looking_for,
      gender: form.gender,
      show_to: form.show_to,
      is_active: true,
    })
    if (error) { toast.error('Could not save profile'); return }
    setDatingProfile({ ...form, user_id: userId })
    setSetupStep('browse')
    toast.success('Profile saved! Start discovering ✨')
  }

  function toggleInterest(interest: string) {
    setForm(p => ({
      ...p,
      interests: (p.interests || []).includes(interest)
        ? p.interests.filter((i: string) => i !== interest)
        : (p.interests || []).length < 6 ? [...(p.interests || []), interest] : p.interests
    }))
  }

  // Helper to get match profile
  const getMatchDisplay = (m: any) => {
    const other = m.user1_id === userId ? m.user2 : m.user1
    return {
      id: other.id,
      name: other.full_name,
      branch: other.branch,
      year: other.year,
      avatar: other.full_name.split(' ').map((n:any)=>n[0]).join(''),
      avatar_url: other.avatar_url
    }
  }

  // Idle / landing
  if (setupStep === 'idle') {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center" style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)',boxShadow:'0 0 40px rgba(236,72,153,0.4)'}}>
            <span className="material-symbols-outlined text-[40px] text-white" style={{fontVariationSettings:"'FILL' 1"}}>favorite</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface">Campus Dating</h1>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              Meet verified IILM students. Only college-email verified students can join — no outsiders, ever.
            </p>
          </div>
          <div className="space-y-2 text-left">
            {['✅ Only verified @iilm.edu students','🔒 Private — not visible outside campus','💬 Match and chat within CampusConnect','❤️ Find friends, study partners, or more'].map(f => (
              <p key={f} className="text-sm text-on-surface-variant">{f}</p>
            ))}
          </div>
          <button onClick={() => setSetupStep('setup')} className="btn-primary w-full justify-center"
            style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)',boxShadow:'0 0 30px rgba(236,72,153,0.35)'}}>
            <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>favorite</span>
            Set Up My Profile
          </button>
        </div>
      </div>
    )
  }

  // Setup flow
  if (setupStep === 'setup') {
    return (
      <div className="animate-fade-in max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Set Up Dating Profile</h1>
          <p className="text-sm text-on-surface-variant mt-1">Visible only to verified IILM students</p>
        </div>
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div>
            <label className="section-label block mb-2">YOUR BIO</label>
            <textarea className="input-glass resize-none" rows={3}
              placeholder="Write something fun about yourself…"
              value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} />
          </div>
          <div>
            <label className="section-label block mb-2">INTERESTS (pick up to 6)</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <button key={interest} onClick={() => toggleInterest(interest)}
                  className="px-3 py-1.5 rounded-full text-xs font-mono transition-all"
                  style={form.interests.includes(interest)
                    ? {background:'linear-gradient(135deg,rgba(236,72,153,0.3),rgba(244,63,94,0.3))',color:'#fda4af',border:'1px solid rgba(253,164,175,0.4)'}
                    : {background:'rgba(255,255,255,0.04)',color:'#c7c4d8',border:'1px solid rgba(255,255,255,0.08)'}}>
                  {interest}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label block mb-2">I AM</label>
              <select className="input-glass" value={form.gender} onChange={e => setForm(p=>({...p,gender:e.target.value}))}>
                <option value="">Prefer not to say</option>
                <option>Male</option><option>Female</option><option>Non-binary</option>
              </select>
            </div>
            <div>
              <label className="section-label block mb-2">LOOKING FOR</label>
              <select className="input-glass" value={form.looking_for} onChange={e => setForm(p=>({...p,looking_for:e.target.value}))}>
                <option value="friendship">Friendship</option>
                <option value="relationship">Relationship</option>
                <option value="study_buddy">Study Buddy</option>
                <option value="anything">Open to anything</option>
              </select>
            </div>
          </div>
          <button onClick={saveProfile} className="btn-primary w-full justify-center"
            style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)'}}>
            Save & Start Discovering
          </button>
        </div>
      </div>
    )
  }

  // Main browse view
  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-on-surface">Campus Dating</h1>
        <div className="flex items-center gap-2 text-sm font-mono text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          {discoverable.length} students nearby
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
        {([['browse','💫 Discover'],['matches',`❤️ Matches (${matches.length})`],['settings','⚙️ Settings']] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setActiveTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-mono transition-all"
            style={activeTab===t?{background:'rgba(236,72,153,0.3)',color:'#fda4af',border:'1px solid rgba(253,164,175,0.25)'}:{color:'#c7c4d8'}}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'browse' && (
        <div className="flex flex-col items-center gap-6">
          {cardIdx >= discoverable.length ? (
            <div className="glass-card rounded-2xl p-12 text-center w-full flex flex-col items-center">
              <span className="text-5xl mb-4 block">🎉</span>
              <h3 className="font-display font-bold text-on-surface text-lg mb-2">You&apos;ve seen everyone!</h3>
              <p className="text-sm text-on-surface-variant mb-4">New students join every day. Check back soon!</p>
              </div>
          ) : (
            <>
              {/* Card */}
              <div className="relative w-80 select-none"
                style={{transform: swipeDir === 'left' ? 'rotate(-8deg) translateX(-60px)' : swipeDir === 'right' ? 'rotate(8deg) translateX(60px)' : 'none', opacity: swipeDir ? 0.6 : 1, transition:'all 0.35s cubic-bezier(0.4,0,0.2,1)'}}>
                <div className="glass-elevated rounded-2xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.1)'}}>
                  {/* Pseudo-avatar banner */}
                  <div className="h-56 flex items-center justify-center relative"
                    style={{background:`linear-gradient(135deg, ${AVATAR_COLORS[cardIdx % 5]}40, ${AVATAR_COLORS[(cardIdx+2)%5]}40)`}}>
                    <GlobalAvatar
                      profile={current.profiles}
                      size="custom"
                      className="w-28 h-28 rounded-2xl text-4xl font-display font-bold ring-2 ring-white/10"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display font-bold text-on-surface text-lg">{current.profiles.full_name}</h3>
                    <p className="text-sm font-mono text-on-surface-variant">{current.profiles.branch} · Year {current.profiles.year}</p>
                    <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{current.bio}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(current.interests || []).map((i: string) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-mono"
                          style={{background:'rgba(236,72,153,0.12)',color:'#fda4af',border:'1px solid rgba(253,164,175,0.2)'}}>
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-6">
                <button onClick={() => swipe('left')}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{background:'rgba(255,180,171,0.12)',border:'2px solid rgba(255,180,171,0.3)'}}>
                  <span className="material-symbols-outlined text-[28px]" style={{color:'#ffb4ab'}}>close</span>
                </button>
                <button onClick={() => swipe('right')}
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)',boxShadow:'0 0 30px rgba(236,72,153,0.5)'}}>
                  <span className="material-symbols-outlined text-[36px] text-white" style={{fontVariationSettings:"'FILL' 1"}}>favorite</span>
                </button>
                <button onClick={() => swipe('left')}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{background:'rgba(251,191,36,0.12)',border:'2px solid rgba(251,191,36,0.3)'}}>
                  <span className="material-symbols-outlined text-[28px]" style={{color:'#fbbf24'}}>star</span>
                </button>
              </div>
              <p className="text-xs font-mono text-on-surface-variant">{discoverable.length - cardIdx} profiles left</p>
            </>
          )}
        </div>
      )}

      {activeTab === 'matches' && (
        <div>
          {matches.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <span className="text-5xl mb-4 block">💫</span>
              <h3 className="font-display font-semibold text-on-surface mb-2">No matches yet</h3>
              <p className="text-sm text-on-surface-variant">Keep swiping — your match is out there!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {matches.map(m => {
                const display = getMatchDisplay(m)
                return (
                  <div key={m.id} className="glass-card rounded-xl p-5 flex flex-col items-center text-center gap-3">
                    <GlobalAvatar
                      profile={{
                        avatar_url: display.avatar_url,
                        full_name: display.name,
                      }}
                      size="custom"
                      className="w-16 h-16 rounded-2xl font-display font-bold text-2xl border border-white/[0.08]"
                    />
                    <div>
                      <p className="font-display font-semibold text-on-surface">{display.name}</p>
                      <p className="text-xs font-mono text-on-surface-variant">{display.branch} · Y{display.year}</p>
                    </div>
                    <button className="btn-primary text-xs px-4 py-1.5 w-full justify-center"
                      style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)'}}>
                      <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                      Message
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-md space-y-4">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="font-display font-semibold text-on-surface">Profile Settings</h3>
            <div>
              <label className="section-label block mb-2">UPDATE BIO</label>
              <textarea className="input-glass resize-none" rows={3} defaultValue={datingProfile?.bio || form.bio} />
            </div>
            <div>
              <label className="section-label block mb-2">SHOW MY PROFILE TO</label>
              <select className="input-glass">
                <option>Everyone</option><option>Only same branch</option><option>Only same year</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface font-display font-semibold">Pause Discovery</p>
                <p className="text-xs text-on-surface-variant">Hide your profile temporarily</p>
              </div>
              <div className="w-10 h-5 rounded-full cursor-pointer" style={{background:'rgba(255,255,255,0.1)'}} />
            </div>
            <button className="btn-primary text-sm"
              style={{background:'linear-gradient(135deg,#ec4899,#f43f5e)'}}>Save Changes</button>
          </div>
          <button className="btn-ghost text-sm w-full justify-center text-error">
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete Dating Profile
          </button>
        </div>
      )}
    </div>
  )
}
