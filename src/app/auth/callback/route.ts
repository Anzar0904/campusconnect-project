/**
 * /auth/callback — PKCE code exchange for Supabase magic-link auth.
 *
 * Supabase redirects here after the user clicks the magic link.
 * The URL carries a `code` query parameter. This server-side handler
 * exchanges it for a session, sets the auth cookies, then redirects
 * the user into the app.
 *
 * This MUST be a Route Handler (not a Client Component) so the cookie
 * can be set server-side before any redirect. A client-only page
 * cannot reliably set HttpOnly cookies.
 *
 * Flow:
 *   Email → magic link → /auth/callback?code=xxx
 *   → exchangeCodeForSession() → set-cookie → 302 /dashboard
 */

import { NextResponse, type NextRequest } from 'next/server'
import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  // If no code is present the link is malformed or already consumed.
  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/verify?error=missing_code', requestUrl.origin)
    )
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      new URL(`/auth/verify?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
    )
  }

  // Successful exchange — redirect into the app.
  // `next` allows future deep-linking (e.g. /auth/callback?next=/profile).
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
