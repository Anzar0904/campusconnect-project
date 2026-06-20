'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'

interface FriendProfile {
  id: string
  full_name: string
  username: string | null
  avatar_url: string | null
  branch: string | null
  year: number | null
}

interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  requester?: FriendProfile
  addressee?: FriendProfile
}

function Avatar({ profile }: { profile: FriendProfile }) {
  const url = profile.avatar_url ||
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profile.full_name)}&backgroundColor=4f46e5&textColor=ffffff`
  return (
    <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-white/10 shrink-0 shadow-lg">
      <Image src={url} alt={profile.full_name} width={48} height={48} className="object-cover w-full h-full" />
    </div>
  )
}

export default function FriendsClient({
  friends,
  pending,
  currentUserId,
}: {
  friends: Friendship[]
  pending: Friendship[]
  currentUserId: string
}) {
  const supabase = createClient()
  const [tab, setTab] = useState<'friends' | 'pending'>('friends')
  const [actionIds, setActionIds] = useState<string[]>([])

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    setActionIds(a => [...a, friendshipId])
    await supabase
      .from('friendships')
      .update({ status: accept ? 'accepted' : 'blocked' })
      .eq('id', friendshipId)
    window.location.reload()
  }

  const getFriendProfile = (f: Friendship): FriendProfile | undefined =>
    f.requester_id === currentUserId ? f.addressee as any : f.requester as any

  return (
    <div className="animate-fade-in space-y-8 max-w-4xl pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="section-label">Campus Social</p>
          <h1 className="display-heading text-4xl">Connections</h1>
          <p className="body-pro text-sm">Manage your university network and friendship requests.</p>
        </div>
        <Link href="/discover" className="btn-premium px-8">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Find People
        </Link>
      </header>

      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit">
        {(['friends', 'pending'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "relative px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all",
              tab === t ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t === 'friends' ? `Connections (${friends.length})` : `Requests`}
            {t === 'pending' && pending.length > 0 && (
              <span className="ml-3 px-2 py-0.5 rounded-md bg-brand-500 text-white text-[10px] font-bold shadow-lg shadow-brand-500/20">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'friends' ? (
            friends.length === 0 ? (
              <EmptyState 
                icon="group"
                title="No connections yet"
                description="Your campus network is empty. Discover IILM students and send friend requests to start chatting."
                action={{
                  label: "Discover People",
                  href: "/discover"
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.map(f => {
                  const p = getFriendProfile(f)
                  if (!p) return null
                  return (
                    <div key={f.id} className="card-premium p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar profile={p} />
                        <div className="min-w-0">
                          <p className="sub-heading text-base truncate">{p.full_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="chip-pro text-[9px] py-0">{p.branch}</span>
                            <span className="text-[10px] font-mono text-zinc-500">Year {p.year}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/messages?user=${p.id}`} className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-500 hover:text-brand-400 hover:border-brand-500/30 transition-all shadow-sm active:scale-90">
                        <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            pending.length === 0 ? (
              <EmptyState 
                icon="inbox"
                title="Inbox Zero"
                description="You don't have any pending friend requests at the moment."
              />
            ) : (
              <div className="space-y-4">
                {pending.map(f => {
                  const p = f.requester as any as FriendProfile
                  if (!p) return null
                  const busy = actionIds.includes(f.id)
                  return (
                    <div key={f.id} className="card-premium p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar profile={p} />
                        <div className="min-w-0">
                          <p className="sub-heading text-lg leading-none">{p.full_name}</p>
                          <p className="text-xs text-zinc-500 mt-2 font-mono uppercase tracking-tighter">
                            {p.branch} · Year {p.year} · Wants to connect
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button
                          onClick={() => respondToRequest(f.id, false)}
                          disabled={busy}
                          className="btn-ghost-pro px-6 py-2 text-xs flex-1 md:flex-none disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => respondToRequest(f.id, true)}
                          disabled={busy}
                          className="btn-premium px-8 py-2 text-xs flex-1 md:flex-none disabled:opacity-50"
                        >
                          {busy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Accept Request'}
                        </button>
                      </div>
                    </div>
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
