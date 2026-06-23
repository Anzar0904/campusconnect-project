'use client'

import React, { useState } from 'react'
import { 
  Users, MessageCircle, Settings, X, Plus, LogOut, CheckCircle, 
  Trash2, ShieldCheck, Award, GraduationCap, Edit2, Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import CreatePost from './CreatePost'
import { formatDistanceToNow } from 'date-fns'

const CATEGORIES = ['Academic', 'Social', 'Technical', 'Cultural', 'Sports', 'Career', 'General']

export default function CommunityClient({
  community: initialCommunity,
  initialMembership,
  initialPosts,
  initialMembers,
  currentUserId,
  currentUserRole
}: {
  community: any
  initialMembership: any
  initialPosts: any[]
  initialMembers: any[]
  currentUserId: string
  currentUserRole: string
}) {
  const supabase = createClient()
  const router = useRouter()

  const [community, setCommunity] = useState<any>(initialCommunity)
  const [membership, setMembership] = useState<any>(initialMembership)
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [members, setMembers] = useState<any[]>(initialMembers)
  
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Community Detail Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 relative overflow-hidden border border-white/[0.08] bg-[#090d16]/80 backdrop-blur-2xl"
      >
        <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-violet-600/10 blur-[90px] pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-purple-600/10 blur-[90px] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/10">
              🎉
            </div>
            
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-2.5">
                {community.name}
                {community.is_private && <span className="chip-pro text-[9px] bg-red-500/10 text-red-400 border-red-500/20">Private</span>}
              </h1>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xl font-medium">
                {community.description || 'Welcome to this university interest group.'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-zinc-500 pt-1.5">
                <span className="flex items-center gap-1.5"><Award size={13} className="text-violet-400" /> {community.category}</span>
                <span className="flex items-center gap-1.5"><Users size={13} className="text-purple-400" /> {community.member_count} Members</span>
                <span className="flex items-center gap-1.5"><MessageCircle size={13} className="text-cyan-400" /> {posts.length} Posts</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManage && (
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-all active:scale-95"
                title="Edit Community Settings"
              >
                <Settings size={16} />
              </button>
            )}

            <button 
              onClick={handleJoinLeave}
              className={clsx(
                "px-6 py-2.5 rounded-xl text-xs font-bold font-display tracking-wide shadow-lg transition-all active:scale-95",
                membership 
                  ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" 
                  : "bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:scale-102"
              )}
            >
              {membership ? 'Leave Community' : 'Join Community'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs Menu */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit">
        <button 
          onClick={() => setTab('feed')}
          className={clsx(
            "px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all",
            tab === 'feed' ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Community Feed
        </button>
        <button 
          onClick={() => setTab('members')}
          className={clsx(
            "px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all",
            tab === 'members' ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
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
            {membership && <CreatePost communityId={community.id} />}

            <div className="glass-card rounded-3xl p-6 border border-white/[0.08] bg-[#090d16]/30">
              <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>

              {posts.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-xs italic">
                  No signals sent to this feed yet. Be the first to share.
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post: any) => (
                    <div key={post.id} className="p-5 rounded-2xl bg-[#030712]/40 border border-white/[0.04] hover:border-cyan-500/10 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <GlobalAvatar profile={post.author} size="md" />
                          <div>
                            <p className="font-bold text-xs text-white leading-none">{post.author?.full_name || 'Student'}</p>
                            <p className="text-[9px] font-mono text-neutral-500 mt-1.5 leading-none uppercase">
                              {post.author?.branch || 'Student'} · Year {post.author?.year || '1'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed text-neutral-200 whitespace-pre-wrap">{post.content}</p>

                      <div className="mt-4 flex gap-5 text-[10px] font-mono font-bold text-neutral-500">
                        <button className="hover:text-pink-400 transition-colors">❤️ {post.likes_count ?? 0}</button>
                        <button className="hover:text-cyan-400 transition-colors">💬 {post.comments_count ?? 0}</button>
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
                <div key={idx} className="card-premium p-4 flex items-center justify-between group hover:border-cyan-500/15 transition-all">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <GlobalAvatar profile={p} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-none flex items-center gap-1.5">
                        {p.full_name}
                        {isMemCreator && <ShieldCheck size={12} className="text-violet-400 shrink-0" />}
                      </p>
                      <p className="text-[10px] font-mono text-neutral-500 mt-1 leading-none uppercase truncate">
                        {p.branch || 'Student'} · Year {p.year || '1'}
                      </p>
                    </div>
                  </div>

                  {isMemCreator && (
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20 shrink-0">
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
              className="card-premium max-w-md w-full relative z-10 overflow-hidden shadow-2xl bg-[#090d16]"
            >
              <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="display-heading text-xl">Community Settings</h2>
                  <button type="button" onClick={()=>setShowSettings(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white">
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Community Name</label>
                    <input 
                      value={editForm.name} 
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Description</label>
                    <textarea 
                      value={editForm.description} 
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none h-20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Category</label>
                      <select 
                        value={editForm.category} 
                        onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full bg-[#030712]/95 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                      >
                        {CATEGORIES.map(x => <option key={x} value={x} className="bg-[#030712]">{x}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase block">Privacy Level</label>
                      <select 
                        value={editForm.is_private ? 'private' : 'public'} 
                        onChange={e => setEditForm(f => ({ ...f, is_private: e.target.value === 'private' }))}
                        className="w-full bg-[#030712]/95 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-white outline-none"
                      >
                        <option value="public" className="bg-[#030712]">Public Discoverable</option>
                        <option value="private" className="bg-[#030712]">Private (Secret)</option>
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
    </div>
  )
}
