import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import StudyRoomClient from './StudyRoomClient'

export const metadata = { title: 'Study Room — IILM Connect' }

export default async function StudyRoomPage({
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

  // Fetch study group details, memberships, and user profile concurrently
  const [groupResult, membershipResult, membersResult, profileResult] = await Promise.all([
    supabase
      .from('study_groups')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('study_group_members')
      .select('*')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('study_group_members')
      .select('user_id, profiles!study_group_members_user_id_fkey(id, full_name, avatar_url, branch, year)')
      .eq('group_id', id),
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
  ])

  const group = groupResult.data
  const groupError = groupResult.error
  const membership = membershipResult.data
  const members = membersResult.data
  const profile = profileResult.data

  if (groupError || !group) {
    notFound()
  }

  // Redirect to browse study page if not a member of the study room
  if (!membership) {
    redirect('/study')
  }

  return (
    <StudyRoomClient
      group={group}
      initialMembers={members || []}
      currentUserId={user.id}
      currentUserRole={profile?.role || 'STUDENT'}
    />
  )
}
