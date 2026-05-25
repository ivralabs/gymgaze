export const dynamic = "force-dynamic";

import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import StaticSitesPrint, { type StaticSitePrintRow } from "./StaticSitesPrint";

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

  // Parse the site IDs from query param
  const selectedIds = params.siteIds ? params.siteIds.split(",").filter(Boolean) : [];

  // Fetch all requested static sites with venue info
  let query = svc
    .from("static_sites")
    .select(
      "id, label, site_type, location_in_venue, width_cm, height_cm, is_active, photo_url, notes, price_per_month, monthly_impressions, pricing_tier, created_at, venues(id, name, city, province, cover_image_url)"
    )
    .order("created_at", { ascending: false });

  if (selectedIds.length > 0) {
    query = query.in("id", selectedIds);
  }

  const { data: rawSites } = await query;

  // Supabase returns venues as array from the join; normalise to single object
  const sites: StaticSitePrintRow[] = (rawSites ?? []).map((s) => {
    const venueRaw = s.venues as unknown as
      | { id: string; name: string; city: string | null; province: string | null; cover_image_url?: string | null }[]
      | { id: string; name: string; city: string | null; province: string | null; cover_image_url?: string | null }
      | null;
    const venue = Array.isArray(venueRaw) ? (venueRaw[0] ?? null) : venueRaw;
    return { ...s, venues: venue } as StaticSitePrintRow;
  });

  return (
    <StaticSitesPrint
      sites={sites}
      clientName={params.clientName ?? params.client ?? ""}
      flightStart={params.flightStart ?? params.start ?? ""}
      flightEnd={params.flightEnd ?? params.end ?? ""}
    />
  );
}
