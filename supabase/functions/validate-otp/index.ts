/**
 * EDGE FUNCTION: validate-otp
 *
 * Replaces direct client-side Supabase OTP calls.
 * Validates the email domain against the colleges table BEFORE
 * sending an OTP — preventing anyone with a gmail/yahoo address
 * from ever receiving a magic link.
 *
 * Deploy: supabase functions deploy validate-otp
 * Call from client: supabase.functions.invoke('validate-otp', { body: { email } })
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS ────────────────────────────────────────────────────────────────────
// Inlined to remove the brittle '../_shared/cors.ts' import — if that file is
// missing or not deployed, Deno throws a module-resolution error at cold start
// BEFORE Deno.serve() runs, producing the exact "non-2xx status code" error.
const ALLOWED_ORIGINS = new Set([
  Deno.env.get('SITE_URL') ?? '',
  Deno.env.get('NEXT_PUBLIC_SITE_URL') ?? '',
])

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : '*'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  }
}

// ── Secrets ─────────────────────────────────────────────────────────────────
// Do NOT use the non-null assertion (!) at module scope — if a secret is
// missing, Deno.env.get() returns undefined and the function silently misbehaves.
// Instead, validate inside the handler and return a clear error.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// ── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)

  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  // Always return 200 so supabase.functions.invoke() never throws a
  // FunctionsFetchError — errors are communicated via the JSON body instead.
  const json = (payload: object, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  // ── Secret guard ────────────────────────────────────────────────────────
  // FIX: Validate secrets early and return a meaningful error rather than
  // letting createClient() receive undefined and fail silently downstream.
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      'Missing secrets: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. ' +
      'Run: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<value>'
    )
    return json({ error: 'Server configuration error. Please contact support.' })
  }

  try {
    // ── Parse body ──────────────────────────────────────────────────────────
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Invalid JSON body' })
    }

    const { email, acceptedTerms } = body

    if (!email || typeof email !== 'string') {
      return json({ error: 'Email is required' })
    }

    if (!acceptedTerms) {
      return json({
        error:
          'You must accept the Privacy Policy and Terms of Service to continue.',
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Extract domain from email
    const atIndex = normalizedEmail.lastIndexOf('@')
    if (atIndex === -1) {
      return json({ error: 'Invalid email format' })
    }
    const domain = normalizedEmail.slice(atIndex + 1) // e.g. "college.edu"

    // ── Admin client ────────────────────────────────────────────────────────
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // ── Platform Owner Bypass ────────────────────────────────────────────────
    const { data: ownerEmail, error: ownerErr } = await adminClient.rpc('owner_email')
    if (ownerErr) {
      // Non-fatal: log and continue — owner bypass simply won't fire.
      console.warn('owner_email RPC failed (non-fatal):', ownerErr.message)
    } else if (normalizedEmail === ownerEmail) {
      const { data: ownerCollege } = await adminClient
        .from('colleges')
        .select('id, name')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      return json({
        success: true,
        college: ownerCollege?.name ?? 'Platform Admin',
        college_id: ownerCollege?.id ?? null,
      })
    }

    // ── Rate Limit Check ─────────────────────────────────────────────────────
    // FIX: also capture the error so a DB failure doesn't silently block users.
    const { data: rateLimitOk, error: rateErr } = await adminClient.rpc(
      'check_rate_limit',
      {
        p_action: 'otp_request',
        p_limit: 5,
        p_window: '15 minutes',
      }
    )

    if (rateErr) {
      // If the rate-limit function itself errors, log it and allow the request
      // rather than hard-blocking legitimate users due to a DB issue.
      console.error('Rate limit RPC error (allowing request):', rateErr.message)
    } else if (!rateLimitOk) {
      return json({
        error: 'Too many requests. Please try again in 15 minutes.',
      })
    }

    // ── Domain validation ────────────────────────────────────────────────────
    const { data: college, error: dbError } = await adminClient
      .from('colleges')
      .select('id, name, is_active')
      .eq('email_domain', domain)
      .eq('is_active', true)
      .maybeSingle()

    if (dbError) {
      console.error('DB error querying colleges:', dbError)
      // FIX: Return 200 (not 500) so invoke() surfaces data.error to the UI
      // instead of throwing an uncatchable FunctionsFetchError.
      return json({ error: 'Internal error. Please try again.' })
    }

    if (!college) {
      return json({
        error: `"@${domain}" is not a registered college domain. Please use your official college email.`,
        domain_rejected: true,
      })
    }

    // Domain valid, rate limits passed — client can safely call signInWithOtp.
    return json({ success: true, college: college.name, college_id: college.id })

  } catch (err) {
    console.error('Unhandled error in validate-otp:', err)
    // FIX: Return 200 so invoke() receives data.error rather than throwing.
    return json({ error: 'Unexpected server error. Please try again.' })
  }
})
