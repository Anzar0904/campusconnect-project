'use client'

import { Flame, Trophy, Award, Calendar, Zap, Star, ShieldAlert, Sparkles, Check, ChevronRight, Lock } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui/Skeleton'
import { triggerConfetti } from '@/lib/confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

const ACHIEVEMENT_COLORS: Record<string, string> = {
  FIRST_POST: '#c3c0ff',
  SOCIAL_STARTER: '#f472b6',
  COMMUNITY_MEMBER: '#4cd7f6',
  CLUB_ENTHUSIAST: '#86efac',
  EVENT_EXPLORER: '#fbbf24',
  MARKETPLACE_SELLER: '#fb923c',
  NOTE_CONTRIBUTOR: '#a78bfa',
  PAPER_CONTRIBUTOR: '#f472b6',
  VERIFIED_STUDENT: '#38bdf8',
  STUDY_CHAMPION: '#a78bfa',
  CAMPUS_INFLUENCER: '#f43f5e',
}

const HOW_TO_EARN = [
  { action: 'Post on Feed', points: '50 pts (FIRST_POST)', icon: 'edit_note', color: '#c3c0ff' },
  { action: 'Add 5 Friends', points: '100 pts (SOCIAL_STARTER)', icon: 'diversity_3', color: '#f472b6' },
  { action: 'Join 3 Communities', points: '75 pts (COMMUNITY_MEMBER)', icon: 'group', color: '#4cd7f6' },
  { action: 'Join 3 Clubs', points: '75 pts (CLUB_ENTHUSIAST)', icon: 'school', color: '#86efac' },
  { action: 'Join 3 Events', points: '100 pts (EVENT_EXPLORER)', icon: 'event', color: '#fbbf24' },
  { action: 'Create Marketplace Listing', points: '50 pts (MARKETPLACE_SELLER)', icon: 'store', color: '#fb923c' },
  { action: 'Upload study note', points: '100 pts (NOTE_CONTRIBUTOR)', icon: 'menu_book', color: '#a78bfa' },
  { action: 'Upload exam paper', points: '100 pts (PAPER_CONTRIBUTOR)', icon: 'description', color: '#f472b6' },
  { action: 'Verify profile', points: '150 pts (VERIFIED_STUDENT)', icon: 'verified', color: '#38bdf8' },
  { action: 'Join 3 Study Groups', points: '75 pts (STUDY_CHAMPION)', icon: 'groups', color: '#a78bfa' },
  { action: 'Get 25 Post Likes', points: '200 pts (CAMPUS_INFLUENCER)', icon: 'favorite', color: '#f43f5e' },
]

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

export default function RewardsClient({ userId, profile }: any) {
  const [tab, setTab] = useState<'overview' | 'badges' | 'leaderboard' | 'earn'>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    points: 0,
    rank: 0,
    streak: 0,
    level: 1,
    nextLevelPoints: 500,
    badgesCount: 0
  })
  const [badges, setBadges] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  
  const [animateParentRef] = useAutoAnimate()

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()

        // 1. Fetch user points
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('total, level, streak_days')
          .eq('user_id', userId)
          .maybeSingle()

        const totalPoints = pointsData?.total || 0
        const currentLevel = Math.max(1, pointsData?.level || Math.floor(totalPoints / 500) + 1)
        const nextLevelPoints = currentLevel * 500
        const streak = pointsData?.streak_days || 0

        // Calculate rank
        const { count: rankCount } = await supabase
          .from('user_points')
          .select('*', { count: 'exact', head: true })
          .gt('total', totalPoints)
        const currentRank = (rankCount || 0) + 1

        // 2. Fetch all achievements
        const { data: allAchievements } = await supabase
          .from('achievements')
          .select('*')
          .order('points_reward', { ascending: true })

        // 3. Fetch user's unlocked achievements
        const { data: userUnlocked } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)

        const unlockedIds = new Set((userUnlocked || []).map((ua: any) => ua.achievement_id))

        const mappedBadges = (allAchievements || []).map((ach: any) => ({
          id: ach.id,
          name: ach.name,
          desc: ach.description,
          icon: ach.icon || 'military_tech',
          points: ach.points_reward,
          color: ACHIEVEMENT_COLORS[ach.id] || '#c3c0ff',
          earned: unlockedIds.has(ach.id),
          unlockedAt: (userUnlocked || []).find((ua: any) => ua.achievement_id === ach.id)?.unlocked_at
        }))

        // 4. Fetch activities from points_log
        const { data: logData } = await supabase
          .from('points_log')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)

        const mappedActivities = (logData || []).map((log: any) => {
          let icon = 'military_tech'
          let color = '#c3c0ff'
          const actionText = log.action.toLowerCase()
          if (actionText.includes('post')) {
            icon = 'edit_note'
            color = '#c3c0ff'
          } else if (actionText.includes('like')) {
            icon = 'favorite'
            color = '#f472b6'
          } else if (actionText.includes('friend')) {
            icon = 'diversity_3'
            color = '#d0bcff'
          } else if (actionText.includes('note')) {
            icon = 'menu_book'
            color = '#4cd7f6'
          } else if (actionText.includes('paper')) {
            icon = 'description'
            color = '#f472b6'
          } else if (actionText.includes('community')) {
            icon = 'group'
            color = '#4cd7f6'
          } else if (actionText.includes('club')) {
            icon = 'school'
            color = '#86efac'
          } else if (actionText.includes('event')) {
            icon = 'event'
            color = '#fbbf24'
          }
          return {
            icon,
            label: log.action,
            points: `+${log.points} pts`,
            time: formatRelativeTime(log.created_at),
            color
          }
        })

        // 5. Fetch leaderboard
        const { data: topPoints } = await supabase
          .from('user_points')
          .select(`
            total,
            level,
            streak_days,
            user_id,
            profiles (
              full_name,
              branch,
              username,
              avatar_url
            )
          `)
          .order('total', { ascending: false })
          .limit(15)

        const mappedLeaderboard = (topPoints || []).map((item: any, idx: number) => ({
          rank: idx + 1,
          name: item.profiles?.full_name || item.profiles?.username || 'Unknown Student',
          branch: item.profiles?.branch || 'General',
          points: item.total || 0,
          badge: idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐',
          streak: item.streak_days || 0,
          isYou: item.user_id === userId,
          avatar_url: item.profiles?.avatar_url
        }))

        const hasYou = mappedLeaderboard.some((m: any) => m.isYou)
        if (!hasYou) {
          mappedLeaderboard.push({
            rank: currentRank,
            name: profile?.full_name || profile?.username || 'You',
            branch: profile?.branch || 'General',
            points: totalPoints,
            badge: '🔥',
            streak,
            isYou: true,
            avatar_url: profile?.avatar_url
          })
        }

        setStats({
          points: totalPoints,
          rank: currentRank,
          streak,
          level: currentLevel,
          nextLevelPoints,
          badgesCount: unlockedIds.size
        })
        setBadges(mappedBadges)
        setActivities(mappedActivities)
        setLeaderboard(mappedLeaderboard)
      } catch (err: any) {
        console.error('Error loading rewards data:', err)
        toast.error('Failed to load rewards data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, profile])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  const pointsForCurrentLevel = (stats.level - 1) * 500
  const pct = Math.min(100, Math.max(0, Math.round(((stats.points - pointsForCurrentLevel) / 500) * 100)))
  const ptsToNext = stats.nextLevelPoints - stats.points

  // Trigger local confetti to wow the user
  const handleBadgeClick = (badge: any) => {
    if (badge.earned) {
      triggerConfetti()
      toast.success(`Badge "${badge.name}" unlocked! Reward claimed: +${badge.points} XP`, {
        icon: '🏅',
        style: {
          background: '#09090b',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#fafafa'
        }
      })
    } else {
      toast(`Keep going to unlock the "${badge.name}" badge!`, {
        icon: '🔒',
        style: {
          background: '#09090b',
          border: '1px solid rgba(255,255,255,0.05)',
          color: '#a1a1aa'
        }
      })
    }
  }

  // Top 3 Podium Sorting
  const topThree = leaderboard
    .filter(u => u.rank <= 3)
    .sort((a, b) => {
      // Re-order for podium rendering: 2nd place, 1st place, 3rd place
      if (a.rank === 1) return 0
      if (a.rank === 2) return -1
      return 1
    })

  // Fill in empty top 3 spaces if data is short
  while (topThree.length < 3) {
    topThree.push({
      rank: topThree.length + 1,
      name: 'Claim Spot',
      branch: 'Join Connect',
      points: 0,
      badge: '🏆',
      streak: 0,
      isYou: false,
      avatar_url: null
    })
  }

  // Double check sorting to yield: [Second, First, Third]
  const podiumOrder = [
    topThree.find(u => u.rank === 2) || topThree[1],
    topThree.find(u => u.rank === 1) || topThree[0],
    topThree.find(u => u.rank === 3) || topThree[2]
  ]

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto px-4 py-4">
      {/* Title */}
      <div>
        <h1 className="display-heading text-3xl flex items-center gap-2">
          Rewards & Achievements
          <Award className="text-indigo-400" size={28} />
        </h1>
        <p className="body-pro text-sm text-zinc-400">Earn points, claim badges, and top the campus leaderboards.</p>
      </div>

      {/* Premium Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 sm:p-8 relative overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.03) 100%)',
          borderColor: 'rgba(99,102,241,0.15)'
        }}
      >
        {/* Glow Effects */}
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full opacity-10 bg-indigo-500 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 rounded-full opacity-10 bg-violet-500 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          
          {/* Level Circle Badge */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center border border-indigo-500/20 bg-zinc-950 relative z-10">
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">LEVEL</span>
                <span className="font-display font-black text-3xl text-zinc-100">{stats.level}</span>
              </div>
            </div>

            <div>
              <h2 className="font-display font-bold text-xl text-zinc-100 flex items-center gap-2">
                {profile?.full_name}
                <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md border border-white/[0.04]">
                  Rank #{stats.rank}
                </span>
              </h2>
              <p className="text-xs font-mono text-zinc-500 mt-1">{profile?.branch || 'General Science'} · Verified IILM Student</p>
              
              <div className="flex items-center gap-3 mt-4 w-72">
                <div className="flex-grow h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" 
                  />
                </div>
                <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">{stats.points} / {stats.nextLevelPoints} XP</span>
              </div>
              <p className="text-[10px] font-mono text-zinc-500 mt-1.5">
                {ptsToNext > 0 ? `${ptsToNext} XP required to reach Level ${stats.level + 1}` : 'Maximum tier achieved.'}
              </p>
            </div>
          </div>

          {/* Points Metrics & Streak */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-white/[0.06] pt-4 md:pt-0 md:pl-8">
            <div className="text-left md:text-right">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Total Balance</span>
              <span className="font-display font-black text-4xl text-zinc-100">{stats.points.toLocaleString()}</span>
              <span className="text-xs font-mono text-indigo-400 ml-1">XP</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.05)]">
              <Flame size={15} className="fill-orange-500" />
              <span className="text-xs font-mono font-bold">{stats.streak} Day Streak</span>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Tabs Menu Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-zinc-900 border border-white/[0.05] w-fit">
        {([
          ['overview', '📊 Overview'],
          ['badges', '🏅 Badges'],
          ['leaderboard', '🏆 Leaderboard'],
          ['earn', '💡 How to Earn']
        ] as const).map(([t, label]) => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-all duration-150 ${
              tab === t 
                ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Area Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent points logs */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-zinc-200 text-lg flex items-center gap-1.5">
                  <Zap size={16} className="text-indigo-400" />
                  Recent Activity Log
                </h3>
                
                {activities.length === 0 ? (
                  <div className="card-premium p-8 text-center text-zinc-500 font-mono text-xs">
                    No recent reward transactions logged.
                  </div>
                ) : (
                  <div className="space-y-2.5" ref={animateParentRef}>
                    {activities.map((act, idx) => (
                      <div 
                        key={idx} 
                        className="card-premium px-4 py-3.5 flex items-center justify-between border-white/[0.04] bg-zinc-900/30 hover:border-white/[0.08] transition-colors rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${act.color}15`, border: `1px solid ${act.color}25` }}
                          >
                            <DynamicIcon name={act.icon} size={16} style={{ color: act.color }} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-200 leading-tight">{act.label}</p>
                            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{act.time}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {act.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Earned Badges Mini View */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-zinc-200 text-lg flex items-center gap-1.5">
                    <Award size={16} className="text-indigo-400" />
                    Unlocked Achievements ({stats.badgesCount})
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-white/[0.04]">
                    Progress: {Math.round((stats.badgesCount / Math.max(1, badges.length)) * 100)}%
                  </span>
                </div>

                {badges.filter(b => b.earned).length === 0 ? (
                  <div className="card-premium p-8 text-center text-zinc-500 font-mono text-xs">
                    No achievements unlocked yet. Check the &apos;Badges&apos; tab!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" ref={animateParentRef}>
                    {badges.filter(b => b.earned).map(badge => (
                      <div 
                        key={badge.id} 
                        onClick={() => handleBadgeClick(badge)}
                        className="card-premium p-3.5 flex items-center gap-3 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all duration-200 cursor-pointer rounded-xl border-white/[0.04] hover:scale-[1.01]"
                      >
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
                          style={{ background: `${badge.color}15`, border: `1px solid ${badge.color}25` }}
                        >
                          <DynamicIcon name={badge.icon} size={20} style={{ color: badge.color }} />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border border-zinc-950 flex items-center justify-center text-white text-[8px] font-bold">
                            ✓
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-zinc-200 text-xs truncate leading-tight">{badge.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{badge.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BADGES LIST */}
          {tab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" ref={animateParentRef}>
              {badges.map(badge => (
                <div 
                  key={badge.id} 
                  onClick={() => handleBadgeClick(badge)}
                  className={`card-premium p-5 flex flex-col items-center text-center gap-4 cursor-pointer transition-all duration-300 relative rounded-2xl hover:scale-[1.02] ${
                    badge.earned 
                      ? 'border-indigo-500/20 bg-[#0c0c0e]/80 shadow-md hover:shadow-indigo-500/5' 
                      : 'opacity-40 grayscale-[0.6] hover:opacity-75 hover:grayscale-[0.2] border-white/[0.03] bg-zinc-900/10'
                  }`}
                >
                  {/* Badge Icon Shield */}
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10"
                    style={{ 
                      background: `${badge.color}${badge.earned ? '20' : '05'}`, 
                      border: `1.5px solid ${badge.color}${badge.earned ? '40' : '15'}`,
                      boxShadow: badge.earned ? `0 0 20px ${badge.color}15` : 'none'
                    }}
                  >
                    <DynamicIcon name={badge.icon} size={28} style={{ color: badge.color }} />
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-zinc-100 text-sm leading-tight">{badge.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-normal px-2">{badge.desc}</p>
                    <p className="text-[10px] font-mono text-indigo-400 mt-2 font-bold uppercase tracking-wider">
                      +{badge.points} XP Reward
                    </p>
                  </div>

                  <div className="w-full pt-3 border-t border-white/[0.04]">
                    {badge.earned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
                        <Check size={10} /> Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-full border border-white/[0.05] font-bold">
                        <Lock size={10} /> Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: LEADERBOARD WITH 3D PODIUM */}
          {tab === 'leaderboard' && (
            <div className="space-y-8">
              
              {/* Premium 3D Podium Layout */}
              <div className="flex flex-col sm:flex-row justify-center items-end gap-6 sm:gap-4 py-8 px-4 relative overflow-hidden rounded-3xl bg-zinc-900/10 border border-white/[0.02]">
                
                {/* 2nd Place Column (Left) */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-col items-center w-full sm:w-48 group cursor-pointer"
                >
                  <div className="flex flex-col items-center mb-4 relative z-10">
                    <div className="relative">
                      <GlobalAvatar 
                        fullName={podiumOrder[0].name}
                        avatarUrl={podiumOrder[0].avatar_url}
                        size="lg" 
                        className="ring-4 ring-zinc-400/50 shadow-2xl" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zinc-400 rounded-full border-2 border-zinc-950 flex items-center justify-center text-zinc-950 font-mono text-xs font-bold shadow-md">
                        2
                      </div>
                    </div>
                    <span className="font-display font-bold text-sm text-zinc-200 mt-3 group-hover:text-zinc-50 transition-colors">
                      {podiumOrder[0].name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 mt-0.5">{podiumOrder[0].branch}</span>
                  </div>

                  {/* Silver Column Base */}
                  <div 
                    className="w-full h-24 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl border border-zinc-700/30 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_10px_30px_rgba(255,255,255,0.02)] group-hover:border-zinc-500/20"
                    style={{ transformStyle: 'preserve-3d', transform: 'perspective(500px) rotateX(10deg)' }}
                  >
                    <span className="font-display font-black text-2xl text-zinc-400">🥈</span>
                    <span className="text-xs font-mono text-zinc-400 font-bold mt-1">{podiumOrder[0].points.toLocaleString()} XP</span>
                    <span className="text-[9px] font-mono text-zinc-500 mt-0.5">{podiumOrder[0].streak}🔥 streak</span>
                  </div>
                </motion.div>

                {/* 1st Place Column (Center - Highest) */}
                <motion.div 
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center w-full sm:w-56 group cursor-pointer relative -top-3"
                >
                  <div className="absolute -top-8 w-12 h-12 bg-amber-400/20 rounded-full filter blur-xl animate-pulse" />
                  
                  <div className="flex flex-col items-center mb-4 relative z-10">
                    <div className="relative">
                      <GlobalAvatar 
                        fullName={podiumOrder[1].name}
                        avatarUrl={podiumOrder[1].avatar_url}
                        size="xl" 
                        className="ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.3)]" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-full border-2 border-zinc-950 flex items-center justify-center text-zinc-950 font-mono text-sm font-bold shadow-md">
                        1
                      </div>
                    </div>
                    <span className="font-display font-black text-base text-zinc-100 mt-3 group-hover:text-amber-300 transition-colors flex items-center gap-1">
                      {podiumOrder[1].name}
                      <Sparkles size={12} className="text-amber-400" />
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5">{podiumOrder[1].branch}</span>
                  </div>

                  {/* Gold Column Base */}
                  <div 
                    className="w-full h-36 bg-gradient-to-b from-zinc-800/80 to-zinc-900 rounded-2xl border border-amber-400/20 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_15px_40px_rgba(251,191,36,0.06)] group-hover:border-amber-400/40"
                    style={{ transformStyle: 'preserve-3d', transform: 'perspective(500px) rotateX(10deg)' }}
                  >
                    <span className="font-display font-black text-3xl text-amber-400">🥇</span>
                    <span className="text-sm font-mono text-amber-300 font-bold mt-1">{podiumOrder[1].points.toLocaleString()} XP</span>
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5">{podiumOrder[1].streak}🔥 streak</span>
                  </div>
                </motion.div>

                {/* 3rd Place Column (Right) */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col items-center w-full sm:w-48 group cursor-pointer"
                >
                  <div className="flex flex-col items-center mb-4 relative z-10">
                    <div className="relative">
                      <GlobalAvatar 
                        fullName={podiumOrder[2].name}
                        avatarUrl={podiumOrder[2].avatar_url}
                        size="lg" 
                        className="ring-4 ring-orange-500/50 shadow-2xl" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full border-2 border-zinc-950 flex items-center justify-center text-zinc-950 font-mono text-xs font-bold shadow-md">
                        3
                      </div>
                    </div>
                    <span className="font-display font-bold text-sm text-zinc-200 mt-3 group-hover:text-zinc-50 transition-colors">
                      {podiumOrder[2].name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 mt-0.5">{podiumOrder[2].branch}</span>
                  </div>

                  {/* Bronze Column Base */}
                  <div 
                    className="w-full h-20 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl border border-orange-500/20 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_10px_30px_rgba(249,115,22,0.02)] group-hover:border-orange-500/40"
                    style={{ transformStyle: 'preserve-3d', transform: 'perspective(500px) rotateX(10deg)' }}
                  >
                    <span className="font-display font-black text-2xl text-orange-500">🥉</span>
                    <span className="text-xs font-mono text-zinc-400 font-bold mt-1">{podiumOrder[2].points.toLocaleString()} XP</span>
                    <span className="text-[9px] font-mono text-zinc-500 mt-0.5">{podiumOrder[2].streak}🔥 streak</span>
                  </div>
                </motion.div>

              </div>

              {/* Leaderboard Table List */}
              <div className="card-premium rounded-2xl overflow-hidden border-white/[0.04]">
                <div className="px-5 py-3 border-b border-white/[0.04] bg-zinc-900/40 flex items-center justify-between text-xs font-mono text-zinc-500 font-bold">
                  <div className="flex items-center gap-4">
                    <span className="w-5 text-center">RANK</span>
                    <span>STUDENT</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span>BRANCH</span>
                    <span className="w-10 text-right">STREAK</span>
                    <span className="w-24 text-right">BALANCE</span>
                  </div>
                </div>
                
                <div className="divide-y divide-white/[0.04]" ref={animateParentRef}>
                  {leaderboard.map(entry => (
                    <div 
                      key={entry.rank} 
                      className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02] ${
                        entry.isYou ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-5 text-center font-mono text-xs text-zinc-400 font-bold">
                          #{entry.rank}
                        </span>
                        
                        <div className="flex items-center gap-3 min-w-0">
                          <GlobalAvatar 
                            fullName={entry.name}
                            avatarUrl={entry.avatar_url}
                            size="sm" 
                            className="ring-1 ring-white/10" 
                          />
                          <p className="font-display font-bold text-zinc-200 text-sm truncate flex items-center gap-1.5">
                            {entry.name}
                            {entry.isYou && (
                              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                YOU
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="text-xs font-mono text-zinc-500 truncate max-w-[80px]">
                          {entry.branch}
                        </span>
                        
                        <span className="text-xs font-mono text-orange-400 flex items-center gap-0.5 w-10 justify-end">
                          {entry.streak}🔥
                        </span>

                        <span className="font-display font-black text-zinc-200 text-sm w-24 text-right">
                          {entry.points.toLocaleString()} <span className="text-[10px] font-mono text-zinc-500 font-normal">XP</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: HOW TO EARN */}
          {tab === 'earn' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ref={animateParentRef}>
              {HOW_TO_EARN.map(item => (
                <div 
                  key={item.action} 
                  className="card-premium p-4.5 flex items-center justify-between rounded-2xl border-white/[0.04] bg-zinc-900/20 hover:border-indigo-500/10 hover:bg-zinc-900/40 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}
                    >
                      <DynamicIcon name={item.icon} size={20} style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold text-zinc-200 leading-tight">{item.action}</p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wide">
                        Claim Once Completed
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                    {item.points.split(' ')[0]} XP
                  </span>
                </div>
              ))}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
