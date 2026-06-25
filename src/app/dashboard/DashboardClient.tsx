'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect, useMemo } from 'react'
import { createClient, checkRateLimit } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { Navbar } from '@/components/layout/Navbar'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { HeroSection } from '@/components/home/HeroSection'
import { ModuleSection } from '@/components/home/ModuleSection'
import { SecondarySidebar } from '@/components/dashboard/SecondarySidebar'
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
  Calendar, 
  Briefcase, 
  BookOpen, 
  Store, 
  Users, 
  Award, 
  MapPin, 
  ShieldCheck, 
  Search, 
  Trash2,
  Clock,
  Check, 
  Lock, 
  Megaphone,
  UserX,
  ArrowUpRight,
  Flag
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

  const typeConfig: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
    post: { label: 'Post', icon: MessageSquare, color: 'text-brand-400' },
    confession: { label: 'Confession', icon: Lock, color: 'text-amber-400' },
    announcement: { label: 'Announce', icon: Megaphone, color: 'text-indigo-400' },
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-base rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {post.is_anonymous ? (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-900 ring-1 ring-white/10 shrink-0">
              <UserX size={18} className="text-zinc-500" />
            </div>
          ) : (
            <GlobalAvatar profile={author} />
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

        <div className="flex items-center gap-2">
          <div className={clsx("chip", config.color, "bg-white/[0.03] border-white/[0.05] flex items-center gap-1.5")}>
            <TypeIcon size={12} />
            <span className="font-mono text-[10px] uppercase tracking-wider">{config.label}</span>
          </div>
          {canDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="w-11 h-11 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors animate-fade-in"
              title="Delete Post"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[13px] text-neutral-300 leading-relaxed px-0.5 whitespace-pre-wrap">
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
          <motion.div animate={liked ? { scale: [1, 1.4, 1] } : {}}>
            <Heart size={16} fill={liked ? "currentColor" : "none"} className={liked ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"} />
          </motion.div>
          <span className="font-mono">{post.likes_count}</span>
        </button>

        <button 
          onClick={handleCommentsToggle}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
            showComments ? "bg-brand-500/10 text-brand-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
          )}
        >
          <MessageSquare size={16} className={showComments ? "text-brand-400" : "text-zinc-500 hover:text-zinc-300"} />
          <span className="font-mono">{post.comments_count}</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button 
            onClick={handleReport}
            disabled={reporting}
            title="Report Post"
            className="w-11 h-11 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <Flag size={14} />
          </button>
          <button 
            className="w-11 h-11 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
            aria-label="Share post"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/[0.05] space-y-4">
          {/* Comments list */}
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <span className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-[11px] text-zinc-500 text-center py-4 font-mono">
              No comments yet. Start the conversation!
            </p>
          ) : (
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <div className="shrink-0 mt-0.5">
                    <GlobalAvatar profile={comment.author} size="sm" />
                  </div>
                  <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-zinc-200">
                        {comment.author?.full_name || 'IILM Student'}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment form */}
          <div className="flex items-center gap-2.5 pt-2 border-t border-white/[0.03]">
            <div className="shrink-0">
              <GlobalAvatar profile={currentUserProfile} size="sm" />
            </div>
            <form onSubmit={handleCommentSubmit} className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] focus:bg-white/[0.06] focus:border-brand-500/30 transition-all rounded-xl px-3 py-1.5 text-xs outline-none text-zinc-200 placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-1.5 px-4 text-xs font-mono uppercase tracking-wider shrink-0"
              >
                {submitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Send'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirmDelete(false)} />
          <div className="card-premium max-w-sm w-full relative z-10 p-6 space-y-4 bg-[#090d16] border border-white/10 rounded-2xl animate-scale-up">
            <h3 className="font-display font-bold text-white text-base">Delete Post</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Are you sure you want to permanently delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-neutral-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
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
    { value: 'post', label: '📝 Post', desc: 'Share with campus' },
    { value: 'confession', label: '🔒 Confession', desc: 'Always anonymous' },
    { value: 'announcement', label: '📢 Announce', desc: 'Important update' },
  ] as const

  return (
    <div className="glass-panel-base rounded-xl p-4 transition-all duration-300">
      {!open ? (
        <div className="flex items-center gap-3">
          <GlobalAvatar profile={profile} size="sm" />
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left px-4 py-2.5 rounded-xl text-sm text-neutral-500 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all font-medium"
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
            <GlobalAvatar profile={anon ? null : profile} size="sm" />
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
              <Shield size={18} className="text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-200/70 leading-relaxed font-medium">
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
                    "flex items-center gap-2 text-[11px] font-mono transition-colors items-center",
                    anon ? "text-brand-400" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {anon ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span>Anonymous</span>
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
                className="px-4 py-1.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-neutral-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!content.trim() || posting || content.length > 500}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/10"
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
  profile: initialProfile,
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

      // Check for duplicate records first
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
    const d = new Date(ts)
    return { month: d.toLocaleString('default', { month: 'short' }).toUpperCase(), day: d.getDate() }
  }

  const isProfileIncomplete = !profile?.username || !profile?.bio || !profile?.branch

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 flex flex-col font-sans antialiased selection:bg-blue-500/30 selection:text-white overflow-x-hidden">
      <Navbar profile={profile} />

      <main className="flex-1 flex flex-col w-full z-10">
        
        {/* Onboarding Banner */}
        {isProfileIncomplete && (
          <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-12 lg:px-20 pt-4 sm:pt-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel-base p-6 border-brand-500/20 bg-brand-500/[0.03] relative overflow-hidden group shadow-2xl shadow-brand-500/5 rounded-2xl"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 text-brand-400 shadow-lg">
                      <User size={32} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold tracking-tight text-white">Complete your Campus ID</h3>
                      <p className="text-neutral-300 text-sm max-w-lg font-medium">
                        Welcome to CampusConnect! Add a username, bio, and branch to your profile so your classmates can find you.
                      </p>
                    </div>
                  </div>
                  <Link href="/profile" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg whitespace-nowrap">
                    Finish Setup
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <HeroSection />

        <div className="my-4">
          <ModuleSection userRole={profile?.role} />
        </div>

        {/* Primary Functional Dashboard Node Grid */}
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-12 lg:px-20 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          
          {/* Feed Column */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4">
            <CreatePost profile={profile} onPost={handleNewPost} supabase={supabase} />
            
            <div className="flex items-center gap-5 border-b border-white/[0.04] text-[11px] font-bold tracking-tight pb-2">
              <button className="text-blue-400 border-b-2 border-blue-400 pb-2 px-1">For You</button>
              <button className="text-neutral-500 hover:text-neutral-300 pb-2 px-1 transition-colors">Following</button>
              <button className="text-neutral-500 hover:text-neutral-300 pb-2 px-1 transition-colors">Trending</button>
            </div>

            <div ref={parentPosts} className="space-y-4">
              {posts.length === 0 ? (
                <EmptyState 
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

          {/* Middle Column */}
          <div className="lg:col-span-3 xl:col-span-3">
            <SecondarySidebar />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-4">
            
            {/* Identity Verification banner */}
            {!profile?.is_verified && (
              <div className="glass-panel-base rounded-2xl p-4.5 border-amber-500/20 bg-amber-500/[0.02] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-sm font-bold text-amber-200/90 tracking-tight">Identity Verification</p>
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed font-medium">
                    Verify your student ID to unlock Marketplace uploads and Dating features.
                  </p>
                  <Link href="/profile" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold w-full block text-center transition-all">
                    Complete Verification
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="glass-panel-base rounded-xl p-1.5">
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: 'Notes', icon: BookOpen, href: '/notes' },
                  { label: 'Market', icon: Store, href: '/marketplace' },
                  { label: 'Intern', icon: Briefcase, href: '/internships' },
                  { label: 'Chat', icon: MessageCircle, href: '/messages' },
                ].map(q => (
                  <Link key={q.label} href={q.href}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:bg-white/[0.05] group">
                    <q.icon size={20} className="text-neutral-400 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-tighter">{q.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Calendar & Upcoming Events */}
            <div className="glass-panel-base rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-white tracking-tight">Upcoming Events</span>
                <Link href="/events" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">View all</Link>
              </div>

              {events.length === 0 ? (
                <div className="py-8 text-center bg-zinc-900/20 rounded-xl border border-white/[0.02]">
                  <p className="text-neutral-500 text-xs italic font-medium">No events scheduled</p>
                </div>
              ) : (
                <div ref={parentEvents} className="space-y-3.5">
                  {events.map(e => {
                    const { month, day } = formatEventDate(e.start_time)
                    return (
                      <div key={e.id} className="flex gap-3 items-start border-b border-white/[0.04] last:border-0 pb-3 last:pb-0 group cursor-pointer animate-fade-in">
                        <div className="w-11 h-11 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col items-center justify-center shrink-0 group-hover:border-blue-500/30 transition-all shadow-sm">
                          <span className="text-blue-400 font-mono text-[9px] font-bold tracking-tighter uppercase">{month}</span>
                          <span className="text-zinc-100 font-display font-bold text-base leading-none">{day}</span>
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors tracking-tight leading-tight">{e.title}</p>
                          <p className="text-[10px] text-neutral-500 font-medium mt-1 flex items-center gap-1">
                            <MapPin size={10} className="text-neutral-600" />
                            {e.venue || 'Campus'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Campus Connections */}
            <div className="glass-panel-base rounded-2xl p-4 space-y-5">
              {/* Friends list */}
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block mb-3">My Connections ({friends.length})</span>
                <div ref={parentFriends} className="space-y-3">
                  {friends.length > 0 ? (
                    friends.map((f) => (
                      <div key={f.id} className="flex items-center justify-between group p-1 -m-1 rounded-xl hover:bg-white/[0.01]">
                        <div className="flex items-center gap-3">
                          <GlobalAvatar profile={f} size="sm" />
                          <div className="min-w-0 text-left">
                            <Link href={`/profile?id=${f.id}`} className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer tracking-tight block truncate max-w-[130px]">
                              {f.full_name}
                            </Link>
                            <p className="text-[10px] text-neutral-500 font-medium mt-0.5 truncate max-w-[130px]">
                              {f.branch ? `${f.branch}` : ''} {f.year ? `· Y${f.year}` : ''}
                            </p>
                          </div>
                        </div>
                        <Link href={`/profile?id=${f.id}`} className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all active:scale-95 flex items-center justify-center">
                          <User size={13} className="text-neutral-400" />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-neutral-500 italic">No connections yet.</p>
                  )}
                </div>
              </div>

              {/* Suggested Connections */}
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block mb-3">Suggested Peers</span>
                <div className="space-y-3">
                  {connections.length > 0 ? (
                    connections.map((c) => {
                      const relation = getRelation(c.id)
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => router.push(`/profile?id=${c.id}`)}
                          className="flex items-center justify-between group p-1 -m-1 rounded-xl hover:bg-white/[0.01] cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <GlobalAvatar profile={c} size="sm" />
                            <div className="min-w-0 text-left">
                              <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight block truncate max-w-[130px]">
                                {c.full_name}
                              </p>
                              <p className="text-[10px] text-neutral-500 font-medium mt-0.5 truncate max-w-[130px]">
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
                                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 gap-1 text-[10px] font-bold whitespace-nowrap"
                                title="Add Friend"
                              >
                                {sendingId === c.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <UserPlus size={11} className="text-cyan-400" />
                                    <span>Add Friend</span>
                                  </>
                                )}
                              </button>
                            )}

                            {relation === 'sent' && (
                              <button
                                disabled
                                className="p-1.5 bg-white/5 border border-white/5 text-neutral-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-1 text-[10px] font-bold whitespace-nowrap"
                                title="Request Sent"
                              >
                                <Clock size={11} className="text-neutral-600" />
                                <span>Pending</span>
                              </button>
                            )}

                            {relation === 'friends' && (
                              <button
                                disabled
                                className="p-1.5 bg-white/5 border border-white/5 text-emerald-400 rounded-lg cursor-not-allowed flex items-center justify-center gap-1 text-[10px] font-bold whitespace-nowrap"
                                title="Connected"
                              >
                                <Check size={11} className="text-emerald-500" />
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
                                className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-lg transition-all active:scale-95 flex items-center justify-center text-[10px] font-bold whitespace-nowrap"
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
                    <p className="text-[10px] text-neutral-500 italic">No suggestions.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.05] bg-[#01040a] z-10 py-6 px-6 sm:px-12 lg:px-20 mt-12 text-center text-[10px] uppercase font-bold tracking-widest text-neutral-600">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span>CampusConnect Architecture Suite</span>
            <span className="text-neutral-800">•</span>
            <span className="text-neutral-500 font-semibold lowercase">v2026.4.2 space-engine-optimized</span>
          </div>
          <div>&copy; {new Date().getFullYear()} CampusConnect. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
