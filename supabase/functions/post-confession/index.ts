/**
 * EDGE FUNCTION: post-confession
 *
 * Students call this instead of inserting into posts directly.
 * The author_id is written to confessions._author_id_audit
 * (invisible to student RLS policies) — so confessions are
 * anonymous to peers but auditable by admins.
 *
 * Deploy: supabase functions deploy post-confession
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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Verify caller is a real authenticated user
  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } }
  })
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const { content } = await req.json()

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (content.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Confession too short (min 10 chars)' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (content.trim().length > 2000) {
      return new Response(JSON.stringify({ error: 'Confession too long (max 2000 chars)' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Rate limit: 5 confessions per hour
    const { data: rateLimitOk } = await adminClient.rpc('check_rate_limit', {
      p_action: 'confession',
      p_limit: 5,
      p_window: '1 hour',
    })
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'Too many confessions. Slow down.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get user's college_id
    const { data: profile } = await adminClient
      .from('profiles')
      .select('college_id')
      .eq('id', user.id)
      .single()

    if (!profile?.college_id) {
      return new Response(JSON.stringify({ error: 'Profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Blind insert — service role writes author to audit column only
    const { data, error } = await adminClient
      .from('confessions')
      .insert({
        content: content.trim(),
        college_id: profile.college_id,
        _author_id_audit: user.id,   // audit only — not exposed to student RLS
      })
      .select('id, content, likes_count, created_at')
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true, confession: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('Confession error:', err)
    return new Response(JSON.stringify({ error: 'Failed to post confession' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
