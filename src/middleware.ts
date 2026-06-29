// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: This middleware runs in the Node.js runtime (not the Edge Runtime).
//
// WHY: @supabase/supabase-js ≤2.54.x bundles @supabase/realtime-js, which
// references `process.versions` inside websocket-factory.js to detect whether
// it needs to polyfill WebSockets. That is a Node.js-only API. On Vercel the
// default middleware runtime is the Edge Runtime (a V8 isolate), where
// `process.versions` does not exist → runtime crash → MIDDLEWARE_INVOCATION_FAILED.
//
// SOLUTION (two-part):
//  1. Export `runtime = 'nodejs'` so Next.js/Vercel runs this file in the full
//     Node.js runtime where process.versions is available.
//  2. Upgrade @supabase/supabase-js to ≥2.55.0 in package.json (the fix was
//     shipped in realtime-js@2.15.1 / supabase-js@2.55.0). Once that upgrade is
//     in place you can remove this export if you prefer the edge runtime, but
//     leaving it as nodejs is safe and has no functional downside for auth middleware.
// ─────────────────────────────────────────────────────────────────────────────
export const runtime = 'nodejs'

import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Derive the Supabase project ref from the public URL so we can delete the
 * auth-token cookie by its exact name when suspending a user.
 *
 * The cookie name Supabase sets is: sb-<PROJECT_REF>-auth-token
 * e.g. NEXT_PUBLIC_SUPABASE_URL = https://abcdefgh.supabase.co
 *      → project ref = "abcdefgh"
 *      → cookie name = "sb-abcdefgh-auth-token"
 *
 * We guard against a missing / malformed URL so the middleware never throws
 * a TypeError during cookie deletion (which would produce another 500).
 */
function getSupabaseAuthCookieName(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    // Works for both https://ref.supabase.co and self-hosted URLs
    const host = new URL(url).hostname          // e.g. "abcdefgh.supabase.co"
    const ref  = host.split('.')[0]             // e.g. "abcdefgh"
    return `sb-${ref}-auth-token`
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT add auth checks between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public paths — no auth required
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/auth/') ||    // login, verify, callback
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    return NextResponse.redirect(loginUrl)
  }

  // Check for suspension and profile completeness on authenticated routes
  const isProfilePage = pathname.startsWith('/profile')
  const isSettingsPage = pathname.startsWith('/settings')
  const isApiRoute = pathname.startsWith('/api/')

  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended, full_name, username, branch, year, roll_number')
      .eq('id', user.id)
      .single()

    if (profile?.is_suspended) {
      const suspendedUrl = request.nextUrl.clone()
      suspendedUrl.pathname = '/auth/login'
      suspendedUrl.searchParams.set('error', 'Account suspended')

      supabaseResponse = NextResponse.redirect(suspendedUrl)

      // Safely delete the auth cookie — guarded against missing/malformed URL
      const cookieName = getSupabaseAuthCookieName()
      if (cookieName) {
        supabaseResponse.cookies.delete(cookieName)
      }

      return supabaseResponse
    } else if (
      profile &&
      !isProfilePage &&
      !isSettingsPage &&
      !isApiRoute && (
        !profile.full_name?.trim() ||
        !profile.username?.trim() ||
        !profile.branch?.trim() ||
        profile.year === null || profile.year === undefined ||
        !profile.roll_number?.trim()
      )
    ) {
      const onboardingUrl = request.nextUrl.clone()
      onboardingUrl.pathname = '/profile/complete'
      onboardingUrl.searchParams.set('onboarding', '1')
      return NextResponse.redirect(onboardingUrl)
    }
  }

  // Redirect logged-in users away from login page
  if (user && pathname === '/auth/login') {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
