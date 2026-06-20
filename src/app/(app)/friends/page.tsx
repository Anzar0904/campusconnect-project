import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FriendsClient from './FriendsClient'

export const metadata = { title: 'Friends — IILM Connect' }

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: friends } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(id,full_name,username,avatar_url,branch,year), addressee:profiles!friendships_addressee_id_fkey(id,full_name,username,avatar_url,branch,year)')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const { data: pending } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(id,full_name,username,avatar_url,branch,year)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  return <FriendsClient friends={friends || []} pending={pending || []} currentUserId={user.id} />
}
