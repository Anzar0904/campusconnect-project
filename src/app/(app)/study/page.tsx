import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudyClient from './StudyClient'
export const metadata = { title: 'Study Hub — IILM Connect' }
export default async function StudyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  // Fetch user profile and study groups concurrently
  const [profileResult, groupsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name,branch,year,college_id')
      .eq('id', user.id)
      .single(),
    supabase
      .from('study_groups')
      .select('*, study_group_members(user_id)')
      .order('created_at', { ascending: false })
  ])

  const profile = profileResult.data
  const groups = groupsResult.data

  return <StudyClient userId={user.id} profile={profile} initialGroups={groups || []} />
}
