'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { PenTool } from 'lucide-react'

export default function CreatePost({
  communityId,
  profile,
}: {
  communityId: string
  profile?: any
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
    <div className="card-premium p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-3">
        <h2 className="font-display text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
          <PenTool size={14} className="text-brand-400" /> Share a Thought
        </h2>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <GlobalAvatar profile={profile} size="md" />
        <div>
          <p className="font-semibold text-xs text-white">
            {profile?.full_name || 'Student Member'}
          </p>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            {profile?.branch || 'Campus Connect'} · Year {profile?.year || '1'}
          </p>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message or share an update with the community..."
        className="w-full min-h-[90px] rounded-xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.1] focus:border-brand-500/50 p-4 text-xs text-white placeholder:text-zinc-500 resize-none outline-none transition-all"
      />

      <div className="flex justify-end mt-3">
        <button
          onClick={submitPost}
          disabled={loading || !content.trim()}
          className="btn-premium px-5 py-2 text-xs font-bold"
        >
          {loading ? 'Posting...' : 'Share Post'}
        </button>
      </div>
    </div>
  )
}
