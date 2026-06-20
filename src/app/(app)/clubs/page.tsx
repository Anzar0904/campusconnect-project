import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClubsClient from './ClubsClient'

export const metadata = { title: 'Clubs — IILM Connect' }

export default async function ClubsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clubs } = await supabase
    .from('clubs')
    .select('*')
    .order('is_official', { ascending: false })

  return <ClubsClient clubs={clubs || []} currentUserId={user.id} />
}
