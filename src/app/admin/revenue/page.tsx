import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RevenueClient from './RevenueClient'
import RevenuePageClient from './RevenuePageClient'
import type { RevenueEntry, Venue, Campaign, Contract } from './RevenueClient'

export default async function RevenuePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Revenue entries with venue + brand join
  const { data: revenueEntries } = await supabase
    .from('revenue_entries')
    .select(
      'id, venue_id, month, rental_zar, revenue_share_zar, venues(id, name, city, region, gym_brand_id, gym_brands(name))'
    )
    .order('month', { ascending: false })
    .limit(50)

  // All venues (for form dropdown)
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, city, region, status, active_members, gym_brand_id, gym_brands(name)')
    .order('name')

  // Venues for the entry form (simple list)
  const { data: venuesForForm } = await supabase
    .from('venues')
    .select('id, name, city')
    .order('name')

  // Campaigns with deal data
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select(
      'id, name, advertiser, start_date, end_date, amount_charged_zar, deal_type, cpm_rate, revenue_share_percent, gym_revenue_share_percent'
    )
    .order('start_date', { ascending: false })

  // Contracts
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, venue_id, monthly_rental_zar, revenue_share_percent, start_date, end_date')

  return (
    <div>
      {/* Add Entry form lives in the hero area — injected into RevenueClient via prop */}
      <RevenueClient
        revenueEntries={(revenueEntries ?? []) as unknown as RevenueEntry[]}
        venues={(venues ?? []) as unknown as Venue[]}
        campaigns={(campaigns ?? []) as unknown as Campaign[]}
        contracts={(contracts ?? []) as unknown as Contract[]}
        venuesForForm={venuesForForm ?? []}
      />
    </div>
  )
}
