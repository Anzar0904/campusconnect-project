import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InternshipsClient from './InternshipsClient'

export const metadata = { title: 'Internships — IILM Connect' }

export default async function InternshipsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('branch, year, skills, resume_url')
    .eq('id', user.id)
    .single()

  const { data: applications } = await (supabase as any)
  .from('internship_applications')

    .select('internship_id, status')
    .eq('user_id', user.id)

  const appliedMap: Record<string, string> = {}
  for (const a of applications ?? []) appliedMap[a.internship_id] = a.status

  return <InternshipsClient userId={user.id} profile={profile} appliedMap={appliedMap} />
}
