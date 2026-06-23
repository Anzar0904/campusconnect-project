import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlacementsClient from './PlacementsClient'

export const metadata = { title: 'Placements — IILM Connect' }

export default async function PlacementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch profile, placement drives, verified offers, and registrations in parallel
  const [profileResult, drivesResult, offersResult, registrationsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('branch, year, full_name, college_id')
      .eq('id', user.id)
      .single(),
    supabase
      .from('internships')   // Re-using internships table for placement drives; filter by type
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('placements')
      .select('company, role, package_lpa, offer_type, year, profiles!placements_student_id_fkey(branch)')
      .eq('is_verified', true)
      .order('package_lpa', { ascending: false })
      .limit(20),
    supabase
      .from('placement_registrations')
      .select('drive_id, status, ctc_offered')
      .eq('user_id', user.id)
  ])

  const profile = profileResult.data
  const dbDrives = drivesResult.data
  const offers = offersResult.data
  const myRegistrations = registrationsResult.data

  return (
    <PlacementsClient
      userId={user.id}
      profile={profile}
      dbDrives={dbDrives || []}
      dbOffers={offers || []}
      myRegistrations={myRegistrations || []}
    />
  )
}
