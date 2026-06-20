import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EventsClient from './EventsClient'

export const metadata = { title: 'Events — IILM Connect' }

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: true })

  const { data: myRSVPs } = await supabase
    .from('event_attendees')
    .select('event_id')
    .eq('user_id', user.id)

  const rsvpIds = (myRSVPs || []).map(r => r.event_id)

  return <EventsClient events={events || []} currentUserId={user.id} initialRSVPs={rsvpIds} />
}
