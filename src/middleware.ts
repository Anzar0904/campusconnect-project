import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
  const isProfilePage = pathname === '/profile'
  const isApiRoute = pathname.startsWith('/api/')

  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended, full_name, username, branch, year, roll_number')
      .eq('id', user.id)
      .single()

    if (profile?.is_suspended) {
      // We must clear the session client-side, but from middleware we can only redirect.
      // Redirect to a public endpoint that explains the suspension or clears the auth.
      // For now, redirect to login with a query parameter.
      const suspendedUrl = request.nextUrl.clone()
      suspendedUrl.pathname = '/auth/login'
      suspendedUrl.searchParams.set('error', 'Account suspended')
      
      // Delete the auth cookies to forcefully log them out at the edge
      supabaseResponse = NextResponse.redirect(suspendedUrl)
      supabaseResponse.cookies.delete('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0] + '-auth-token')
      return supabaseResponse
    } else if (
      profile && 
      !isProfilePage && 
      !isApiRoute && (
        !profile.full_name?.trim() ||
        !profile.username?.trim() ||
        !profile.branch?.trim() ||
        profile.year === null || profile.year === undefined ||
        !profile.roll_number?.trim()
      )
    ) {
      const onboardingUrl = request.nextUrl.clone()
      onboardingUrl.pathname = '/profile'
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
