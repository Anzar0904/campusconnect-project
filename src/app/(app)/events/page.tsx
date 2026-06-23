import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EventsClient from './EventsClient'
import { getCachedProfile } from '@/lib/profile'

export const metadata = { title: 'Events — IILM Connect' }

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch profile, events, and RSVPs in parallel
  const [profile, eventsResult, rsvpsResult] = await Promise.all([
    getCachedProfile(user.id),
    supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true }),
    supabase
      .from('event_attendees')
      .select('event_id')
      .eq('user_id', user.id)
  ])

  const events = eventsResult.data
  const myRSVPs = rsvpsResult.data

  const rsvpIds = (myRSVPs || []).map((r: any) => r.event_id)

  return <EventsClient events={events || []} currentUserId={user.id} initialRSVPs={rsvpIds} profile={profile} />
}
