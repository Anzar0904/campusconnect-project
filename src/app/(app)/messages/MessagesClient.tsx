'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  ArrowLeft, Send, Search, Image as ImageIcon, Smile, Eye, Paperclip, 
  X, Check, CheckCheck, Loader2, Info, Folder, FileText, Heart, MessageCircle, Gamepad2, ChevronRight, Lock, CheckCircle
} from 'lucide-react'
import { createClient, checkRateLimit } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  branch: string | null
  year: number | null
  role?: string | null
  is_verified?: boolean
  hostel?: string | null
}

interface Friendship {
  requester_id: string
  addressee_id: string
  requester: Profile
  addressee: Profile
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏']

export default function MessagesClient({
  friendships,
  currentUserId,
}: {
  friendships: Friendship[]
  currentUserId: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Real-time Presence State
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!currentUserId) return

    const presenceChannelName = 'global-online-presence'
    const existingPresenceChannel = supabase.getChannels().find(c => c.topic === presenceChannelName)
    if (existingPresenceChannel) {
      supabase.removeChannel(existingPresenceChannel)
    }

    const presenceChannel = supabase.channel(presenceChannelName, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const onlineIds = new Set<string>()
        Object.keys(state).forEach(key => {
          onlineIds.add(key)
        })
        setOnlineUsers(onlineIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [currentUserId, supabase])

  // Parse userId query parameter and set selectedId
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const uId = params.get('userId')
      if (uId) {
        setSelectedId(uId)
      }
    }
  }, [])

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [showRightPanel, setShowRightPanel] = useState(true)

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)

  // Typing state
  const [friendIsTyping, setFriendIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Emoji Popover state
  const [activeMessageIdForEmoji, setActiveMessageIdForEmoji] = useState<string | null>(null)
  const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false)

  // Mutual communities & details
  const [mutualCommunities, setMutualCommunities] = useState<any[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)

  // Process Friends
  const friends = useMemo(() => {
    return friendships.map(f =>
      f.requester_id === currentUserId ? f.addressee : f.requester
    ).filter(Boolean)
  }, [friendships, currentUserId])

  // Filter Friends by search
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends
    return friends.filter(f => 
      f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.branch && f.branch.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [friends, searchQuery])

  const selectedFriend = useMemo(() => {
    return friends.find(f => f.id === selectedId) || null
  }, [friends, selectedId])

  // Load Mutual Communities
  useEffect(() => {
    const targetId = selectedId as string
    if (!targetId) return
    async function fetchMutual() {
      try {
        const [myCommsRes, friendCommsRes] = await Promise.all([
          supabase.from('community_members').select('community_id').eq('user_id', currentUserId),
          supabase.from('community_members').select('community_id, communities(id, name, description)').eq('user_id', targetId)
        ])

        if (myCommsRes.data && friendCommsRes.data) {
          const myIds = new Set(myCommsRes.data.map(c => c.community_id))
          const mutual = friendCommsRes.data
            .filter(c => myIds.has(c.community_id))
            .map(c => c.communities)
            .filter(Boolean)
          setMutualCommunities(mutual)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchMutual()
  }, [selectedId, currentUserId, supabase])

  // Load Messages & Mark Read
  useEffect(() => {
    const targetId = selectedId as string
    if (!targetId) return
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })
      setMessages(data || [])

      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', targetId)
        .eq('receiver_id', currentUserId)
        .eq('read', false)
    }
    load()

    // Realtime Postgres listener for message insert/update
    const msgChannelName = `messages-${targetId}`
    const existingMsgChannel = supabase.getChannels().find(c => c.topic === msgChannelName)
    if (existingMsgChannel) {
      supabase.removeChannel(existingMsgChannel)
    }

    const channel = supabase
      .channel(msgChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        payload => {
          const msg = payload.new as Message
          if (
            (msg.sender_id === currentUserId && msg.receiver_id === targetId) ||
            (msg.sender_id === targetId && msg.receiver_id === currentUserId)
          ) {
            if (payload.eventType === 'INSERT') {
              setMessages(m => {
                if (m.some(x => x.id === msg.id)) return m
                return [...m, msg]
              })
              // Mark read in DB if active conversation
              if (msg.sender_id === targetId) {
                supabase.from('messages').update({ read: true }).eq('id', msg.id).then()
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages(m => m.map(x => x.id === msg.id ? msg : x))
            }
          }
        }
      )
      .subscribe()

    // Typing broadcast channel
    const typingChannelName = `typing-${targetId}`
    const existingTypingChannel = supabase.getChannels().find(c => c.topic === typingChannelName)
    if (existingTypingChannel) {
      supabase.removeChannel(existingTypingChannel)
    }

    const typingChannel = supabase
      .channel(typingChannelName)
      .on('broadcast', { event: 'typing' }, payload => {
        if (payload.payload.userId === targetId) {
          setFriendIsTyping(payload.payload.isTyping)
        }
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(channel)
      supabase.removeChannel(typingChannel)
    }
  }, [selectedId, currentUserId, supabase])

  // Scroll to Bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, friendIsTyping])

  // Handle typing broadcast trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    
    const channel = supabase.channel(`typing-${selectedId}`)
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping: true }
    })
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping: false }
      })
    }, 1500)
  }

  // Handle Attachment Selection
  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachmentFile(file)
    if (file.type.startsWith('image/')) {
      setAttachmentPreview(URL.createObjectURL(file))
    } else {
      setAttachmentPreview(null)
    }
  }

  // Clear Attachment
  const clearAttachment = () => {
    setAttachmentFile(null)
    setAttachmentPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Send message
  const sendMessage = async () => {
    if ((!input.trim() && !attachmentFile) || !selectedId || sending) return
    setSending(false)

    // Rate limits
    const allowed = await checkRateLimit(supabase, 'message', 20, '1 minute')
    if (!allowed) {
      toast.error('Messaging paused. You are sending messages too quickly.')
      return
    }

    setSending(true)
    let finalContent = input.trim()

    try {
      if (attachmentFile) {
        setUploadingAttachment(true)
        const fileExt = attachmentFile.name.split('.').pop()
        const fileName = `messages/${currentUserId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, attachmentFile)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        
        finalContent = `[attachment:${publicUrl}] ${finalContent}`
      }

      const msg = { sender_id: currentUserId, receiver_id: selectedId, content: finalContent, read: false }
      
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert([msg])
        .select('*')
        .single()

      if (error) throw error

      setMessages(m => {
        if (m.some(x => x.id === newMsg.id)) return m
        return [...m, newMsg]
      })

      setInput('')
      clearAttachment()
    } catch (e: any) {
      toast.error('Failed to send message: ' + e.message)
    } finally {
      setSending(false)
      setUploadingAttachment(false)
    }
  }

  // Keyboard handles
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault()
      sendMessage() 
    }
  }

  // Message Reactions toggle
  const toggleReaction = async (messageId: string, emoji: string) => {
    const msg = messages.find(m => m.id === messageId)
    if (!msg) return
    let currentReactions: Record<string, string[]> = {}
    let originalText = msg.content
    
    if (msg.content.includes('\n--reactions:')) {
      const parts = msg.content.split('\n--reactions:')
      originalText = parts[0]
      try {
        currentReactions = JSON.parse(parts[1])
      } catch (e) {}
    }

    if (!currentReactions[emoji]) {
      currentReactions[emoji] = []
    }

    if (currentReactions[emoji].includes(currentUserId)) {
      currentReactions[emoji] = currentReactions[emoji].filter(id => id !== currentUserId)
    } else {
      currentReactions[emoji].push(currentUserId)
    }

    if (currentReactions[emoji].length === 0) {
      delete currentReactions[emoji]
    }

    const newContent = Object.keys(currentReactions).length > 0 
      ? `${originalText}\n--reactions:${JSON.stringify(currentReactions)}`
      : originalText

    // Optimistic local update
    setMessages(msgs => msgs.map(m => m.id === messageId ? { ...m, content: newContent } : m))
    setActiveMessageIdForEmoji(null)

    await supabase.from('messages').update({ content: newContent }).eq('id', messageId)
  }

  // Filter & Search Messages in Conversation
  const searchedMessages = useMemo(() => {
    if (!messageSearchQuery.trim()) return messages
    return messages.filter(m => {
      const originalText = m.content.split('\n--reactions:')[0]
      return originalText.toLowerCase().includes(messageSearchQuery.toLowerCase())
    })
  }, [messages, messageSearchQuery])

  // Extract Shared Media
  const sharedMedia = useMemo(() => {
    const images: string[] = []
    messages.forEach(m => {
      const regex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/gi
      let match
      while ((match = regex.exec(m.content)) !== null) {
        images.push(match[1])
      }
      if (m.content.includes('[attachment:')) {
        const parts = m.content.split('[attachment:')
        parts.slice(1).forEach(part => {
          const url = part.split(']')[0]
          images.push(url)
        })
      }
    })
    return [...new Set(images)]
  }, [messages])

  // Helper: Display message content parsed
  const renderMessageContent = (msg: Message) => {
    const rawText = msg.content.split('\n--reactions:')[0]
    
    // Check for attachment marker
    if (rawText.startsWith('[attachment:')) {
      const match = rawText.match(/^\[attachment:(.*?)\](.*)$/)
      if (match) {
        const url = match[1]
        const text = match[2]
        const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || url.includes('avatars')
        return (
          <div className="space-y-2">
            {isImage ? (
              <img 
                src={url} 
                alt="Attachment" 
                className="max-w-full max-h-60 rounded-xl object-contain bg-zinc-950/20 border border-white/10"
              />
            ) : (
              <a 
                href={url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-white/10 text-cyan-400 hover:text-cyan-300 font-mono text-xs truncate max-w-sm"
              >
                <FileText size={16} />
                <span>Download Attachment</span>
              </a>
            )}
            {text && <p className="text-sm font-medium">{text}</p>}
          </div>
        )
      }
    }

    return <p className="text-sm font-medium whitespace-pre-wrap">{rawText}</p>
  }

  // Helper: Extract Reactions
  const getMessageReactions = (content: string) => {
    if (!content.includes('\n--reactions:')) return null
    try {
      const reactionsStr = content.split('\n--reactions:')[1]
      return JSON.parse(reactionsStr) as Record<string, string[]>
    } catch (e) {
      return null
    }
  }

  // Format timestamp helper
  const formatTime = (ts: string) => {
    try {
      return format(new Date(ts), 'h:mm a')
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="h-[calc(100vh-140px)] border border-white/[0.08] bg-[#090d16]/30 backdrop-blur-3xl rounded-3xl overflow-hidden flex shadow-2xl relative">
      
      {/* 1. Left Conversation Panel */}
      <div className={clsx(
        "w-full md:w-80 border-r border-white/[0.08] flex flex-col bg-[#030712]/30 shrink-0",
        selectedId && "hidden md:flex"
      )}>
        <div className="p-5 space-y-4 border-b border-white/[0.05]">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-black text-xl text-white tracking-tight">Direct Messages</h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {friends.length} peers
            </span>
          </div>

          {/* Search Contacts */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 text-neutral-500" size={14} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search peers by name..."
              className="w-full bg-[#030712]/40 border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-neutral-500 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 transition-all font-medium"
            />
          </div>
        </div>

        {/* Friends / Active Chats List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredFriends.length === 0 ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center mx-auto text-neutral-600 border border-white/[0.04]">
                <Info size={18} />
              </div>
              <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest leading-loose">No matches</p>
              <a href="/discover" className="btn-premium px-4 py-2 text-xs w-full justify-center text-center rounded-xl inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold">Find Connections</a>
            </div>
          ) : (
            filteredFriends.map(f => {
              const isSelected = selectedId === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                  className={clsx(
                    "w-full p-3 rounded-2xl flex items-center gap-3 transition-all duration-200 group text-left relative",
                    isSelected ? "bg-cyan-500/15 border border-cyan-500/30 shadow-lg" : "border border-transparent hover:bg-white/[0.03]"
                  )}
                >
                  <div className="relative w-11 h-11 shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-xl opacity-20 blur-sm group-hover:opacity-40" />
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08]">
                      {f.avatar_url ? (
                        <img src={f.avatar_url} alt={f.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-cyan-400">
                          {f.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                      )}
                    </div>
                    {/* Status pulsing dot */}
                    {onlineUsers.has(f.id) && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#090d16] rounded-full shadow-lg animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={clsx(
                      "text-xs font-bold truncate tracking-tight flex items-center gap-1.5",
                      isSelected ? "text-cyan-400" : "text-white"
                    )}>
                      {f.full_name}
                      {f.is_verified && <CheckCircle className="text-cyan-400 font-bold" size={12} />}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate font-mono uppercase mt-0.5">
                      {f.branch} · Year {f.year}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 2. Central Conversation Stream */}
      <div className={clsx(
        "flex-1 flex flex-col bg-[#030712]/10 relative min-w-0",
        !selectedId && "hidden md:flex"
      )}>
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 shadow-xl">
              <MessageCircle size={28} />
            </div>
            <h3 className="font-display font-black text-xl text-white tracking-tight">Direct Inbox</h3>
            <p className="text-xs text-neutral-400 mt-2 max-w-sm">Select a colleague from the left menu to secure an encrypted chat link.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="h-[73px] px-6 border-b border-white/[0.05] flex items-center justify-between bg-[#030712]/30 backdrop-blur-xl z-20">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setSelectedId(null)} 
                  className="md:hidden p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-white/[0.03] rounded-xl border border-white/[0.05]"
                >
                  <ArrowLeft size={16} />
                </button>
                
                <div className="relative w-10 h-10 shrink-0">
                  <div className="w-full h-full rounded-xl overflow-hidden border border-white/[0.08] bg-zinc-950">
                    {selectedFriend?.avatar_url ? (
                      <img src={selectedFriend.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-cyan-400">
                        {selectedFriend?.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                    )}
                  </div>
                  {onlineUsers.has(selectedFriend?.id || '') && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#090d16] rounded-full" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white tracking-tight truncate flex items-center gap-1.5">
                    {selectedFriend?.full_name}
                    {selectedFriend?.is_verified && <CheckCircle className="text-cyan-400" size={12} />}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {friendIsTyping ? (
                      <span className="text-[10px] text-cyan-400 font-mono tracking-wide animate-pulse">Typing...</span>
                    ) : (
                      <>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", onlineUsers.has(selectedFriend?.id || '') ? "bg-emerald-500" : "bg-zinc-600")} />
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {onlineUsers.has(selectedFriend?.id || '') ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action utilities */}
              <div className="flex items-center gap-2">
                {/* Search In Chat */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-2 text-neutral-500" size={12} />
                  <input
                    value={messageSearchQuery}
                    onChange={e => setMessageSearchQuery(e.target.value)}
                    placeholder="Search thread..."
                    className="bg-[#030712]/40 border border-white/[0.06] rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-zinc-300 placeholder:text-neutral-500 outline-none w-36 focus:w-48 focus:border-cyan-500/40 transition-all"
                  />
                </div>

                <button 
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className={clsx(
                    "p-2.5 rounded-xl border transition-all text-neutral-400 hover:text-white",
                    showRightPanel ? "bg-white/[0.05] border-white/10" : "bg-transparent border-white/[0.05]"
                  )}
                  aria-label="Toggle user details panel"
                >
                  <Info size={16} />
                </button>
              </div>
            </header>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-[#090d16]/10 to-[#030712]/30">
              {searchedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-2">
                  <MessageCircle className="text-4xl text-neutral-500" size={24} />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">No signals found</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {searchedMessages.map((m, idx) => {
                    const isOwn = m.sender_id === currentUserId
                    const prevMsg = searchedMessages[idx - 1]
                    const showDateHeader = !prevMsg || new Date(m.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 3600000
                    const reactions = getMessageReactions(m.content)

                    return (
                      <div key={m.id} className="space-y-1.5">
                        {showDateHeader && (
                          <div className="flex items-center justify-center py-4">
                            <span className="px-3 py-1 rounded-full text-[9px] font-mono text-neutral-500 uppercase tracking-widest bg-white/[0.02] border border-white/[0.04]">
                              {format(new Date(m.created_at), 'eeee, MMM d · h:mm a')}
                            </span>
                          </div>
                        )}
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={clsx(
                            "flex items-start gap-2.5 group relative",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          {/* Sender icon */}
                          {!isOwn && (
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/[0.05] bg-zinc-950 mt-0.5">
                              {selectedFriend?.avatar_url ? (
                                <img src={selectedFriend.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-cyan-400">
                                  {selectedFriend?.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message Box */}
                          <div className="relative">
                            <div className={clsx(
                              "px-4 py-2.5 rounded-2xl leading-relaxed shadow-lg max-w-sm md:max-w-md relative transition-all group-hover:shadow-[0_0_15px_rgba(6,182,212,0.02)]",
                              isOwn 
                                ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-tr-none" 
                                : "bg-[#0d121f]/75 border border-white/[0.08] text-neutral-100 rounded-tl-none"
                            )}>
                              {renderMessageContent(m)}
                            </div>

                            {/* Reactions display */}
                            {reactions && Object.keys(reactions).length > 0 && (
                              <div className={clsx(
                                "flex flex-wrap gap-1 mt-1.5 relative z-10",
                                isOwn ? "justify-end" : "justify-start"
                              )}>
                                {Object.entries(reactions).map(([emoji, userIds]) => {
                                  const reacted = userIds.includes(currentUserId)
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => toggleReaction(m.id, emoji)}
                                      className={clsx(
                                        "px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all select-none",
                                        reacted 
                                          ? "bg-cyan-500/25 border-cyan-500/30 text-cyan-400" 
                                          : "bg-white/[0.02] border-white/[0.04] text-neutral-400 hover:bg-white/[0.05]"
                                      )}
                                    >
                                      <span>{emoji}</span>
                                      <span className="font-mono text-[9px]">{userIds.length}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Float Options (Reactions picker trigger) */}
                          <div className={clsx(
                            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-20 px-2",
                            isOwn ? "right-full mr-2" : "left-full ml-2"
                          )}>
                            <button
                              onClick={() => setActiveMessageIdForEmoji(activeMessageIdForEmoji === m.id ? null : m.id)}
                              className="p-1.5 rounded-lg bg-zinc-950 border border-white/10 text-neutral-400 hover:text-white hover:scale-105 active:scale-95 transition-all"
                              aria-label="Add reaction"
                            >
                              <Smile size={13} />
                            </button>

                            {/* Reaction list pick overlay */}
                            {activeMessageIdForEmoji === m.id && (
                              <>
                                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveMessageIdForEmoji(null)} />
                                <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-zinc-950 border border-white/10 rounded-xl flex items-center gap-1 z-50 shadow-2xl animate-fade-in">
                                  {EMOJI_LIST.map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => toggleReaction(m.id, emoji)}
                                      className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg text-sm hover:scale-110 transition-transform active:scale-95"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}

                            {/* Time and Read Receipts */}
                            <span className="text-[9px] font-mono text-neutral-500 whitespace-nowrap">
                              {formatTime(m.created_at)}
                            </span>
                            
                            {isOwn && (
                              <span>
                                {m.read ? (
                                  <CheckCheck className="text-cyan-400" size={13} />
                                ) : (
                                  <Check className="text-neutral-500" size={13} />
                                )}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    )
                  })}
                </AnimatePresence>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Attachment preview panel */}
            {attachmentPreview && (
              <div className="p-3 border-t border-white/[0.05] bg-[#030712]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                    <img src={attachmentPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs text-white font-bold truncate max-w-xs">{attachmentFile?.name}</p>
                    <p className="text-[10px] text-neutral-500">Image Ready to Upload</p>
                  </div>
                </div>
                <button onClick={clearAttachment} className="p-2 text-neutral-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Input form */}
            <footer className="p-4 border-t border-white/[0.05] bg-[#030712]/30 backdrop-blur-xl">
              <div className="flex items-center gap-3 relative">
                
                {/* Trigger attachment input */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-[#0d121f]/50 border border-white/[0.06] rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.03] transition-colors"
                  aria-label="Add file attachment"
                >
                  <Paperclip size={16} />
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAttachmentSelect}
                  className="hidden"
                />

                {/* Message input */}
                <div className="flex-1 relative flex items-center">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKey}
                    placeholder={`Message ${selectedFriend?.full_name.split(' ')[0]}…`}
                    className="w-full bg-[#0d121f]/50 border border-white/[0.06] focus:border-cyan-500/50 rounded-xl pl-4 pr-10 py-3 text-xs text-zinc-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                  />
                  
                  {/* Inline Emoji Trigger */}
                  <button
                    onClick={() => setShowMainEmojiPicker(!showMainEmojiPicker)}
                    className="absolute right-3 text-neutral-500 hover:text-white transition-colors"
                    aria-label="Emoji picker"
                  >
                    <Smile size={16} />
                  </button>

                  {/* Inline Emoji Selector Overlay */}
                  {showMainEmojiPicker && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowMainEmojiPicker(false)} />
                      <div className="absolute bottom-full right-2 mb-2.5 p-2 bg-[#090d16] border border-white/10 rounded-2xl flex flex-wrap gap-1.5 w-44 z-50 shadow-2xl animate-fade-in">
                        {EMOJI_LIST.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setInput(prev => prev + emoji)
                              setShowMainEmojiPicker(false)
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-lg active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !attachmentFile) || sending}
                  className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shrink-0 flex items-center justify-center"
                  aria-label="Send message"
                >
                  {sending || uploadingAttachment ? (
                    <Loader2 size={16} className="animate-spin text-white" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* 3. Right Details Sidebar (Discord/Telegram style info panel) */}
      <AnimatePresence>
        {selectedId && showRightPanel && selectedFriend && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 300 }}
            exit={{ opacity: 0, width: 0 }}
            className="hidden lg:flex flex-col border-l border-white/[0.08] bg-[#030712]/30 shrink-0 overflow-y-auto custom-scrollbar"
          >
            <div className="p-6 text-center space-y-6">
              <h3 className="font-display font-black text-sm text-neutral-400 uppercase tracking-widest leading-none">Student Profile</h3>
              
              {/* Detailed profile details */}
              <div className="space-y-4">
                <div className="relative w-24 h-24 mx-auto rounded-3xl overflow-hidden border-2 border-cyan-500/30 bg-zinc-950 p-1 shadow-2xl">
                  {selectedFriend.avatar_url ? (
                    <img src={selectedFriend.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-extrabold text-2xl text-cyan-400 bg-gradient-to-tr from-cyan-900/30 to-purple-900/30 rounded-2xl">
                      {selectedFriend.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white flex items-center justify-center gap-1.5">
                    {selectedFriend.full_name}
                    {selectedFriend.is_verified && <CheckCircle className="text-cyan-400 shrink-0" size={14} />}
                  </h4>
                  {selectedFriend.role && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                      {selectedFriend.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Education block */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 text-left space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-medium">Branch</span>
                  <span className="text-white font-bold font-mono">{selectedFriend.branch || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-medium">Current Year</span>
                  <span className="text-white font-bold">{selectedFriend.year ? `Year ${selectedFriend.year}` : 'N/A'}</span>
                </div>
                {selectedFriend.hostel && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400 font-medium">Campus Hostel</span>
                    <span className="text-white font-bold">{selectedFriend.hostel}</span>
                  </div>
                )}
              </div>

              {/* Mutual Communities */}
              <div className="space-y-3 text-left">
                <p className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1">Mutual Communities</p>
                {mutualCommunities.length === 0 ? (
                  <p className="text-[11px] text-neutral-500 italic px-1">No mutual groups.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {mutualCommunities.map(comm => (
                      <div key={comm.id} className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-2.5 hover:border-cyan-500/10 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                          <MessageCircle size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white truncate">{comm.name}</p>
                          <p className="text-[9px] text-neutral-500 truncate leading-none mt-0.5">{comm.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shared Media */}
              <div className="space-y-3 text-left">
                <p className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-1">Shared Media</p>
                {sharedMedia.length === 0 ? (
                  <p className="text-[11px] text-neutral-500 italic px-1">No shared files yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {sharedMedia.slice(0, 6).map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="aspect-square rounded-xl bg-zinc-950 overflow-hidden border border-white/[0.05] hover:scale-105 transition-transform"
                      >
                        <img src={url} alt="Shared" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
