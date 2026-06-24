'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Users, MessageSquare, Plus, X, Trash2, Shield, Calendar, MapPin, 
  FileText, Link as LinkIcon, Download, Send, Search, UserPlus, LogOut, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

interface Member {
  user_id: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
    branch: string | null
    year: number | null
  }
}

interface SharedItem {
  id: string
  name: string
  url: string
  uploaded_by: string
  uploaded_at: string
  type: 'note' | 'file'
}

export default function StudyRoomClient({
  group,
  initialMembers,
  currentUserId,
  currentUserRole
}: {
  group: any
  initialMembers: Member[]
  currentUserId: string
  currentUserRole: string
}) {
  const supabase = createClient()
  const router = useRouter()

  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [activeTab, setActiveTab] = useState<'chat' | 'files'>('chat')
  
  // Realtime Chat state
  const [messages, setMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Inviting / Adding members
  const [inviteSearch, setInviteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searching, setSearching] = useState(false)

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Parse structured description JSON
  let initialParsed = { about: '', notes: [] as SharedItem[], files: [] as SharedItem[] }
  try {
    if (group.description && (group.description.startsWith('{') || group.description.startsWith('['))) {
      initialParsed = JSON.parse(group.description)
    } else {
      initialParsed.about = group.description || ''
    }
  } catch (e) {
    initialParsed.about = group.description || ''
  }

  const [groupMetadata, setGroupMetadata] = useState(initialParsed)
  const [editDescMode, setEditDescMode] = useState(false)
  const [newDescVal, setNewDescVal] = useState(groupMetadata.about)

  const isOwner = group.creator_id === currentUserId
  const isPlatformAdmin = currentUserRole?.toUpperCase() === 'SUPER_ADMIN' || currentUserRole?.toUpperCase() === 'ADMIN'
  const canManage = isOwner || isPlatformAdmin
  const chatChannelRef = useRef<any>(null)

  // Scroll chat bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load persisted chat from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`study_chat_${group.id}`)
    if (stored) {
      try { setMessages(JSON.parse(stored)) } catch {}
    }
  }, [group.id])

  // Subscribing to Supabase Realtime Broadcast for Room Chat
  useEffect(() => {
    const channelName = `study-group-${group.id}`
    const existingChannel = supabase.getChannels().find((c: any) => c.topic === channelName)
    if (existingChannel) {
      supabase.removeChannel(existingChannel)
    }

    const channel = supabase.channel(channelName)

    channel
      .on('broadcast', { event: 'chat' }, (payload: any) => {
        setMessages(prev => {
          const next = [...prev, payload.payload]
          localStorage.setItem(`study_chat_${group.id}`, JSON.stringify(next.slice(-200)))
          return next
        })
      })
      .subscribe()

    chatChannelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      chatChannelRef.current = null
    }
  }, [group.id, supabase])

  // Sending Chat message via Broadcast
  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return
    const sender = members.find(m => m.user_id === currentUserId)?.profiles
    const payload = {
      id: Date.now().toString(),
      senderName: sender?.full_name || 'Student',
      senderAvatar: sender?.avatar_url,
      senderId: currentUserId,
      content: chatInput.trim(),
      created_at: new Date().toISOString()
    }

    // Broadcast to other clients reusing active channel ref
    if (chatChannelRef.current) {
      chatChannelRef.current.send({
        type: 'broadcast',
        event: 'chat',
        payload
      })
    }

    // Update local messages array and persist
    setMessages(prev => {
      const next = [...prev, payload]
      localStorage.setItem(`study_chat_${group.id}`, JSON.stringify(next.slice(-200)))
      return next
    })
    setChatInput('')
  }

  // Invite member search query
  useEffect(() => {
    if (!inviteSearch.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    const delaySearch = setTimeout(async () => {
      try {
        const memberIds = new Set(members.map(m => m.user_id))
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, branch, year')
          .ilike('full_name', `%${inviteSearch}%`)
          .limit(5)
        
        if (data) {
          // Filter out existing members
          setSearchResults(data.filter((u: any) => !memberIds.has(u.id)))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 200)

    return () => clearTimeout(delaySearch)
  }, [inviteSearch, members, supabase])

  // Add Member
  const handleAddMember = async (user: any) => {
    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        })

      if (error) throw error

      setMembers(prev => [...prev, {
        user_id: user.id,
        profiles: user
      }])
      toast.success(`${user.full_name} added to study group!`)
      setShowInviteModal(false)
      setInviteSearch('')
    } catch (err: any) {
      toast.error('Failed to add: ' + err.message)
    }
  }

  // Remove Member
  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this study group?`)) return
    try {
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', targetUserId)

      if (error) throw error

      setMembers(prev => prev.filter(m => m.user_id !== targetUserId))
      toast.success(`${name} removed successfully`)
    } catch (err: any) {
      toast.error('Failed to remove: ' + err.message)
    }
  }

  // Save Group description meta changes to DB
  const handleSaveDescription = async () => {
    const nextMeta = { ...groupMetadata, about: newDescVal.trim() }
    setGroupMetadata(nextMeta)
    setEditDescMode(false)

    const { error } = await supabase
      .from('study_groups')
      .update({ description: JSON.stringify(nextMeta) })
      .eq('id', group.id)

    if (error) toast.error('Failed to sync description: ' + error.message)
    else toast.success('Description updated')
  }

  // Note/File uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'note' | 'file') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading(`Uploading ${fileType}...`)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `study/${group.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const sender = members.find(m => m.user_id === currentUserId)?.profiles
      const newItem: SharedItem = {
        id: Date.now().toString(),
        name: file.name,
        url: publicUrl,
        uploaded_by: sender?.full_name || 'Student',
        uploaded_at: new Date().toLocaleDateString(),
        type: fileType
      }

      const key = fileType === 'note' ? 'notes' : 'files'
      const nextMeta = {
        ...groupMetadata,
        [key]: [...(groupMetadata[key] || []), newItem]
      }

      setGroupMetadata(nextMeta)

      const { error: dbError } = await supabase
        .from('study_groups')
        .update({ description: JSON.stringify(nextMeta) })
        .eq('id', group.id)

      if (dbError) throw dbError
      toast.success(`${file.name} shared with room!`, { id: toastId })
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message, { id: toastId })
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  // Delete Shared note / file
  const handleDeleteSharedItem = async (itemId: string, itemType: 'note' | 'file') => {
    if (!confirm('Are you sure you want to remove this shared item?')) return
    const key = itemType === 'note' ? 'notes' : 'files'
    const nextMeta = {
      ...groupMetadata,
      [key]: (groupMetadata[key] || []).filter((x: any) => x.id !== itemId)
    }

    setGroupMetadata(nextMeta)

    const { error } = await supabase
      .from('study_groups')
      .update({ description: JSON.stringify(nextMeta) })
      .eq('id', group.id)

    if (error) toast.error('Failed to remove: ' + error.message)
    else toast.success('Item removed')
  }

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this study group?')) return
    try {
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', currentUserId)

      if (error) throw error
      toast.success('You left the study group')
      router.push('/study')
    } catch (err: any) {
      toast.error('Failed to leave: ' + err.message)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto pb-24 items-start animate-fade-in">
      
      {/* LEFT COL: Chat & Files */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Detail info banner */}
        <div className="glass-card rounded-3xl p-6 border border-white/[0.08] bg-[#090d16]/80 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 relative overflow-hidden">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl">
              📚
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{group.subject} Workspace</h1>
              <p className="text-xs text-neutral-400 leading-none mt-1.5 font-mono flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin size={12} /> {group.venue || 'Study Room'}</span>
                {group.meeting_time && <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(group.meeting_time), 'MMM d, h:mm a')}</span>}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab(activeTab === 'chat' ? 'files' : 'chat')}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold text-white"
            >
              {activeTab === 'chat' ? 'Notes & Files' : 'Chat Stream'}
            </button>
            <button 
              onClick={handleLeaveGroup}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all"
            >
              <LogOut size={13} className="inline mr-1" /> Leave
            </button>
          </div>
        </div>

        {/* Dynamic Panels */}
        {activeTab === 'chat' ? (
          <div className="border border-white/[0.08] bg-[#090d16]/30 backdrop-blur-3xl rounded-3xl h-[520px] flex flex-col justify-between overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-white/[0.05] bg-[#030712]/30">
              <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">Live Workspace Chat</span>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-[#090d16]/10 to-[#030712]/30 flex flex-col justify-between">
              <div className="space-y-4 flex-1">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-2 mt-20">
                    <MessageSquare className="text-4xl text-neutral-500" size={24} />
                    <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Workspace feed started</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwn = m.senderId === currentUserId
                    return (
                      <div key={m.id} className={clsx("flex items-start gap-3.5 max-w-2xl", isOwn ? "ml-auto flex-row-reverse" : "mr-auto")}>
                        <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden bg-zinc-950 border border-white/[0.05]">
                          {m.senderAvatar ? (
                            <img src={m.senderAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-cyan-400">
                              {m.senderName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className={clsx("text-[10px] font-mono text-neutral-500", isOwn && "text-right")}>
                            {m.senderName} · {format(new Date(m.created_at), 'h:mm a')}
                          </p>
                          <div className={clsx(
                            "px-4 py-2 rounded-2xl text-xs font-medium border",
                            isOwn 
                              ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white border-transparent rounded-tr-none"
                              : "bg-[#0d121f]/75 border-white/[0.08] text-neutral-200 rounded-tl-none"
                          )}>
                            {m.content}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input area */}
            <footer className="p-4 border-t border-white/[0.05] bg-[#030712]/30">
              <div className="flex gap-3">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendChatMessage() }}
                  placeholder="Share a thought with group members..."
                  className="flex-1 bg-[#0d121f]/50 border border-white/[0.06] focus:border-cyan-500/50 rounded-xl px-4 py-3 text-xs text-zinc-100 outline-none shadow-inner"
                />
                <button
                  onClick={handleSendChatMessage}
                  className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Send size={15} />
                </button>
              </div>
            </footer>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-6 border border-white/[0.08] bg-[#090d16]/30 space-y-6">
            
            {/* Notes Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><FileText size={15} className="text-cyan-400" /> Study Notes</h3>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Share Note
                </button>
              </div>

              {(groupMetadata.notes || []).length === 0 ? (
                <p className="text-xs text-neutral-500 italic">No notes shared in this workspace yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(groupMetadata.notes || []).map((note) => (
                    <div key={note.id} className="p-3.5 rounded-2xl bg-[#030712]/40 border border-white/[0.04] flex items-center justify-between gap-3 group hover:border-cyan-500/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                          <FileText size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{note.name}</p>
                          <p className="text-[9px] text-neutral-500 truncate mt-0.5">By {note.uploaded_by} · {note.uploaded_at}</p>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <a href={note.url} target="_blank" rel="noreferrer" className="p-1.5 rounded bg-white/5 border border-white/10 text-neutral-400 hover:text-white" title="Download note">
                          <Download size={12} />
                        </a>
                        {canManage && (
                          <button onClick={() => handleDeleteSharedItem(note.id, 'note')} className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files Section */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><LinkIcon size={15} className="text-purple-400" /> Reference Files</h3>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-purple-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Share File
                </button>
              </div>

              {(groupMetadata.files || []).length === 0 ? (
                <p className="text-xs text-neutral-500 italic">No reference files uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(groupMetadata.files || []).map((file) => (
                    <div key={file.id} className="p-3.5 rounded-2xl bg-[#030712]/40 border border-white/[0.04] flex items-center justify-between gap-3 group hover:border-purple-500/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                          <LinkIcon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{file.name}</p>
                          <p className="text-[9px] text-neutral-500 truncate mt-0.5">By {file.uploaded_by} · {file.uploaded_at}</p>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <a href={file.url} target="_blank" rel="noreferrer" className="p-1.5 rounded bg-white/5 border border-white/10 text-neutral-400 hover:text-white" title="Download file">
                          <Download size={12} />
                        </a>
                        {canManage && (
                          <button onClick={() => handleDeleteSharedItem(file.id, 'file')} className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => handleFileUpload(e, activeTab === 'files' ? 'file' : 'note')} 
              className="hidden" 
            />
          </div>
        )}
      </div>

      {/* RIGHT COL: Group Info & Members List */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Description / About */}
        <div className="glass-card rounded-3xl p-6 border border-white/[0.08] bg-[#090d16]/80 space-y-4">
          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">Room Description</span>
            {canManage && (
              <button 
                onClick={() => { setEditDescMode(!editDescMode); setNewDescVal(groupMetadata.about) }}
                className="text-xs text-cyan-400 font-bold hover:underline"
              >
                {editDescMode ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>

          {editDescMode ? (
            <div className="space-y-3">
              <textarea
                value={newDescVal}
                onChange={e => setNewDescVal(e.target.value)}
                className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl p-3 text-xs text-white resize-none h-20 outline-none"
              />
              <button onClick={handleSaveDescription} className="btn-premium px-4 py-1.5 text-xs font-bold ml-auto block">
                <Check size={12} className="inline mr-1" /> Save
              </button>
            </div>
          ) : (
            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
              {groupMetadata.about || 'No custom description set yet. Click Edit to customize workspace instructions.'}
            </p>
          )}
        </div>

        {/* Member list details */}
        <div className="glass-card rounded-3xl p-6 border border-white/[0.08] bg-[#090d16]/80 space-y-4">
          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">Active Members</span>
            {canManage && (
              <button 
                onClick={() => setShowInviteModal(true)}
                className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1"
              >
                <UserPlus size={12} /> Invite
              </button>
            )}
          </div>

          <div className="space-y-3">
            {members.map((m) => {
              const p = m.profiles
              if (!p) return null
              const isOwnerNode = p.id === group.creator_id
              return (
                <div key={m.user_id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.03] group/member">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GlobalAvatar profile={p} size="sm" />
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                        {p.full_name}
                        {isOwnerNode && <Shield size={10} className="text-violet-400 shrink-0" />}
                      </p>
                      <p className="text-[9px] font-mono text-neutral-500 uppercase truncate leading-none mt-0.5">{p.branch || 'Student'} · Year {p.year || '1'}</p>
                    </div>
                  </div>

                  {canManage && !isOwnerNode && (
                    <button 
                      onClick={() => handleRemoveMember(m.user_id, p.full_name)}
                      className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 opacity-0 group-hover/member:opacity-100 hover:bg-red-500/25 transition-all"
                      title="Kick user"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Invite Member Popover Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={()=>setShowInviteModal(false)} />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
              className="card-premium max-w-md w-full relative z-10 overflow-hidden shadow-2xl bg-[#090d16]"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="display-heading text-lg">Invite Members</h2>
                  <button onClick={()=>setShowInviteModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white">
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-neutral-500" size={14} />
                    <input 
                      value={inviteSearch}
                      onChange={e => setInviteSearch(e.target.value)}
                      placeholder="Search peer profiles by name..."
                      className="w-full bg-[#030712]/50 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl pl-9 pr-4 py-2 text-white outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pt-2">
                    {searching ? (
                      <p className="text-neutral-500 italic text-center text-xs">Searching...</p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-neutral-500 italic text-center text-xs">{inviteSearch ? 'No matching peers found' : 'Enter name to begin search'}</p>
                    ) : (
                      searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <GlobalAvatar profile={user} size="sm" />
                            <div className="min-w-0 text-left">
                              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                              <p className="text-[9px] font-mono text-neutral-500 truncate leading-none mt-0.5">{user.branch} · Year {user.year}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleAddMember(user)}
                            className="btn-premium px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Plus size={11} /> Add to Room
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
