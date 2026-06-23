import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InternshipsClient from './InternshipsClient'
import { getCachedProfile } from '@/lib/profile'

export const metadata = { title: 'Internships — IILM Connect' }

export default async function InternshipsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch profile, internship applications, and internships concurrently
  const [profile, applicationsResult, internshipsResult] = await Promise.all([
    getCachedProfile(user.id),
    (supabase as any)
      .from('internship_applications')
      .select('internship_id, status')
      .eq('user_id', user.id),
    supabase
      .from('internships')
      .select('*')
  ])

  const applications = applicationsResult.data
  const dbInternships = internshipsResult.data

  const appliedMap: Record<string, string> = {}
  for (const a of applications ?? []) appliedMap[a.internship_id] = a.status

  return <InternshipsClient userId={user.id} profile={profile} appliedMap={appliedMap} dbInternships={dbInternships || []} />
}
