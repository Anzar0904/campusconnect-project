import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminClient from './SuperAdminClient'

export const metadata = { title: 'Platform Admin — IILM Connect' }

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Double-verify the role from the database explicitly
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  // Fetch dynamic owner email as the single source of truth
  const { data: ownerEmailData } = await supabase.rpc('owner_email')
  
  return <SuperAdminClient userId={user.id} ownerEmail={ownerEmailData as string} />
}
