import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MessagesClient from './MessagesClient'

export const metadata = { title: 'Messages — IILM Connect' }

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get all accepted friends
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, requester:profiles!friendships_requester_id_fkey(id,full_name,avatar_url,branch,year), addressee:profiles!friendships_addressee_id_fkey(id,full_name,avatar_url,branch,year)')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')

  return <MessagesClient friendships={friendships || []} currentUserId={user.id} />
}
