import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DiscoverClient from './DiscoverClient'

export const metadata = { title: 'Discover — IILM Connect' }

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: students } = await supabase
  .from('profiles')
  .select('id, full_name, username, avatar_url, branch, year, bio, hostel')
  .eq('is_verified', true)
  .neq('id', user.id)
  .not('full_name', 'is', null)
  .limit(50)

  const { data: myFriendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  return <DiscoverClient students={students || []} currentUserId={user.id} myFriendships={myFriendships || []} />
}
