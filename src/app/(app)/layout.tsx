import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, branch, year, is_verified, role, colleges(name, city)')
    .eq('id', user.id)
    .single()

  const college = (profile?.colleges as any)
  const collegeName = college ? `${college.name}${college.city ? ' · ' + college.city : ''}` : 'IILM University · Greater Noida'

  return (
    <AppShell
      collegeName={collegeName}
      userName={profile?.full_name}
      userAvatar={profile?.avatar_url}
      isVerified={profile?.is_verified}
      userRole={profile?.role}
      userId={user.id}
    >
      {children}
    </AppShell>
  )
}
