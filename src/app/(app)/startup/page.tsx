import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StartupClient from './StartupClient'
import { getCachedProfile } from '@/lib/profile'

export const metadata = { title: 'Startup Cell — IILM Connect' }

export default async function StartupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getCachedProfile(user.id)

  return <StartupClient userId={user.id} profile={profile} />
}
