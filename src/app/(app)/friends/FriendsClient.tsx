'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { MessageSquare, UserPlus, Check, X, ShieldAlert, ArrowRight, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface FriendProfile {
  id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  branch: string | null
  year: number | null
  is_verified?: boolean
}

interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  requester?: FriendProfile
  addressee?: FriendProfile
}

export default function FriendsClient({
  friends: initialFriends,
  pending: initialPending,
  currentUserId,
}: {
  friends: Friendship[]
  pending: Friendship[]
  currentUserId: string
}) {
  const supabase = createClient()
  const [tab, setTab] = useState<'friends' | 'pending'>('friends')
  const [friendsList, setFriendsList] = useState<Friendship[]>(initialFriends)
  const [pendingList, setPendingList] = useState<Friendship[]>(initialPending)
  const [actionIds, setActionIds] = useState<string[]>([])

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    if (actionIds.includes(friendshipId)) return
    setActionIds(prev => [...prev, friendshipId])

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'blocked' })
        .eq('id', friendshipId)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success(accept ? 'Connection request accepted!' : 'Request declined.')
        
        // Remove from pending
        const respondedRequest = pendingList.find(p => p.id === friendshipId)
        setPendingList(prev => prev.filter(p => p.id !== friendshipId))
        
        // If accepted, add to friends list
        if (accept && respondedRequest) {
          setFriendsList(prev => [...prev, respondedRequest])
        }
      }
    } catch (err) {
      toast.error('Failed to respond to request.')
    } finally {
      setActionIds(prev => prev.filter(id => id !== friendshipId))
    }
  }

  const removeConnection = async (friendshipId: string) => {
    if (actionIds.includes(friendshipId)) return
    setActionIds(prev => [...prev, friendshipId])

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Connection removed.')
        setFriendsList(prev => prev.filter(f => f.id !== friendshipId))
      }
    } catch (err) {
      toast.error('Failed to remove connection.')
    } finally {
      setActionIds(prev => prev.filter(id => id !== friendshipId))
    }
  }

  const getFriendProfile = (f: Friendship): FriendProfile | undefined =>
    f.requester_id === currentUserId ? f.addressee as any : f.requester as any

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24 font-sans select-none text-left">
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
        <div className="glass-page-header flex-1 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Campus Network
          </div>
          <h1 className="display-heading text-3xl sm:text-4xl mt-1">
            My Connections
          </h1>
          <p className="body-pro text-xs sm:text-sm">
            Manage your peer relationships, active classmates network, and incoming connection requests.
          </p>
        </div>

        <Link 
          href="/discover" 
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 border border-blue-500/20 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 select-none active:scale-95 cursor-pointer shrink-0"
        >
          <UserPlus size={14} />
          Discover People
        </Link>
      </header>

      {/* Connection Tab Control */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.01] border border-white/[0.04] w-fit">
        {(['friends', 'pending'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer",
              tab === t 
                ? "bg-white/5 border border-white/[0.04] text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t === 'friends' ? `Connections (${friendsList.length})` : 'Pending Requests'}
            {t === 'pending' && pendingList.length > 0 && (
              <span className="ml-2.5 px-2 py-0.5 rounded-md bg-blue-500 text-white text-[9px] font-bold shadow-md shadow-blue-500/10">
                {pendingList.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        >
          {tab === 'friends' ? (
            friendsList.length === 0 ? (
              <EmptyState 
                icon="group"
                title="Your network is empty"
                description="Discover and connect with students at your college to build your university cohort."
                action={{
                  label: "Discover People",
                  href: "/discover"
                }}
                className="bg-[#18181B] border-white/[0.04]"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {friendsList.map(f => {
                  const p = getFriendProfile(f)
                  if (!p) return null
                  const busy = actionIds.includes(f.id)
                  
                  return (
                    <motion.div 
                      layout
                      key={f.id} 
                      className="bg-[#18181B] border border-white/[0.04] rounded-3xl p-5 flex flex-col justify-between gap-5 transition-all hover:border-white/[0.08] shadow-md group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.01),transparent_50%)] pointer-events-none" />

                      <div className="flex items-start justify-between gap-4 z-10">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Link href={`/profile?id=${p.id}`}>
                            <GlobalAvatar profile={p} size="lg" className="border border-white/5 shrink-0 hover:scale-105 transition-transform" />
                          </Link>
                          <div className="min-w-0 text-left">
                            <Link href={`/profile?id=${p.id}`} className="text-sm font-bold text-white hover:text-blue-400 transition-colors block truncate max-w-[150px] tracking-tight leading-snug">
                              {p.full_name}
                            </Link>
                            {p.username && <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">@{p.username}</p>}
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wide">
                                {p.branch}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-400">Year {p.year}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04] z-10">
                        {/* Message Shortcut */}
                        <Link 
                          href={`/messages?userId=${p.id}`} 
                          className="flex-1 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 rounded-xl text-[11px] font-semibold transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <MessageSquare size={12} />
                          Message
                        </Link>
                        
                        {/* Remove Connection button */}
                        <button 
                          onClick={() => removeConnection(f.id)}
                          disabled={busy}
                          className="px-3.5 py-2 bg-white/[0.01] hover:bg-red-500/10 border border-white/[0.04] hover:border-red-500/20 text-zinc-500 hover:text-red-400 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 active:scale-95 cursor-pointer"
                          title="Remove Connection"
                        >
                          {busy ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <X size={12} />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          ) : (
            pendingList.length === 0 ? (
              <EmptyState 
                icon="inbox"
                title="All caught up"
                description="You don't have any pending classmate connection requests right now."
                className="bg-[#18181B] border-white/[0.04]"
              />
            ) : (
              <div className="space-y-3.5">
                {pendingList.map(f => {
                  const p = f.requester as any as FriendProfile
                  if (!p) return null
                  const busy = actionIds.includes(f.id)
                  
                  return (
                    <motion.div 
                      layout
                      key={f.id} 
                      className="bg-[#18181B] border border-white/[0.04] rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:border-white/[0.08] shadow-md relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.01),transparent_50%)] pointer-events-none" />

                      <div className="flex items-center gap-4 min-w-0 z-10">
                        <Link href={`/profile?id=${p.id}`}>
                          <GlobalAvatar profile={p} size="lg" className="border border-white/5 shrink-0 hover:scale-105 transition-transform" />
                        </Link>
                        <div className="min-w-0 text-left">
                          <Link href={`/profile?id=${p.id}`} className="text-base font-bold text-white hover:text-blue-400 transition-colors block truncate max-w-[200px] tracking-tight">
                            {p.full_name}
                          </Link>
                          <p className="text-xs text-zinc-500 mt-1 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <span>{p.branch}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                            <span>Year {p.year}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                            <span className="text-blue-400 flex items-center gap-0.5"><Clock size={11} /> Pending invitation</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2.5 shrink-0 z-10">
                        <button
                          onClick={() => respondToRequest(f.id, false)}
                          disabled={busy}
                          className="px-5 py-2.5 bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] text-zinc-300 rounded-xl text-xs font-semibold tracking-wide transition-all select-none active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => respondToRequest(f.id, true)}
                          disabled={busy}
                          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 border border-blue-500/20 text-white rounded-xl text-xs font-semibold tracking-wide transition-all select-none shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {busy ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check size={13} />
                              <span>Accept Request</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
