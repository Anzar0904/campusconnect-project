import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const metadata = { title: 'Home Feed — IILM Connect' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Run initial queries concurrently to prevent waterfalls
  const [profileResult, postsResult, eventsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username, branch, year, is_verified, college_id')
      .eq('id', user.id)
      .single(),
    (supabase as any)
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(id,full_name,username,avatar_url,branch,year,is_verified)')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('events')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(3)
  ])

  const profile = profileResult.data
  const posts = postsResult.data
  const events = eventsResult.data

  // Seed liked post IDs from post_likes table — so the like button renders
  // correctly (filled/unfilled) on first load without a separate client query.
  const postIds = (posts ?? []).map((p: any) => p.id)
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
