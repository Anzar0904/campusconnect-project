'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Users, MessageSquare, Plus, X, Trash2, Shield, Calendar, MapPin, 
  FileText, Link as LinkIcon, Download, Send, Search, UserPlus, LogOut, Check, ChevronLeft,
  Play, Pause, RotateCcw, Clock, Sparkles
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

const POMODORO_MINS = [25, 30, 45, 60]

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

  // Pomodoro timer state
  const [selectedMins, setSelectedMins] = useState(25)
  const [running, setRunning] = useState(false)
  const [secsLeft, setSecsLeft] = useState(25 * 60)
  const [intervalId, setIntervalId] = useState<any>(null)

  function startTimer() {
    if (running) {
      if (intervalId) clearInterval(intervalId)
      setRunning(false)
      return
    }
    setSecsLeft(selectedMins * 60)
    const id = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          clearInterval(id)
          setRunning(false)
          toast.success('Pomodoro complete! Take a break 🎉')
          return selectedMins * 60
        }
        return s - 1
      })
    }, 1000)
    setIntervalId(id)
    setRunning(true)
  }

  function resetTimer() {
    if (intervalId) clearInterval(intervalId)
    setRunning(false)
    setSecsLeft(selectedMins * 60)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [intervalId])

  const timerMins = Math.floor(secsLeft / 60).toString().padStart(2, '0')
  const timerSecs = (secsLeft % 60).toString().padStart(2, '0')
  const timerPct = ((selectedMins * 60 - secsLeft) / (selectedMins * 60)) * 100

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
      const fileName = `${currentUserId}/study/${group.id}/${Date.now()}.${fileExt}`

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
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Mobile back button & Desktop Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => {
            if (window.history.length > 1) {
              router.back()
            } else {
              router.push('/study')
            }
          }}
          className="md:hidden flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span>&gt;</span>
          <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/study')}>Study Hub</span>
          <span>&gt;</span>
          <span className="text-white font-semibold">{group.subject}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COL: Chat & Pinned Resources */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Detail info banner */}
          <div className="card-elevated p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 relative overflow-hidden">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl shrink-0">
                📚
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{group.subject} Workspace</h1>
                <p className="text-xs text-zinc-400 mt-1 font-mono flex items-center justify-center sm:justify-start gap-3">
                  <span className="flex items-center gap-1"><MapPin size={12} className="text-zinc-500" /> {group.venue || 'Virtual Room'}</span>
                  {group.meeting_time && <span className="flex items-center gap-1"><Calendar size={12} className="text-zinc-500" /> {format(new Date(group.meeting_time), 'MMM d, h:mm a')}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab(activeTab === 'chat' ? 'files' : 'chat')}
                className="btn-premium px-4 py-2 text-xs font-bold"
              >
                {activeTab === 'chat' ? 'Notes & Files' : 'Open Chat'}
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
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="card-premium h-[540px] flex flex-col justify-between overflow-hidden shadow-2xl relative"
              >
                <div className="p-4 border-b border-white/[0.04] bg-zinc-950/20 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> LIVE CHAMPUS CHAT STREAM
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">{messages.length} messages buffered</span>
                </div>

                {/* Chat message stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-zinc-950/5 to-zinc-900/10">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-2.5 mt-20">
                      <MessageSquare className="text-3xl text-zinc-500" />
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 text-center">Room session initialized. Say hello!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((m) => {
                        const isOwn = m.senderId === currentUserId
                        return (
                          <div key={m.id} className={clsx("flex items-start gap-3 max-w-[80%]", isOwn ? "ml-auto flex-row-reverse" : "mr-auto")}>
                            <GlobalAvatar fullName={m.senderName} avatarUrl={m.senderAvatar} size="sm" className="rounded-lg shadow-sm" />
                            <div className="space-y-1">
                              <p className={clsx("text-[9px] font-mono text-zinc-500", isOwn && "text-right")}>
                                {m.senderName} · {format(new Date(m.created_at), 'h:mm a')}
                              </p>
                              <div className={clsx(
                                "px-4 py-2.5 rounded-xl text-xs leading-relaxed font-medium border",
                                isOwn 
                                  ? "bg-brand-500/10 text-brand-300 border-brand-500/20 rounded-tr-none"
                                  : "bg-zinc-900/50 border-white/[0.05] text-zinc-200 rounded-tl-none"
                              )}>
                                {m.content}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <footer className="p-4 border-t border-white/[0.04] bg-zinc-950/20">
                  <div className="flex gap-3">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendChatMessage() }}
                      placeholder="Type a message or share a link with workspace members..."
                      className="input-pro text-xs rounded-xl flex-1 bg-zinc-950/30 border-white/[0.06] focus:border-brand-500/40 h-10 px-4"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim()}
                      className="btn-premium p-3 h-10 w-10 flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </footer>
              </motion.div>
            ) : (
              <motion.div 
                key="files"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="card-premium p-6 space-y-6"
              >
                
                {/* Notes Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><FileText size={14} className="text-cyan-400" /> shared notes</h3>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-brand-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Upload Note
                    </button>
                  </div>

                  {(groupMetadata.notes || []).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No notes shared in this workspace yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(groupMetadata.notes || []).map((note) => (
                        <div key={note.id} className="p-3.5 rounded-xl bg-zinc-950/35 border border-white/[0.04] flex items-center justify-between gap-3 group hover:border-brand-500/10 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                              <FileText size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate leading-none">{note.name}</p>
                              <p className="text-[9px] text-zinc-500 font-mono truncate mt-1">By {note.uploaded_by} · {note.uploaded_at}</p>
                            </div>
                          </div>

                          <div className="flex gap-1.5">
                            <a href={note.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-400 hover:text-white" title="Download">
                              <Download size={12} />
                            </a>
                            {canManage && (
                              <button onClick={() => handleDeleteSharedItem(note.id, 'note')} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300">
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
                <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><LinkIcon size={14} className="text-purple-400" /> Reference Files</h3>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-brand-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Upload File
                    </button>
                  </div>

                  {(groupMetadata.files || []).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No reference files uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(groupMetadata.files || []).map((file) => (
                        <div key={file.id} className="p-3.5 rounded-xl bg-zinc-950/35 border border-white/[0.04] flex items-center justify-between gap-3 group hover:border-brand-500/10 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                              <LinkIcon size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate leading-none">{file.name}</p>
                              <p className="text-[9px] text-zinc-500 font-mono truncate mt-1">By {file.uploaded_by} · {file.uploaded_at}</p>
                            </div>
                          </div>

                          <div className="flex gap-1.5">
                            <a href={file.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-400 hover:text-white" title="Download">
                              <Download size={12} />
                            </a>
                            {canManage && (
                              <button onClick={() => handleDeleteSharedItem(file.id, 'file')} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COL: Timer, Description & Members */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pomodoro Timer Sidebar Card */}
          <div className="card-premium p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-4 left-4">
              <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
                <Clock size={11} className="text-brand-400" /> POMODORO TIMER
              </span>
            </div>
            
            {/* Circular progress countdown */}
            <div className="relative w-32 h-32 mx-auto my-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#timerGradient)" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - timerPct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
                
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                <span className="font-mono text-2xl font-extrabold text-white leading-none">{timerMins}:{timerSecs}</span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Remaining</span>
              </div>
            </div>

            {/* Durations list */}
            <div className="flex gap-1 justify-center mb-5">
              {POMODORO_MINS.map(m => (
                <button 
                  key={m} 
                  onClick={() => { if (!running) { setSelectedMins(m); setSecsLeft(m * 60) } }}
                  disabled={running}
                  className={clsx(
                    "px-2.5 py-1 rounded-md text-[10px] font-mono transition-all border",
                    selectedMins === m
                      ? "bg-brand-500/15 text-brand-400 border-brand-500/30 font-bold"
                      : "bg-zinc-950/40 text-zinc-500 border-white/[0.04] hover:text-zinc-300 disabled:opacity-50"
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>

            {/* Timer controls */}
            <div className="flex gap-2.5 w-full">
              <button 
                onClick={startTimer} 
                className={clsx(
                  "flex-1 py-2 rounded-xl text-xs font-bold font-display tracking-wider uppercase transition-all flex items-center justify-center gap-1.5",
                  running 
                    ? "bg-zinc-900 border border-white/[0.08] text-zinc-400 hover:text-white" 
                    : "btn-premium"
                )}
              >
                {running ? <Pause size={12} /> : <Play size={12} />}
                <span>{running ? 'Pause' : 'Start Focus'}</span>
              </button>
              <button 
                onClick={resetTimer} 
                className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-zinc-500 hover:text-white transition-colors"
                title="Reset timer"
              >
                <RotateCcw size={13} />
              </button>
            </div>
            {running && <p className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase mt-2.5 animate-pulse">🎯 Study Session Active</p>}
          </div>
          
          {/* Description / About */}
          <div className="card-premium p-6 space-y-3">
            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Room Description</span>
              {canManage && (
                <button 
                  onClick={() => { setEditDescMode(!editDescMode); setNewDescVal(groupMetadata.about) }}
                  className="text-xs text-brand-400 font-bold hover:underline"
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
                  className="input-pro h-20 text-xs py-2.5 resize-none"
                />
                <button onClick={handleSaveDescription} className="btn-premium px-4 py-1.5 text-xs font-bold ml-auto block">
                  <Check size={12} className="inline mr-1" /> Save
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                {groupMetadata.about || 'No custom description set yet. Click Edit to customize workspace instructions.'}
              </p>
            )}
          </div>

          {/* Member list details */}
          <div className="card-premium p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Active Participants</span>
              {canManage && (
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="text-xs text-brand-400 font-bold hover:underline flex items-center gap-1"
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
                  <div key={m.user_id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/20 border border-white/[0.02] group/member hover:border-brand-500/10 transition-all duration-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GlobalAvatar profile={p} size="sm" status="online" />
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1.5 leading-none">
                          {p.full_name}
                          {isOwnerNode && <Shield size={10} className="text-violet-400 shrink-0" />}
                        </p>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase truncate mt-1">{p.branch || 'Student'} · Year {p.year || '1'}</p>
                      </div>
                    </div>

                    {canManage && !isOwnerNode && (
                      <button 
                        onClick={() => handleRemoveMember(m.user_id, p.full_name)}
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 opacity-0 group-hover/member:opacity-100 hover:bg-red-500/25 transition-all"
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
                className="card-elevated max-w-md w-full relative z-10 overflow-hidden"
              >
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                    <h2 className="font-display text-lg font-bold text-white">Invite Members</h2>
                    <button onClick={()=>setShowInviteModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white" aria-label="Close invite modal">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                      <input 
                        value={inviteSearch}
                        onChange={e => setInviteSearch(e.target.value)}
                        placeholder="Search peers by name..."
                        className="input-pro pl-9 text-xs"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pt-2">
                      {searching ? (
                        <p className="text-zinc-500 italic text-center text-xs">Searching...</p>
                      ) : searchResults.length === 0 ? (
                        <p className="text-zinc-500 italic text-center text-xs">{inviteSearch ? 'No matching peers found' : 'Enter name to begin search'}</p>
                      ) : (
                        searchResults.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <GlobalAvatar profile={user} size="sm" />
                              <div className="min-w-0 text-left">
                                <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                                <p className="text-[9px] font-mono text-zinc-500 truncate mt-0.5">{user.branch} · Year {user.year}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleAddMember(user)}
                              className="btn-premium px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5"
                            >
                              <Plus size={11} /> Add
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
    </div>
  )
}

