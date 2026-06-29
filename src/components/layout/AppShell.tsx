'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'

import { NotificationProvider, useNotifications } from '@/hooks/useNotifications'
import { ProfileProvider, useCurrentProfile } from '@/hooks/useCurrentProfile'
import { UnreadMessagesProvider } from '@/hooks/useUnreadMessages'
import { cn } from '@/lib/utils'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface AppShellProps {
  children: React.ReactNode
  collegeName: string
  userId: string
  initialProfile: any
}

export function AppShell({ 
  children, 
  collegeName, 
  userId,
  initialProfile
}: AppShellProps) {
  const pathname = usePathname()
  // Memoize supabase client to avoid creating a new instance on every render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const channel = supabase
      .channel(`achievement-unlocks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`
        },
        async (payload: any) => {
          try {
            const achId = payload.new.achievement_id
            const { data } = await supabase
              .from('achievements')
              .select('name, points_reward')
              .eq('id', achId)
              .single()

            if (data) {
              toast.custom((t) => (
                <div
                  className={cn(
                    t.visible ? 'animate-fade-in' : 'animate-fade-out',
                    "max-w-md w-full bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] shadow-premium rounded-2xl pointer-events-auto flex p-4"
                  )}
                  style={{ boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}
                >
                  <div className="flex-1 w-0">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl animate-bounce">
                          🏆
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-xs font-black text-amber-400 font-display uppercase tracking-wider">
                          🏆 Achievement Unlocked
                        </p>
                        <p className="mt-1 text-sm font-bold text-zinc-50 font-display">
                          {data.name}
                        </p>
                        <p className="mt-1 text-xs font-mono text-cyan-400 font-bold">
                          +{data.points_reward} Points Earned
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="rounded-lg p-1.5 inline-flex text-zinc-500 hover:text-zinc-50 hover:bg-white/5 transition-colors self-start"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ), { id: `achievement-${achId}`, duration: 6000 })
            }
          } catch (error) {
            console.error('Error handling real-time achievement:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  return (
    <ProfileProvider initialProfile={initialProfile} userId={userId}>
      <NotificationProvider userId={userId}>
        <UnreadMessagesProvider userId={userId}>
          <AppShellInner collegeName={collegeName} pathname={pathname}>
            {children}
          </AppShellInner>
        </UnreadMessagesProvider>
      </NotificationProvider>
    </ProfileProvider>
  )
}

function AppShellInner({ 
  collegeName, 
  pathname, 
  children 
}: { 
  collegeName: string
  pathname: string
  children: React.ReactNode 
}) {
  const { profile } = useCurrentProfile()
  const { unreadCount } = useNotifications()
  const [routeLoading, setRouteLoading] = useState(false)

  // Trigger glowing top loader on route navigation changes
  useEffect(() => {
    setRouteLoading(true)
    const t = setTimeout(() => setRouteLoading(false), 380)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-zinc-50 font-sans antialiased selection:bg-brand-500/30 selection:text-white">
      {routeLoading && (
        <motion.div
          key={`loader-${pathname}`}
          initial={{ width: '0%', opacity: 1 }}
          animate={{ width: '100%', opacity: [1, 1, 0] }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-brand-500 via-cyan-400 to-indigo-500 z-[99999] shadow-[0_0_10px_rgba(6,182,212,0.5)]"
        />
      )}


      <Navbar profile={profile} />
    
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-24 sm:pt-28 pb-32 md:pb-12 relative main-content-layout">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
              type: "spring",
              mass: 1,
              stiffness: 170,
              damping: 26 
            }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
