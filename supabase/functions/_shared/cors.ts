/**
 * CORS headers for Supabase Edge Functions.
 *
 * In production SITE_URL must be set (e.g. https://iilm.campusconnect.app).
 * In local dev we allow any localhost port.
 */
const SITE_URL = Deno.env.get('SITE_URL')

export const getCorsHeaders = (origin: string | null) => {
  // Allow all localhost origins for development flexibility
  const allowedOrigin = (origin?.includes('localhost') || origin?.includes('127.0.0.1')) 
    ? origin 
    : (SITE_URL ?? '*')

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

