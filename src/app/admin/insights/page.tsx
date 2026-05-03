import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InsightsClient from "./InsightsClient";

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Role gating handled by middleware now

  // Fetch all data server-side
  const { data: networks } = await supabase
    .from("gym_brands")
    .select(`
      id, name, logo_url, is_active, primary_color,
      audience_male_pct, audience_female_pct,
      audience_age_18_24, audience_age_25_34, audience_age_35_44, audience_age_45_plus,
      avg_dwell_minutes, audience_notes
    `)
    .eq("is_active", true)
    .order("name");

  const { data: venues } = await supabase
    .from("venues")
    .select(`
      id, name, city, province, region, status, gym_brand_id,
      active_members, daily_entries, weekly_entries, monthly_entries,
      operating_hours
    `)
    .eq("status", "active")
    .order("name");

  const venueIds = (venues ?? []).map((v) => v.id);

  const [
    { data: screens },
    { data: revenue },
    { data: campaignVenues },
    { data: photos },
    { data: links },
  ] = await Promise.all([
    supabase.from("screens").select("id, venue_id, is_active").in("venue_id", venueIds.length ? venueIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("revenue_entries").select("venue_id, month, rental_zar, revenue_share_zar").in("venue_id", venueIds.length ? venueIds : ["00000000-0000-0000-0000-000000000000"]).order("month", { ascending: false }).limit(500),
    supabase.from("campaign_venues").select("venue_id, campaigns(id, name, advertiser, start_date, end_date, amount_charged_zar)").in("venue_id", venueIds.length ? venueIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("venue_photos").select("venue_id, status").in("venue_id", venueIds.length ? venueIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("insight_links").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <InsightsClient
      networks={networks ?? []}
      venues={venues ?? []}
      screens={screens ?? []}
      revenue={revenue ?? []}
      campaignVenues={campaignVenues ?? []}
      photos={photos ?? []}
      links={links ?? []}
    />
  );
}
