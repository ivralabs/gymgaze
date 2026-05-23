export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import AdvertiseClient from "./AdvertiseClient";

export const metadata = {
  title: "Advertise with GymGaze | Reach South Africa's Gym Audience",
  description:
    "Reach South Africa's most engaged gym audience. CPM-based digital advertising across GymGaze screens in premium gym venues.",
};

// revalidate = 0 set above (force-dynamic)

interface NetworkStats {
  totalVenues: number;
  totalScreens: number;
  weeklyImpressions: number;
  activeCampaigns: number;
}

interface Settings {
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tagline: string | null;
}

export default async function AdvertisePage() {
  const supabase = await createServiceClient();

  const [venuesRes, screensRes, campaignsRes, settingsRes] = await Promise.all([
    supabase.from("venues").select("*", { count: "exact", head: true }),
    supabase.from("screens").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("media_kit_settings").select("*").limit(1).maybeSingle(),
  ]);

  const stats: NetworkStats = {
    totalVenues: venuesRes.count ?? 0,
    totalScreens: screensRes.count ?? 0,
    weeklyImpressions: (screensRes.count ?? 0) * 23792,
    activeCampaigns: campaignsRes.count ?? 0,
  };

  const settings: Settings = {
    contact_name: settingsRes.data?.contact_name ?? null,
    contact_email: settingsRes.data?.contact_email ?? null,
    contact_phone: settingsRes.data?.contact_phone ?? null,
    tagline: settingsRes.data?.tagline ?? null,
  };

  return <AdvertiseClient stats={stats} settings={settings} />;
}
