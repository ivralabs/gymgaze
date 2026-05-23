// Insights data endpoint — used by both admin and public agency views
// token param = public access; no token = admin only (auth required)
//
// ⚠️  PRIVACY NOTE:
//   Public (token) responses are STRIPPED of anything an agency doesn't need:
//   - contact_name / contact_email (internal CRM data)
//   - audience_notes             (internal notes)
//   - operating_hours            (operational detail)
//   - daily_entries / weekly_entries (granular footfall — monthly only)
//   - campaign advertiser names  (competitor intelligence)
//   - revenue data               (always admin-only)
//   - region                     (internal classification)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const networkFilter = searchParams.get("network"); // uuid or "all"

  let isAdmin = false;
  let allowedNetworkIds: string[] | null = null;
  let linkTitle = "GymGaze Network Insights";

  if (token) {
    // Public token-based access
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: link, error: linkErr } = await service
      .from("insight_links")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (linkErr || !link) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: "This link has expired" }, { status: 410 });
    }

    // Update view count + last_viewed_at
    await service
      .from("insight_links")
      .update({ view_count: (link.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
      .eq("token", token);

    allowedNetworkIds = link.network_ids ?? null;
    linkTitle = link.title ?? linkTitle;
  } else {
    // Admin-side access (admin/sales/viewer/custom with insights permission)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role, permissions").eq("id", user.id).single();
    const ADMIN_SIDE = ["admin", "sales", "viewer", "custom"];
    if (!profile?.role || !ADMIN_SIDE.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    isAdmin = true;
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ─── Networks ───────────────────────────────────────────────────────────────
  // Public: audience demographics only — no contact info, no internal notes
  const networkSelectPublic = `
    id, name, logo_url, primary_color,
    audience_male_pct, audience_female_pct,
    audience_age_18_24, audience_age_25_34, audience_age_35_44, audience_age_45_plus,
    avg_dwell_minutes
  `;
  const networkSelectAdmin = `
    id, name, logo_url, is_active, primary_color,
    contact_name, contact_email,
    audience_male_pct, audience_female_pct,
    audience_age_18_24, audience_age_25_34, audience_age_35_44, audience_age_45_plus,
    avg_dwell_minutes, audience_notes
  `;

  let networksQuery = service
    .from("gym_brands")
    .select(isAdmin ? networkSelectAdmin : networkSelectPublic)
    .eq("is_active", true)
    .order("name");

  if (allowedNetworkIds && allowedNetworkIds.length > 0) {
    networksQuery = networksQuery.in("id", allowedNetworkIds);
  }
  if (networkFilter && networkFilter !== "all") {
    networksQuery = networksQuery.eq("id", networkFilter);
  }

  const { data: networks } = await networksQuery;

  // ─── Venues ─────────────────────────────────────────────────────────────────
  // Public: city + province + member/monthly-entry counts only
  // No: operating_hours, daily_entries, weekly_entries, region (internal classification)
  const venueSelectPublic = "id, name, city, province, active_members, monthly_entries, gym_brand_id";
  const venueSelectAdmin = "id, name, city, region, province, status, active_members, daily_entries, weekly_entries, monthly_entries, gym_brand_id, operating_hours";
  const venueSelect: string = isAdmin ? venueSelectAdmin : venueSelectPublic;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let venuesQuery = (service.from("venues") as any)
    .select(venueSelect)
    .eq("status", "active");

  if (allowedNetworkIds && allowedNetworkIds.length > 0) {
    venuesQuery = venuesQuery.in("gym_brand_id", allowedNetworkIds);
  }
  if (networkFilter && networkFilter !== "all") {
    venuesQuery = venuesQuery.eq("gym_brand_id", networkFilter);
  }

  const { data: venues } = await venuesQuery;

  // ─── Screens ────────────────────────────────────────────────────────────────
  const venueIds = (venues ?? []).map((v: { id: string }) => v.id);
  const { data: screens } = venueIds.length > 0
    ? await service.from("screens").select("id, venue_id, is_active").in("venue_id", venueIds)
    : { data: [] };

  // ─── Revenue — ADMIN ONLY ────────────────────────────────────────────────────
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
  const { data: revenue } = venueIds.length > 0 && isAdmin
    ? await service
        .from("revenue_entries")
        .select("venue_id, month, rental_zar, revenue_share_zar")
        .in("venue_id", venueIds)
        .gte("month", sixMonthsAgo)
    : { data: [] };

  // ─── Campaigns — ADMIN gets advertiser name; public gets count only ─────────
  // Agencies must not see which competitors are running on the network
  const { data: campaignVenuesRaw } = venueIds.length > 0
    ? await service
        .from("campaign_venues")
        .select(isAdmin ? "venue_id, campaigns(id, name, advertiser, end_date)" : "venue_id, campaigns(id, end_date)")
        .in("venue_id", venueIds)
    : { data: [] };

  // For public: just expose how many ACTIVE campaigns are running (social proof),
  // not which advertisers or campaign names
  const campaignVenues = isAdmin
    ? (campaignVenuesRaw ?? [])
    : (campaignVenuesRaw ?? []).map((cv: { venue_id: string; campaigns: { id: string; end_date: string | null } | { id: string; end_date: string | null }[] | null }) => ({
        venue_id: cv.venue_id,
        campaigns: cv.campaigns, // only id + end_date — no name, no advertiser
      }));

  // ─── Photos ─────────────────────────────────────────────────────────────────
  const { data: photos } = venueIds.length > 0
    ? await service
        .from("venue_photos")
        .select("venue_id, status")
        .in("venue_id", venueIds)
    : { data: [] };

  return NextResponse.json({
    meta: { title: linkTitle, isAdmin, generatedAt: new Date().toISOString() },
    networks: networks ?? [],
    venues: venues ?? [],
    screens: screens ?? [],
    revenue: revenue ?? [],        // always [] for public
    activeCampaigns: campaignVenues ?? [],
    photos: photos ?? [],
  });
}
