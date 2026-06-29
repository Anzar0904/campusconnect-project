/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Compiler optimizations ───────────────────────────────────
  compiler: {
    // Remove console.* calls in production to eliminate main-thread logging overhead
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // ── Image optimization ────────────────────────────────────────
  images: {
    // Serve AVIF first (50% smaller than WebP), fallback to WebP
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    // Aggressive caching for remote images (1 week)
    minimumCacheTTL: 604800,
  },

  // ── Bundle optimizations ──────────────────────────────────────
  experimental: {
    // Tree-shake these large packages at the module level
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'gsap',
      '@gsap/react',
      'date-fns',
    ],
  },

  // ── Security headers ──────────────────────────────────────
  async headers() {
    return [
      {
        // Apply to every route
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },

          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Force HTTPS
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

          // Stop referrer leakage
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Permissions policy — disable unused browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },

          // Content-Security-Policy
          // Allows: self, Supabase, dicebear avatars, Google Fonts, Material Symbols
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + inline (Next.js requires this) + Supabase realtime
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
              // Styles: self + inline (Tailwind/Next) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images
              "img-src 'self' data: blob: https://*.supabase.co https://api.dicebear.com https://images.unsplash.com",
              // API connections
              [
                "connect-src 'self'",
                'https://*.supabase.co',
                'wss://*.supabase.co',      // Realtime websocket
                'https://fonts.googleapis.com',
              ].join(' '),
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // ── Redirects ─────────────────────────────────────────────
  async redirects() {
    return [
      // Ensure old hash-based auth links go to the new callback route
      {
        source: '/auth/verify',
        has: [{ type: 'query', key: 'code' }],
        destination: '/auth/callback?code=:code',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
