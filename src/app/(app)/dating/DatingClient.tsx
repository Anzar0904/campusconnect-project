'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Heart, MessageSquare, Star, Trash2, X, Sparkles, Filter, 
  MapPin, User, Settings, Info, Check, Plus, AlertCircle, ArrowRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import SwipeStack from '@/components/dating/SwipeStack'

const INTERESTS = [
  'Music', 'Photography', 'Coding', 'Travel', 'Movies', 'Fitness', 
  'Gaming', 'Books', 'Art', 'Cricket', 'Cooking', 'Hiking', 
  'Dance', 'Coffee', 'Startups', 'Anime', 'Design', 'Web3'
]

const AVATAR_COLORS = ['#4f46e5', '#571bc1', '#0ea5e9', '#7c3aed', '#db2777']

// Sub-component for individual Swipeable Dating Cards
function DatingCard({ 
  profile, 
  isTop, 
  onSwipe, 
  myInterests,
  onClickInfo 
}: { 
  profile: any
  isTop: boolean
  onSwipe: (dir: 'left' | 'right' | 'up') => void
  myInterests: string[]
  onClickInfo: () => void
}) {
  const controls = useAnimation()
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Motion transforms for rotation, scaling, and opacity overlays
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95])
  
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0])
  const superOpacity = useTransform(y, [-100, -20], [1, 0])

  // Calculate mutual interests and compatibility score
  const profileInterests = profile.interests || []
  const mutualInterests = profileInterests.filter((i: string) => myInterests.includes(i))
  const compatibilityScore = Math.min(
    99,
    Math.max(
      45,
      50 + mutualInterests.length * 12 + (profile.profiles.branch === 'CSE' ? 8 : 0)
    )
  )

  const handleDragEnd = async (_event: any, info: any) => {
    if (!isTop) return
    const offsetThreshold = 140
    const velocityThreshold = 500

    const swipeX = info.offset.x
    const swipeY = info.offset.y
    const velX = info.velocity.x
    const velY = info.velocity.y

    if (swipeX > offsetThreshold || velX > velocityThreshold) {
      // Swipe Right (Like)
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } })
      onSwipe('right')
    } else if (swipeX < -offsetThreshold || velX < -velocityThreshold) {
      // Swipe Left (Nope)
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } })
      onSwipe('left')
    } else if (swipeY < -offsetThreshold || velY < -velocityThreshold) {
      // Swipe Up (Super Like)
      await controls.start({ y: -500, opacity: 0, transition: { duration: 0.2 } })
      onSwipe('up')
    } else {
      // Snap Back
      controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 250, damping: 20 } })
    }
  }

  // Pre-generate standard college avatar gradient
  const cardColorIdx = Math.abs(profile.user_id.charCodeAt(0) + profile.user_id.charCodeAt(profile.user_id.length - 1)) % 5

  return (
    <motion.div
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1.1}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ 
        x, 
        y, 
        rotate, 
        scale,
        zIndex: isTop ? 10 : 1,
        touchAction: 'none'
      }}
      className={`absolute inset-0 cursor-grab active:cursor-grabbing w-full h-[460px] rounded-3xl overflow-hidden shadow-2xl transition-shadow duration-300 ${
        isTop ? 'hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/[0.08]' : 'scale-95 translate-y-4 opacity-40 border border-white/[0.03]'
      }`}
    >
      {/* Background Surface */}
      <div className="absolute inset-0 bg-[#0c0c0e]" />

      {/* Swipe Badges Overlay */}
      {isTop && (
        <>
          <motion.div 
            style={{ opacity: likeOpacity }} 
            className="absolute top-8 left-8 border-4 border-emerald-500 text-emerald-500 font-display font-black px-6 py-2 rounded-xl text-3xl uppercase tracking-wider rotate-[-12deg] z-30 pointer-events-none"
          >
            LIKE
          </motion.div>
          <motion.div 
            style={{ opacity: nopeOpacity }} 
            className="absolute top-8 right-8 border-4 border-rose-500 text-rose-500 font-display font-black px-6 py-2 rounded-xl text-3xl uppercase tracking-wider rotate-[12deg] z-30 pointer-events-none"
          >
            NOPE
          </motion.div>
          <motion.div 
            style={{ opacity: superOpacity }} 
            className="absolute bottom-28 left-1/2 -translate-x-1/2 border-4 border-amber-400 text-amber-400 font-display font-black px-6 py-2 rounded-xl text-2xl uppercase tracking-widest z-30 pointer-events-none"
          >
            SUPER
          </motion.div>
        </>
      )}

      {/* Photo / Avatar Canvas */}
      <div 
        className="h-60 w-full flex items-center justify-center relative select-none"
        style={{
          background: `linear-gradient(135deg, ${AVATAR_COLORS[cardColorIdx]}25 0%, ${AVATAR_COLORS[(cardColorIdx + 2) % 5]}25 100%)`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-black/30 z-10" />
        
        {/* Glow backdrop */}
        <div 
          className="absolute w-44 h-44 rounded-full opacity-20 filter blur-3xl"
          style={{ backgroundColor: AVATAR_COLORS[cardColorIdx] }}
        />

        <GlobalAvatar
          profile={profile.profiles}
          size="custom"
          className="w-32 h-32 rounded-3xl text-5xl font-display font-bold ring-4 ring-white/10 z-20 shadow-2xl relative"
        />

        {/* Compatibility badge */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1 z-20">
          <Sparkles className="text-amber-400" size={12} />
          <span className="text-[11px] font-mono font-bold text-amber-300">{compatibilityScore}% MATCH</span>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-6 flex flex-col justify-between h-[220px] bg-[#0c0c0e] relative z-20">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-zinc-100 text-xl tracking-tight flex items-center gap-2">
              {profile.profiles.full_name}
              {profile.profiles.verified && (
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-[10px]">✓</span>
              )}
            </h3>
            
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onClickInfo()
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-zinc-400 hover:text-white"
            >
              <Info size={18} />
            </button>
          </div>
          
          <p className="text-xs font-mono text-zinc-400 mt-1 flex items-center gap-1.5">
            <MapPin size={11} className="text-zinc-500" />
            {profile.profiles.branch} · Year {profile.profiles.year}
          </p>

          <p className="text-sm text-zinc-300 mt-3 line-clamp-2 leading-relaxed">
            {profile.bio || "No bio filled yet."}
          </p>
        </div>

        {/* Dynamic Interests Preview */}
        <div className="border-t border-white/[0.04] pt-3 flex flex-wrap gap-1.5 overflow-hidden max-h-[36px]">
          {profileInterests.map((interest: string) => {
            const isMutual = myInterests.includes(interest)
            return (
              <span 
                key={interest} 
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono tracking-tight transition-colors ${
                  isMutual 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : 'bg-zinc-800/40 text-zinc-400 border border-white/[0.04]'
                }`}
              >
                {interest}
              </span>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default function DatingClient({ 
  userId, 
  profile, 
  datingProfile: initDP,
  initialDiscoverable,
  initialMatches,
}: any) {
  const router = useRouter()
  const [datingProfile, setDatingProfile] = useState(initDP)
  const [setupStep, setSetupStep] = useState<'idle' | 'setup' | 'browse'>(initDP ? 'browse' : 'idle')
  const [form, setForm] = useState({ 
    bio: initDP?.bio || profile?.bio || '', 
    interests: initDP?.interests || [] as string[], 
    looking_for: initDP?.looking_for || 'friendship', 
    gender: initDP?.gender || profile?.gender || '', 
    show_to: initDP?.show_to || 'everyone',
    photos: initDP?.photos || [] as string[]
  })
  
  const [cardIdx, setCardIdx] = useState(0)
  const [discoverable, setDiscoverable] = useState<any[]>(initialDiscoverable || [])
  const [matches, setMatches] = useState<any[]>(initialMatches || [])
  const [activeTab, setActiveTab] = useState<'browse' | 'matches' | 'settings'>('browse')
  
  // Client filters
  const [filterBranch, setFilterBranch] = useState<string>('All')
  const [filterYear, setFilterYear] = useState<string>('All')
  
  // Selected Profile Info Overlay
  const [selectedProfileDetail, setSelectedProfileDetail] = useState<any | null>(null)
  
  const [animateParentRef] = useAutoAnimate()
  const supabase = createClient()

  // Apply filters on discoverable stack
  const filteredDiscoverable = discoverable.filter(item => {
    if (filterBranch !== 'All' && item.profiles.branch !== filterBranch) return false
    if (filterYear !== 'All' && String(item.profiles.year) !== filterYear) return false
    return true
  })

  const currentCard = filteredDiscoverable[cardIdx]

  async function handleSwipe(direction: 'left' | 'right' | 'up') {
    if (!currentCard) return
    const liked = direction === 'right' || direction === 'up'

    // 1. Save Swipe Transaction
    const { error: swipeError } = await supabase
      .from('dating_swipes')
      .insert({
        swiper_id: userId,
        swiped_id: currentCard.user_id,
        liked: liked,
        direction: direction
      })

    if (swipeError) {
      if (swipeError.code !== '23505') { // Ignore duplicate key errors
        toast.error('Swipe action failed to register')
        return
      }
    }

    // 2. Check for reciprocal liked action
    if (liked) {
      const { data: reciprocal } = await supabase
        .from('dating_swipes')
        .select('*')
        .eq('swiper_id', currentCard.user_id)
        .eq('swiped_id', userId)
        .eq('liked', true)
        .maybeSingle()

      if (reciprocal) {
        // Build match entry
        const user1_id = userId < currentCard.user_id ? userId : currentCard.user_id
        const user2_id = userId < currentCard.user_id ? currentCard.user_id : userId

        const { data: newMatch, error: matchError } = await supabase
          .from('dating_matches')
          .insert({ user1_id, user2_id })
          .select('*, user1:profiles!dating_matches_user1_id_fkey(id, full_name, branch, year, avatar_url), user2:profiles!dating_matches_user2_id_fkey(id, full_name, branch, year, avatar_url)')
          .single()

        if (!matchError && newMatch) {
          setMatches(prev => [newMatch, ...prev])
          toast.success(`💕 Mutual Match! You connected with ${currentCard.profiles.full_name}!`, {
            duration: 4000,
            icon: '🔥',
            style: {
              background: '#09090b',
              border: '1px solid rgba(236,72,153,0.3)',
              color: '#fafafa'
            }
          })
          
          // Inject Direct Friendship Record
          try {
            await supabase
              .from('friendships')
              .insert({
                requester_id: userId,
                addressee_id: currentCard.user_id,
                status: 'accepted'
              })
          } catch (fError) {
            console.warn('Friendship link skipped (duplicate).', fError)
          }
        }
      }
    }

    // Increment index to serve next card in the deck
    setCardIdx(i => i + 1)
  }

  async function saveProfile() {
    if (!form.gender) {
      toast.error('Please specify your gender identity')
      return
    }

    const { error } = await supabase.from('dating_profiles').upsert({
      user_id: userId,
      bio: form.bio,
      interests: form.interests,
      looking_for: form.looking_for,
      gender: form.gender,
      show_to: form.show_to,
      photos: form.photos,
      is_active: true,
    })
    
    if (error) {
      toast.error('Error preserving dating profile details')
      return
    }

    setDatingProfile({ ...form, user_id: userId })
    setSetupStep('browse')
    toast.success('Your profile is live! Ready to match ✨')
    router.refresh()
  }

  function toggleInterest(interest: string) {
    setForm(p => ({
      ...p,
      interests: (p.interests || []).includes(interest)
        ? p.interests.filter((i: string) => i !== interest)
        : (p.interests || []).length < 6 ? [...(p.interests || []), interest] : p.interests
    }))
  }

  const getMatchDisplay = (m: any) => {
    const other = m.user1_id === userId ? m.user2 : m.user1
    return {
      id: other.id,
      name: other.full_name,
      branch: other.branch,
      year: other.year,
      avatar_url: other.avatar_url,
      avatar: other.full_name?.split(' ').map((n: any) => n[0]).join('') || 'U'
    }
  }

  // ONBOARDING SCREEN
  if (setupStep === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-[75vh] px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-premium p-10 max-w-md w-full text-center space-y-6 relative overflow-hidden"
        >
          {/* Backdrop Aura */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-36 opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top, #ec4899 0%, transparent 70%)' }}
          />

          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center relative z-10 shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#db2777,#ec4899)', boxShadow: '0 0 40px rgba(236,72,153,0.3)' }}>
            <Heart className="text-white" style={{ fontVariationSettings: "'FILL' 1" }} size={40} />
          </div>

          <div className="relative z-10">
            <span className="chip-pro text-[10px] bg-rose-500/10 border-rose-500/20 text-rose-400 mb-2">
              VERIFIED PORTAL
            </span>
            <h1 className="display-heading text-3xl tracking-tight">Campus Dating</h1>
            <p className="body-pro text-sm mt-2 leading-relaxed text-zinc-400">
              A private, email-verified space to connect with fellow IILM students. Clean matches, secure connections, zero outsiders.
            </p>
          </div>

          <div className="p-4 rounded-xl text-left bg-zinc-900/40 border border-white/[0.04] space-y-3">
            {[
              '🔒 Only verified @iilm.edu members are visible',
              '🙈 Restrict visibility based on branch or batch',
              '💬 Automatic friendship creation on mutual likes',
            ].map((text) => (
              <div key={text} className="flex gap-2.5 items-start text-xs text-zinc-400">
                <Check className="text-rose-500 shrink-0 mt-0.5" size={14} />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setSetupStep('setup')} 
            className="btn-primary w-full justify-center py-3.5 relative z-10 font-bold bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 border-0"
          >
            <Sparkles size={16} />
            Initialize My Profile
          </button>
        </motion.div>
      </div>
    )
  }

  // PROFILE SETUP / EDITING STEP
  if (setupStep === 'setup') {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="display-heading text-3xl">Dating Setup</h1>
          <p className="body-pro text-sm text-zinc-400">Your profile information is only visible to active campus swipers.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6 space-y-6"
        >
          {/* Bio Description */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Your Bio</label>
            <textarea 
              className="input-pro w-full h-24 resize-none text-zinc-100 text-sm"
              placeholder="What makes you, you? (e.g. Grinding DSA, coffee explorer, gaming...)"
              value={form.bio} 
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            />
          </div>

          {/* Interests Multi-Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Interests (Pick up to 6)</label>
              <span className="text-xs font-mono text-zinc-500">{(form.interests || []).length} / 6</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => {
                const selected = form.interests.includes(interest)
                return (
                  <button 
                    key={interest} 
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 border ${
                      selected
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-zinc-800/40 text-zinc-400 border-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gender & Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Identify As</label>
              <select 
                className="input-pro w-full text-zinc-100" 
                value={form.gender} 
                onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
              >
                <option value="">Select Identity</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Looking For</label>
              <select 
                className="input-pro w-full text-zinc-100" 
                value={form.looking_for} 
                onChange={e => setForm(p => ({ ...p, looking_for: e.target.value }))}
              >
                <option value="friendship">Friendship</option>
                <option value="relationship">Relationship</option>
                <option value="study_buddy">Study Buddy</option>
                <option value="anything">Anything</option>
              </select>
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Show Profile To</label>
            <select 
              className="input-pro w-full text-zinc-100" 
              value={form.show_to} 
              onChange={e => setForm(p => ({ ...p, show_to: e.target.value }))}
            >
              <option value="everyone">Everyone</option>
              <option value="same_branch">Only my branch</option>
              <option value="same_year">Only my batch year</option>
            </select>
          </div>

          <button 
            type="button" 
            onClick={saveProfile} 
            className="btn-primary w-full justify-center py-3 bg-gradient-to-r from-rose-600 to-pink-500 border-0"
          >
            Create Profile & Start Discovering
          </button>
        </motion.div>
      </div>
    )
  }

  // MAIN CLIENT VIEW
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="display-heading text-3xl tracking-tight flex items-center gap-2">
            Campus Dating
            <Heart className="text-rose-500 fill-rose-500" size={24} />
          </h1>
          <p className="body-pro text-sm text-zinc-400">Discover and match with college mates securely.</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900 px-3.5 py-2 rounded-xl border border-white/[0.04] w-fit">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          {discoverable.length} verified student profiles near you
        </div>
      </div>

      {/* Primary Tab Selection Menu */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex gap-1 p-1 rounded-xl bg-zinc-900 border border-white/[0.05]">
          {(['browse', 'matches', 'settings'] as const).map(tab => {
            const labels = {
              browse: '💫 Discover',
              matches: `❤️ Matches (${matches.length})`,
              settings: '⚙️ Settings'
            }
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-mono transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        {/* Client-Side Quick Filters */}
        {activeTab === 'browse' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Branch filter */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-white/[0.04] px-2.5 py-1.5 rounded-lg text-xs">
              <Filter size={11} className="text-zinc-500" />
              <span className="text-zinc-400 font-mono">Branch:</span>
              <select 
                value={filterBranch} 
                onChange={(e) => { setFilterBranch(e.target.value); setCardIdx(0) }} 
                className="bg-transparent text-zinc-200 outline-none cursor-pointer text-xs font-mono font-bold"
              >
                <option value="All">All</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="MBA">MBA</option>
              </select>
            </div>

            {/* Year filter */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-white/[0.04] px-2.5 py-1.5 rounded-lg text-xs">
              <Filter size={11} className="text-zinc-500" />
              <span className="text-zinc-400 font-mono">Year:</span>
              <select 
                value={filterYear} 
                onChange={(e) => { setFilterYear(e.target.value); setCardIdx(0) }} 
                className="bg-transparent text-zinc-200 outline-none cursor-pointer text-xs font-mono font-bold"
              >
                <option value="All">All</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* DISCOVER/BROWSE DECK PANEL */}
      {activeTab === 'browse' && (
        <div className="flex flex-col items-center justify-center py-6">
          {cardIdx >= filteredDiscoverable.length ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-premium rounded-2xl p-12 text-center max-w-md w-full flex flex-col items-center border border-white/[0.05]"
            >
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                <Sparkles size={28} />
              </div>
              <h3 className="font-display font-bold text-zinc-100 text-lg mb-2">You&apos;ve seen everyone!</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Try widening your filtering parameters or check back soon as more students verification requests get approved!
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setFilterBranch('All'); setFilterYear('All'); setCardIdx(0) }} 
                  className="btn-premium text-xs"
                >
                  Reset Filter Bounds
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                {/* SwipeStack Component */}
                <SwipeStack
                  profiles={filteredDiscoverable.slice(cardIdx)}
                  onLike={() => handleSwipe('right')}
                  onNope={() => handleSwipe('left')}
                  onSuperLike={() => handleSwipe('up')}
                />
                <div className="text-[11px] font-mono text-zinc-500 tracking-wider mt-2 text-center">
                  {filteredDiscoverable.length - cardIdx} PROFILES LEFT IN DECK
                </div>
            </div>
          )}
        </div>
      )}

      {/* MATCHES LIST VIEW */}
      {activeTab === 'matches' && (
        <div className="py-2" ref={animateParentRef}>
          {matches.length === 0 ? (
            <div className="card-premium rounded-2xl p-12 text-center max-w-md mx-auto">
              <span className="text-4xl mb-4 block">💫</span>
              <h3 className="font-display font-bold text-zinc-100 text-lg mb-2">No Matches Yet</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Keep swiping and expanding your bio and interests. Mutual likes automatically open conversations!
              </p>
              <button onClick={() => setActiveTab('browse')} className="btn-premium text-xs">
                Start Browsing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {matches.map(matchItem => {
                const disp = getMatchDisplay(matchItem)
                return (
                  <motion.div 
                    key={matchItem.id} 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card-premium p-5 flex flex-col justify-between items-center text-center gap-4 relative overflow-hidden"
                  >
                    {/* Visual indicators or presence checks */}
                    <div className="relative">
                      <GlobalAvatar
                        profile={{
                          avatar_url: disp.avatar_url,
                          full_name: disp.name,
                        }}
                        size="custom"
                        className="w-20 h-20 rounded-2xl font-display font-bold text-3xl border border-white/[0.08]"
                        status="online" // Showcase online simulation for active matches
                      />
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        MATCH
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display font-bold text-zinc-100 text-base">{disp.name}</h4>
                      <p className="text-xs font-mono text-zinc-500 mt-1">{disp.branch} · Year {disp.year}</p>
                    </div>

                    <button 
                      onClick={() => router.push(`/messages?userId=${disp.id}`)}
                      className="btn-primary text-xs w-full justify-center flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 border-0"
                    >
                      <MessageSquare size={13} />
                      Open Direct Message
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* PROFILE SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="card-premium p-6 space-y-6">
            <h3 className="font-display font-bold text-zinc-100 text-lg">Profile Details</h3>
            
            {/* Setup Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Edit Bio</label>
                <textarea 
                  className="input-pro w-full h-24 resize-none text-zinc-100 text-sm" 
                  value={form.bio} 
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                />
              </div>

              {/* Interests in settings */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Interests</label>
                <div className="flex flex-wrap gap-1.5">
                  {INTERESTS.map(interest => {
                    const selected = form.interests.includes(interest)
                    return (
                      <button 
                        key={interest} 
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                          selected
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : 'bg-zinc-800/40 text-zinc-400 border-white/[0.04]'
                        }`}
                      >
                        {interest}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Photo Input (Optional url list) */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Photos (URLs)</label>
                <div className="space-y-2">
                                    {form.photos.map((photoUrl: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        className="input-pro w-full text-xs"
                        value={photoUrl}
                        onChange={(e) => {
                          const updated = [...form.photos]
                          updated[idx] = e.target.value
                          setForm(p => ({ ...p, photos: updated }))
                        }}
                      />
                      <button
                        type="button"
                        className="p-2 border border-white/[0.05] bg-zinc-900 rounded-xl text-rose-500 hover:bg-rose-950/20"
                        onClick={() => {
                          setForm(p => ({ ...p, photos: p.photos.filter((_: unknown, i: number) => i !== idx) }))
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="btn-premium text-xs flex items-center gap-1.5"
                    onClick={() => setForm(p => ({ ...p, photos: [...(p.photos || []), ''] }))}
                  >
                    <Plus size={12} />
                    Add Photo Link
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Looking For</label>
                  <select 
                    className="input-pro w-full"
                    value={form.looking_for} 
                    onChange={e => setForm(p => ({ ...p, looking_for: e.target.value }))}
                  >
                    <option value="friendship">Friendship</option>
                    <option value="relationship">Relationship</option>
                    <option value="study_buddy">Study Buddy</option>
                    <option value="anything">Anything</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Show Profile To</label>
                  <select 
                    className="input-pro w-full"
                    value={form.show_to} 
                    onChange={e => setForm(p => ({ ...p, show_to: e.target.value }))}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="same_branch">Only CSE / Branch mates</option>
                    <option value="same_year">Only Year mates</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <button onClick={saveProfile} className="btn-premium px-6 bg-gradient-to-r from-rose-600 to-pink-500 border-0">
                  Save Profile Details
                </button>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 border-rose-500/10 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-display font-bold text-zinc-200">Remove Dating Access</h4>
              <p className="text-xs text-zinc-500 mt-1">This deletes your swipes, settings and matches permanently.</p>
            </div>
            <button 
              onClick={async () => {
                if (confirm("Are you absolutely sure you want to delete your dating profile? This cannot be undone.")) {
                  const { error } = await supabase.from('dating_profiles').delete().eq('user_id', userId)
                  if (!error) {
                    toast.success("Dating profile cleared.")
                    router.push('/dashboard')
                  } else {
                    toast.error("Failed to delete profile.")
                  }
                }
              }}
              className="px-4 py-2 border border-rose-500/20 text-rose-400 text-xs font-mono rounded-xl hover:bg-rose-950/20 transition-all flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete Profile
            </button>
          </div>
        </div>
      )}

      {/* PROFILE DETAIL OVERLAY / DRAWER MODAL */}
      <AnimatePresence>
        {selectedProfileDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="card-premium max-w-lg w-full overflow-hidden relative max-h-[90vh] flex flex-col border border-white/[0.08]"
            >
              <button 
                onClick={() => setSelectedProfileDetail(null)}
                className="absolute top-4 right-4 z-50 p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-zinc-300 hover:text-white transition-all"
              >
                <X size={16} />
              </button>

              <div className="overflow-y-auto flex-1">
                {/* Photo Header */}
                <div 
                  className="h-56 relative flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${AVATAR_COLORS[Math.abs(selectedProfileDetail.user_id.charCodeAt(0)) % 5]}25 0%, ${AVATAR_COLORS[(Math.abs(selectedProfileDetail.user_id.charCodeAt(0)) + 2) % 5]}25 100%)`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent" />
                  <GlobalAvatar 
                    profile={selectedProfileDetail.profiles} 
                    size="xl" 
                    className="ring-4 ring-white/10 shadow-2xl relative z-10" 
                  />
                </div>

                {/* Profile Details */}
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-2xl text-zinc-100">{selectedProfileDetail.profiles.full_name}</h3>
                      {selectedProfileDetail.profiles.verified && (
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-[10px]">✓</span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-zinc-400 mt-1 flex items-center gap-1.5">
                      <MapPin size={11} className="text-zinc-500" />
                      {selectedProfileDetail.profiles.branch} · Year {selectedProfileDetail.profiles.year}
                    </p>
                  </div>

                  {/* Compatibility Section */}
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.04] space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-zinc-400">Mutual Interest Alignment</span>
                      <span className="text-amber-400 font-bold">
                        {Math.min(
                          99,
                          Math.max(
                            45,
                            50 + (selectedProfileDetail.interests || []).filter((i: string) => (datingProfile?.interests || []).includes(i)).length * 12
                          )
                        )}% Compatibility
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full" 
                        style={{
                          width: `${Math.min(
                            99,
                            Math.max(
                              45,
                              50 + (selectedProfileDetail.interests || []).filter((i: string) => (datingProfile?.interests || []).includes(i)).length * 12
                            )
                          )}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Bio Description</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed font-sans bg-zinc-900/40 p-4 rounded-xl border border-white/[0.02]">
                      {selectedProfileDetail.bio || "This user hasn't created a bio card yet."}
                    </p>
                  </div>

                  {/* Interests */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Interests & Hobbies</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProfileDetail.interests || []).map((interest: string) => {
                        const isMutual = (datingProfile?.interests || []).includes(interest)
                        return (
                          <span 
                            key={interest} 
                            className={`px-3 py-1.5 rounded-full text-xs font-mono border ${
                              isMutual 
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 font-bold' 
                                : 'bg-zinc-800/40 text-zinc-400 border-white/[0.04]'
                            }`}
                          >
                            {interest} {isMutual && '⭐'}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
