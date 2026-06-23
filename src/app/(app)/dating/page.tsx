import { CheckCircle, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DatingClient from './DatingClient'
import { getCachedProfile } from '@/lib/profile'

export const metadata = { title: 'Campus Dating — IILM Connect' }

export default async function DatingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile: any = await getCachedProfile(user.id)

  const isAdmin =
  profile?.role?.toUpperCase() === 'ADMIN' ||
  profile?.role?.toUpperCase() === 'SUPER_ADMIN'

if (!isAdmin && !profile?.dating_verified)
{
  return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{background:'rgba(255,180,171,0.12)',border:'2px solid rgba(255,180,171,0.3)'}}>
            <ShieldAlert className="text-error" size={32} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface">
  Dating Access Required
</h1>
<p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
  Dating access requires profile verification, age verification, safety acceptance, and admin approval.
</p>
          </div>
          <div className="p-4 rounded-xl text-left text-sm" style={{background:'rgba(255,255,255,0.03)'}}>
            <ul className="space-y-2 text-on-surface-variant">
             <li className="flex gap-2 items-start">
  <CheckCircle className="text-primary" size={16} />
  Verified college account
</li>

<li className="flex gap-2 items-start">
  <CheckCircle className="text-primary" size={16} />
  Age 18 or above
</li>

<li className="flex gap-2 items-start">
  <CheckCircle className="text-primary" size={16} />
  Super Admin dating approval
</li>
            </ul>
          </div>
          <a href="/dating/verify" className="btn-primary w-full justify-center">
            Verify Your Account
          </a>
        </div>
      </div>
    )
  }

  // Fetch dating profile, swiped IDs, and matches in parallel to avoid a waterfall
  const [datingProfileResult, swipedIdsResult, matchesResult] = await Promise.all([
    supabase
      .from('dating_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('dating_swipes')
      .select('swiped_id')
      .eq('swiper_id', user.id),
    supabase
      .from('dating_matches')
      .select('*, user1:profiles!dating_matches_user1_id_fkey(id, full_name, branch, year, avatar_url), user2:profiles!dating_matches_user2_id_fkey(id, full_name, branch, year, avatar_url)')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
  ])

  const myDatingProfile = datingProfileResult.data
  const swipedIds = swipedIdsResult.data
  const dbMatches = matchesResult.data

  const excludeIds = (swipedIds || [])
    .map((s: any) => s.swiped_id)
    .concat(user.id)

  const myGender = myDatingProfile?.gender?.toLowerCase()
  let targetGender = null
  if (myGender === 'male') {
    targetGender = 'Female'
  } else if (myGender === 'female') {
    targetGender = 'Male'
  }

  let dbQuery = supabase
    .from('dating_profiles')
    .select('*, profiles!dating_profiles_user_id_fkey(full_name, branch, year, avatar_url)')
    .eq('is_active', true)
    .not('user_id', 'in', `(${excludeIds.join(',')})`)

  if (targetGender) {
    dbQuery = dbQuery.eq('gender', targetGender)
  }

  const { data: discoverable } = await dbQuery.limit(20)

  return <DatingClient 
    userId={user.id} 
    profile={profile} 
    datingProfile={myDatingProfile} 
    initialDiscoverable={discoverable || []}
    initialMatches={dbMatches || []}
  />
}
