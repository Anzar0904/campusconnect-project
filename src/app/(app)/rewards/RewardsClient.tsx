'use client'

import { Flame } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui/Skeleton'

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
          .limit(10)

        const mappedLeaderboard = (topPoints || []).map((item: any, idx: number) => ({
          rank: idx + 1,
          name: item.profiles?.full_name || item.profiles?.username || 'Unknown Student',
          branch: item.profiles?.branch || 'General',
          points: item.total || 0,
          badge: idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐',
          streak: item.streak_days || 0,
          isYou: item.user_id === userId,
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

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">Rewards & Achievements</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Earn points, collect badges, and climb the campus leaderboard</p>
      </div>

      {/* Hero card */}
      <div className="glass-elevated rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.25),rgba(76,215,246,0.1))', border: '1px solid rgba(195,192,255,0.2)' }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ background: '#4cd7f6', filter: 'blur(40px)' }} />
        <div className="relative flex items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
              style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.4),rgba(76,215,246,0.2))', border: '1px solid rgba(195,192,255,0.3)' }}>
              <span className="font-display font-black text-3xl text-on-surface">{stats.level}</span>
            </div>
            <span className="text-xs font-mono text-on-surface-variant">Level</span>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-on-surface">{profile?.full_name}</h2>
            <p className="text-sm font-mono text-on-surface-variant mb-3">{profile?.branch} · Campus Rank #{stats.rank}</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#4f46e5,#4cd7f6)', boxShadow: '0 0 8px rgba(76,215,246,0.4)' }} />
              </div>
              <span className="text-xs font-mono text-on-surface-variant whitespace-nowrap">{stats.points} / {stats.nextLevelPoints}</span>
            </div>
            <p className="text-xs font-mono text-on-surface-variant">
              {ptsToNext > 0 ? `${ptsToNext} pts to Level ${stats.level + 1}` : `Max level reached for current points tier`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="font-display font-black text-3xl text-on-surface">{stats.points.toLocaleString()}</p>
              <p className="text-xs font-mono text-on-surface-variant">Total Points</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <Flame style={{ color: '#f97316', fontVariationSettings: "'FILL' 1" }} size={16} />
              <span className="text-sm font-mono" style={{ color: '#f97316' }}>{stats.streak} day streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([['overview', '📊 Overview'], ['badges', '🏅 Badges'], ['leaderboard', '🏆 Leaderboard'], ['earn', '💡 How to Earn']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-mono transition-all"
            style={tab === t ? { background: 'rgba(79,70,229,0.4)', color: '#c3c0ff', border: '1px solid rgba(195,192,255,0.2)' } : { color: '#c7c4d8' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent activity */}
          <div>
            <h3 className="font-display font-semibold text-on-surface mb-3">Recent Activity</h3>
            {activities.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center text-on-surface-variant font-mono text-sm">
                No recent points transactions. Start interacting to earn points!
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((a, i) => (
                  <div key={i} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${a.color}18`, border: `1px solid ${a.color}30` }}>
                      <DynamicIcon name={a.icon} size={16} style={{ color: a.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-on-surface">{a.label}</p>
                      <p className="text-[10px] font-mono text-on-surface-variant">{a.time}</p>
                    </div>
                    <span className="text-xs font-mono" style={{ color: '#86efac' }}>{a.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Earned badges */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display font-semibold text-on-surface">Earned Badges ({stats.badgesCount})</h3>
              <span className="text-xs text-on-surface-variant font-mono">Progress: {Math.round((stats.badgesCount / Math.max(1, badges.length)) * 100)}%</span>
            </div>
            {badges.filter(b => b.earned).length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center text-on-surface-variant font-mono text-sm">
                {"No badges earned yet. Check the 'Badges' or 'How to Earn' tab!"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.filter(b => b.earned).map(badge => (
                  <div key={badge.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${badge.color}18`, border: `1px solid ${badge.color}30` }}>
                      <DynamicIcon name={badge.icon} size={22} style={{ color: badge.color }} />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-on-surface text-xs">{badge.name}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map(badge => (
            <div key={badge.id} className="glass-card rounded-xl p-5 flex flex-col items-center text-center gap-3"
              style={!badge.earned ? { opacity: 0.45, filter: 'grayscale(0.6)' } : {}}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `${badge.color}${badge.earned ? '25' : '10'}`, border: `2px solid ${badge.color}${badge.earned ? '45' : '20'}` }}>
                <DynamicIcon name={badge.icon} size={32} style={{ color: badge.color }} />
              </div>
              <div>
                <p className="font-display font-semibold text-on-surface text-sm">{badge.name}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{badge.desc}</p>
                {badge.points && (
                  <p className="text-[10px] font-mono text-primary mt-1">+{badge.points} Points Reward</p>
                )}
              </div>
              {badge.earned
                ? <span className="chip chip-success text-[10px]">✓ Earned</span>
                : <span className="chip text-[10px]" style={{ background: 'rgba(255,255,255,0.05)', color: '#c7c4d8', border: '1px solid rgba(255,255,255,0.08)' }}>Locked</span>
              }
            </div>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {leaderboard.slice(0, 3).map((e, i) => (
              <div key={e.rank} className="glass-card rounded-xl p-5 text-center"
                style={i === 0 ? { border: '1px solid rgba(251,191,36,0.35)' } : {}}>
                <p className="text-3xl mb-2">{e.badge}</p>
                <p className="font-display font-bold text-on-surface text-sm truncate">{e.name}</p>
                <p className="text-xs font-mono text-on-surface-variant">{e.branch}</p>
                <p className="font-display font-bold text-on-surface mt-2">{e.points.toLocaleString()} pts</p>
                <p className="text-[10px] font-mono text-on-surface-variant">{e.streak}🔥 streak</p>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            {leaderboard.map(entry => (
              <div key={entry.rank} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
                style={entry.isYou ? { background: 'rgba(79,70,229,0.08)' } : {}}>
                <span className="w-5 text-center font-mono text-xs text-on-surface-variant">#{entry.rank}</span>
                <span className="text-base">{entry.badge}</span>
                <p className="flex-1 font-display font-semibold text-on-surface text-sm truncate">
                  {entry.name}{entry.isYou && <span className="text-xs font-mono text-primary ml-1.5">(you)</span>}
                </p>
                <span className="text-xs font-mono text-on-surface-variant truncate max-w-[80px]">{entry.branch}</span>
                <span className="text-xs font-mono text-on-surface-variant">{entry.streak}🔥</span>
                <span className="font-display font-bold text-on-surface text-sm w-24 text-right">{entry.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'earn' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HOW_TO_EARN.map(item => (
            <div key={item.action} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                <DynamicIcon name={item.icon} size={20} style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-display font-semibold text-on-surface">{item.action}</p>
              </div>
              <span className="text-sm font-mono" style={{ color: '#86efac' }}>{item.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
