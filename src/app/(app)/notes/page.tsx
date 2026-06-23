import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotesClient from './NotesClient'

export const metadata = { title: 'Notes Library — IILM Connect' }

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch user profile and notes concurrently
  const [profileResult, notesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, college_id, branch')
      .eq('id', user.id)
      .single(),
    supabase
      .from('notes')
      .select('*, uploader:profiles!notes_uploader_id_fkey(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50)
  ])

  const profile = profileResult.data
  const notes = notesResult.data

  return (
  <NotesClient
    notes={notes ?? []}
    userId={user.id}
    userBranch={(profile as any)?.branch}
  />
)
}
