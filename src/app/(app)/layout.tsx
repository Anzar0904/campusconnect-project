import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import { getCachedProfile } from '@/lib/profile'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getCachedProfile(user.id)
  const profileData = profile as any
const college = profileData?.colleges
  const collegeName = college ? `${college.name}${college.city ? ' · ' + college.city : ''}` : 'IILM University · Greater Noida'
  

  return (
    <AppShell
      collegeName={collegeName}
      userId={user.id}
      initialProfile={profileData}
    >
      {children}
    </AppShell>
  )
}
