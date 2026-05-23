export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MediaKitClient from "./MediaKitClient";

export const metadata = {
  title: "Media Kit | GymGaze Admin",
};

export default async function MediaKitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const service = await createServiceClient();

  // Network stats
  const [{ count: venueCount }, { count: screenCount }, { count: campaignCount }, settings, enquiries] =
    await Promise.all([
      service.from("venues").select("*", { count: "exact", head: true }),
      service.from("screens").select("*", { count: "exact", head: true }),
      service
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      service.from("media_kit_settings").select("*").limit(1).maybeSingle(),
      service
        .from("media_kit_enquiries")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  const totalVenues = venueCount ?? 0;
  const totalScreens = screenCount ?? 0;
  const activeCampaigns = campaignCount ?? 0;
  const weeklyImpressions = totalScreens * 23792;

  return (
    <div className="p-4 md:p-8">
      {/* Hero Panel */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-6 md:mb-8"
        style={{ borderRadius: 16 }}
      >
        <div className="relative z-10 p-5 md:p-8">
          <h1
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Media Kit
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            Rate cards, network stats, and advertising enquiries
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: "Venues", value: totalVenues.toString(), color: "#60A5FA" },
          { label: "Screens", value: totalScreens.toString(), color: "#4ADE80" },
          {
            label: "Weekly Impressions",
            value: weeklyImpressions.toLocaleString("en-ZA"),
            color: "#D4FF4F",
          },
          {
            label: "Active Campaigns",
            value: activeCampaigns.toString(),
            color: "#FB923C",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-4 md:p-5"
            style={{ borderRadius: 16 }}
          >
            <p
              className="text-xs uppercase tracking-wider mb-2"
              style={{ color: "#999", fontWeight: 600 }}
            >
              {stat.label}
            </p>
            <p
              className="text-2xl md:text-3xl font-bold tabular-nums"
              style={{
                fontFamily: "Inter Tight, sans-serif",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                color: stat.color,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <MediaKitClient
        settings={settings.data ?? null}
        enquiries={enquiries.data ?? []}
      />
    </div>
  );
}
