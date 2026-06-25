import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My Profile — IILM Connect' }

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const resolvedParams = await searchParams
  const targetUserId = resolvedParams.id || user.id

  // Fetch fresh profile data directly from database on load to bypass server-side caching
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, username, branch, year, is_verified, role, bio, dating_verified, roll_number, hostel, phone, email, college_id, colleges(name, city)')
    .eq('id', targetUserId)
    .single()
  
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const currentUserRole = currentUserProfile?.role || 'STUDENT'

  return (
    <ProfileClient 
      profile={profile as any} 
      userId={user.id} 
      targetUserId={targetUserId} 
      currentUserRole={currentUserRole} 
    />
  )
}
