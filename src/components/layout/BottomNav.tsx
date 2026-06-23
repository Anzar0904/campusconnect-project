'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { Home, Compass, MessageSquare, User } from 'lucide-react'

const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Discover', href: '/discover', icon: Compass },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Profile', href: '/profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/[0.08] bg-zinc-900/80 backdrop-blur-xl shadow-premium">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all duration-300",
                active ? "text-brand-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 bg-brand-500/10 rounded-xl border border-brand-500/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={24} className="relative z-10" />
              <span className="text-[10px] font-mono font-medium uppercase tracking-tighter relative z-10">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
