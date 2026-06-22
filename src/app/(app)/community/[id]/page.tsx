import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CreatePost from './CreatePost'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

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

  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('*')
    .eq('id', id)
    .single()

  if (communityError || !community) {
    notFound()
  }

  const { data: membership } = await supabase
    .from('community_members')
    .select('*')
    .eq('community_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: posts, error: postsError } = await supabase
  .from('posts')
  .select('*, author:profiles!posts_author_id_fkey(id,full_name,username,avatar_url,branch,year,is_verified)')
  .eq('community_id', community.id)
  .order('created_at', { ascending: false })

console.log('COMMUNITY ID:', community.id)
console.log('POSTS:', posts)
console.log('POST ERROR:', postsError)


   return (
  <div className="max-w-5xl mx-auto space-y-6">

    <div className="glass-card rounded-2xl p-8">
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-4">
  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-2xl">
    🎉
  </div>

  <div>
    <h1 className="text-4xl font-bold">
      {community.name}
    </h1>

    <p className="text-on-surface-variant mt-1">
      {community.description || 'Community for students'}
    </p>

    <div className="flex gap-6 mt-3 text-sm text-on-surface-variant">
      <span>🏷️ {community.category}</span>
      <span>👥 {community.member_count} Members</span>
      <span>📝 {posts?.length ?? 0} Posts</span>
    </div>
  </div>
</div>

        <div
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            membership
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {membership ? 'Joined' : 'Not Joined'}
        </div>
      </div>
    </div>

    {membership && (
      <CreatePost communityId={community.id} />
    )}

    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
  <div>
    <h2 className="text-2xl font-bold">
      Recent Posts
    </h2>

    <p className="text-sm text-on-surface-variant">
      Latest activity from this community
    </p>
  </div>

  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm">
    {posts?.length ?? 0} Posts
  </div>
</div>

      {!posts || posts.length === 0 ? (
        <p className="text-on-surface-variant">
          No posts yet. Be the first to post.
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
           <div
  key={post.id}
  className="glass-card rounded-2xl p-5"
>
  <div className="flex items-center gap-3 mb-4">
    {post.is_anonymous ? (
      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-zinc-500 font-bold">
        ?
      </div>
    ) : (
      <GlobalAvatar profile={post.author} size="md" />
    )}

    <div>
      <p className="font-medium text-sm text-zinc-200">
        {post.is_anonymous ? 'Anonymous' : (post.author?.full_name || 'Student')}
      </p>

      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter mt-0.5">
        {post.is_anonymous ? 'Anonymous Member' : `${post.author?.branch || 'Student'} · Year ${post.author?.year || '1'}`}
      </p>
    </div>
  </div>

  <p className="leading-relaxed">
    {post.content}
  </p>

  <div className="mt-4 flex gap-6 text-sm text-on-surface-variant">
    <button>❤️ {post.likes_count ?? 0}</button>
    <button>💬 {post.comments_count ?? 0}</button>
    <button>↗ Share</button>
  </div>
</div>
          ))}
        </div>
      )}
    </div>

  </div>
)
}