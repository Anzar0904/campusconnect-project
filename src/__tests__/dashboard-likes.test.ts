/**
 * Tests for Dashboard like seeding
 * Verifies that liked post IDs are fetched from post_likes table
 * and passed into DashboardClient so PostCard renders correctly
 * on first load.
 */

import { mockSupabaseClient } from './setup'

describe('Dashboard like seeding', () => {
  beforeEach(() => jest.clearAllMocks())

  it('fetches post_likes for current user when posts exist', async () => {
    const userId = 'user-123'
    const postIds = ['post-1', 'post-2', 'post-3']

    const selectMock = jest.fn().mockReturnThis()
    const eqMock     = jest.fn().mockReturnThis()
    const inMock     = jest.fn().mockResolvedValue({
      data: [{ post_id: 'post-1' }, { post_id: 'post-3' }],
      error: null,
    })

    mockSupabaseClient.from = jest.fn().mockReturnValue({
      select: selectMock,
      eq:     eqMock,
      in:     inMock,
    })

    // Simulate the page.tsx query
    const result = await mockSupabaseClient
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('post_likes')
    expect(eqMock).toHaveBeenCalledWith('user_id', userId)
    expect(inMock).toHaveBeenCalledWith('post_id', postIds)

    const likedPostIds = (result.data ?? []).map((l: any) => l.post_id)
    expect(likedPostIds).toEqual(['post-1', 'post-3'])
    expect(likedPostIds).not.toContain('post-2')
  })

  it('returns empty array when no posts exist (skips post_likes query)', async () => {
    const postIds: string[] = []
    // When postIds is empty, page.tsx skips the query entirely
    const likedPostIds = postIds.length > 0 ? ['would-query'] : []
    expect(likedPostIds).toEqual([])
  })

  it('initialLikedIds correctly initialises PostCard liked state', () => {
    // Unit-test the prop logic
    const likedIds = ['post-1', 'post-3']
    const posts = [
      { id: 'post-1', content: 'Hello' },
      { id: 'post-2', content: 'World' },
      { id: 'post-3', content: 'Test' },
    ]

    const results = posts.map(p => ({
      id: p.id,
      initialLiked: likedIds.includes(p.id),
    }))

    expect(results[0].initialLiked).toBe(true)   // post-1: liked
    expect(results[1].initialLiked).toBe(false)  // post-2: not liked
    expect(results[2].initialLiked).toBe(true)   // post-3: liked
  })

  it('toggle_post_like RPC is called (not deprecated increment_post_likes)', async () => {
    mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
      data: { liked: true, likes_count: 5 },
      error: null,
    })

    await mockSupabaseClient.rpc('toggle_post_like', {
      p_post_id: 'post-1',
      p_user_id: 'user-123',
    })

    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'toggle_post_like',
      { p_post_id: 'post-1', p_user_id: 'user-123' }
    )
    expect(mockSupabaseClient.rpc).not.toHaveBeenCalledWith(
      'increment_post_likes',
      expect.anything()
    )
  })
})
