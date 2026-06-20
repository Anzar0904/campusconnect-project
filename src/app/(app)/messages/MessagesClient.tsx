'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { createClient, checkRateLimit } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { EmptyState } from '@/components/ui/EmptyState'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  branch: string | null
  year: number | null
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

function Avatar({ p }: { p: Profile }) {
  const url = p.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(p.full_name)}&backgroundColor=4f46e5&textColor=ffffff`
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden ring-1 ring-white/10">
      <Image src={url} alt={p.full_name} width={40} height={40} className="object-cover w-full h-full" />
    </div>
  )
}

export default function MessagesClient({
  friendships,
  currentUserId,
}: {
  friendships: Friendship[]
  currentUserId: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const friends = friendships.map(f =>
    f.requester_id === currentUserId ? f.addressee : f.requester
  ).filter(Boolean)

  const selectedFriend = friends.find(f => f.id === selectedId)

  // Load messages when friend selected
  useEffect(() => {
    if (!selectedId) return
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedId}),and(sender_id.eq.${selectedId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })
      setMessages(data || [])
    }
    load()

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`,
      }, payload => {
        if (payload.new.sender_id === selectedId) {
          setMessages(m => [...m, payload.new as Message])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedId, currentUserId, supabase])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !selectedId || sending) return
    setSending(true)

    // Rate limit check
    const allowed = await checkRateLimit(supabase, 'message', 20, '1 minute')
    if (!allowed) {
      toast.error('Messaging paused. You are sending messages too quickly.')
      setSending(false)
      return
    }

    const msg = { sender_id: currentUserId, receiver_id: selectedId, content: input.trim(), read: false }
    setMessages(m => [...m, { ...msg, id: Date.now().toString(), created_at: new Date().toISOString() }])
    setInput('')
    await supabase.from('messages').insert(msg)
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card-premium h-[calc(100vh-140px)] overflow-hidden flex flex-col md:flex-row animate-fade-in">
      {/* Sidebar: Friend List */}
      <div className={clsx(
        "w-full md:w-80 border-r border-white/[0.05] flex flex-col bg-zinc-900/10 transition-all",
        selectedId && "hidden md:flex"
      )}>
        <div className="p-5 border-b border-white/[0.05] bg-zinc-900/20">
          <p className="section-label mb-1">MESSAGES</p>
          <h2 className="sub-heading text-lg">Your Chats</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {friends.length === 0 ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto text-zinc-600 border border-white/[0.03]">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest leading-loose">No friends yet</p>
              <a href="/discover" className="btn-premium px-4 py-2 text-xs w-full justify-center">Find Connections</a>
            </div>
          ) : (
            friends.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={clsx(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 group",
                  selectedId === f.id ? "bg-brand-500/10 ring-1 ring-brand-500/20 shadow-lg" : "hover:bg-white/[0.03]"
                )}
              >
                <div className="w-11 h-11 shrink-0">
                  <Avatar p={f} />
                </div>
                <div className="min-w-0 text-left">
                  <p className={clsx(
                    "text-sm font-semibold truncate",
                    selectedId === f.id ? "text-brand-400" : "text-zinc-200 group-hover:text-zinc-100"
                  )}>{f.full_name}</p>
                  <p className="text-[10px] text-zinc-500 truncate font-mono uppercase tracking-tighter">
                    {f.branch} · Year {f.year}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={clsx(
        "flex-1 flex flex-col bg-zinc-900/5 relative",
        !selectedId && "hidden md:flex"
      )}>
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <EmptyState 
              icon="forum"
              title="Inbox"
              description="Choose a connection from the left to start chatting with your campus peers."
            />
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="h-[73px] px-6 border-b border-white/[0.05] flex items-center justify-between bg-zinc-900/40 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedId(null)} 
                  className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-white/[0.03] rounded-lg border border-white/[0.05]"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <div className="w-10 h-10">
                  <Avatar p={selectedFriend!} />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-50 tracking-tight">{selectedFriend?.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
                    <p className="text-[10px] text-brand-400 font-mono uppercase tracking-widest">Active Now</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-zinc-900/10">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-3">
                  <span className="material-symbols-outlined text-4xl">waving_hand</span>
                  <p className="text-xs font-mono uppercase tracking-[0.2em]">Start the conversation</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((m, idx) => {
                    const isOwn = m.sender_id === currentUserId
                    const prevMsg = messages[idx - 1]
                    const showTime = !prevMsg || new Date(m.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000

                    return (
                      <motion.div 
                        key={m.id}
                        initial={{ opacity: 0, x: isOwn ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className={clsx(
                          "flex flex-col group",
                          isOwn ? "items-end" : "items-start"
                        )}
                      >
                        {showTime && (
                          <span className="w-full text-center py-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                            {format(new Date(m.created_at), 'eeee, h:mm a')}
                          </span>
                        )}
                        <div className={clsx(
                          "max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-lg transition-all",
                          isOwn 
                            ? "bg-brand-500 text-white rounded-tr-none hover:bg-brand-400" 
                            : "bg-zinc-800 text-zinc-100 rounded-tl-none border border-white/[0.05] hover:bg-zinc-700"
                        )}>
                          {m.content}
                        </div>
                        <span className="text-[9px] font-mono text-zinc-600 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                          {formatTime(m.created_at)}
                        </span>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <footer className="p-4 border-t border-white/[0.05] bg-zinc-900/40 backdrop-blur-sm">
              <div className="relative flex items-center gap-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Message ${selectedFriend?.full_name.split(' ')[0]}…`}
                  className="flex-1 bg-zinc-800/40 border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-zinc-100 outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 placeholder:text-zinc-600 transition-all shadow-inner"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="btn-premium p-3.5 min-w-0 rounded-xl disabled:opacity-50 shadow-brand-500/10 active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
