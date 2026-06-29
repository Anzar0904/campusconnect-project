import React from 'react'

/**
 * CampusConnectLogo
 * 
 * Single canonical logo component for CampusConnect.
 * Faithfully recreates the brand mark: a gradient "C" letterform
 * with a graduation cap (mortarboard) sitting atop it.
 * 
 * Usage:
 *   <CampusConnectLogo size={40} />                  // icon only
 *   <CampusConnectLogo size={40} showWordmark />      // icon + "CampusConnect" text
 *   <CampusConnectLogo size={40} showWordmark showTagline /> // full lockup
 */

interface CampusConnectLogoProps {
  /** Height (and proportional width) of the icon in px. Default: 40 */
  size?: number
  /** Show the "CampusConnect" wordmark beside the icon. Default: false */
  showWordmark?: boolean
  /** Show the tagline "Your Campus. Connected." below the wordmark. Default: false */
  showTagline?: boolean
  /** Additional className on the root element */
  className?: string
  /** Unique ID suffix to avoid SVG gradient ID collisions when rendered multiple times */
  id?: string
}

export function CampusConnectLogo({
  size = 40,
  showWordmark = false,
  showTagline = false,
  className = '',
  id = 'default',
}: CampusConnectLogoProps) {
  // Each render needs unique gradient IDs to avoid cross-instance bleed
  const gCap = `cc-cap-${id}`
  const gC = `cc-c-${id}`

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* ── SVG Icon ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CampusConnect"
        role="img"
        style={{ flexShrink: 0 }}
      >
        <defs>
          {/* Graduation cap: cyan → blue */}
          <linearGradient id={gCap} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          {/* C letterform: blue → violet/purple */}
          <linearGradient id={gC} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>

        {/* ── C letterform ──
            Bold open-right "C" arc, thick stroke rendered as a filled shape.
            The gap is on the right side (~2 o'clock to ~4 o'clock).
        */}
        <path
          d="
            M 93 38
            C 79 18, 48 16, 30 34
            C 12 52, 12 74, 30 90
            C 48 106, 79 106, 93 88
            L 83 80
            C 72 93, 52 93, 40 83
            C 28 73, 28 53, 40 43
            C 52 33, 72 33, 83 46
            L 93 38 Z
          "
          fill={`url(#${gC})`}
        />

        {/* ── Graduation cap (mortarboard) ──
            Flat square top board + hanging tassel on right + cylindrical band.
            Sits at roughly the top-center of the C.
        */}

        {/* Cap board — flat rhombus/diamond shape */}
        <polygon
          points="60,10 98,26 60,42 22,26"
          fill={`url(#${gCap})`}
        />

        {/* Cap band — the cylindrical part below the board */}
        <path
          d="M 75 32 L 75 50 Q 75 56 60 58 Q 45 56 45 50 L 45 32 Q 52 38 60 40 Q 68 38 75 32 Z"
          fill={`url(#${gCap})`}
          opacity="0.9"
        />

        {/* Tassel cord — hangs from right corner of board */}
        <line x1="98" y1="26" x2="98" y2="52" stroke={`url(#${gCap})`} strokeWidth="3" strokeLinecap="round" />
        {/* Tassel bob */}
        <circle cx="98" cy="55" r="4" fill="#22d3ee" opacity="0.9" />
      </svg>

      {/* ── Wordmark ── */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className="font-display font-bold tracking-tight text-white"
            style={{ fontSize: size * 0.45, lineHeight: 1.1 }}
          >
            Campus
            <span className="text-zinc-400 font-normal">Connect</span>
          </span>
          {showTagline && (
            <span
              className="font-mono text-zinc-500 tracking-widest uppercase"
              style={{ fontSize: size * 0.18, marginTop: size * 0.06 }}
            >
              Your Campus. Connected.
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default CampusConnectLogo
