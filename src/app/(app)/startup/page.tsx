import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StartupClient from './StartupClient'
export const metadata = { title: 'Startup Cell — IILM Connect' }
export default async function StartupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('full_name, branch').eq('id', user.id).single()
  return <StartupClient userId={user.id} profile={profile} />
}
