import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ElectionsClient from './ElectionsClient'
export const metadata = { title: 'Campus Elections — IILM Connect' }
export default async function ElectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('full_name, branch, year').eq('id', user.id).single()
  return <ElectionsClient userId={user.id} profile={profile} />
}
