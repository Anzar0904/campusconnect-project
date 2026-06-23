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
      userName={profileData?.full_name}
      userAvatar={profileData?.avatar_url}
      isVerified={profileData?.is_verified}
      userRole={profileData?.role}
      userId={user.id}
      username={profileData?.username}
      branch={profileData?.branch}
      year={profileData?.year}
    >
      {children}
    </AppShell>
  )
}
