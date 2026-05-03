// Insights data endpoint — used by both admin and public agency views
// token param = public access; no token = admin only (auth required)
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
    // Admin access
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    isAdmin = true;
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch networks
  let networksQuery = service
    .from("gym_brands")
    .select(`
      id, name, logo_url, is_active, primary_color,
      contact_name, contact_email,
      audience_male_pct, audience_female_pct,
      audience_age_18_24, audience_age_25_34, audience_age_35_44, audience_age_45_plus,
      avg_dwell_minutes, audience_notes
    `)
    .eq("is_active", true)
    .order("name");

  if (allowedNetworkIds && allowedNetworkIds.length > 0) {
    networksQuery = networksQuery.in("id", allowedNetworkIds);
  }
  if (networkFilter && networkFilter !== "all") {
    networksQuery = networksQuery.eq("id", networkFilter);
  }

  const { data: networks } = await networksQuery;

  // Fetch venues
  let venuesQuery = service
    .from("venues")
    .select(`
      id, name, city, region, province, status, active_members,
      daily_entries, weekly_entries, monthly_entries, gym_brand_id,
      operating_hours
    `)
    .eq("status", "active");

  if (allowedNetworkIds && allowedNetworkIds.length > 0) {
    venuesQuery = venuesQuery.in("gym_brand_id", allowedNetworkIds);
  }
  if (networkFilter && networkFilter !== "all") {
    venuesQuery = venuesQuery.eq("gym_brand_id", networkFilter);
  }

  const { data: venues } = await venuesQuery;

  // Fetch screens
  const venueIds = (venues ?? []).map((v) => v.id);
  const { data: screens } = venueIds.length > 0
    ? await service.from("screens").select("id, venue_id, is_active").in("venue_id", venueIds)
    : { data: [] };

  // Fetch revenue for last 6 months (admin only — sanitised for public)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
  const { data: revenue } = venueIds.length > 0 && isAdmin
    ? await service
        .from("revenue_entries")
        .select("venue_id, month, rental_zar, revenue_share_zar")
        .in("venue_id", venueIds)
        .gte("month", sixMonthsAgo)
    : { data: [] };

  // Fetch active campaigns count
  const { data: activeCampaigns } = venueIds.length > 0
    ? await service
        .from("campaign_venues")
        .select("campaigns(id, name, advertiser, end_date)")
        .in("venue_id", venueIds)
    : { data: [] };

  // Fetch photo compliance
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
    revenue: revenue ?? [],
    activeCampaigns: activeCampaigns ?? [],
    photos: photos ?? [],
  });
}
