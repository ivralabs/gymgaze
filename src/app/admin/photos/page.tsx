import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PhotosClient from './PhotosClient'

export default async function PhotosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // All venue photos (select storage_path for signed URLs)
  const { data: rawPhotos } = await supabase
    .from('venue_photos')
    .select(
      'id, venue_id, status, month, created_at, storage_path, venues(id, name, city, gym_brand_id, gym_brands(name))'
    )
    .order('created_at', { ascending: false })

  // All venues
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, city, status, gym_brand_id, gym_brands(name)')
    .order('name')

  // All screens (schema uses `label` and `is_active`)
  const { data: screens } = await supabase
    .from('screens')
    .select('id, venue_id, label, is_active, venues(id, name, city, gym_brands(name))')
    .order('venue_id')

  // Campaigns for proof of flighting
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, advertiser, start_date, end_date, campaign_venues(venue_id)')
    .order('start_date', { ascending: false })

  // Generate signed URLs for photos that have storage_path
  const photos = await Promise.all(
    (rawPhotos ?? []).map(async (photo) => {
      let signedUrl: string | null = null
      if (photo.storage_path) {
        const { data } = await supabase.storage
          .from('venue-photos')
          .createSignedUrl(photo.storage_path, 3600)
        signedUrl = data?.signedUrl ?? null
      }
      return { ...photo, signedUrl }
    })
  )

  return (
    <PhotosClient
      photos={photos as any}
      venues={(venues ?? []) as any}
      screens={(screens ?? []) as any}
      campaigns={(campaigns ?? []) as any}
    />
  )
}
