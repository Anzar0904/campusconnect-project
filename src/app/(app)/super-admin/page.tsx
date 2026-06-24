import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminClient from './SuperAdminClient'

import { getCachedProfile } from '@/lib/profile'

export const metadata = { title: 'Platform Admin — IILM Connect' }

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Double-verify the role from the cached profile utility
  const profile = await getCachedProfile(user.id)
  const profileData = profile as any

  const userRole = (profileData?.role || '').toUpperCase()
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN' && userRole !== 'COLLEGE_ADMIN') {
    redirect('/dashboard')
  }

  // Fetch dynamic owner email as the single source of truth
  const { data: ownerEmailData } = await supabase.rpc('owner_email')
  
  return (
  <SuperAdminClient
    userId={user.id}
    ownerEmail={ownerEmailData ?? ''}
  />
)
}
