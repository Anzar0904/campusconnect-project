'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useNotifications } from '@/hooks/useNotifications'

interface AppShellProps {
  children: React.ReactNode
  collegeName: string
  userName?: string | null
  userAvatar?: string | null
  isVerified?: boolean
  userRole?: string
  userId: string
}

export function AppShell({ 
  children, 
  collegeName, 
  userName, 
  userAvatar, 
  isVerified, 
  userRole,
  userId
}: AppShellProps) {
  const pathname = usePathname()
  const { unreadCount } = useNotifications(userId)

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar
        collegeName={collegeName}
        userName={userName}
        userAvatar={userAvatar}
        isVerified={isVerified}
        userRole={userRole}
        notificationCount={unreadCount}
      />
      
      <main className="flex-1 md:ml-64 min-h-screen relative">
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
            className="max-w-6xl mx-auto px-4 md:px-8 py-6 pb-32 md:pb-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}
