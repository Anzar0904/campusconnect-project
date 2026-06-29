import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditClient from './ProfileEditClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Edit Profile — IILM Connect' }

export default async function EditProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch fresh profile data directly from database
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, username, branch, year, is_verified, role, bio, dating_verified, roll_number, hostel, phone, email, college_id, colleges(name, city)')
    .eq('id', user.id)
    .single()

  return (
    <ProfileEditClient 
      profile={profile as any} 
      userId={user.id} 
    />
  )
}
