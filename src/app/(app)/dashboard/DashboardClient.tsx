'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createClient, checkRateLimit } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { ModuleSection } from '@/components/home/ModuleSection'
import { RightSidebar } from '@/components/dashboard/RightSidebar'
import { SecondarySidebar } from '@/components/dashboard/SecondarySidebar'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useGsapNumberCounter, useGsapTilt, useGsapMagnetic, Easing, getPrefersReducedMotion } from '@/hooks/useGsapMotion'
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
  TrendingUp,
  Award,
  Terminal
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

  const cardRef = useGsapTilt(3.5) as React.RefObject<HTMLDivElement>

  return (
    <motion.article 
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="bg-[#15181D] border border-white/[0.04] rounded-2xl p-6 space-y-5 transition-all duration-300 hover:border-white/[0.08] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transformPerspective-800"
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
            <h4 className="font-sans font-semibold text-zinc-100 text-sm tracking-tight truncate leading-tight">
              {post.is_anonymous ? 'Anonymous Student' : (author?.full_name || 'IILM Student')}
            </h4>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              {author?.branch && !post.is_anonymous && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-800" />
                  <span className="uppercase text-brand-400 font-semibold tracking-wider text-[9px]">{author.branch}</span>
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

      <p className="text-[13px] text-zinc-300 leading-relaxed px-0.5 whitespace-pre-wrap font-sans font-normal">
        {post.content}
      </p>

      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
        <motion.button
          onClick={handleLike}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium font-sans tracking-wide transition-all duration-300 select-none",
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
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium font-sans tracking-wide transition-all duration-200 select-none",
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
                      <div className="flex-1 bg-[#1B1F24]/40 border border-white/[0.04] rounded-xl p-2.5 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-zinc-200 text-[11px]">
                            {comment.author?.full_name || 'IILM Student'}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-zinc-300 font-normal text-[11px] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
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
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white text-xs font-semibold transition-all shrink-0 active:scale-95"
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

      <AnimatePresence>
        {showConfirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[#0B0D10]/80 backdrop-blur-md" 
              onClick={() => setShowConfirmDelete(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="max-w-sm w-full relative z-10 p-6 space-y-4 bg-[#15181D]/95 border border-white/[0.08] rounded-2xl shadow-premium"
            >
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

function CreatePost({ 
  profile, 
  onPost, 
  supabase, 
  isOpen, 
  setIsOpen 
}: { 
  profile: Profile | null; 
  onPost: (p: Post) => void; 
  supabase: any;
  isOpen?: boolean;
  setIsOpen?: (o: boolean) => void;
}) {
  const [localOpen, setLocalOpen] = useState(false)
  const open = isOpen !== undefined ? isOpen : localOpen
  const setOpen = setIsOpen !== undefined ? setIsOpen : setLocalOpen
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
      { value: 'post', label: 'Post', icon: MessageSquare },
      { value: 'confession', label: 'Confession', icon: Lock },
      { value: 'announcement', label: 'Announcement', icon: Megaphone },
    ] as const

  return (
    <div id="post-composer" className="bg-[#15181D] border border-white/[0.04] rounded-2xl p-6 shadow-sm space-y-4">
      {!open ? (
        <div className="flex items-center gap-3">
          <GlobalAvatar profile={profile} size="sm" className="border border-white/5 shrink-0" />
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left px-5 py-3.5 rounded-xl text-xs text-zinc-500 bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all font-medium select-none"
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
          <div className="flex gap-1 p-1 rounded-xl bg-[#1B1F24] w-fit select-none border border-white/[0.04]">
            {typeOptions.map(t => {
              const Icon = t.icon
              const isSelected = postType === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { 
                    setPostType(t.value)
                    if (t.value === 'confession') setAnon(true)
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-wide transition-all flex items-center gap-1.5",
                    isSelected 
                      ? "bg-white/[0.06] text-brand-400 border border-white/[0.04] shadow-sm" 
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Icon size={12} className={isSelected ? "text-brand-400" : "text-zinc-500"} />
                  <span>{t.label}</span>
                </button>
              )
            })}
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
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 resize-none outline-none py-2.5 min-h-[120px] leading-relaxed font-sans font-normal"
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
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white text-xs font-semibold transition-all select-none active:scale-95"
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

const EventSkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex gap-3 items-center border-b border-white/[0.04] last:border-0 pb-3 last:pb-0 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] shrink-0" />
        <div className="min-w-0 space-y-1.5 flex-1">
          <div className="h-3 bg-white/[0.06] rounded w-2/3" />
          <div className="h-2 bg-white/[0.03] rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
)

const InternshipSkeleton = () => (
  <div className="space-y-2.5">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.01] animate-pulse">
        <div className="min-w-0 flex-1 pr-2 space-y-1.5">
          <div className="h-3 bg-white/[0.06] rounded w-1/2" />
          <div className="h-2 bg-white/[0.03] rounded w-1/3" />
        </div>
        <div className="w-10 h-4 bg-white/[0.04] rounded shrink-0" />
      </div>
    ))}
  </div>
)

const CommunitySkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-0.5 animate-pulse">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 bg-white/[0.06] rounded w-1/2" />
            <div className="h-2 bg-white/[0.03] rounded w-1/3" />
          </div>
        </div>
        <div className="w-12 h-6 bg-white/[0.04] rounded-lg shrink-0" />
      </div>
    ))}
  </div>
)

const MarketplaceSkeleton = () => (
  <div className="grid grid-cols-2 gap-3">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="flex flex-col rounded-xl border border-white/[0.04] bg-white/[0.01] p-2 animate-pulse">
        <div className="aspect-video w-full rounded-lg bg-white/[0.03]" />
        <div className="h-3 bg-white/[0.06] rounded w-3/4 mt-2" />
        <div className="h-2 bg-white/[0.03] rounded w-1/3 mt-1.5" />
      </div>
    ))}
  </div>
)

const ConnectionsSkeleton = () => (
  <div className="space-y-3">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-0.5 animate-pulse">
        <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-white/[0.03] shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 bg-white/[0.06] rounded w-1/2" />
            <div className="h-2 bg-white/[0.03] rounded w-1/3" />
          </div>
        </div>
        <div className="w-16 h-6 bg-white/[0.04] rounded-lg shrink-0" />
      </div>
    ))}
  </div>
)

interface DashboardHeroProps {
  profile: Profile | null
  stats: {
    internshipsCount: number
    upcomingEventsCount: number
    friendsCount: number
    communitiesCount: number
    currentRanking: number
    unreadMessagesCount: number
    points: number
    level: number
  }
  onCreatePostClick: () => void
}

const CountUp: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
  const ref = useGsapNumberCounter(value, 1.2, 0, suffix)
  return <span ref={ref as any}>0{suffix}</span>
}

const MagneticButton: React.FC<{
  onClick?: () => void
  href?: string
  className: string
  children: React.ReactNode
}> = ({ onClick, href, className, children }) => {
  const ref = useGsapMagnetic(0.22) as React.RefObject<any>
  if (href) {
    return (
      <Link ref={ref} href={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <button ref={ref} onClick={onClick} className={className}>
      {children}
    </button>
  )
}

const SummaryCard: React.FC<{
  href: string
  children: React.ReactNode
}> = ({ href, children }) => {
  const ref = useGsapTilt(4) as React.RefObject<HTMLDivElement>
  return (
    <Link href={href}>
      <div
        ref={ref}
        className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 transition-all duration-300 h-full flex flex-col justify-between gap-3 text-left relative overflow-hidden group hover:border-white/[0.08] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
      >
        {children}
      </div>
    </Link>
  )
}

const DashboardHero: React.FC<DashboardHeroProps> = ({ profile, stats, onCreatePostClick }) => {
  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr >= 5 && hr < 11) return 'Good Morning'
    if (hr >= 11 && hr < 17) return 'Good Afternoon'
    if (hr >= 17 && hr < 20) return 'Good Evening'
    return 'Good Night'
  }

  // Cards configuration
  const summaryCards = [
    {
      label: 'Internships',
      count: stats.internshipsCount,
      suffix: ' Matches',
      emptyText: 'No matches',
      icon: Briefcase,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      href: '/internships'
    },
    {
      label: 'Upcoming Events',
      count: stats.upcomingEventsCount,
      suffix: ' Scheduled',
      emptyText: 'No events',
      icon: CalendarIcon,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      href: '/events'
    },
    {
      label: 'Friends Connected',
      count: stats.friendsCount,
      suffix: ' Active',
      emptyText: '0 Active',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      href: '/friends'
    },
    {
      label: 'Communities',
      count: stats.communitiesCount,
      suffix: ' Joined',
      emptyText: '0 Joined',
      icon: MessageCircle,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      href: '/community'
    },
    {
      label: 'Campus Rank',
      count: stats.currentRanking,
      prefix: 'Rank #',
      subvalue: `Level ${stats.level}`,
      icon: Award,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      href: '/rewards'
    },
    {
      label: 'Unread Messages',
      count: stats.unreadMessagesCount,
      suffix: ' New',
      emptyText: 'Inbox clear',
      icon: MessageSquare,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      href: '/messages'
    }
  ]

  const quickActions = [
    { label: 'Create Post', icon: Plus, action: onCreatePostClick, isPrimary: true },
    { label: 'Messages', icon: MessageSquare, href: '/messages' },
    { label: 'Dating', icon: Heart, href: '/dating' },
    { label: 'AI Assistant', icon: Sparkles, href: '/ai', isAi: true },
    { label: 'Notes', icon: BookOpen, href: '/notes' },
    { label: 'Marketplace', icon: Store, href: '/marketplace' },
    { label: 'Events', icon: CalendarIcon, href: '/events' },
    { label: 'Coding Arena', icon: Terminal, href: '/coding-arena' },
  ]

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 mb-6 select-none reveal-hero">
      <div className="bg-[#18181B] border border-white/[0.04] rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.015),transparent_60%)] pointer-events-none" />

        {/* Personalized Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-4">
            <GlobalAvatar profile={profile} className="w-12 h-12 border border-white/10 shadow-md shrink-0" />
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight font-sans">
                {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-normal font-sans">
                Ready to build your campus today?
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <SummaryCard href={card.href} key={idx}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{card.label}</span>
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", card.color)}>
                    <Icon size={12} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors tracking-tight font-sans">
                    {card.label === 'Campus Rank' ? (
                      <>
                        Rank #<CountUp value={card.count} />
                      </>
                    ) : card.count > 0 ? (
                      <CountUp value={card.count} suffix={card.suffix} />
                    ) : (
                      card.emptyText
                    )}
                  </p>
                  {card.subvalue && (
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{card.subvalue}</p>
                  )}
                </div>
              </SummaryCard>
            )
          })}
        </div>

        {/* Quick Actions Row */}
        <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-5 border-t border-white/[0.04] reveal-quick-actions">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mr-2 text-left">Quick Actions:</span>
          {quickActions.map((action, idx) => {
            const Icon = action.icon
            const isPrimary = action.isPrimary
            const isAi = action.isAi

            const buttonContent = (
              <span className="flex items-center gap-1.5 font-sans">
                <Icon size={13} className={cn("shrink-0", isAi ? "text-purple-400" : isPrimary ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span>{action.label}</span>
              </span>
            )

            const classes = cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border cursor-pointer select-none group active:scale-95",
              isPrimary
                ? "bg-brand-500 hover:bg-brand-600 border-brand-500/20 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/15"
                : isAi
                ? "bg-purple-500/10 hover:bg-purple-500/15 border-purple-500/20 hover:border-purple-500/35 text-purple-400"
                : "bg-white/[0.01] hover:bg-white/[0.04] border-white/[0.04] hover:border-white/[0.1] text-zinc-400 hover:text-zinc-200"
            )

            return (
              <MagneticButton
                key={idx}
                onClick={action.action}
                href={action.href}
                className={classes}
              >
                {buttonContent}
              </MagneticButton>
            )
          })}
        </div>
      </div>
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

  // Card Tilt refs
  const verifyCardRef = useGsapTilt(3.5) as React.RefObject<HTMLDivElement>
  const aiCardRef = useGsapTilt(3.5) as React.RefObject<HTMLDivElement>
  const marketCardRef = useGsapTilt(3.5) as React.RefObject<HTMLDivElement>
  const connectCardRef = useGsapTilt(3.5) as React.RefObject<HTMLDivElement>

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

  // Premium UI & interaction state
  const [loadingWidgets, setLoadingWidgets] = useState(true)
  const [activeFeedTab, setActiveFeedTab] = useState<'for-you' | 'following' | 'trending'>('for-you')
  const [composerOpen, setComposerOpen] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({
    internshipsCount: 0,
    upcomingEventsCount: 0,
    friendsCount: 0,
    communitiesCount: 0,
    currentRanking: 1,
    unreadMessagesCount: 0,
    points: 0,
    level: 1,
  })

  // Client-side premium sorting & filtering
  const sortedPosts = useMemo(() => {
    const result = [...posts]
    if (activeFeedTab === 'trending') {
      return result.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
    }
    if (activeFeedTab === 'following') {
      const friendIds = friends.map(f => f.id)
      return result.filter(p => p.author && friendIds.includes(p.author.id))
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [posts, activeFeedTab, friends])

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
        setLoadingWidgets(true)
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

        // Fetch command center statistics
        const [
          unreadMsgsRes,
          commsCountRes,
          ptsDataRes,
          friendsCountRes,
          upcomingEventsRes,
          internshipsRes
        ] = await Promise.all([
          supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('receiver_id', currentUserId)
            .eq('read', false),
          supabase
            .from('community_members')
            .select('community_id', { count: 'exact', head: true })
            .eq('user_id', currentUserId),
          supabase
            .from('user_points')
            .select('total, level')
            .eq('user_id', currentUserId)
            .maybeSingle(),
          supabase
            .from('friendships')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`),
          supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .gte('start_time', new Date().toISOString()),
          supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
        ])

        const pts = ptsDataRes.data?.total || 0
        const lvl = ptsDataRes.data?.level || 1

        const { count: higherCount } = await supabase
          .from('user_points')
          .select('user_id', { count: 'exact', head: true })
          .gt('total', pts)

        setDashboardStats({
          unreadMessagesCount: unreadMsgsRes.count || 0,
          communitiesCount: commsCountRes.count || 0,
          points: pts,
          level: lvl,
          currentRanking: (higherCount || 0) + 1,
          friendsCount: friendsCountRes.count || 0,
          upcomingEventsCount: upcomingEventsRes.count || 0,
          internshipsCount: internshipsRes.count || 0,
        })

      } catch (e) {
        console.error('Error fetching campus data:', e)
      } finally {
        setLoadingWidgets(false)
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

  const handleCreatePostClick = () => {
    setComposerOpen(true)
    const composer = document.getElementById('post-composer')
    if (composer) {
      composer.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const textarea = composer.querySelector('textarea')
      if (textarea) {
        setTimeout(() => textarea.focus(), 150)
      }
    }
  }

  const isProfileIncomplete = !profile?.username || !profile?.bio || !profile?.branch

  return (
    <div className="w-full">
      <div className="flex-1 flex flex-col w-full z-10 pt-4">
        
        {/* Onboarding Banner */}
        {isProfileIncomplete && (
          <div className="w-full mb-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/[0.01] border border-white/[0.04] p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-white/[0.08]"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/[0.02] blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 text-brand-400 shadow-sm">
                      <User size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold font-sans tracking-tight text-white">Complete your Campus ID</h3>
                      <p className="text-zinc-400 text-xs font-medium leading-relaxed max-w-lg">
                        Welcome to CampusConnect! Add a username, bio, and branch to your profile so your classmates can find you.
                      </p>
                    </div>
                  </div>
                  <Link href="/settings" className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-xl text-xs font-semibold tracking-wide transition-all select-none active:scale-95">
                    Finish Setup
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Personalized Student Command Center Hero */}
        <DashboardHero 
          profile={profile} 
          stats={dashboardStats} 
          onCreatePostClick={handleCreatePostClick} 
        />

        {/* Primary Functional Dashboard Node Grid */}
        <div className="w-full py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left/Main Column: Feed */}
          <div className="lg:col-span-8 space-y-6 reveal-feed">
            
            {/* Create Post composer */}
            <CreatePost 
              profile={profile} 
              onPost={handleNewPost} 
              supabase={supabase} 
              isOpen={composerOpen} 
              setIsOpen={setComposerOpen} 
            />
            
            {/* Feed Sort Tabs */}
            <div className="flex items-center gap-2 select-none border-b border-white/[0.04] pb-3">
              {(['for-you', 'following', 'trending'] as const).map((tab) => {
                const isActive = activeFeedTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFeedTab(tab)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border",
                      isActive 
                        ? "bg-[#3B82F6]/10 border-[#3B82F6]/20 text-[#3B82F6]"
                        : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {tab === 'for-you' && 'For You'}
                    {tab === 'following' && 'Following'}
                    {tab === 'trending' && (
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} />
                        <span>Trending</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Feed Cards Section */}
            <div ref={parentPosts} className="space-y-4">
              {sortedPosts.length === 0 ? (
                <EmptyState 
                  icon={activeFeedTab === 'following' ? 'group_off' : 'feed'}
                  title={
                    activeFeedTab === 'following' 
                      ? "No connection posts yet" 
                      : activeFeedTab === 'trending'
                      ? "No trending posts"
                      : "The feed is silent"
                  }
                  description={
                    activeFeedTab === 'following'
                      ? "Classmates you connect with haven't posted anything yet. Connect with more peers to see updates."
                      : activeFeedTab === 'trending'
                      ? "No posts have received likes or comments recently. Be the first to start a conversation!"
                      : "Be the first to share something with your classmates or join a community to see what's happening."
                  }
                  action={
                    activeFeedTab === 'following'
                      ? {
                          label: "Find Classmates",
                          href: "/discover"
                        }
                      : {
                          label: "Explore Communities",
                          href: "/community"
                        }
                  }
                  className="bg-[#15181D] border-white/[0.04]"
                />
              ) : (
                <AnimatePresence mode="popLayout">
                  {sortedPosts.map(p => (
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
              <div ref={verifyCardRef} className="bg-amber-500/[0.02] border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden group shadow-sm transition-all hover:border-amber-500/30 duration-300 transformPerspective-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-all pointer-events-none" />
                <div className="relative z-10 space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                      <ShieldCheck size={16} />
                    </div>
                    <p className="text-xs font-semibold text-amber-200/90 tracking-tight">Identity Verification</p>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-medium">
                    Verify your student ID to unlock Marketplace uploads and Dating features.
                  </p>
                  <Link href="/profile" className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold w-full block text-center transition-all select-none active:scale-95">
                    Complete Verification
                  </Link>
                </div>
              </div>
            )}

            {/* AI Assistant context helper */}
            <div ref={aiCardRef} className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-5 relative overflow-hidden group shadow-sm transition-all hover:border-purple-500/30 duration-300 transformPerspective-800 reveal-ai-assistant">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-all pointer-events-none" />
              <div className="relative z-10 space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
                    <Sparkles size={15} className="animate-pulse" />
                  </div>
                  <p className="text-xs font-semibold text-purple-200/90 tracking-tight">AI Campus Helper</p>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed font-medium">
                  Ask the AI assistant to help you draft your class timetable or write clean study session summaries.
                </p>
                <Link href="/ai" className="px-4 py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold w-full block text-center transition-all select-none active:scale-95">
                  Open AI Workspace
                </Link>
              </div>
            </div>

            <SecondarySidebar />
            <RightSidebar />

            {/* Marketplace Featured Widget */}
            <div ref={marketCardRef} className="bg-[#15181D] border border-white/[0.04] rounded-2xl p-5 space-y-4 shadow-sm transition-all hover:border-white/[0.08] hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] duration-300 transformPerspective-800 reveal-marketplace">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white tracking-tight">Marketplace Deals</span>
                <Link href="/marketplace" className="text-[10px] font-semibold text-brand-400 hover:text-brand-300 transition-colors">View all</Link>
              </div>

              {loadingWidgets ? (
                <MarketplaceSkeleton />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {marketplaceItems.length > 0 ? (
                    marketplaceItems.map((item) => (
                      <Link href="/marketplace" key={item.id} className="flex flex-col rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#1B1F24] p-2 transition-all group">
                        <div className="aspect-video w-full rounded-lg bg-[#0B0D10] border border-white/[0.04] relative overflow-hidden shrink-0">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.title} fill className="object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600 font-mono">NO IMAGE</div>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-zinc-200 truncate mt-2 group-hover:text-brand-400 transition-colors leading-tight pr-1">{item.title}</p>
                        <p className="text-[10px] font-medium font-mono text-emerald-400 mt-1">₹{item.price}</p>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-2 py-4 text-center">
                      <p className="text-[11px] text-zinc-500 font-medium italic">No deals listed.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campus Connections & Suggestions */}
            <div ref={connectCardRef} className="bg-[#15181D] border border-white/[0.04] rounded-2xl p-5 space-y-5 shadow-sm transition-all hover:border-white/[0.08] hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] duration-300 transformPerspective-800 reveal-communities">
              {/* Connections list */}
              <div>
                <span className="text-[9px] font-mono font-semibold tracking-widest text-zinc-500 uppercase block mb-3 select-none">Classmate Connections ({friends.length})</span>
                
                {loadingWidgets ? (
                  <ConnectionsSkeleton />
                ) : (
                  <div ref={parentFriends} className="space-y-3">
                    {friends.length > 0 ? (
                      friends.map((f) => (
                        <div key={f.id} className="flex items-center justify-between group p-0.5">
                          <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                            <GlobalAvatar profile={f} size="sm" className="border border-white/5 shrink-0" />
                            <div className="min-w-0 text-left">
                              <Link href={`/profile?id=${f.id}`} className="text-xs font-semibold text-white group-hover:text-brand-400 transition-colors cursor-pointer tracking-tight block truncate">
                                {f.full_name}
                              </Link>
                              <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">
                                {f.branch ? `${f.branch}` : ''} {f.year ? `· Y${f.year}` : ''}
                              </p>
                            </div>
                          </div>
                          <Link href={`/profile?id=${f.id}`} className="p-1.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-zinc-400 hover:text-zinc-200 rounded-lg transition-all active:scale-95 shrink-0 flex items-center justify-center">
                            <User size={12} />
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-zinc-500 font-medium italic select-none">No classmate classmate connections.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Separator line */}
              <div className="h-px bg-white/[0.04]" />

              {/* Suggested Connections */}
              <div>
                <span className="text-[9px] font-mono font-semibold tracking-widest text-zinc-500 uppercase block mb-3 select-none">Suggested Peers</span>
                
                {loadingWidgets ? (
                  <ConnectionsSkeleton />
                ) : (
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
                                <p className="text-xs font-semibold text-white group-hover:text-brand-400 transition-colors tracking-tight block truncate">
                                  {c.full_name}
                                </p>
                                <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">
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
                                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 gap-1 text-[10px] font-semibold whitespace-nowrap"
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
                                  className="px-2.5 py-1 bg-white/5 border border-white/5 text-zinc-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-1 text-[10px] font-semibold whitespace-nowrap"
                                  title="Request Sent"
                                >
                                  <Clock size={10} className="text-zinc-600" />
                                  <span>Sent</span>
                                </button>
                              )}

                              {relation === 'friends' && (
                                <button
                                  disabled
                                  className="px-2.5 py-1 bg-white/5 border border-white/5 text-emerald-400 rounded-lg cursor-not-allowed flex items-center justify-center gap-1 text-[10px] font-semibold whitespace-nowrap"
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
                                  className="px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-lg transition-all active:scale-95 flex items-center justify-center text-[10px] font-semibold whitespace-nowrap"
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
                      <p className="text-[10px] text-zinc-500 font-medium italic select-none">No recommendations available.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

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
