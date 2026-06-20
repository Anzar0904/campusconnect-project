import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HostelClient from './HostelClient'

export const metadata = { title: 'Hostel Hub — IILM Connect' }

export default async function HostelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('hostel, year, branch').eq('id', user.id).single()
  const { data: rooms } = await supabase.from('hostel_rooms').select('*, occupant:profiles!hostel_rooms_occupant_id_fkey(full_name,avatar_url,branch,year)').eq('is_seeking_roommate', true).limit(20)

  return <HostelClient profile={profile} seekingRoommates={rooms??[]} userId={user.id} />
}
