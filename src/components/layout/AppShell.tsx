'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { useNotifications } from '@/hooks/useNotifications'

interface AppShellProps {
  children: React.ReactNode
  collegeName: string
  userName?: string | null
  userAvatar?: string | null
  isVerified?: boolean
  userRole?: string
  userId: string
  username?: string | null
  branch?: string | null
  year?: number | null
}

export function AppShell({ 
  children, 
  collegeName, 
  userName, 
  userAvatar, 
  isVerified, 
  userRole,
  userId,
  username,
  branch,
  year
}: AppShellProps) {
  const pathname = usePathname()
  const { unreadCount } = useNotifications(userId)

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-neutral-100 font-sans antialiased selection:bg-blue-500/30 selection:text-white">
      <Navbar
        profile={{
          avatar_url: userAvatar,
          full_name: userName,
          username: username,
          branch: branch,
          year: year,
          role: userRole
        }}
      />
      
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-20 py-8 relative">
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
            className="pb-32 md:pb-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
