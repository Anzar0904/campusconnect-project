'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreatePost({
  communityId,
}: {
  communityId: string
}) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const submitPost = async () => {
    if (!content.trim()) return

    try {
      setLoading(true)

      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        community_id: communityId,
        content: content.trim(),
        is_anonymous: false,
      })

      if (error) throw error

      setContent('')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold mb-4">
        Create Post
      </h2>
      <div className="flex items-center gap-3 mb-4">
  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold">
    A
  </div>

  <div>
    <p className="font-medium">
      Anzar Khan
    </p>

    <p className="text-xs text-on-surface-variant">
      Share something with your community
    </p>
  </div>
</div>

     <textarea
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Share something with your community..."
  rows={3}
  className="w-full min-h-[120px] rounded-2xl bg-slate-900/80 border border-white/10 p-5 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
/>

      <button
        onClick={submitPost}
        disabled={loading}
        className="
mt-4
px-6
py-3
rounded-xl
bg-primary
font-medium
hover:opacity-90
transition
"
      >
        {loading ? 'Posting...' : 'Post'}
      </button>
    </div>
  )
}
