import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsLoader";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Revenue entries with venue join
  const { data: revenueEntries } = await supabase
    .from("revenue_entries")
    .select("*, venues(name, gym_brand_id)")
    .order("month", { ascending: true });

  // Venues
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, active_members, status, gym_brand_id");

  // Campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, start_date, end_date, amount_charged_zar");

  // Gym brands
  const { data: brands } = await supabase.from("gym_brands").select("id, name");

  // Venue photos
  const { data: photos } = await supabase
    .from("venue_photos")
    .select("id, status, venue_id, month");

  return (
    <AnalyticsClient
      revenueEntries={revenueEntries ?? []}
      venues={venues ?? []}
      campaigns={campaigns ?? []}
      brands={brands ?? []}
      photos={photos ?? []}
    />
  );
}
