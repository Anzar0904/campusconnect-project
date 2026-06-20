import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LostFoundClient from './LostFoundClient'

export const metadata = { title: 'Lost & Found — IILM Connect' }

export default async function LostFoundPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: items } = await supabase
    .from('lost_found')
    .select('*, reporter:profiles!lost_found_reporter_id_fkey(full_name,avatar_url)')
    .order('created_at', { ascending: false })
    .limit(40)

  return <LostFoundClient items={items??[]} userId={user.id} />
}
