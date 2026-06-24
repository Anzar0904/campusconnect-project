'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface DBNotification {
  id: string
  user_id: string | null
  title: string
  content: string | null
  type: string
  read: boolean
  link: string | null
  created_at: string
}

interface NotificationContextProps {
  notifications: DBNotification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined)

export function NotificationProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [notifications, setNotifications] = useState<DBNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setNotifications(data || [])
      setUnreadCount(data?.filter((n: any) => !n.read).length || 0)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    fetchNotifications()

    const channelName = `user-notifications-${userId}`
    const existingChannel = supabase.getChannels().find((c: any) => c.topic === channelName)
    if (existingChannel) {
      supabase.removeChannel(existingChannel)
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        const newNotif = payload.new as DBNotification
        setNotifications(prev => [newNotif, ...prev])
        setUnreadCount(prev => prev + 1)
        toast(newNotif.title, {
          icon: '🔔',
          duration: 4000,
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        const updatedNotif = payload.new as DBNotification
        setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n))
        // Re-calculate unread count
        setUnreadCount(prev => {
          if (updatedNotif.read) {
            return Math.max(0, prev - 1)
          }
          return prev
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchNotifications])

  // Mark specific notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
      
      if (error) throw error

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [supabase])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }, [userId, supabase])

  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  }), [notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications])

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
