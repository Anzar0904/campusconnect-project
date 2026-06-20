import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MarketplaceClient from './MarketplaceClient'

export const metadata = { title: 'Marketplace — IILM Connect' }

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: items } = await supabase
    .from('marketplace_items')
    .select('*, seller:profiles!marketplace_items_seller_id_fkey(id,full_name,avatar_url,hostel)')
    .eq('status','available')
    .order('created_at',{ascending:false})
    .limit(40)

  return <MarketplaceClient items={items??[]} userId={user.id} />
}
