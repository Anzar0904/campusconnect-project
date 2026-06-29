import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from './CalendarClient'

export const metadata = { title: 'Academic Calendar — IILM Connect' }

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: true })

  return <CalendarClient events={events??[]} userId={user.id} />
}
