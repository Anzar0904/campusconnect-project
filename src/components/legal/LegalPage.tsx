'use client'

import Link from 'next/link'
import { ArrowLeft, CalendarDays, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { CampusConnectLogo } from '@/components/brand/CampusConnectLogo'
import { LegalDocument, LegalMeta } from '@/lib/legal/types'
import { LegalContent, getTocItems } from './LegalContent'

export interface LegalPageProps {
  document: LegalDocument
  meta: LegalMeta
  /** Unique id suffix for the logo's internal SVG ids, so two logo instances never collide. */
  logoId: string
}

const BackToLogin = () => (
  <Link href="/" className="btn-ghost-pro inline-flex items-center gap-2 text-sm">
    <ArrowLeft size={15} />
    Back to Login
  </Link>
)

export function LegalPage({ document: doc, meta, logoId }: LegalPageProps) {
  const toc = getTocItems(doc)

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-10 sm:px-6 sm:py-14">
        <BackToLogin />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col items-center text-center"
        >
          <div
            className="rounded-2xl p-2 shadow-2xl"
            style={{ boxShadow: '0 0 40px rgba(99,102,241,0.3), 0 0 80px rgba(99,102,241,0.1)' }}
          >
            <CampusConnectLogo size={48} id={logoId} />
          </div>
          <p className="section-label mt-4 text-zinc-500">IILM CONNECT</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            {doc.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="chip chip-primary text-[10px]">
              <CalendarDays size={9} /> Effective {meta.effectiveDate}
            </span>
            <span className="chip chip-success text-[10px]">
              <ShieldCheck size={9} /> Version {meta.version}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 grid gap-6 lg:grid-cols-[220px_minmax(0,860px)] lg:justify-center"
        >
          {/* Desktop table of contents */}
          <aside className="hidden lg:block">
            <nav className="glass-elevated sticky top-10 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl p-5">
              <p className="section-label mb-3 text-zinc-500">On this page</p>
              <ul className="space-y-1">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <span className="font-mono text-zinc-500">{item.number}</span>
                      {item.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Mobile / tablet table of contents */}
          <details className="glass-elevated rounded-2xl p-4 lg:hidden">
            <summary className="section-label cursor-pointer select-none text-zinc-400">On this page</summary>
            <ul className="mt-3 space-y-1">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex gap-2 rounded-lg px-2 py-1.5 text-[13px] text-zinc-400 hover:text-white"
                  >
                    <span className="font-mono text-zinc-500">{item.number}</span>
                    {item.heading}
                  </a>
                </li>
              ))}
            </ul>
          </details>

          {/* Document content */}
          <div className="glass-elevated rounded-2xl p-6 sm:p-10">
            <LegalContent document={doc} />
          </div>
        </motion.div>

        <div className="mt-10 space-y-1 text-center">
          <p className="text-xs text-zinc-500">
            Last updated: {meta.lastUpdated} · IILM Connect v{meta.version} · IILM University, Gurugram
          </p>
          <p className="text-[11px] text-zinc-600">Confidential — IILM University, Gurugram</p>
        </div>

        <div className="mt-6 flex justify-center">
          <BackToLogin />
        </div>
      </div>
    </div>
  )
}

export default LegalPage
