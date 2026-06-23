import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'
import { getCachedProfile } from '@/lib/profile'

export const metadata = { title: 'My Profile — IILM Connect' }

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const resolvedParams = await searchParams
  const targetUserId = resolvedParams.id || user.id
  const profile = await getCachedProfile(targetUserId)

  return <ProfileClient profile={profile} userId={user.id} targetUserId={targetUserId} />
}
