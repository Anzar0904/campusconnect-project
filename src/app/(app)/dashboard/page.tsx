import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const metadata = { title: 'Home Feed — IILM Connect' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, username, branch, year, is_verified')
    .eq('id', user.id)
    .single()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(id,full_name,username,avatar_url,branch,year,is_verified)')
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(3)

  // Seed liked post IDs from post_likes table — so the like button renders
  // correctly (filled/unfilled) on first load without a separate client query.
  const postIds = (posts ?? []).map(p => p.id)
  const { data: myLikes } = postIds.length > 0
    ? await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)
    : { data: [] }

  const likedPostIds = (myLikes ?? []).map((l: any) => l.post_id)

  return (
    <DashboardClient
      profile={profile}
      posts={posts || []}
      events={events || []}
      currentUserId={user.id}
      initialLikedIds={likedPostIds}
    />
  )
}
