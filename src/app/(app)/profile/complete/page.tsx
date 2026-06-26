import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileCompleteClient from './ProfileCompleteClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Complete Registration — IILM Connect' }

export default async function CompleteProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, username, branch, year, roll_number, hostel, phone, email')
    .eq('id', user.id)
    .single()

  return (
    <ProfileCompleteClient 
      profile={profile as any} 
      userId={user.id} 
    />
  )
}
