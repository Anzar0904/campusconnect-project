import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PapersClient from './PapersClient'

export const metadata = { title: 'Past Papers — IILM Connect' }

export default async function PapersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('college_id')
    .eq('id', user.id)
    .single()

  return <PapersClient userId={user.id} collegeId={profile?.college_id || undefined} />
}
