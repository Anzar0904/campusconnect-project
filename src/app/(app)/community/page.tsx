import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CommunitiesClient from './CommunitiesClient'

export const metadata = { title: 'Communities — IILM Connect' }

export default async function CommunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch communities and user memberships in parallel
  const [communitiesResult, membershipsResult] = await Promise.all([
    supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false }),
    (supabase as any)
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
  ])

  const communities = communitiesResult.data
  const myMemberships = membershipsResult.data

  return (
    <CommunitiesClient
      communities={communities || []}
     myMemberships={(myMemberships || []).map(
  (m: any) => m.community_id
)}
      currentUserId={user.id}
    />
  )
}
