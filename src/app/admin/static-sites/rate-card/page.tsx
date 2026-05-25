export const dynamic = "force-dynamic";

import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import StaticSitesRateCardClient from "./StaticSitesRateCardClient";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function StaticSitesRateCardPage() {
  const svc = serviceClient();

  const { data: sites } = await svc
    .from("static_sites")
    .select(
      "id, venue_id, label, site_type, location_in_venue, width_cm, height_cm, is_active, photo_url, notes, price_per_month, monthly_impressions, pricing_tier, venues(id, name, city, province, cover_image_url, monthly_entries)"
    )
    .eq("is_active", true)
    .order("created_at");

  return (
    <StaticSitesRateCardClient
      sites={(sites ?? []) as unknown as Parameters<typeof StaticSitesRateCardClient>[0]["sites"]}
    />
  );
}
