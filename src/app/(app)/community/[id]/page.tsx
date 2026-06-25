import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CommunityClient from './CommunityClient'

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch community info, membership status, community posts, members list, and user profile role concurrently
  const [communityResult, membershipResult, postsResult, membersResult, profileResult] = await Promise.all([
    supabase
      .from('communities')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('community_members')
      .select('*')
      .eq('community_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(id,full_name,username,avatar_url,branch,year,is_verified,college_id)')
      .eq('community_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('community_members')
      .select('role, user_id, profiles!community_members_user_id_fkey(id, full_name, avatar_url, branch, year)')
      .eq('community_id', id),
    supabase
      .from('profiles')
      .select('id, role, college_id')
      .eq('id', user.id)
      .single()
  ])

  const community = communityResult.data
  const communityError = communityResult.error
  const membership = membershipResult.data
  const posts = postsResult.data
  const members = membersResult.data
  const profile = profileResult.data

  if (communityError || !community) {
    notFound()
  }

  return (
    <CommunityClient
      community={community}
      initialMembership={membership}
      initialPosts={posts || []}
      initialMembers={members || []}
      currentUserId={user.id}
      currentUserRole={profile?.role || 'STUDENT'}
      currentUserProfile={profile}
    />
  )
}