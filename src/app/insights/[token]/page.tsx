import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PublicInsightsClient from "./PublicInsightsClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicInsightsPage({ params }: Props) {
  const { token } = await params;

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Validate token exists
  const { data: link } = await service
    .from("insight_links")
    .select("id, token, title, network_ids, pin_hash, expires_at, view_count")
    .eq("token", token)
    .maybeSingle();

  if (!link) return notFound();

  const expired = link.expires_at && new Date(link.expires_at) < new Date();
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="text-center px-6">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Inter Tight, sans-serif" }}>Link Expired</h1>
          <p style={{ color: "#555" }}>This insights link is no longer active. Contact your GymGaze representative for a new link.</p>
        </div>
      </div>
    );
  }

  // If PIN-protected, client handles the gate
  // If open, fetch data server-side immediately
  let initialData = null;
  if (!link.pin_hash) {
    // Fetch data and increment view count
    await service
      .from("insight_links")
      .update({ view_count: (link.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
      .eq("token", token);

    const networkFilter = link.network_ids;

    let networksQ = service.from("gym_brands").select(`
      id, name, logo_url, primary_color, is_active,
      audience_male_pct, audience_female_pct,
      audience_age_18_24, audience_age_25_34, audience_age_35_44, audience_age_45_plus,
      avg_dwell_minutes, audience_notes
    `).eq("is_active", true).order("name");
    if (networkFilter?.length) networksQ = networksQ.in("id", networkFilter);
    const { data: networks } = await networksQ;

    let venuesQ = service.from("venues").select(`
      id, name, city, province, region, status, gym_brand_id,
      active_members, monthly_entries
    `).eq("status", "active");
    if (networkFilter?.length) venuesQ = venuesQ.in("gym_brand_id", networkFilter);
    const { data: venues } = await venuesQ;

    const venueIds = (venues ?? []).map((v) => v.id);
    const safeIds = venueIds.length ? venueIds : ["00000000-0000-0000-0000-000000000000"];

    const [{ data: screens }, { data: photos }, { data: cvs }] = await Promise.all([
      service.from("screens").select("id, venue_id, is_active").in("venue_id", safeIds),
      service.from("venue_photos").select("venue_id, status").in("venue_id", safeIds),
      service.from("campaign_venues").select("venue_id, campaigns(id, name, advertiser, end_date)").in("venue_id", safeIds),
    ]);

    initialData = { networks: networks ?? [], venues: venues ?? [], screens: screens ?? [], photos: photos ?? [], campaignVenues: cvs ?? [] };
  }

  return (
    <PublicInsightsClient
      token={token}
      title={link.title}
      pinProtected={!!link.pin_hash}
      initialData={initialData}
    />
  );
}
