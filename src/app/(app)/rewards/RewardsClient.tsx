'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const USER_STATS = { points: 1240, rank: 47, streak: 8, level: 5, nextLevelPoints: 1500, badges: ['early_adopter','first_post','social_butterfly','study_hero'] }

const BADGES = [
  { id:'early_adopter', name:'Early Adopter', icon:'rocket_launch', desc:'Joined in the first month', color:'#fbbf24', earned:true },
  { id:'first_post', name:'First Post', icon:'edit_note', desc:'Published your first post', color:'#c3c0ff', earned:true },
  { id:'social_butterfly', name:'Social Butterfly', icon:'diversity_3', desc:'Made 10+ friends', color:'#f472b6', earned:true },
  { id:'study_hero', name:'Study Hero', icon:'school', desc:'Uploaded 5+ notes', color:'#4cd7f6', earned:true },
  { id:'top_coder', name:'Top Coder', icon:'code', desc:'Solve 50 coding problems', color:'#86efac', earned:false },
  { id:'mentor', name:'Mentor', icon:'support_agent', desc:'Become a verified mentor', color:'#d0bcff', earned:false },
  { id:'placement_ace', name:'Placement Ace', icon:'business_center', desc:'Get a placement offer', color:'#fbbf24', earned:false },
  { id:'community_leader', name:'Community Leader', icon:'campaign', desc:'Create a community with 100+ members', color:'#fb923c', earned:false },
  { id:'streak_30', name:'On Fire 🔥', icon:'local_fire_department', desc:'30-day activity streak', color:'#f97316', earned:false },
  { id:'night_owl', name:'Night Owl', icon:'dark_mode', desc:'Active after midnight 5 times', color:'#a78bfa', earned:false },
]

const LEADERBOARD = [
  { rank:1, name:'Aryan Mehta', branch:'CSE', points:3420, badge:'🥇', streak:45 },
  { rank:2, name:'Priya Kapoor', branch:'ECE', points:3150, badge:'🥈', streak:32 },
  { rank:3, name:'Rohan Singh', branch:'CSE', points:2890, badge:'🥉', streak:28 },
  { rank:4, name:'Sneha Patel', branch:'MBA', points:2640, badge:'⭐', streak:19 },
  { rank:5, name:'Kabir Verma', branch:'ECE', points:2310, badge:'⭐', streak:15 },
  { rank:47, name:'You', branch:'CSE', points:1240, badge:'🔥', streak:8, isYou:true },
]

const ACTIVITIES = [
  { icon:'edit_note', label:'Published a post', points:'+5 pts', time:'2 hours ago', color:'#c3c0ff' },
  { icon:'favorite', label:'Received 10 likes', points:'+10 pts', time:'Yesterday', color:'#f472b6' },
  { icon:'code', label:'Solved 2 coding problems', points:'+40 pts', time:'Yesterday', color:'#86efac' },
  { icon:'menu_book', label:'Uploaded study notes', points:'+20 pts', time:'2 days ago', color:'#4cd7f6' },
  { icon:'group', label:'Added 3 new friends', points:'+15 pts', time:'3 days ago', color:'#d0bcff' },
]

const HOW_TO_EARN = [
  { action:'Post on Feed', points:'5 pts', icon:'edit_note', color:'#c3c0ff' },
  { action:'Get a Like', points:'1 pt', icon:'favorite', color:'#f472b6' },
  { action:'Upload Notes', points:'20 pts', icon:'menu_book', color:'#4cd7f6' },
  { action:'Solve Coding Problem', points:'10–40 pts', icon:'code', color:'#86efac' },
  { action:'Attend an Event', points:'25 pts', icon:'event', color:'#fbbf24' },
  { action:'Refer a Friend', points:'50 pts', icon:'person_add', color:'#d0bcff' },
  { action:'Login Streak (7 days)', points:'30 pts', icon:'local_fire_department', color:'#f97316' },
  { action:'Complete Profile', points:'100 pts', icon:'person', color:'#a78bfa' },
]

const pct = Math.round(((USER_STATS.points - 1000) / (USER_STATS.nextLevelPoints - 1000)) * 100)

export default function RewardsClient({ userId, profile }: any) {
  const [tab, setTab] = useState<'overview'|'badges'|'leaderboard'|'earn'>('overview')

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">Rewards & Achievements</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Earn points, collect badges, and climb the campus leaderboard</p>
      </div>

      {/* Hero card */}
      <div className="glass-elevated rounded-2xl p-6 relative overflow-hidden"
        style={{background:'linear-gradient(135deg,rgba(79,70,229,0.25),rgba(76,215,246,0.1))',border:'1px solid rgba(195,192,255,0.2)'}}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{background:'#4cd7f6',filter:'blur(40px)'}} />
        <div className="relative flex items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
              style={{background:'linear-gradient(135deg,rgba(79,70,229,0.4),rgba(76,215,246,0.2))',border:'1px solid rgba(195,192,255,0.3)'}}>
              <span className="font-display font-black text-3xl text-on-surface">{USER_STATS.level}</span>
            </div>
            <span className="text-xs font-mono text-on-surface-variant">Level</span>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-on-surface">{profile?.full_name}</h2>
            <p className="text-sm font-mono text-on-surface-variant mb-3">{profile?.branch} · Campus Rank #{USER_STATS.rank}</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 rounded-full" style={{background:'rgba(255,255,255,0.08)'}}>
                <div className="h-full rounded-full" style={{width:`${pct}%`,background:'linear-gradient(90deg,#4f46e5,#4cd7f6)',boxShadow:'0 0 8px rgba(76,215,246,0.4)'}} />
              </div>
              <span className="text-xs font-mono text-on-surface-variant whitespace-nowrap">{USER_STATS.points} / {USER_STATS.nextLevelPoints}</span>
            </div>
            <p className="text-xs font-mono text-on-surface-variant">{USER_STATS.nextLevelPoints - USER_STATS.points} pts to Level {USER_STATS.level + 1}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="font-display font-black text-3xl text-on-surface">{USER_STATS.points.toLocaleString()}</p>
              <p className="text-xs font-mono text-on-surface-variant">Total Points</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{background:'rgba(249,115,22,0.15)',border:'1px solid rgba(249,115,22,0.25)'}}>
              <span className="material-symbols-outlined text-[16px]" style={{color:'#f97316',fontVariationSettings:"'FILL' 1"}}>local_fire_department</span>
              <span className="text-sm font-mono" style={{color:'#f97316'}}>{USER_STATS.streak} day streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
        {([['overview','📊 Overview'],['badges','🏅 Badges'],['leaderboard','🏆 Leaderboard'],['earn','💡 How to Earn']] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-mono transition-all"
            style={tab===t?{background:'rgba(79,70,229,0.4)',color:'#c3c0ff',border:'1px solid rgba(195,192,255,0.2)'}:{color:'#c7c4d8'}}>
            {label}
          </button>
        ))}
      </div>

      {tab==='overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Recent activity */}
          <div>
            <h3 className="font-display font-semibold text-on-surface mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {ACTIVITIES.map((a,i)=>(
                <div key={i} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{background:`${a.color}18`,border:`1px solid ${a.color}30`}}>
                    <span className="material-symbols-outlined text-[16px]" style={{color:a.color,fontVariationSettings:"'FILL' 1"}}>{a.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-on-surface">{a.label}</p>
                    <p className="text-[10px] font-mono text-on-surface-variant">{a.time}</p>
                  </div>
                  <span className="text-xs font-mono" style={{color:'#86efac'}}>{a.points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Earned badges */}
          <div>
            <h3 className="font-display font-semibold text-on-surface mb-3">Earned Badges ({USER_STATS.badges.length})</h3>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.filter(b=>b.earned).map(badge=>(
                <div key={badge.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{background:`${badge.color}18`,border:`1px solid ${badge.color}30`}}>
                    <span className="material-symbols-outlined text-[22px]" style={{color:badge.color,fontVariationSettings:"'FILL' 1"}}>{badge.icon}</span>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-on-surface text-xs">{badge.name}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='badges' && (
        <div className="grid grid-cols-3 gap-4">
          {BADGES.map(badge=>(
            <div key={badge.id} className="glass-card rounded-xl p-5 flex flex-col items-center text-center gap-3"
              style={!badge.earned?{opacity:0.45,filter:'grayscale(0.6)'}:{}}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{background:`${badge.color}${badge.earned?'25':'10'}`,border:`2px solid ${badge.color}${badge.earned?'45':'20'}`}}>
                <span className="material-symbols-outlined text-[32px]" style={{color:badge.color,fontVariationSettings:`'FILL' ${badge.earned?1:0}`}}>{badge.icon}</span>
              </div>
              <div>
                <p className="font-display font-semibold text-on-surface text-sm">{badge.name}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{badge.desc}</p>
              </div>
              {badge.earned
                ? <span className="chip chip-success text-[10px]">✓ Earned</span>
                : <span className="chip text-[10px]" style={{background:'rgba(255,255,255,0.05)',color:'#c7c4d8',border:'1px solid rgba(255,255,255,0.08)'}}>Locked</span>
              }
            </div>
          ))}
        </div>
      )}

      {tab==='leaderboard' && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {LEADERBOARD.slice(0,3).map((e,i)=>(
              <div key={e.rank} className="glass-card rounded-xl p-5 text-center"
                style={i===0?{border:'1px solid rgba(251,191,36,0.35)'}:{}}>
                <p className="text-3xl mb-2">{e.badge}</p>
                <p className="font-display font-bold text-on-surface text-sm">{e.name}</p>
                <p className="text-xs font-mono text-on-surface-variant">{e.branch}</p>
                <p className="font-display font-bold text-on-surface mt-2">{e.points.toLocaleString()} pts</p>
                <p className="text-[10px] font-mono text-on-surface-variant">{e.streak}🔥 streak</p>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            {LEADERBOARD.map(entry=>(
              <div key={entry.rank} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
                style={entry.isYou?{background:'rgba(79,70,229,0.08)'}:{}}>
                <span className="w-5 text-center font-mono text-xs text-on-surface-variant">#{entry.rank}</span>
                <span className="text-base">{entry.badge}</span>
                <p className="flex-1 font-display font-semibold text-on-surface text-sm">
                  {entry.name}{entry.isYou&&<span className="text-xs font-mono text-primary ml-1.5">(you)</span>}
                </p>
                <span className="text-xs font-mono text-on-surface-variant">{entry.branch}</span>
                <span className="text-xs font-mono text-on-surface-variant">{entry.streak}🔥</span>
                <span className="font-display font-bold text-on-surface text-sm w-24 text-right">{entry.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='earn' && (
        <div className="grid grid-cols-2 gap-4">
          {HOW_TO_EARN.map(item=>(
            <div key={item.action} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:`${item.color}18`,border:`1px solid ${item.color}30`}}>
                <span className="material-symbols-outlined text-[20px]" style={{color:item.color,fontVariationSettings:"'FILL' 1"}}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-display font-semibold text-on-surface">{item.action}</p>
              </div>
              <span className="text-sm font-mono" style={{color:'#86efac'}}>{item.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
