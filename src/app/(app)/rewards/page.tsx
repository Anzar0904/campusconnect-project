import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RewardsClient from './RewardsClient'
import { getCachedProfile } from '@/lib/profile'

export const metadata = { title: 'Rewards — IILM Connect' }

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getCachedProfile(user.id)

  return <RewardsClient userId={user.id} profile={profile} />
}
