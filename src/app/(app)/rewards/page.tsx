import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RewardsClient from './RewardsClient'
export const metadata = { title: 'Rewards — IILM Connect' }
export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('full_name, branch, year').eq('id', user.id).single()
  return <RewardsClient userId={user.id} profile={profile} />
}
