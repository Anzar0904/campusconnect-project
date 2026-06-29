import React from 'react'
import { LegalBlock, LegalDocument, LegalSection } from '@/lib/legal/types'

const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
const EMAIL_TEST = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/** Turns plain-text email addresses into mailto links without altering any wording. */
function withMailLinks(text: string, keyPrefix: string) {
  const segments = text.split(EMAIL_RE)
  return segments.map((segment, i) => {
    if (EMAIL_TEST.test(segment)) {
      return (
        <a
          key={`${keyPrefix}-${i}`}
          href={`mailto:${segment}`}
          className="text-brand-400 underline-offset-2 transition-colors hover:text-brand-300 hover:underline"
        >
          {segment}
        </a>
      )
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{segment}</React.Fragment>
  })
}

function BlockView({ block, blockKey }: { block: LegalBlock; blockKey: string }) {
  if (block.type === 'paragraph') {
    return <p className="text-[15px] leading-7 text-on-surface-variant">{withMailLinks(block.text, blockKey)}</p>
  }

  if (block.type === 'list') {
    return (
      <ul className="space-y-2.5">
        {block.items.map((item, i) => (
          <li key={`${blockKey}-${i}`} className="flex gap-3 text-[15px] leading-7 text-on-surface-variant">
            <span className="mt-[11px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-400/70" />
            <span>{withMailLinks(item, `${blockKey}-${i}`)}</span>
          </li>
        ))}
      </ul>
    )
  }

  // table — rendered as a stacked, glass-styled definition list so it never
  // needs horizontal scrolling on small screens
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 divide-y divide-white/10">
      {block.rows.map((row, i) => (
        <div
          key={`${blockKey}-${i}`}
          className="flex flex-col gap-1 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
        >
          <span className="section-label w-full shrink-0 text-zinc-500 sm:w-40">{row.label}</span>
          <span className="text-[15px] leading-6 text-on-surface-variant">{withMailLinks(row.value, `${blockKey}-${i}-v`)}</span>
        </div>
      ))}
    </div>
  )
}

function SectionView({ section }: { section: LegalSection }) {
  return (
    <section id={section.id} className="scroll-mt-28">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-brand-400/80">{section.number}</span>
        <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">{section.heading}</h2>
      </div>

      {section.blocks && (
        <div className="mt-4 space-y-4">
          {section.blocks.map((block, i) => (
            <BlockView key={i} block={block} blockKey={`${section.id}-${i}`} />
          ))}
        </div>
      )}

      {section.subsections && (
        <div className="mt-6 space-y-6">
          {section.subsections.map((sub) => (
            <div key={sub.id} id={sub.id} className="scroll-mt-28">
              <h3 className="font-display text-[15px] font-semibold text-on-surface">{sub.heading}</h3>
              <div className="mt-3 space-y-4">
                {sub.blocks.map((block, i) => (
                  <BlockView key={i} block={block} blockKey={`${sub.id}-${i}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export interface TocItem {
  id: string
  number: string
  heading: string
}

export function getTocItems(doc: LegalDocument): TocItem[] {
  return doc.sections.map((s) => ({ id: s.id, number: s.number, heading: s.heading }))
}

export function LegalContent({ document: doc }: { document: LegalDocument }) {
  return (
    <div>
      <div className="space-y-4">
        {doc.intro.map((block, i) => (
          <BlockView key={i} block={block} blockKey={`intro-${i}`} />
        ))}
      </div>

      <div className="mt-2 divide-y divide-white/10">
        {doc.sections.map((section) => (
          <div key={section.id} className="py-8 first:pt-8">
            <SectionView section={section} />
          </div>
        ))}
      </div>
    </div>
  )
}
