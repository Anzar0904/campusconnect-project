'use client'

import React, { useState } from 'react'
import { 
  Users, MessageCircle, Settings, X, Plus, LogOut, CheckCircle, 
  Trash2, ShieldCheck, Award, GraduationCap, Edit2, Calendar, ChevronLeft
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import CreatePost from './CreatePost'
import { formatDistanceToNow } from 'date-fns'

const CATEGORY_COLORS: Record<string, string> = {
  Academic: '#a78bfa',  // Violet
  Social: '#22d3ee',    // Cyan
  Technical: '#3b82f6', // Blue
  Cultural: '#ec4899',  // Pink
  Sports: '#f59e0b',    // Amber
  Career: '#10b981',    // Emerald
  General: '#94a3b8',   // Slate
}

const CATEGORIES = ['Academic', 'Social', 'Technical', 'Cultural', 'Sports', 'Career', 'General']

export default function CommunityClient({
  community: initialCommunity,
  initialMembership,
  initialPosts,
  initialMembers,
  currentUserId,
  currentUserRole,
  currentUserProfile
}: {
  community: any
  initialMembership: any
  initialPosts: any[]
  initialMembers: any[]
  currentUserId: string
  currentUserRole: string
  currentUserProfile?: any
}) {
  const supabase = createClient()
  const router = useRouter()

  const [community, setCommunity] = useState<any>(initialCommunity)
  const [membership, setMembership] = useState<any>(initialMembership)
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [members, setMembers] = useState<any[]>(initialMembers)
  
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const executeDeletePost = async () => {
    if (!deletingPostId) return
    setDeleting(true)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', deletingPostId)
    
    if (error) {
      toast.error('Failed to delete post: ' + error.message)
    } else {
      toast.success('Post deleted successfully')
      setPosts(prev => prev.filter(p => p.id !== deletingPostId))
      setDeletingPostId(null)
    }
    setDeleting(false)
  }
  
  const [tab, setTab] = useState<'feed' | 'members'>('feed')
  
  // Settings & Edit states
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [editForm, setEditForm] = useState({
    name: community.name || '',
    description: community.description || '',
    category: community.category || 'General',
    is_private: community.is_private || false
  })

  const isCreator = community.created_by === currentUserId
  const isPlatformAdmin = currentUserRole?.toUpperCase() === 'SUPER_ADMIN' || currentUserRole?.toUpperCase() === 'ADMIN'
  const canManage = isCreator || isPlatformAdmin

  const handleJoinLeave = async () => {
    if (membership) {
      // Leave
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', community.id)
        .eq('user_id', currentUserId)
      
      if (error) {
        toast.error('Failed to leave: ' + error.message)
        return
      }

      setMembership(null)
      setMembers((prev: any[]) => prev.filter(m => m.user_id !== currentUserId))
      setCommunity((prev: any) => ({ ...prev, member_count: Math.max(0, prev.member_count - 1) }))
      toast.success('Left community')
      
      // Update DB member count
      await supabase
        .from('communities')
        .update({ member_count: Math.max(0, community.member_count - 1) })
        .eq('id', community.id)
    } else {
      // Join
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: currentUserId,
          role: 'member'
        })
      
      if (error) {
        toast.error('Failed to join: ' + error.message)
        return
      }

      const { data: newMember } = await supabase
        .from('community_members')
        .select('role, user_id, profiles(id, full_name, avatar_url, branch, year)')
        .eq('community_id', community.id)
        .eq('user_id', currentUserId)
        .single()

      setMembership({ role: 'member' })
      if (newMember) setMembers((prev: any[]) => [...prev, newMember])
      setCommunity((prev: any) => ({ ...prev, member_count: prev.member_count + 1 }))
      toast.success('Joined community!')

      // Update DB member count
      await supabase
        .from('communities')
        .update({ member_count: community.member_count + 1 })
        .eq('id', community.id)
    }
    router.refresh()
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.name.trim()) return

    setSavingSettings(true)
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          category: editForm.category,
          is_private: editForm.is_private
        })
        .eq('id', community.id)

      if (error) throw error

      setCommunity((prev: any) => ({
        ...prev,
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        category: editForm.category,
        is_private: editForm.is_private
      }))
      
      toast.success('Settings updated successfully!')
      setShowSettings(false)
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleDeleteCommunity = async () => {
    if (!confirm('Are you absolutely sure you want to delete this community? This will permanently delete all posts.')) return
    
    try {
      const { error } = await supabase.from('communities').delete().eq('id', community.id)
      if (error) throw error
      toast.success('Community deleted')
      router.push('/community')
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  const color = CATEGORY_COLORS[community.category] || '#94a3b8'

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Mobile back button & Desktop Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => {
            if (window.history.length > 1) {
              router.back()
            } else {
              router.push('/dashboard')
            }
          }}
          className="md:hidden flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span>&gt;</span>
          <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/community')}>Communities</span>
          <span>&gt;</span>
          <span className="text-white font-semibold">{community.name}</span>
        </div>
      </div>

      {/* Community Detail Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated rounded-2xl p-6 md:p-8 relative overflow-hidden border-t-4"
        style={{ borderTopColor: color }}
      >
        <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full opacity-10 blur-[90px] pointer-events-none" style={{ backgroundColor: color }} />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full opacity-10 blur-[90px] pointer-events-none" style={{ backgroundColor: color }} />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              🎉
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
                  {community.name}
                </h1>
                {community.is_private && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                    Private
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl font-medium">
                {community.description || 'Welcome to this university interest group.'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/[0.04] w-fit">
                <span className="flex items-center gap-1.5"><Award size={13} style={{ color }} /> {community.category}</span>
                <span className="flex items-center gap-1.5"><Users size={13} className="text-brand-400" /> {community.member_count} Members</span>
                <span className="flex items-center gap-1.5"><MessageCircle size={13} className="text-cyan-400" /> {posts.length} Posts</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-center md:self-start">
            {canManage && (
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
                title="Edit Community Settings"
              >
                <Settings size={16} />
              </button>
            )}

            <button 
              onClick={handleJoinLeave}
              className={clsx(
                "px-5 py-2.5 rounded-xl text-xs font-bold font-display tracking-wide shadow-md transition-all active:scale-95",
                membership 
                  ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" 
                  : "btn-premium"
              )}
            >
              {membership ? 'Leave Community' : 'Join Community'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs Menu */}
      <div className="flex gap-1 p-1 rounded-xl bg-zinc-950/60 border border-white/[0.06] w-fit">
        <button 
          onClick={() => setTab('feed')}
          className={clsx(
            "px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all",
            tab === 'feed' ? "bg-white/[0.06] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Community Feed
        </button>
        <button 
          onClick={() => setTab('members')}
          className={clsx(
            "px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all",
            tab === 'members' ? "bg-white/[0.06] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Members ({members.length})
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {tab === 'feed' ? (
          <motion.div 
            key="feed" 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {membership && <CreatePost communityId={community.id} profile={currentUserProfile} />}

            <div className="card-premium p-6 relative overflow-hidden">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Recent Activity
              </h2>

              {posts.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-xs italic font-medium">
                  No signals sent to this feed yet. Be the first to share.
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post: any) => (
                    <div key={post.id} className="p-5 rounded-xl bg-zinc-950/30 border border-white/[0.04] hover:border-brand-500/10 transition-colors duration-300">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <GlobalAvatar profile={post.author} size="md" />
                          <div>
                            <p className="font-bold text-xs text-white leading-none">{post.author?.full_name || 'Student'}</p>
                            <p className="text-[9px] font-mono text-zinc-500 mt-1.5 leading-none uppercase tracking-wider">
                              {post.author?.branch || 'Student'} · Year {post.author?.year || '1'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] font-mono text-zinc-500">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                          {(post.author_id === currentUserId ||
                            currentUserRole === 'SUPER_ADMIN' ||
                            (currentUserRole === 'COLLEGE_ADMIN' && post.author?.college_id === currentUserProfile?.college_id)) && (
                            <button
                              onClick={() => setDeletingPostId(post.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                              title="Delete Post"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap font-medium">{post.content}</p>

                      <div className="mt-4 pt-3 border-t border-white/[0.02] flex gap-5 text-[10px] font-mono font-bold text-zinc-500">
                        <button className="hover:text-pink-400 transition-colors flex items-center gap-1">❤️ {post.likes_count ?? 0}</button>
                        <button className="hover:text-cyan-400 transition-colors flex items-center gap-1">💬 {post.comments_count ?? 0}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="members" 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            {members.map((m: any, idx: number) => {
              const p = m.profiles
              if (!p) return null
              const isMemCreator = p.id === community.created_by
              return (
                <div key={idx} className="card-premium p-4 flex items-center justify-between group hover:border-brand-500/15 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <GlobalAvatar profile={p} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-none flex items-center gap-1.5">
                        {p.full_name}
                        {isMemCreator && <ShieldCheck size={12} className="text-violet-400 shrink-0" />}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1 leading-none uppercase truncate">
                        {p.branch || 'Student'} · Year {p.year || '1'}
                      </p>
                    </div>
                  </div>

                  {isMemCreator && (
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 shrink-0">
                      Host
                    </span>
                  )}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal (Edit/Delete) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setShowSettings(false)} />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
              className="card-elevated max-w-md w-full relative z-10 overflow-hidden"
            >
              <form onSubmit={handleSaveSettings} className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                  <h2 className="font-display text-xl font-bold text-white">Community Settings</h2>
                  <button type="button" onClick={()=>setShowSettings(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white" aria-label="Close settings">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Community Name</label>
                    <input 
                      value={editForm.name} 
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="input-pro"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Description</label>
                    <textarea 
                      value={editForm.description} 
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      className="input-pro h-20 py-2.5 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Category</label>
                      <select 
                        value={editForm.category} 
                        onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                        className="input-pro"
                      >
                        {CATEGORIES.map(x => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Privacy Level</label>
                      <select 
                        value={editForm.is_private ? 'private' : 'public'} 
                        onChange={e => setEditForm(f => ({ ...f, is_private: e.target.value === 'private' }))}
                        className="input-pro"
                      >
                        <option value="public">Public Discoverable</option>
                        <option value="private">Private (Secret)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button type="button" onClick={()=>setShowSettings(false)} className="btn-ghost-pro flex-1 py-2.5 justify-center text-xs">
                      Cancel
                    </button>
                    <button type="submit" disabled={savingSettings} className="btn-premium flex-1 py-2.5 justify-center text-xs">
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleDeleteCommunity}
                    className="btn-ghost-pro py-2.5 justify-center text-xs text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/5 w-full flex items-center gap-1.5"
                  >
                    <Trash2 size={13} /> Delete Community
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {deletingPostId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeletingPostId(null)} />
          <div className="card-premium max-w-sm w-full relative z-10 p-6 space-y-4 bg-zinc-950 border border-white/10 rounded-xl">
            <h3 className="font-display font-bold text-white text-base">Delete Post</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-medium">
              Are you sure you want to permanently delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingPostId(null)}
                disabled={deleting}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-zinc-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeDeletePost}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
