'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react'
import { createClient } from '@/lib/supabase/client'

interface UnreadMessagesContextProps {
  /** Total unread count across all conversations */
  totalUnread: number
  /** Per-friend unread count map */
  unreadByFriend: Record<string, number>
  /**
   * Persist all incoming unread messages for a conversation as read in the DB
   * and immediately update local state.
   */
  markConversationRead: (friendId: string, currentUserId: string) => Promise<void>
}

const UnreadMessagesContext = createContext<UnreadMessagesContextProps | undefined>(undefined)

export function UnreadMessagesProvider({
  children,
  userId,
}: {
  children: React.ReactNode
  userId: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [unreadByFriend, setUnreadByFriend] = useState<Record<string, number>>({})

  // Rebuild counts from DB on mount and after realtime events
  const fetchCounts = useCallback(async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', userId)
        .eq('read', false)

      if (!data) return

      const map: Record<string, number> = {}
      data.forEach((m: { sender_id: string }) => {
        map[m.sender_id] = (map[m.sender_id] || 0) + 1
      })
      setUnreadByFriend(map)
    } catch (err) {
      console.error('[useUnreadMessages] fetchCounts error:', err)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) return

    fetchCounts()

    const channelName = `unread-messages-${userId}`
    const existingChannel = supabase.getChannels().find((c: any) => c.topic === channelName)
    if (existingChannel) supabase.removeChannel(existingChannel)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload: any) => {
          const msg = payload.new as { sender_id: string; read: boolean }
          // Only count if not already marked read (e.g. when conversation is open)
          if (!msg.read) {
            setUnreadByFriend(prev => ({
              ...prev,
              [msg.sender_id]: (prev[msg.sender_id] || 0) + 1,
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload: any) => {
          const msg = payload.new as { sender_id: string; read: boolean }
          // When a message is marked read, re-fetch to get accurate counts
          if (msg.read) {
            fetchCounts()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchCounts])

  const totalUnread = useMemo(
    () => Object.values(unreadByFriend).reduce((acc, n) => acc + n, 0),
    [unreadByFriend]
  )

  const markConversationRead = useCallback(
    async (friendId: string, currentUserId: string) => {
      if (!friendId || !currentUserId) return

      // Optimistic local update
      setUnreadByFriend(prev => {
        if (!prev[friendId]) return prev
        const next = { ...prev }
        delete next[friendId]
        return next
      })

      try {
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('sender_id', friendId)
          .eq('receiver_id', currentUserId)
          .eq('read', false)

        if (error) {
          console.error('[useUnreadMessages] markConversationRead error:', error)
          // Re-fetch to restore accurate state if DB update failed
          fetchCounts()
        }
      } catch (err) {
        console.error('[useUnreadMessages] markConversationRead error:', err)
        // Re-fetch to restore accurate state if DB update failed
        fetchCounts()
      }
    },
    [supabase, fetchCounts]
  )

  const contextValue = useMemo(
    () => ({ totalUnread, unreadByFriend, markConversationRead }),
    [totalUnread, unreadByFriend, markConversationRead]
  )

  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext)
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider')
  }
  return context
}
