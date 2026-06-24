import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let clientInstance: any = null

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(url, key)
  }
  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(url, key)
  }
  return clientInstance
}

/**
 * Shared Rate Limit Checker
 * Blocks execution if the user has exceeded the defined window limit.
 */
export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  action: 'post' | 'message' | 'friend_request' | 'event' | 'marketplace' | 'confession',
  limit: number = 10,
  window: string = '1 hour'
): Promise<boolean> {
  const { data, error } = await (supabase as any).rpc('check_rate_limit', {
  p_action: action,
  p_limit: limit,
  p_window: window,
})

  if (error) {
    console.error('Rate limit check failed:', error)
    return true // Fallback to allow if DB error
  }

  return data as boolean
}
