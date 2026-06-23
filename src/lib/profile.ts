import { cache } from 'react'
import { createClient } from './supabase/server'

export const getCachedProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, avatar_url, username, branch, year, is_verified, role, bio, dating_verified, roll_number, hostel, phone, email, college_id, colleges(name, city)')
    .eq('id', userId)
    .single()
  return profile
})
