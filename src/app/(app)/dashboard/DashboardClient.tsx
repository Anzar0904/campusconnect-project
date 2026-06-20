'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { createClient, checkRateLimit } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  branch: string | null
  year: number | null
  username: string | null
  is_verified: boolean
  bio?: string | null
}

interface Post {
  id: string
  content: string
  created_at: string
  likes_count: number
  comments_count: number
  is_anonymous: boolean
  post_type: string
  author: Profile | null
}

interface Event {
  id: string
  title: string
  start_time: string
  venue: string | null
  category: string
}

function Avatar({ profile, size = 'md' }: { profile: Profile | null; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
  const name = profile?.full_name || 'Anonymous'
  const url = profile?.avatar_url ||
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5&textColor=ffffff`
  const pixelSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40

  return (
    <div className={clsx(
      "relative rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0 shadow-sm",
      s
    )}>
      <Image 
        src={url} 
        alt={name} 
        width={pixelSize} 
        height={pixelSize} 
        className="object-cover w-full h-full"
      />
    </div>
  )
}

function PostCard({
  post,
  currentUserId,
  onLike,
  initialLiked = false,
}: {
  post: Post
  currentUserId: string
  onLike: (id: string) => void
  initialLiked?: boolean
}) {
  const [liked, setLiked] = useState(initialLiked)
  const author = post.author

  const handleLike = () => {
    setLiked(l => !l)
    onLike(post.id)
  }

  const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
    post: { label: 'Post', icon: 'chat_bubble', color: 'text-brand-400' },
    confession: { label: 'Confession', icon: 'lock', color: 'text-amber-400' },
    announcement: { label: 'Announce', icon: 'campaign', color: 'text-indigo-400' },
  }
  const config = typeConfig[post.post_type] || typeConfig.post

  return (
    <motion.article 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {post.is_anonymous ? (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-900 ring-1 ring-white/10 shrink-0">
              <span className="material-symbols-outlined text-zinc-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_off</span>
            </div>
          ) : (
            <Avatar profile={author} />
          )}
          <div className="min-w-0">
            <h4 className="font-display font-semibold text-zinc-100 text-sm tracking-tight truncate">
              {post.is_anonymous ? 'Anonymous Student' : (author?.full_name || 'IILM Student')}
            </h4>
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              {author?.branch && !post.is_anonymous && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="uppercase text-brand-400/80">{author.branch}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={clsx("chip-pro", config.color, "bg-white/[0.03] border-white/[0.05]")}>
          <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider">{config.label}</span>
        </div>
      </div>

      <p className="text-[14px] body-pro px-0.5 whitespace-pre-wrap">
        {post.content}
      </p>

      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
        <button
          onClick={handleLike}
          className={clsx(
            "group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300",
            liked ? "bg-red-500/10 text-red-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
          )}
        >
          <motion.span 
            animate={liked ? { scale: [1, 1.4, 1] } : {}}
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}
          >
            favorite
          </motion.span>
          <span className="font-mono">{post.likes_count + (liked ? 1 : 0)}</span>
        </button>

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-all duration-200">
          <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
          <span className="font-mono">{post.comments_count}</span>
        </button>

        <div className="ml-auto">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors">
            <span className="material-symbols-outlined text-[18px]">share</span>
          </button>
        </div>
      </div>
    </motion.article>
  )
}

function CreatePost({ profile, onPost }: { profile: Profile | null; onPost: (p: Post) => void }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<'post' | 'confession' | 'announcement'>('post')
  const [anon, setAnon] = useState(false)
  const [posting, setPosting] = useState(false)

  const submit = async () => {
    if (!content.trim() || posting) return
    setPosting(true)

    const allowed = await checkRateLimit(supabase, postType === 'confession' ? 'confession' : 'post', 5, '10 minutes')
    if (!allowed) {
      toast.error('Slow down! You are posting too frequently.')
      setPosting(false)
      return
    }

    if (postType === 'confession') {
      const { data, error } = await supabase.functions.invoke('post-confession', {
        body: { content: content.trim() },
      })
      if (error || data?.error) {
        toast.error(data?.error ?? 'Failed to post confession')
        setPosting(false)
        return
      }
      onPost({
        ...data.confession,
        post_type: 'confession',
        is_anonymous: true,
        author: null,
        comments_count: 0,
      } as any)
      setContent('')
      setOpen(false)
      setPosting(false)
      return
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: content.trim(),
        author_id: profile!.id,
        post_type: postType,
        is_anonymous: anon,
      })
      .select('*, author:profiles!posts_author_id_fkey(id,full_name,avatar_url,branch,year,username)')
      .single()
    if (data) {
      onPost(data as any)
      setContent('')
      setOpen(false)
    }
    setPosting(false)
  }

  const typeOptions = [
    { value: 'post', label: '📝 Post', desc: 'Share with campus' },
    { value: 'confession', label: '🔒 Confession', desc: 'Always anonymous' },
    { value: 'announcement', label: '📢 Announce', desc: 'Important update' },
  ] as const

  return (
    <div className="card-premium p-4 transition-all duration-300">
      {!open ? (
        <div className="flex items-center gap-3">
          <Avatar profile={profile} size="sm" />
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left px-4 py-2.5 rounded-xl text-sm text-zinc-500 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all"
          >
            What&apos;s on your mind, {profile?.full_name?.split(' ')[0] || 'there'}?
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <div className="flex gap-1.5 p-1 rounded-xl bg-black/20 w-fit">
            {typeOptions.map(t => (
              <button
                key={t.value}
                onClick={() => { setPostType(t.value); if (t.value === 'confession') setAnon(true) }}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all",
                  postType === t.value ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-start gap-3">
            <Avatar profile={anon ? null : profile} size="sm" />
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                postType === 'confession' ? 'Share your confession anonymously…' :
                postType === 'announcement' ? 'Make an important announcement…' :
                "What's happening at IILM?"
              }
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 resize-none outline-none py-1.5 min-h-[100px]"
            />
          </div>

          {postType === 'confession' && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0">security</span>
              <p className="text-[11px] text-amber-200/70 leading-relaxed">
                Confessions are anonymous to other students. Your identity is only stored for administrative safety audits.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
            <div className="flex items-center gap-4">
              {postType !== 'confession' && (
                <button 
                  onClick={() => setAnon(!anon)}
                  className={clsx(
                    "flex items-center gap-2 text-[11px] font-mono transition-colors",
                    anon ? "text-brand-400" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {anon ? 'visibility_off' : 'visibility'}
                  </span>
                  Anonymous
                </button>
              )}
              <span className={clsx(
                "text-[10px] font-mono",
                content.length > 500 ? "text-red-400" : "text-zinc-600"
              )}>
                {content.length}/500
              </span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => { setOpen(false); setContent('') }} 
                className="btn-ghost-pro py-1.5 px-4"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!content.trim() || posting || content.length > 500}
                className="btn-premium py-1.5 px-6"
              >
                {posting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function DashboardClient({
  profile,
  posts: initialPosts,
  events,
  currentUserId,
  initialLikedIds = [],
}: {
  profile: Profile | null
  posts: Post[]
  events: Event[]
  currentUserId: string
  initialLikedIds?: string[]
}) {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const handleNewPost = (post: Post) => setPosts(p => [post, ...p])

  const handleLike = async (postId: string) => {
    const { data } = await supabase.rpc('toggle_post_like', {
      p_post_id: postId,
      p_user_id: currentUserId,
    })
    if (data) {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes_count: (data as any).likes_count } : p
      ))
    }
  }

  const formatEventDate = (ts: string) => {
    const d = new Date(ts)
    return { month: d.toLocaleString('default', { month: 'short' }).toUpperCase(), day: d.getDate() }
  }

  const isProfileIncomplete = !profile?.username || !profile?.bio || !profile?.branch

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      {/* Onboarding Banner */}
      <AnimatePresence>
        {isProfileIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card-premium p-6 border-brand-500/20 bg-brand-500/[0.03] relative overflow-hidden group shadow-2xl shadow-brand-500/5 mb-8"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 text-brand-400 shadow-lg">
                  <span className="material-symbols-outlined text-[32px]">face</span>
                </div>
                <div className="space-y-1">
                  <h3 className="display-heading text-xl tracking-tight">Complete your Campus ID</h3>
                  <p className="body-pro text-sm max-w-lg">
                    Welcome to CampusConnect! Add a username, bio, and branch to your profile so your classmates can find you.
                  </p>
                </div>
              </div>
              <Link href="/profile" className="btn-premium px-8 py-3 whitespace-nowrap shadow-xl shadow-brand-500/20">
                Finish Setup
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="section-label">Campus Overview</p>
          <h1 className="display-heading text-4xl">
            {greeting}, {firstName}
          </h1>
          <p className="body-pro text-sm">
            Updates and events from across the campus today.
          </p>
        </div>
        <div className="chip-pro bg-brand-500/10 border-brand-500/20 text-brand-400 px-4 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
          IILM University · Greater Noida
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-6">
          <CreatePost profile={profile} onPost={handleNewPost} />

          <div className="space-y-6">
            {posts.length === 0 ? (
              <EmptyState 
                icon="feed"
                title="The feed is silent"
                description="Be the first to share something with your classmates or join a community to see what's happening."
                action={{
                  label: "Explore Communities",
                  href: "/community"
                }}
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {posts.map(p => (
                  <PostCard 
                    key={p.id} 
                    post={p} 
                    currentUserId={currentUserId} 
                    onLike={handleLike} 
                    initialLiked={initialLikedIds.includes(p.id)} 
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <aside className="md:col-span-4 space-y-6">
          <div className="card-premium p-1.5">
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Notes', icon: 'menu_book', href: '/notes' },
                { label: 'Market', icon: 'storefront', href: '/marketplace' },
                { label: 'Intern', icon: 'work_outline', href: '/internships' },
                { label: 'Chat', icon: 'chat', href: '/messages' },
              ].map(q => (
                <Link key={q.label} href={q.href}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:bg-white/[0.05] group">
                  <span className="material-symbols-outlined text-[20px] text-zinc-500 group-hover:text-brand-400 transition-colors">{q.icon}</span>
                  <span className="text-[10px] font-mono font-medium text-zinc-600 uppercase tracking-tighter">{q.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {!profile?.is_verified && (
            <div className="card-premium p-5 border-amber-500/20 bg-amber-500/[0.02] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
                    <span className="material-symbols-outlined text-[22px]">verified_user</span>
                  </div>
                  <p className="sub-heading text-sm text-amber-200/90">Identity Verification</p>
                </div>
                <p className="body-pro text-xs leading-relaxed">
                  Verify your student ID to unlock Marketplace uploads and Dating features.
                </p>
                <Link href="/profile" className="btn-premium w-full !bg-amber-600 !shadow-none hover:!bg-amber-500 text-xs py-2 shadow-lg">
                  Complete Verification
                </Link>
              </div>
            </div>
          )}

          <div className="card-premium p-5 space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="section-label">Upcoming Events</p>
              <Link href="/events" className="text-[10px] font-mono text-brand-400 hover:text-brand-300 uppercase tracking-widest transition-colors font-bold">View All</Link>
            </div>
            
            {events.length === 0 ? (
              <div className="py-8 text-center bg-zinc-900/20 rounded-xl border border-white/[0.02]">
                <p className="body-pro text-xs italic opacity-40">No events scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map(e => {
                  const { month, day } = formatEventDate(e.start_time)
                  return (
                    <div key={e.id} className="flex gap-4 group cursor-pointer p-2 -m-2 rounded-xl hover:bg-white/[0.03] transition-all">
                      <div className="w-11 h-11 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col items-center justify-center shrink-0 group-hover:border-brand-500/30 transition-all shadow-sm">
                        <span className="text-brand-400 font-mono text-[9px] font-bold tracking-tighter uppercase">{month}</span>
                        <span className="text-zinc-100 font-display font-bold text-base leading-none">{day}</span>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors tracking-tight">{e.title}</p>
                        <p className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5 uppercase tracking-tighter">
                          <span className="material-symbols-outlined text-[12px] text-zinc-600">location_on</span>
                          {e.venue || 'Campus'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card-premium p-5 space-y-5 shadow-lg">
            <p className="section-label">Campus Connections</p>
            <div className="space-y-4">
              {['Anika Mehra', 'Rohan Gupta', 'Sakshi Jain'].map((name, i) => (
                <div key={name} className="flex items-center justify-between group p-1 -m-1 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <Avatar profile={{ 
                      id: i.toString(),
                      full_name: name,
                      avatar_url: null,
                      branch: ['BBA', 'MBA', 'BCA'][i],
                      year: [2, 1, 3][i],
                      username: name.toLowerCase().replace(' ', ''),
                      is_verified: true
                    }} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors tracking-tight">{name}</p>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">{['BBA · Y2', 'MBA · Y1', 'BCA · Y3'][i]}</p>
                    </div>
                  </div>
                  <Link href="/discover" className="btn-ghost-pro !p-1.5 hover:!bg-brand-500/10 hover:!text-brand-400 hover:!border-brand-500/20 shadow-sm active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
