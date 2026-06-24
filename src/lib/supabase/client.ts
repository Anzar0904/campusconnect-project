import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let clientInstance: any = null

export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
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
