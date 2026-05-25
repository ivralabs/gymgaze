export const dynamic = "force-dynamic";

import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import StaticSitesPrint from "./StaticSitesPrint";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function StaticSitesPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const svc = serviceClient();

  const { data: sites } = await svc
    .from("static_sites")
    .select(
      "id, venue_id, label, site_type, location_in_venue, width_cm, height_cm, is_active, photo_url, notes, price_per_month, monthly_impressions, pricing_tier, production_cost, flighting_fee, venues(id, name, city, province, cover_image_url)"
    )
    .eq("is_active", true)
    .order("created_at");

  const allSites = sites ?? [];
  const selectedSiteIds = params.sites ? params.sites.split(",").filter(Boolean) : [];
  const filteredSites =
    selectedSiteIds.length > 0
      ? allSites.filter((s) => selectedSiteIds.includes(s.id))
      : allSites;

  return (
    <StaticSitesPrint
      sites={filteredSites as unknown as Parameters<typeof StaticSitesPrint>[0]["sites"]}
      clientName={params.client ?? ""}
      flightStart={params.start ?? ""}
      flightEnd={params.end ?? ""}
    />
  );
}
