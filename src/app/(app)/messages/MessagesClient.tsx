'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { 
  ArrowLeft, Send, Search, Image as ImageIcon, Smile, Eye, Paperclip, 
  X, Check, CheckCheck, Loader2, Info, Folder, FileText, Heart, MessageCircle, Gamepad2, 
  ChevronRight, Lock, CheckCircle, Pin, PinOff, CornerUpLeft, Clock, Trash2, Sparkles
} from 'lucide-react'
import { createClient, checkRateLimit } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

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
  const { unreadByFriend, markConversationRead } = useUnreadMessages()
  
  // Real-time Presence State
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})

  // Auto animate hooks
  const [leftListRef] = useAutoAnimate()
  const [chatBodyRef] = useAutoAnimate()

  // Track selected ID via Ref to avoid dependency cycle in real-time callbacks
  const selectedIdRef = useRef<string | null>(null)
  useEffect(() => {
    selectedIdRef.current = selectedId
    if (selectedId) {
      // Persist read state to DB and update global unread context
      markConversationRead(selectedId, currentUserId)
    }
  }, [selectedId, currentUserId, markConversationRead])

  // Subscribing to Presence
  useEffect(() => {
    if (!currentUserId) return

    const presenceChannelName = 'global-online-presence'
    const existingPresenceChannel = supabase.getChannels().find((c: any) => c.topic === presenceChannelName)
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
      .subscribe(async (status: any) => {
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

  // Global Typing Signal Listener
  useEffect(() => {
    if (!currentUserId) return
    const typingChannel = supabase
      .channel(`typing-${currentUserId}`)
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const { userId, isTyping } = payload.payload
        setTypingUsers(prev => ({
          ...prev,
          [userId]: isTyping
        }))
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(typingChannel)
    }
  }, [currentUserId, supabase])

  // Parse query params for default selected conversation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const uId = params.get('userId')
      if (uId) {
        setSelectedId(uId)
      }
    }
  }, [])

  // Messages states
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  
  // Lists preview info states
  const [lastMessages, setLastMessages] = useState<Record<string, { content: string; created_at: string; sender_id: string; read: boolean }>>({})
  // unreadCounts is now sourced from the global useUnreadMessages context
  const unreadCounts = unreadByFriend
  const [pinnedIds, setPinnedIds] = useState<string[]>([])

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [listFilter, setListFilter] = useState<'all' | 'unread' | 'groups'>('all')
  const [showRightPanel, setShowRightPanel] = useState(true)

  // Reply Thread state
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)

  // Typing timeout ref and active typing channel
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingChannelRef = useRef<any>(null)

  // Pagination limit
  const [messagesLimit, setMessagesLimit] = useState(50)

  // Reset page limit on conversation switch
  useEffect(() => {
    setMessagesLimit(50)
    setReplyTo(null)
  }, [selectedId])

  // Emoji Popover states
  const [activeMessageIdForEmoji, setActiveMessageIdForEmoji] = useState<string | null>(null)
  const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false)

  // Mutual communities
  const [mutualCommunities, setMutualCommunities] = useState<any[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch Pinned conversations from localStorage
  useEffect(() => {
    if (!currentUserId) return
    const saved = localStorage.getItem(`pinned_chats_${currentUserId}`)
    if (saved) {
      try {
        setPinnedIds(JSON.parse(saved))
      } catch (e) {}
    }
  }, [currentUserId])

  // Toggle conversation Pin
  const togglePin = (friendId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPinnedIds(prev => {
      const updated = prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
      localStorage.setItem(`pinned_chats_${currentUserId}`, JSON.stringify(updated))
      return updated
    })
    toast.success(pinnedIds.includes(friendId) ? 'Conversation unpinned' : 'Conversation pinned')
  }

  // Process Friends list
  const friends = useMemo(() => {
    return friendships.map(f =>
      f.requester_id === currentUserId ? f.addressee : f.requester
    ).filter(Boolean)
  }, [friendships, currentUserId])

  // Fetch last messages preview map (last message content per conversation)
  useEffect(() => {
    if (!currentUserId) return
    
    const fetchPreviews = async () => {
      try {
        const { data: msgs, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false })
        
        if (error) throw error

        const lastMsgMap: typeof lastMessages = {}

        if (msgs) {
          msgs.forEach((m: Message) => {
            const friendId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id
            if (!lastMsgMap[friendId]) {
              lastMsgMap[friendId] = {
                content: m.content,
                created_at: m.created_at,
                sender_id: m.sender_id,
                read: m.read
              }
            }
          })
        }

        setLastMessages(lastMsgMap)
      } catch (err) {
        console.error('Error fetching chat previews:', err)
      }
    }

    fetchPreviews()

    // Realtime message previews sync — only update lastMessages, unread counts managed by global hook
    const previewChannel = supabase
      .channel('chat-list-previews-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload: any) => {
        const m = payload.new as Message
        if (m.sender_id === currentUserId || m.receiver_id === currentUserId) {
          const friendId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id
          
          setLastMessages(prev => ({
            ...prev,
            [friendId]: {
              content: m.content,
              created_at: m.created_at,
              sender_id: m.sender_id,
              read: m.read
            }
          }))
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, (payload: any) => {
        const m = payload.new as Message
        if (m.sender_id === currentUserId || m.receiver_id === currentUserId) {
          const friendId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id
          setLastMessages(prev => {
            const current = prev[friendId]
            if (current && current.created_at === m.created_at) {
              return {
                ...prev,
                [friendId]: {
                  ...current,
                  read: m.read
                }
              }
            }
            return prev
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(previewChannel)
    }
  }, [currentUserId, supabase])

  // Filter and Sort Friends
  const sortedAndFilteredFriends = useMemo(() => {
    // 1. Filter by search query
    let result = friends
    if (searchQuery.trim()) {
      result = result.filter(f => 
        f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.branch && f.branch.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // 2. Filter by list filter tabs
    if (listFilter === 'unread') {
      result = result.filter(f => (unreadCounts[f.id] || 0) > 0)
    }

    // 3. Sort: Pinned first, then by last message timestamp, then alphabetical
    return [...result].sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id)
      const bPinned = pinnedIds.includes(b.id)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1

      const aTime = lastMessages[a.id] ? new Date(lastMessages[a.id].created_at).getTime() : 0
      const bTime = lastMessages[b.id] ? new Date(lastMessages[b.id].created_at).getTime() : 0
      if (aTime !== bTime) {
        return bTime - aTime // descending
      }

      return a.full_name.localeCompare(b.full_name)
    })
  }, [friends, searchQuery, listFilter, unreadCounts, pinnedIds, lastMessages])

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
          const myIds = new Set(myCommsRes.data.map((c: any) => c.community_id))
          const mutual = friendCommsRes.data
            .filter((c: any) => myIds.has(c.community_id))
            .map((c: any) => c.communities)
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
        .order('created_at', { ascending: false })
        .limit(messagesLimit)
      setMessages((data || []).reverse())

      // Mark unread messages as read via global hook (persists to DB + updates global state)
      markConversationRead(targetId, currentUserId)
    }
    load()

    // Realtime Postgres listener for messages table
    const msgChannelName = `messages-${targetId}`
    const existingMsgChannel = supabase.getChannels().find((c: any) => c.topic === msgChannelName)
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
        (payload: any) => {
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
              if (msg.sender_id === targetId) {
                // Mark incoming message as read immediately via global hook
                markConversationRead(targetId, currentUserId)
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages(m => m.map(x => x.id === msg.id ? msg : x))
            }
          }
        }
      )
      .subscribe()

    // Typing broadcast receiver for selected colleague
    const typingChannelName = `typing-${targetId}`
    const existingTypingChannel = supabase.getChannels().find((c: any) => c.topic === typingChannelName)
    if (existingTypingChannel) {
      supabase.removeChannel(existingTypingChannel)
    }

    const typingChannel = supabase
      .channel(typingChannelName)
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload.payload.userId === targetId) {
          // This sets standard typing state for chat stream header
          setFriendIsTyping(payload.payload.isTyping)
        }
      })
      .subscribe()

    typingChannelRef.current = typingChannel

    return () => { 
      supabase.removeChannel(channel)
      supabase.removeChannel(typingChannel)
      typingChannelRef.current = null
    }
  }, [selectedId, currentUserId, supabase, messagesLimit, markConversationRead])

  const [friendIsTyping, setFriendIsTyping] = useState(false)

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, friendIsTyping, replyTo])

  // Handle typing signal emitter
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    
    // Broadcast typing signal to typing-FriendId channel so they receive it
    if (selectedId) {
      const typingChannel = supabase.channel(`typing-${selectedId}`)
      typingChannel.subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          typingChannel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentUserId, isTyping: true }
          })
        }
      })
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedId) {
        const typingChannel = supabase.channel(`typing-${selectedId}`)
        typingChannel.subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            typingChannel.send({
              type: 'broadcast',
              event: 'typing',
              payload: { userId: currentUserId, isTyping: false }
            })
          }
        })
      }
    }, 1500)
  }

  // Handle attachment selection
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

  const clearAttachment = () => {
    setAttachmentFile(null)
    setAttachmentPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Send message
  const sendMessage = async () => {
    if ((!input.trim() && !attachmentFile) || !selectedId || sending) return
    setSending(false)

    // Check rate limit
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
        const fileName = `${currentUserId}/messages/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, attachmentFile)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        
        finalContent = `[attachment:${publicUrl}] ${finalContent}`
      }

      // If replying to a message
      if (replyTo) {
        finalContent = `[reply:${replyTo.id}] ${finalContent}`
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
      setReplyTo(null)
      clearAttachment()
    } catch (e: any) {
      toast.error('Failed to send message: ' + e.message)
    } finally {
      setSending(false)
      setUploadingAttachment(false)
    }
  }

  // Keyboard hooks
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault()
      sendMessage() 
    }
  }

  // Toggle emoji reaction
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

  // Filter messages in selected conversation
  const searchedMessages = useMemo(() => {
    if (!messageSearchQuery.trim()) return messages
    return messages.filter(m => {
      const originalText = m.content.split('\n--reactions:')[0]
      return originalText.toLowerCase().includes(messageSearchQuery.toLowerCase())
    })
  }, [messages, messageSearchQuery])

  // Extract shared media
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

  // Content parsing: attachments, replies, emoji reactions
  const parseMessageData = (msg: Message) => {
    let rawText = msg.content.split('\n--reactions:')[0]
    let replyId: string | null = null
    let replyMsg: Message | null = null

    // Check for reply format: [reply:msgId] content
    if (rawText.startsWith('[reply:')) {
      const match = rawText.match(/^\[reply:(.*?)\](.*)$/)
      if (match) {
        replyId = match[1]
        rawText = match[2].trim()
        replyMsg = messages.find(m => m.id === replyId) || null
      }
    }

    let attachmentUrl: string | null = null
    let isImageAttachment = false

    // Check for attachment format: [attachment:URL] content
    if (rawText.startsWith('[attachment:')) {
      const match = rawText.match(/^\[attachment:(.*?)\](.*)$/)
      if (match) {
        attachmentUrl = match[1]
        rawText = match[2].trim()
        isImageAttachment = !!attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || attachmentUrl.includes('avatars')
      }
    }

    return { rawText, replyId, replyMsg, attachmentUrl, isImageAttachment }
  }

  // Render message parsed content
  const renderParsedContent = (msg: Message) => {
    const { rawText, attachmentUrl, isImageAttachment } = parseMessageData(msg)

    return (
      <div className="space-y-1.5">
        {attachmentUrl && (
          <div className="rounded-xl overflow-hidden max-w-sm mt-1">
            {isImageAttachment ? (
              <img 
                src={attachmentUrl} 
                alt="Attachment" 
                className="max-w-full max-h-60 rounded-xl object-contain bg-zinc-950/20 border border-white/10"
              />
            ) : (
              <a 
                href={attachmentUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900 border border-white/10 text-cyan-400 hover:text-cyan-300 font-mono text-xs truncate"
              >
                <FileText size={15} />
                <span className="truncate">Download Attachment</span>
              </a>
            )}
          </div>
        )}
        {rawText && <p className="text-xs sm:text-[13px] leading-relaxed font-medium whitespace-pre-wrap">{rawText}</p>}
      </div>
    )
  }

  // Parse emoji reactions
  const getMessageReactions = (content: string) => {
    if (!content.includes('\n--reactions:')) return null
    try {
      const reactionsStr = content.split('\n--reactions:')[1]
      return JSON.parse(reactionsStr) as Record<string, string[]>
    } catch (e) {
      return null
    }
  }

  const formatMsgTime = (ts: string) => {
    try {
      const d = new Date(ts)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHrs = Math.floor(diffMins / 60)
      if (diffHrs < 24) return `${diffHrs}h ago`
      if (diffHrs < 48) return 'Yesterday'
      return format(d, 'd MMM')
    } catch (e) {
      return ''
    }
  }

  const formatTime = (ts: string) => {
    try {
      return format(new Date(ts), 'h:mm a')
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="h-[calc(100vh-130px)] border border-white/[0.08] bg-[#090d16]/30 backdrop-blur-3xl rounded-3xl overflow-hidden flex shadow-2xl relative select-none">
      
      {/* 1. Direct Messages Side Bar (Redesigned Conversation list) */}
      <div className={clsx(
        "w-full md:w-80 border-r border-white/[0.08] flex flex-col bg-[#030712]/30 shrink-0 select-none",
        selectedId && "hidden md:flex"
      )}>
        {/* Header & title */}
        <div className="p-4 space-y-3.5 border-b border-white/[0.05] shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-cyan-400" />
              <h2 className="font-display font-black text-sm text-zinc-100 tracking-tight">Direct Messages</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
              {friends.length} chats
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={13} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#030712]/40 border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 transition-all font-medium"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] p-1 rounded-xl">
            <button
              onClick={() => setListFilter('all')}
              className={clsx(
                "flex-1 text-[9px] font-mono uppercase py-1 rounded-lg font-bold transition-all text-center",
                listFilter === 'all' ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              All
            </button>
            <button
              onClick={() => setListFilter('unread')}
              className={clsx(
                "flex-1 text-[9px] font-mono uppercase py-1 rounded-lg font-bold transition-all text-center relative",
                listFilter === 'unread' ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Unread
              {Object.values(unreadCounts).some(c => c > 0) && (
                <span className="absolute top-0.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              )}
            </button>
            <button
              onClick={() => setListFilter('groups')}
              className={clsx(
                "flex-1 text-[9px] font-mono uppercase py-1 rounded-lg font-bold transition-all text-center",
                listFilter === 'groups' ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Conversation List container */}
        <div ref={leftListRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {listFilter === 'groups' ? (
            // Groups explanation panel
            <div className="p-6 text-center space-y-3.5 select-none">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mx-auto text-cyan-400">
                <Gamepad2 size={16} />
              </div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Community Channels</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Group chats are managed natively under community spaces. Head to communities to join discussions.
              </p>
              <a 
                href="/communities" 
                className="btn-premium px-3.5 py-1.5 text-[10px] justify-center tracking-wider uppercase font-mono bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 inline-block w-full text-center"
              >
                Go to Communities
              </a>
            </div>
          ) : sortedAndFilteredFriends.length === 0 ? (
            <div className="p-8 text-center space-y-4 select-none">
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center mx-auto text-zinc-600 border border-white/[0.04]">
                <Info size={16} />
              </div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">No conversations</p>
              <a 
                href="/discover" 
                className="btn-premium px-4 py-2 text-xs w-full justify-center text-center rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all inline-block"
              >
                Discover Connections
              </a>
            </div>
          ) : (
            sortedAndFilteredFriends.map(f => {
              const isSelected = selectedId === f.id
              const isPinned = pinnedIds.includes(f.id)
              const lastMsg = lastMessages[f.id]
              const unreadCount = unreadCounts[f.id] || 0
              const isTyping = typingUsers[f.id]
              const isOnline = onlineUsers.has(f.id)

              // Clean text preview of last message
              let lastMsgText = ''
              if (lastMsg) {
                const parsed = parseMessageData({ content: lastMsg.content } as Message)
                lastMsgText = parsed.rawText || (parsed.attachmentUrl ? '📷 Attachment' : '')
              }

              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                  className={clsx(
                    "w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all duration-200 group text-left relative border border-transparent select-none",
                    isSelected 
                      ? "bg-cyan-500/10 border-cyan-500/20 shadow-md" 
                      : "hover:bg-white/[0.02] hover:border-white/[0.04]"
                  )}
                >
                  {/* Left Avatar & Status Indicator */}
                  <div className="relative w-10 h-10 shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-xl opacity-10 blur-sm group-hover:opacity-30" />
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08]">
                      {f.avatar_url ? (
                        <img src={f.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-cyan-400">
                          {f.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                      )}
                    </div>
                    {/* Pulsing online indicator dot */}
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#090d16] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                    )}
                  </div>

                  {/* Message Previews */}
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center justify-between gap-1">
                      <p className={clsx(
                        "text-[12px] font-bold truncate tracking-tight flex items-center gap-1.5",
                        isSelected ? "text-cyan-400" : "text-white"
                      )}>
                        {f.full_name}
                        {f.is_verified && <CheckCircle className="text-cyan-400 shrink-0" size={11} />}
                      </p>
                      {lastMsg && (
                        <span className="text-[9px] font-mono text-zinc-500 shrink-0 select-none">
                          {formatMsgTime(lastMsg.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      {isTyping ? (
                        <span className="text-[10px] text-cyan-400 font-mono tracking-wide animate-pulse">typing...</span>
                      ) : (
                        <p className={clsx(
                          "text-[11px] truncate leading-normal",
                          unreadCount > 0 ? "text-white font-bold" : "text-zinc-500"
                        )}>
                          {lastMsgText || "No messages yet"}
                        </p>
                      )}

                      {/* Pins and Unreads Badges */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isPinned && <Pin size={10} className="text-zinc-500" />}
                        {unreadCount > 0 && (
                          <span className="bg-cyan-500 text-zinc-950 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pin overlay toggle */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => togglePin(f.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        togglePin(f.id, e as any);
                      }
                    }}
                    className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded-md text-zinc-500 hover:text-white transition-all z-10"
                    title={isPinned ? "Unpin Chat" : "Pin Chat"}
                    aria-label={isPinned ? "Unpin Chat" : "Pin Chat"}
                  >
                    {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 2. Central Conversation Stream Pane */}
      <div className={clsx(
        "flex-1 flex flex-col bg-[#030712]/10 relative min-w-0 select-none",
        !selectedId && "hidden md:flex"
      )}>
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 shadow-xl">
              <MessageCircle size={26} />
            </div>
            <h3 className="font-display font-black text-md text-zinc-200 tracking-tight uppercase font-mono">Direct Inbox</h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
              Select a classmate from the list to start a secure direct chat session.
            </p>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <header className="h-[73px] px-4 sm:px-6 border-b border-white/[0.05] flex items-center justify-between bg-[#030712]/30 backdrop-blur-xl z-20 select-none shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setSelectedId(null)} 
                  className="md:hidden p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-white/[0.03] rounded-xl border border-white/[0.05]"
                  aria-label="Back to chat list"
                >
                  <ArrowLeft size={15} />
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
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#090d16] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white tracking-tight truncate flex items-center gap-1.5">
                    {selectedFriend?.full_name}
                    {selectedFriend?.is_verified && <CheckCircle className="text-cyan-400 shrink-0" size={11} />}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 select-none">
                    {friendIsTyping ? (
                      <span className="text-[10px] text-cyan-400 font-mono tracking-wide animate-pulse">typing...</span>
                    ) : (
                      <>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", onlineUsers.has(selectedFriend?.id || '') ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "bg-zinc-600")} />
                        <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                          {onlineUsers.has(selectedFriend?.id || '') ? 'Online' : 'Offline'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action tabs / Search thread */}
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-2.5 text-zinc-500" size={12} />
                  <input
                    value={messageSearchQuery}
                    onChange={e => setMessageSearchQuery(e.target.value)}
                    placeholder="Search thread..."
                    className="bg-[#030712]/40 border border-white/[0.06] rounded-xl pl-8 pr-3 py-1.5 text-[10px] text-zinc-300 placeholder:text-zinc-500 outline-none w-32 focus:w-44 focus:border-cyan-500/40 transition-all font-medium"
                  />
                </div>

                <button 
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className={clsx(
                    "p-2 rounded-xl border transition-all text-zinc-400 hover:text-white",
                    showRightPanel ? "bg-white/[0.05] border-white/10" : "bg-transparent border-white/[0.05]"
                  )}
                  title="Toggle details panel"
                  aria-label="Toggle details panel"
                >
                  <Info size={15} />
                </button>
              </div>
            </header>

            {/* Scrollable conversation bubble panel */}
            <div 
              ref={chatBodyRef}
              onScroll={(e) => {
                const target = e.currentTarget
                if (target.scrollTop === 0 && messages.length >= messagesLimit) {
                  const previousScrollHeight = target.scrollHeight
                  setMessagesLimit(prev => prev + 50)
                  setTimeout(() => {
                    target.scrollTop = target.scrollHeight - previousScrollHeight
                  }, 100)
                }
              }}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-[#090d16]/10 to-[#030712]/20"
            >
              {searchedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-2">
                  <MessageCircle className="text-zinc-500" size={24} />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">No messages yet</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {searchedMessages.map((m, idx) => {
                    const isOwn = m.sender_id === currentUserId
                    const prevMsg = searchedMessages[idx - 1]
                    
                    // Show sticky date separators if 1 hr gap exists or first message
                    const showDateHeader = !prevMsg || new Date(m.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 3600000
                    const reactions = getMessageReactions(m.content)
                    const parsed = parseMessageData(m)

                    return (
                      <div key={m.id} className="space-y-2">
                        {showDateHeader && (
                          <div className="flex items-center justify-center py-4 select-none">
                            <span className="px-3 py-1 rounded-full text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest bg-white/[0.02] border border-white/[0.04]">
                              {format(new Date(m.created_at), 'eeee, MMM d · h:mm a')}
                            </span>
                          </div>
                        )}
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className={clsx(
                            "flex items-start gap-2.5 group relative",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          {/* Colleague Avatar */}
                          {!isOwn && (
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/[0.05] bg-zinc-950 mt-1 select-none">
                              {selectedFriend?.avatar_url ? (
                                <img src={selectedFriend.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-cyan-400">
                                  {selectedFriend?.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message box body */}
                          <div className="relative max-w-[70%] sm:max-w-[60%] flex flex-col">
                            
                            {/* Reply Source Banner */}
                            {parsed.replyMsg && (
                              <div className={clsx(
                                "mb-1 text-[10px] text-zinc-500 flex items-center gap-1.5 px-2.5 py-1 rounded-t-xl bg-white/[0.02] border border-white/[0.03] max-w-max truncate select-none border-b-0",
                                isOwn ? "self-end" : "self-start"
                              )}>
                                <CornerUpLeft size={10} className="shrink-0" />
                                <span className="font-semibold text-zinc-400">
                                  {parsed.replyMsg.sender_id === currentUserId ? 'You' : selectedFriend?.full_name.split(' ')[0]}
                                </span>
                                <span className="truncate italic">
                                  {parseMessageData(parsed.replyMsg).rawText}
                                </span>
                              </div>
                            )}

                            {/* Main Message Bubble */}
                            <div className={clsx(
                              "px-4 py-2.5 rounded-2xl shadow-lg relative border transition-all",
                              isOwn 
                                ? "bg-gradient-to-br from-cyan-600/80 to-blue-600/80 border-cyan-500/20 text-white rounded-tr-none" 
                                : "bg-[#0d121f]/80 border-white/[0.06] text-zinc-200 rounded-tl-none",
                              parsed.replyMsg && (isOwn ? "rounded-tr-none" : "rounded-tl-none")
                            )}>
                              {renderParsedContent(m)}
                            </div>

                            {/* Reactions display row */}
                            {reactions && Object.keys(reactions).length > 0 && (
                              <div className={clsx(
                                "flex flex-wrap gap-1 mt-1.5 z-10 select-none",
                                isOwn ? "justify-end" : "justify-start"
                              )}>
                                {Object.entries(reactions).map(([emoji, userIds]) => {
                                  const reacted = userIds.includes(currentUserId)
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => toggleReaction(m.id, emoji)}
                                      className={clsx(
                                        "px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all",
                                        reacted 
                                          ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" 
                                          : "bg-white/[0.02] border-white/[0.04] text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                                      )}
                                    >
                                      <span>{emoji}</span>
                                      <span className="font-mono text-[9px]">{userIds.length}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            )}

                            {/* Meta & Status Ticks (Delivered / Read receipts) */}
                            <div className={clsx(
                              "flex items-center gap-1.5 mt-1 select-none",
                              isOwn ? "justify-end" : "justify-start"
                            )}>
                              <span className="text-[8px] font-mono text-zinc-500 tracking-wider">
                                {formatTime(m.created_at)}
                              </span>
                              {isOwn && (
                                <span className="transition-transform group-hover:scale-110">
                                  {m.read ? (
                                    <CheckCheck className="text-cyan-400" size={12} />
                                  ) : (
                                    <Check className="text-zinc-500" size={12} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover utilities: reaction picker + reply action */}
                          <div className={clsx(
                            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-zinc-950/80 backdrop-blur-sm border border-white/[0.08] p-0.5 rounded-lg z-20 shadow-xl",
                            isOwn ? "right-full mr-3.5" : "left-full ml-3.5"
                          )}>
                            <button
                              onClick={() => setReplyTo(m)}
                              className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded transition-colors"
                              title="Reply"
                              aria-label="Reply to message"
                            >
                              <CornerUpLeft size={11} />
                            </button>
                            <button
                              onClick={() => setActiveMessageIdForEmoji(activeMessageIdForEmoji === m.id ? null : m.id)}
                              className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded transition-colors"
                              title="React"
                              aria-label="Add reaction"
                            >
                              <Smile size={11} />
                            </button>

                            {/* Hover Emoji Selector */}
                            {activeMessageIdForEmoji === m.id && (
                              <>
                                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveMessageIdForEmoji(null)} />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 p-1 bg-zinc-900 border border-white/[0.08] rounded-lg flex items-center gap-0.5 z-50 shadow-2xl">
                                  {EMOJI_LIST.map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => toggleReaction(m.id, emoji)}
                                      className="w-6 h-6 flex items-center justify-center hover:bg-white/5 rounded text-xs transition-transform active:scale-90 hover:scale-110"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </>
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

            {/* Replying banner */}
            {replyTo && (
              <div className="px-4 py-2 bg-zinc-950/60 border-t border-white/[0.05] flex items-center justify-between select-none">
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 truncate">
                  <CornerUpLeft size={11} className="text-cyan-400" />
                  <span>Replying to <span className="font-bold text-zinc-200">{replyTo.sender_id === currentUserId ? 'yourself' : selectedFriend?.full_name.split(' ')[0]}</span></span>
                  <span className="truncate italic text-zinc-500">&ldquo;{parseMessageData(replyTo).rawText}&rdquo;</span>
                </div>
                <button 
                  onClick={() => setReplyTo(null)}
                  className="p-1 text-zinc-500 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Attachment preview box */}
            {attachmentPreview && (
              <div className="p-3 border-t border-white/[0.05] bg-[#030712]/30 flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                    <img src={attachmentPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white font-bold truncate max-w-xs">{attachmentFile?.name}</p>
                    <p className="text-[9px] text-zinc-500">Ready to upload</p>
                  </div>
                </div>
                <button onClick={clearAttachment} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Composer Footer input */}
            <footer className="p-4 border-t border-white/[0.05] bg-[#030712]/30 backdrop-blur-xl shrink-0 select-none">
              <div className="flex items-center gap-2 relative">
                
                {/* Paperclip upload trigger */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-[#0d121f]/50 border border-white/[0.06] rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors"
                  aria-label="Add file attachment"
                >
                  <Paperclip size={15} />
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAttachmentSelect}
                  className="hidden"
                />

                {/* Text input */}
                <div className="flex-1 relative flex items-center">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKey}
                    placeholder={`Message ${selectedFriend?.full_name.split(' ')[0]}…`}
                    className="w-full bg-[#0d121f]/50 border border-white/[0.06] focus:border-cyan-500/50 rounded-xl pl-4 pr-10 py-3 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none transition-all shadow-inner font-medium"
                  />
                  
                  {/* Inline Smile Trigger */}
                  <button
                    onClick={() => setShowMainEmojiPicker(!showMainEmojiPicker)}
                    className="absolute right-3 text-zinc-500 hover:text-white transition-colors"
                    aria-label="Emoji picker"
                  >
                    <Smile size={15} />
                  </button>

                  {/* Keyboard emoji menu panel */}
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
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-sm transition-all active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Send action button */}
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !attachmentFile) || sending}
                  className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shrink-0 flex items-center justify-center"
                  aria-label="Send message"
                >
                  {sending || uploadingAttachment ? (
                    <Loader2 size={15} className="animate-spin text-white" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* 3. Colleague details sidebar */}
      <AnimatePresence>
        {selectedId && showRightPanel && selectedFriend && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 280 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="hidden lg:flex flex-col border-l border-white/[0.08] bg-[#030712]/30 shrink-0 overflow-y-auto custom-scrollbar select-none"
          >
            <div className="p-5 text-center space-y-5 select-none">
              <h3 className="font-display font-black text-[9px] text-zinc-500 uppercase tracking-widest leading-none">Student Profile</h3>
              
              {/* Detailed avatar/name box */}
              <div className="space-y-3 select-none">
                <div className="relative w-20 h-20 mx-auto rounded-2xl overflow-hidden border border-cyan-500/20 bg-zinc-950 p-0.5 shadow-2xl">
                  {selectedFriend.avatar_url ? (
                    <img src={selectedFriend.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-extrabold text-xl text-cyan-400 bg-gradient-to-tr from-cyan-950 to-blue-950 rounded-xl">
                      {selectedFriend.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-[13px] font-black text-white flex items-center justify-center gap-1">
                    {selectedFriend.full_name}
                    {selectedFriend.is_verified && <CheckCircle className="text-cyan-400 shrink-0" size={12} />}
                  </h4>
                  {selectedFriend.role && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                      {selectedFriend.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Education section info box */}
              <div className="rounded-xl bg-white/[0.01] border border-white/[0.03] p-3 text-left space-y-2.5 shadow-inner">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider font-mono">Branch</span>
                  <span className="text-zinc-200 font-bold">{selectedFriend.branch || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider font-mono">Academic Year</span>
                  <span className="text-zinc-200 font-bold">{selectedFriend.year ? `Year ${selectedFriend.year}` : 'N/A'}</span>
                </div>
                {selectedFriend.hostel && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider font-mono">Hostel block</span>
                    <span className="text-zinc-200 font-bold">{selectedFriend.hostel}</span>
                  </div>
                )}
              </div>

              {/* Mutual groups list */}
              <div className="space-y-2.5 text-left">
                <p className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Mutual Communities</p>
                {mutualCommunities.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 italic px-1">No mutual groups.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {mutualCommunities.map(comm => (
                      <div key={comm.id} className="p-2 rounded-xl bg-white/[0.01] border border-white/[0.03] flex items-center gap-2 hover:border-cyan-500/10 transition-colors">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                          <MessageCircle size={12} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-zinc-200 truncate">{comm.name}</p>
                          <p className="text-[8px] text-zinc-500 truncate leading-none mt-0.5">{comm.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shared files media list */}
              <div className="space-y-2.5 text-left">
                <p className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Shared Media</p>
                {sharedMedia.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 italic px-1">No shared files yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {sharedMedia.slice(0, 6).map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="aspect-square rounded-lg bg-zinc-950 overflow-hidden border border-white/[0.04] hover:scale-105 transition-all shadow"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
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
