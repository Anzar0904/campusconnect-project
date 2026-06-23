/**
 * @jest-environment node
 *
 * Tests for /auth/callback route handler
 * Covers: PKCE code exchange, missing code, exchange errors, safe redirect
 */

// Mock @supabase/ssr before importing the route
const mockExchangeCodeForSession = jest.fn()
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}))

jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set:    jest.fn(),
  }),
}))

import { GET } from '@/app/auth/callback/route'
import { NextRequest } from 'next/server'

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/auth/callback')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

describe('/auth/callback', () => {
  beforeEach(() => jest.clearAllMocks())

  it('redirects to /auth/verify?error=missing_code when no code param', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/auth/verify')
    expect(res.headers.get('location')).toContain('missing_code')
  })

  it('exchanges code and redirects to /dashboard on success', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })
    const res = await GET(makeRequest({ code: 'valid-pkce-code' }))
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-pkce-code')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('redirects to /auth/verify with error message on exchange failure', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      error: { message: 'Token expired' },
    })
    const res = await GET(makeRequest({ code: 'expired-code' }))
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/auth/verify')
    expect(location).toContain('Token%20expired')
  })

  it('respects next= param for deep-link redirect on success', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })
    const res = await GET(makeRequest({ code: 'valid-code', next: '/profile' }))
    expect(res.headers.get('location')).toContain('/profile')
  })

  it('ignores absolute URLs in next= param (open redirect prevention)', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })
    const res = await GET(makeRequest({ code: 'valid-code', next: 'https://evil.com' }))
    // Should still redirect within the same origin
    const location = res.headers.get('location') ?? ''
    expect(location).not.toContain('evil.com')
  })
})
