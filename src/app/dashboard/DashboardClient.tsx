'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect, useMemo } from 'react'
import { createClient, checkRateLimit } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { Navbar } from '@/components/layout/Navbar'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { ModuleSection } from '@/components/home/ModuleSection'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Eye, 
  EyeOff, 
  Shield, 
  User, 
  UserPlus, 
  Plus, 
  Sparkles, 
  MessageCircle, 
  Calendar as CalendarIcon, 
  Briefcase, 
  BookOpen, 
  Store, 
  Users, 
  MapPin, 
  ShieldCheck, 
  Trash2,
  Clock,
  Check, 
  Lock, 
  Megaphone,
  UserX,
  Flag,
  ArrowRight,
  TrendingUp
} from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  branch: string | null
  year: number | null
  username: string | null
  is_verified: boolean
  bio?: string | null
  college_id?: string | null
  role?: string | null
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

function PostCard({
  post,
  currentUserId,
  onLike,
  liked = false,
  currentUserProfile,
  onCommentAdded,
  supabase,
  onDelete,
}: {
  post: Post
  currentUserId: string
  onLike: (id: string) => void
  liked?: boolean
  currentUserProfile: Profile | null
  onCommentAdded: (postId: string) => void
  supabase: any
  onDelete: (id: string) => void
}) {
  const author = post.author
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [commentsParentRef] = useAutoAnimate()

  const executeDelete = async () => {
    setDeleting(true)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id)
    
    if (error) {
      toast.error('Failed to delete post: ' + error.message)
      setDeleting(false)
    } else {
      toast.success('Post deleted successfully')
      onDelete(post.id)
    }
  }

  const handleReport = async () => {
    const reasonInput = prompt(
      'Why are you reporting this post?\nEnter one of the following reasons exactly:\n- spam\n- harassment\n- misinformation\n- inappropriate_content\n- fake_account\n- scam\n- other'
    )
    if (!reasonInput) return
    const cleanReason = reasonInput.trim().toLowerCase().replace(' ', '_')
    const validReasons = ['spam', 'harassment', 'misinformation', 'inappropriate_content', 'fake_account', 'scam', 'other']
    if (!validReasons.includes(cleanReason)) {
      toast.error('Invalid reason. Please select from the list.')
      return
    }
    const details = prompt('Please provide additional details for the report (optional):')
    
    setReporting(true)
    const { error } = await supabase
      .from('abuse_reports')
      .insert({
        reporter_id: currentUserId,
        target_type: 'post',
        target_id: post.id,
        reason: cleanReason,
        details: details || null,
        status: 'pending',
        college_id: currentUserProfile?.college_id || null
      })
    
    if (error) {
      toast.error('Failed to submit report: ' + error.message)
    } else {
      toast.success('Thank you. The content has been reported to administrators.')
    }
    setReporting(false)
  }

  const fetchComments = async () => {
    setLoadingComments(true)
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, created_at, author_id, author:profiles(id, full_name, avatar_url, username)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } else {
      setComments(data || [])
    }
    setLoadingComments(false)
  }

  const handleCommentsToggle = () => {
    const nextShow = !showComments
    setShowComments(nextShow)
    if (nextShow) {
      fetchComments()
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return
    setSubmitting(true)

    const allowed = await checkRateLimit(supabase, 'post', 15, '1 minute')
    if (!allowed) {
      toast.error('Slow down! You are commenting too frequently.')
      setSubmitting(false)
      return
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        author_id: currentUserId,
        content: newComment.trim(),
      })
      .select('id, content, created_at, author_id, author:profiles(id, full_name, avatar_url, username)')
      .single()

    if (error) {
      console.error('Error submitting comment:', error)
      toast.error('Failed to submit comment')
    } else if (data) {
      setComments(prev => [...prev, data])
      setNewComment('')
      onCommentAdded(post.id)
      toast.success('Comment posted!')
    }
    setSubmitting(false)
  }

  const handleLike = () => {
    onLike(post.id)
  }

  const typeConfig: Record<string, { label: string; icon: React.ComponentType<any>; color: string; border: string; bg: string }> = {
    post: { label: 'Post', icon: MessageSquare, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
    confession: { label: 'Confession', icon: Lock, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
    announcement: { label: 'Announce', icon: Megaphone, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
  }
  const config = typeConfig[post.post_type] || typeConfig.post
  const TypeIcon = config.icon

  const isOwner = post.author?.id === currentUserId
  const isSuperAdmin = currentUserProfile?.role === 'SUPER_ADMIN'
  const isCollegeAdmin = currentUserProfile?.role === 'COLLEGE_ADMIN' && author?.college_id === currentUserProfile?.college_id
  const canDelete = isOwner || isSuperAdmin || isCollegeAdmin

  return (
    <motion.article 
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="bg-[#15181D] border border-white/[0.06] rounded-2xl p-5 space-y-4 shadow-sm hover:border-white/[0.12] transition-colors duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {post.is_anonymous ? (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-900 border border-white/[0.04] shrink-0 select-none">
              <UserX size={18} className="text-zinc-500" />
            </div>
          ) : (
            <GlobalAvatar profile={author} className="border border-white/5" />
          )}
          <div className="min-w-0">
            <h4 className="font-display font-bold text-zinc-100 text-sm tracking-tight truncate leading-tight">
              {post.is_anonymous ? 'Anonymous Student' : (author?.full_name || 'IILM Student')}
            </h4>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              {author?.branch && !post.is_anonymous && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="uppercase text-brand-400 font-bold">{author.branch}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn("chip flex items-center gap-1.5 border py-0.5 px-2", config.color, config.border, config.bg)}>
            <TypeIcon size={11} />
            <span className="font-mono text-[9px] uppercase tracking-wider font-bold">{config.label}</span>
          </div>
          {canDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Post"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[13px] text-zinc-300 leading-relaxed px-0.5 whitespace-pre-wrap font-sans font-medium">
        {post.content}
      </p>

      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
        <motion.button
          onClick={handleLike}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all duration-300 select-none",
            liked ? "bg-red-500/10 text-red-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
          )}
        >
          <motion.div animate={liked ? { scale: [1, 1.35, 1] } : {}}>
            <Heart size={15} fill={liked ? "currentColor" : "none"} className={liked ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"} />
          </motion.div>
          <span className="font-mono text-[11px] font-bold">{post.likes_count}</span>
        </motion.button>

        <button 
          onClick={handleCommentsToggle}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all duration-200 select-none",
            showComments ? "bg-brand-500/10 text-brand-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
          )}
        >
          <MessageSquare size={15} className={showComments ? "text-brand-400" : "text-zinc-500 group-hover:text-zinc-300"} />
          <span className="font-mono text-[11px] font-bold">{post.comments_count}</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button 
            onClick={handleReport}
            disabled={reporting}
            title="Report Post"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
          >
            <Flag size={13} />
          </button>
          <button 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
            aria-label="Share post"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/[0.05] space-y-4">
              {/* Comments list */}
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <span className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[11px] text-zinc-500 text-center py-4 font-mono select-none">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                <div ref={commentsParentRef} className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <div className="shrink-0 mt-0.5">
                        <GlobalAvatar profile={comment.author} size="sm" className="border border-white/5" />
                      </div>
                      <div className="flex-1 bg-white/[0.01] border border-white/[0.04] rounded-xl p-2.5 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-200 text-[11px]">
                            {comment.author?.full_name || 'IILM Student'}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-zinc-300 font-medium text-[11px] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment form */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-white/[0.04]">
                <div className="shrink-0">
                  <GlobalAvatar profile={currentUserProfile} size="sm" className="border border-white/5" />
                </div>
                <form onSubmit={handleCommentSubmit} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="flex-1 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.03] focus:bg-white/[0.03] focus:border-brand-500/40 transition-all rounded-xl px-3 h-9 text-xs outline-none text-zinc-200 placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="btn-premium py-1 px-4 h-9 text-xs rounded-xl shrink-0 font-display font-semibold"
                  >
                    {submitting ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Reply'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B0D10]/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowConfirmDelete(false)} />
          <div className="max-w-sm w-full relative z-10 p-6 space-y-4 bg-[#15181D] border border-white/[0.08] rounded-2xl shadow-premium animate-fade-in">
            <h3 className="font-display font-bold text-white text-base">Delete Post</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-medium">
              Are you sure you want to permanently delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-neutral-300 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.article>
  )
}

function CreatePost({ profile, onPost, supabase }: { profile: Profile | null; onPost: (p: Post) => void; supabase: any }) {
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

    const { data, error } = await (supabase as any)
      .from('posts')
      .insert([
        {
          content: content.trim(),
          author_id: profile!.id,
          post_type: postType,
          is_anonymous: anon,
        }
      ])
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
    { value: 'post', label: '📝 Post' },
    { value: 'confession', label: '🔒 Confession' },
    { value: 'announcement', label: '📢 Announcement' },
  ] as const

  return (
    <div className="bg-[#15181D] border border-white/[0.06] rounded-2xl p-5 shadow-sm space-y-4">
      {!open ? (
        <div className="flex items-center gap-3">
          <GlobalAvatar profile={profile} size="sm" className="border border-white/5 shrink-0" />
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left px-4 h-11 rounded-xl text-xs sm:text-xs text-zinc-500 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all font-semibold select-none"
          >
            What&apos;s on your mind, {profile?.full_name?.split(' ')[0] || 'there'}?
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 overflow-hidden"
        >
          <div className="flex gap-1.5 p-1 rounded-xl bg-zinc-950/40 w-fit select-none">
            {typeOptions.map(t => (
              <button
                key={t.value}
                onClick={() => { setPostType(t.value); if (t.value === 'confession') setAnon(true) }}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[10px] font-bold font-display uppercase tracking-wider transition-all",
                  postType === t.value ? "bg-white/[0.06] text-brand-400 border border-white/[0.04]" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-start gap-3">
            <GlobalAvatar profile={anon ? null : profile} size="sm" className="border border-white/5 shrink-0 mt-1" />
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                postType === 'confession' ? 'Share your confession anonymously…' :
                postType === 'announcement' ? 'Make an important announcement…' :
                "What's happening at IILM?"
              }
              className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 resize-none outline-none py-1.5 min-h-[100px] leading-relaxed font-sans font-medium"
            />
          </div>

          {postType === 'confession' && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/[0.02] border border-amber-500/10">
              <Shield size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200/60 leading-relaxed font-semibold">
                Confessions are anonymous to other students. Your identity is only stored for administrative safety audits.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-4">
              {postType !== 'confession' && (
                <button 
                  onClick={() => setAnon(!anon)}
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] font-mono font-bold transition-colors select-none",
                    anon ? "text-brand-400" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {anon ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span>Anonymous</span>
                </button>
              )}
              <span className={cn(
                "text-[9px] font-mono font-bold select-none",
                content.length > 500 ? "text-red-400" : "text-zinc-600"
              )}>
                {content.length}/500
              </span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => { setOpen(false); setContent('') }} 
                className="px-4 py-1.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-zinc-400 transition-all select-none active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!content.trim() || posting || content.length > 500}
                className="btn-premium px-5 py-1.5 text-xs select-none shadow-none"
              >
                {posting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Publish'
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
  profile: initialProfile,
  posts: initialPosts,
  events: initialEvents,
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
  const router = useRouter()
  const { profile: currentProfile } = useCurrentProfile()
  const profile = (currentProfile || initialProfile) as any

  const [parentPosts] = useAutoAnimate()
  const [parentEvents] = useAutoAnimate()
  const [parentFriends] = useAutoAnimate()

  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [likedPostIds, setLikedPostIds] = useState<string[]>(initialLikedIds)
  const [connections, setConnections] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [friendships, setFriendships] = useState<any[]>([])
  const [sendingId, setSendingId] = useState<string | null>(null)
  
  // Real database-driven widgets data
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [internships, setInternships] = useState<any[]>([])
  const [communities, setCommunities] = useState<any[]>([])
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([])

  const getRelation = (peerId: string) => {
    const f = friendships.find(
      (x: any) => 
        (x.requester_id === peerId && x.addressee_id === currentUserId) ||
        (x.requester_id === currentUserId && x.addressee_id === peerId)
    )
    if (!f) return 'none'
    if (f.status === 'accepted') return 'friends'
    if (f.requester_id === currentUserId) return 'sent'
    return 'received'
  }

  const handleAddFriend = async (e: React.MouseEvent, peerId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (sendingId) return

    setSendingId(peerId)

    try {
      const allowed = await checkRateLimit(supabase, 'friend_request', 10, '1 hour')
      if (!allowed) {
        toast.error('You have sent too many requests. Try again later.')
        setSendingId(null)
        return
      }

      const { data: existing } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

      const alreadyExists = (existing || []).some(
        (f: any) =>
          (f.requester_id === currentUserId && f.addressee_id === peerId) ||
          (f.requester_id === peerId && f.addressee_id === currentUserId)
      )

      if (alreadyExists) {
        toast.error('A friendship request already exists.')
        setSendingId(null)
        return
      }

      const { error } = await supabase
        .from('friendships')
        .insert([
          {
            requester_id: currentUserId,
            addressee_id: peerId,
            status: 'pending',
          }
        ])

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Friend request sent successfully!')
        setFriendships(prev => [
          ...prev, 
          { requester_id: currentUserId, addressee_id: peerId, status: 'pending' }
        ])
      }
    } catch (err: any) {
      toast.error('Failed to send request.')
    } finally {
      setSendingId(null)
    }
  }

  useEffect(() => {
    async function getCampusData() {
      try {
        // Fetch suggested peers from same college
        let queryBuilder = supabase
          .from('profiles')
          .select('id, full_name, avatar_url, branch, year, username, is_verified')
          .neq('id', currentUserId)

        if (profile?.college_id) {
          queryBuilder = queryBuilder.eq('college_id', profile.college_id)
        }

        const { data: suggestions } = await queryBuilder.limit(3)
        if (suggestions) setConnections(suggestions)

        // Fetch all friendships for connection status tracking
        const { data: allRelations } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id, status')
          .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

        if (allRelations) {
          setFriendships(allRelations)
        }

        // Fetch accepted friends
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id, requester:profiles!friendships_requester_id_fkey(id, full_name, avatar_url, branch, year, username, is_verified), addressee:profiles!friendships_addressee_id_fkey(id, full_name, avatar_url, branch, year, username, is_verified)')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
          .limit(3)

        if (friendshipData) {
          const activeFriends = friendshipData
            .map((f: any) => f.requester_id === currentUserId ? f.addressee : f.requester)
            .filter(Boolean)
          setFriends(activeFriends)
        }

        // Fetch real internships matches database-driven
        const { data: dbInterns } = await supabase
          .from('internships')
          .select('id, title, company, type')
          .limit(3)
        if (dbInterns) setInternships(dbInterns)

        // Fetch top communities database-driven
        const { data: dbComms } = await supabase
          .from('communities')
          .select('id, name, member_count')
          .order('member_count', { ascending: false })
          .limit(3)
        if (dbComms) setCommunities(dbComms)

        // Fetch marketplace listings database-driven
        const { data: dbMarket } = await supabase
          .from('marketplace_items')
          .select('id, title, price, image_url')
          .eq('status', 'available')
          .order('created_at', { ascending: false })
          .limit(2)
        if (dbMarket) setMarketplaceItems(dbMarket)

      } catch (e) {
        console.error('Error fetching campus data:', e)
      }
    }
    getCampusData()
  }, [currentUserId, profile?.college_id, supabase])

  const handleNewPost = (post: Post) => setPosts(p => [post, ...p])

  const handleLike = async (postId: string) => {
    const isLiked = likedPostIds.includes(postId)
    setLikedPostIds(prev =>
      isLiked ? prev.filter(id => id !== postId) : [...prev, postId]
    )
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) } : p
    ))

    const { data, error } = await supabase.rpc('toggle_post_like', {
      p_post_id: postId,
      p_user_id: currentUserId,
    })

    if (error || !data) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
      // Revert state
      setLikedPostIds(prev =>
        isLiked ? [...prev, postId] : prev.filter(id => id !== postId)
      )
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes_count: p.likes_count + (isLiked ? 1 : -1) } : p
      ))
    } else {
      // Sync with exact server count
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes_count: (data as any).likes_count } : p
      ))
    }
  }

  const handleCommentAdded = (postId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
    ))
  }

  const formatEventDate = (ts: string) => {
    try {
      const d = new Date(ts)
      return { month: d.toLocaleString('default', { month: 'short' }).toUpperCase(), day: d.getDate() }
    } catch {
      return { month: 'MAY', day: 16 }
    }
  }

  const isProfileIncomplete = !profile?.username || !profile?.bio || !profile?.branch

  return (
    <div className="min-h-screen bg-[#0B0D10] text-zinc-50 flex flex-col font-sans antialiased selection:bg-brand-500/35 selection:text-white overflow-x-hidden pt-12">
      <Navbar profile={profile} />

      <main className="flex-1 flex flex-col w-full z-10 pt-4">
        
        {/* Onboarding Banner */}
        {isProfileIncomplete && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 mb-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-brand-500/[0.02] border border-brand-500/25 p-6 rounded-2xl relative overflow-hidden group shadow-sm"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 text-brand-400 shadow-sm">
                      <User size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold font-display tracking-tight text-white">Complete your Campus ID</h3>
                      <p className="text-zinc-400 text-xs font-semibold leading-relaxed max-w-lg">
                        Welcome to CampusConnect! Add a username, bio, and branch to your profile so your classmates can find you.
                      </p>
                    </div>
                  </div>
                  <Link href="/profile" className="btn-premium px-5 py-2 text-xs font-bold shadow-none">
                    Finish Setup
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Dashboard Pill Shortcuts */}
        <div className="my-2 select-none">
          <ModuleSection userRole={profile?.role} />
        </div>

        {/* Primary Functional Dashboard Node Grid */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left/Main Column: Feed */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Create Post composer */}
            <CreatePost profile={profile} onPost={handleNewPost} supabase={supabase} />
            
            {/* Feed Sort Tabs */}
            <div className="flex items-center gap-6 border-b border-white/[0.04] text-[11px] font-bold font-display uppercase tracking-widest pb-3 select-none">
              <button className="text-brand-400 border-b border-brand-400 pb-3 px-1 transition-all">For You</button>
              <button className="text-zinc-500 hover:text-zinc-300 pb-3 px-1 transition-colors">Following</button>
              <button className="text-zinc-500 hover:text-zinc-300 pb-3 px-1 transition-colors flex items-center gap-1">
                <TrendingUp size={11} />
                <span>Trending</span>
              </button>
            </div>

            {/* Feed Cards Section */}
            <div ref={parentPosts} className="space-y-4">
              {posts.length === 0 ? (
                <EmptyState 
                  title="The feed is silent"
                  description="Be the first to share something with your classmates or join a community to see what's happening."
                  action={{
                    label: "Explore Communities",
                    href: "/community"
                  }}
                  className="bg-[#15181D] border-white/[0.04]"
                />
              ) : (
                <AnimatePresence mode="popLayout">
                  {posts.map(p => (
                    <PostCard 
                      key={p.id} 
                      post={p} 
                      currentUserId={currentUserId} 
                      onLike={handleLike} 
                      liked={likedPostIds.includes(p.id)}
                      currentUserProfile={profile}
                      onCommentAdded={handleCommentAdded}
                      supabase={supabase}
                      onDelete={(id) => setPosts(prev => prev.filter(post => post.id !== id))}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Right Column: Widgets */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Identity Verification banner */}
            {profile && !profile.is_verified && (
              <div className="bg-amber-500/[0.02] border border-amber-500/20 rounded-2xl p-4.5 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-all pointer-events-none" />
                <div className="relative z-10 space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                      <ShieldCheck size={16} />
                    </div>
                    <p className="text-xs font-bold text-amber-200/90 tracking-tight">Identity Verification</p>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-semibold">
                    Verify your student ID to unlock Marketplace uploads and Dating features.
                  </p>
                  <Link href="/profile" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold w-full block text-center transition-all select-none active:scale-95">
                    Complete Verification
                  </Link>
                </div>
              </div>
            )}

            {/* AI Assistant context helper */}
            <div className="bg-purple-500/[0.02] border border-purple-500/25 rounded-2xl p-4.5 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-all pointer-events-none" />
              <div className="relative z-10 space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
                    <Sparkles size={15} className="animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-purple-200/90 tracking-tight">AI Campus Helper</p>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed font-semibold">
                  Ask the AI assistant to help you draft your class timetable or write clean study session summaries.
                </p>
                <Link href="/ai" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold w-full block text-center transition-all select-none active:scale-95">
                  Open AI Workspace
                </Link>
              </div>
            </div>

            {/* Upcoming Events Calendar Widget */}
            <div className="bg-[#15181D] border border-white/[0.06] rounded-2xl p-4.5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-tight">Upcoming Events</span>
                <Link href="/events" className="text-[10px] font-bold text-brand-400 hover:text-brand-300 transition-colors">View all</Link>
              </div>

              {events.length === 0 ? (
                <div className="py-6 text-center bg-zinc-950/20 rounded-xl border border-white/[0.02] select-none">
                  <p className="text-zinc-500 text-[11px] font-bold italic">No events scheduled</p>
                </div>
              ) : (
                <div ref={parentEvents} className="space-y-3">
                  {events.map(e => {
                    const { month, day } = formatEventDate(e.start_time)
                    return (
                      <div key={e.id} className="flex gap-3 items-center border-b border-white/[0.04] last:border-0 pb-3 last:pb-0 group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center justify-center shrink-0 group-hover:border-brand-500/30 transition-all">
                          <span className="text-brand-400 font-mono text-[8px] font-bold uppercase leading-none">{month}</span>
                          <span className="text-zinc-100 font-display font-bold text-sm leading-none mt-0.5">{day}</span>
                        </div>
                        <div className="min-w-0 space-y-0.5 flex-1">
                          <p className="text-xs font-bold text-white truncate group-hover:text-brand-400 transition-colors tracking-tight leading-tight">{e.title}</p>
                          <p className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                            <MapPin size={9} className="text-zinc-600" />
                            <span className="truncate">{e.venue || 'Campus'}</span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Internship Matches Widget */}
            <div className="bg-[#15181D] border border-white/[0.06] rounded-2xl p-4.5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-tight">Internship Matches</span>
                <Link href="/internships" className="text-[10px] font-bold text-brand-400 hover:text-brand-300 transition-colors">View all</Link>
              </div>

              <div className="space-y-2.5">
                {internships.length > 0 ? (
                  internships.map((job) => (
                    <Link href="/internships" key={job.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-brand-500/20 hover:bg-white/[0.02] transition-all cursor-pointer group">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors tracking-tight truncate">{job.title}</p>
                        <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">{job.company}</p>
                      </div>
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-md border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shrink-0 select-none">
                        Live
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-[11px] text-zinc-500 font-bold italic text-center py-4">No active internships.</p>
                )}
              </div>
            </div>

            {/* Communities Widget */}
            <div className="bg-[#15181D] border border-white/[0.06] rounded-2xl p-4.5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-tight">Campus Communities</span>
                <Link href="/community" className="text-[10px] font-bold text-brand-400 hover:text-brand-300 transition-colors">View all</Link>
              </div>

              <div className="space-y-3">
                {communities.length > 0 ? (
                  communities.map((comm, idx) => {
                    const initial = comm.name.slice(0, 2).toUpperCase()
                    const gradients = [
                      'from-blue-600 to-indigo-600',
                      'from-emerald-600 to-teal-600',
                      'from-cyan-600 to-blue-600'
                    ]
                    const grad = gradients[idx % gradients.length]
                    
                    return (
                      <div key={comm.id} className="flex items-center justify-between group p-0.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br text-white text-[9px] font-black flex items-center justify-center shadow-sm shrink-0", grad)}>
                            {initial}
                          </div>
                          <div className="min-w-0 text-left">
                            <Link href={`/community/${comm.id}`} className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors cursor-pointer tracking-tight block truncate">{comm.name}</Link>
                            <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">{comm.member_count} nodes</p>
                          </div>
                        </div>
                        <Link href={`/community/${comm.id}`} className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] rounded-lg transition-all tracking-wide shrink-0 active:scale-95">
                          Join
                        </Link>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-[11px] text-zinc-500 font-bold italic text-center py-4">No communities yet.</p>
                )}
              </div>
            </div>

            {/* Marketplace Featured Widget */}
            <div className="bg-[#15181D] border border-white/[0.06] rounded-2xl p-4.5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-tight">Marketplace Deals</span>
                <Link href="/marketplace" className="text-[10px] font-bold text-brand-400 hover:text-brand-300 transition-colors">View all</Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {marketplaceItems.length > 0 ? (
                  marketplaceItems.map((item) => (
                    <Link href="/marketplace" key={item.id} className="flex flex-col rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-brand-500/20 hover:bg-white/[0.02] p-2 transition-all group">
                      <div className="aspect-video w-full rounded-lg bg-zinc-950/60 border border-white/[0.02] relative overflow-hidden shrink-0">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.title} fill className="object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600 font-mono">NO IMAGE</div>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-zinc-200 truncate mt-2 group-hover:text-brand-400 transition-colors leading-tight pr-1">{item.title}</p>
                      <p className="text-[10px] font-bold font-mono text-emerald-400 mt-1">₹{item.price}</p>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 py-4 text-center">
                    <p className="text-[11px] text-zinc-500 font-bold italic">No deals listed.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Campus Connections & Suggestions */}
            <div className="bg-[#15181D] border border-white/[0.06] rounded-2xl p-4.5 space-y-5 shadow-sm">
              {/* Connections list */}
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-3 select-none">Classmate Connections ({friends.length})</span>
                <div ref={parentFriends} className="space-y-3">
                  {friends.length > 0 ? (
                    friends.map((f) => (
                      <div key={f.id} className="flex items-center justify-between group p-0.5">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                          <GlobalAvatar profile={f} size="sm" className="border border-white/5 shrink-0" />
                          <div className="min-w-0 text-left">
                            <Link href={`/profile?id=${f.id}`} className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors cursor-pointer tracking-tight block truncate">
                              {f.full_name}
                            </Link>
                            <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">
                              {f.branch ? `${f.branch}` : ''} {f.year ? `· Y${f.year}` : ''}
                            </p>
                          </div>
                        </div>
                        <Link href={`/profile?id=${f.id}`} className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all active:scale-95 shrink-0 flex items-center justify-center">
                          <User size={12} className="text-neutral-400" />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-zinc-500 font-bold italic select-none">No active classmate connections.</p>
                  )}
                </div>
              </div>

              {/* Separator line */}
              <div className="h-px bg-white/[0.04]" />

              {/* Suggested Connections */}
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-3 select-none">Suggested Peers</span>
                <div className="space-y-3">
                  {connections.length > 0 ? (
                    connections.map((c) => {
                      const relation = getRelation(c.id)
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => router.push(`/profile?id=${c.id}`)}
                          className="flex items-center justify-between group p-0.5 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                            <GlobalAvatar profile={c} size="sm" className="border border-white/5 shrink-0" />
                            <div className="min-w-0 text-left">
                              <p className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors tracking-tight block truncate">
                                {c.full_name}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">
                                {c.branch ? `${c.branch}` : ''} {c.year ? `· Y${c.year}` : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="shrink-0 flex items-center"
                          >
                            {relation === 'none' && (
                              <button
                                onClick={(e) => handleAddFriend(e, c.id)}
                                disabled={sendingId === c.id}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 gap-1 text-[10px] font-bold whitespace-nowrap"
                                title="Add Friend"
                              >
                                {sendingId === c.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-brand-400/20 border-t-brand-400 rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <UserPlus size={10} className="text-brand-400" />
                                    <span>Connect</span>
                                  </>
                                )}
                              </button>
                            )}

                            {relation === 'sent' && (
                              <button
                                disabled
                                className="px-2.5 py-1 bg-white/5 border border-white/5 text-zinc-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-1 text-[10px] font-bold whitespace-nowrap"
                                title="Request Sent"
                              >
                                <Clock size={10} className="text-zinc-600" />
                                <span>Sent</span>
                              </button>
                            )}

                            {relation === 'friends' && (
                              <button
                                disabled
                                className="px-2.5 py-1 bg-white/5 border border-white/5 text-emerald-400 rounded-lg cursor-not-allowed flex items-center justify-center gap-1 text-[10px] font-bold whitespace-nowrap"
                                title="Connected"
                              >
                                <Check size={10} className="text-emerald-500" />
                                <span>Friends</span>
                              </button>
                            )}

                            {relation === 'received' && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  router.push('/friends')
                                }}
                                className="px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-lg transition-all active:scale-95 flex items-center justify-center text-[10px] font-bold whitespace-nowrap"
                                title="Accept Request"
                              >
                                Accept
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-[10px] text-zinc-500 font-bold italic select-none">No recommendations available.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.04] bg-[#0B0D10] z-10 py-8 px-6 sm:px-12 lg:px-20 mt-12 text-center text-[9px] uppercase font-bold tracking-widest text-zinc-600 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span>CampusConnect Operations Environment</span>
            <span className="text-zinc-800">•</span>
            <span className="text-zinc-500 font-semibold lowercase">v2026.4.2 production</span>
          </div>
          <div>&copy; {new Date().getFullYear()} CampusConnect. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
