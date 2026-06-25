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
import { getCorsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, acceptedTerms } = await req.json()

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!acceptedTerms) {
      return new Response(
        JSON.stringify({ error: 'You must accept the Privacy Policy and Terms of Service to continue.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Extract domain from email
    const atIndex = normalizedEmail.lastIndexOf('@')
    if (atIndex === -1) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const domain = normalizedEmail.slice(atIndex + 1) // e.g. "iilm.edu"

    // Check domain against allowed college domains in DB
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    
    // ── Platform Owner Bypass ───────────────────────────────
    const { data: ownerEmail } = await adminClient.rpc('owner_email')
    if (normalizedEmail === ownerEmail) {
      // Find the owner's college_id (or default to the first active college)
      const { data: ownerCollege } = await adminClient
        .from('colleges')
        .select('id, name')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      return new Response(
        JSON.stringify({ 
          success: true, 
          college: ownerCollege?.name || 'Platform Admin', 
          college_id: ownerCollege?.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Rate Limit Check ────────────────────────────────────
    const { data: rateLimitOk } = await adminClient.rpc('check_rate_limit', {
      p_action: 'otp_request',
      p_limit: 5,
      p_window: '15 minutes',
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again in 15 minutes.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: college, error: dbError } = await adminClient
      .from('colleges')
      .select('id, name, is_active')
      .eq('email_domain', domain)
      .eq('is_active', true)
      .maybeSingle()

    if (dbError) {
      console.error('DB error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Internal error. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!college) {
      return new Response(
        JSON.stringify({
          error: `"@${domain}" is not a registered college domain. Please use your official college email.`,
          domain_rejected: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Domain is valid and rate limits passed.
    // Return success to the client so it can safely initiate PKCE login.
    return new Response(
      JSON.stringify({ success: true, college: college.name, college_id: college.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Unhandled error:', err)
    return new Response(
      JSON.stringify({ error: 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
