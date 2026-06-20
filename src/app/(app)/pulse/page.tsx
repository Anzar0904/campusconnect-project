import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PulseClient from './PulseClient'

export const metadata = { title: 'Campus Pulse — IILM Connect' }

export default async function PulsePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return <PulseClient userId={user.id} />
}
