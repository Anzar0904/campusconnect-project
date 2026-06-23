'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { clsx } from 'clsx'
import { 
  Inbox, 
  Users, 
  Rss, 
  MessageSquare, 
  Briefcase, 
  BookOpen, 
  Store, 
  Compass, 
  Calendar, 
  UserX
} from 'lucide-react'

const LUCIDE_ICON_MAP: Record<string, React.ComponentType<any>> = {
  group_off: UserX,
  feed: Rss,
  chat: MessageSquare,
  business_center: Briefcase,
  menu_book: BookOpen,
  storefront: Store,
  work_outline: Briefcase,
  travel_explore: Compass,
  diversity_3: Users,
  event: Calendar
}

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon = 'feed', title, description, action, className }: EmptyStateProps) {
  const IconComponent = LUCIDE_ICON_MAP[icon] || Inbox

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        "card-premium p-12 text-center flex flex-col items-center justify-center space-y-6",
        className
      )}
    >
      <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/[0.04] flex items-center justify-center text-zinc-500 shadow-inner">
        <IconComponent size={40} className="opacity-40" />
      </div>

      <div className="space-y-2 max-w-xs mx-auto">
        <h3 className="sub-heading text-xl text-zinc-50 tracking-tight">{title}</h3>
        <p className="body-pro text-sm text-zinc-500 leading-relaxed">
          {description}
        </p>
      </div>

      {action && (
        <div className="pt-2">
          {action.href ? (
            <Link href={action.href} className="btn-premium px-8">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="btn-premium px-8">
              {action.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
