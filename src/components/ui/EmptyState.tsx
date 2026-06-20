'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { clsx } from 'clsx'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
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
        <span className="material-symbols-outlined text-[40px] opacity-40">{icon}</span>
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
