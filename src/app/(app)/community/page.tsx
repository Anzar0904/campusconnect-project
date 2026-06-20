import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CommunitiesClient from './CommunitiesClient'

export const metadata = { title: 'Communities — IILM Connect' }

export default async function CommunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: communities } = await supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false })

  const { data: myMemberships } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id)

  return (
    <CommunitiesClient
      communities={communities || []}
      myMemberships={(myMemberships || []).map(m => m.community_id)}
      currentUserId={user.id}
    />
  )
}
