export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MediaKitClient from "./MediaKitClient";

export const metadata = {
  title: "Media Kit | GymGaze Admin",
};

interface PricingTier {
  id: string;
  name: string;
  duration_seconds: number;
  cpm_zar: number;
  min_spend_zar: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export default async function MediaKitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const service = await createServiceClient();

  // Fetch all data in parallel
  const [
    { count: venueCount },
    { count: screenCount },
    gymBrandsResult,
    pricingTiersResult,
    settingsResult,
    enquiriesResult,
  ] = await Promise.all([
    service
      .from("venues")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    service
      .from("screens")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    service.from("gym_brands").select("id, audience_male_pct, audience_female_pct"),
    service
      .from("pricing_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    service.from("media_kit_settings").select("*").limit(1).maybeSingle(),
    service
      .from("media_kit_enquiries")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const totalVenues = venueCount ?? 0;
  const totalScreens = screenCount ?? 0;

  // Aggregate audience data from gym_brands
  const brands = gymBrandsResult.data ?? [];
  const brandsWithAudience = brands.filter(
    (b) => b.audience_male_pct != null || b.audience_female_pct != null
  );
  const avgMalePct =
    brandsWithAudience.length > 0
      ? Math.round(
          brandsWithAudience.reduce((s, b) => s + (b.audience_male_pct ?? 50), 0) /
            brandsWithAudience.length
        )
      : 62;
  const avgFemalePct = 100 - avgMalePct;

  // Total members approximation: venues * avg members per venue (or real field if exists)
  const membersResult = await service
    .from("venues")
    .select("member_count")
    .eq("status", "active");
  const totalMembers = (membersResult.data ?? []).reduce(
    (s, v) => s + ((v as { member_count?: number | null }).member_count ?? 0),
    0
  );

  // Monthly entries
  const footfallResult = await service
    .from("venues")
    .select("monthly_entries")
    .eq("status", "active");
  const totalMonthlyEntries = (footfallResult.data ?? []).reduce(
    (s, v) => s + (v.monthly_entries ?? 0),
    0
  );

  return (
    <div className="p-4 md:p-6">
      {/* Hero Panel */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-6"
        style={{ borderRadius: 16 }}
      >
        <div className="relative z-10 p-5 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span
                className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: "rgba(212,255,79,0.12)", color: "#D4FF4F", border: "1px solid rgba(212,255,79,0.2)" }}
              >
                Agency Sales Tool
              </span>
            </div>
            <h1
              style={{
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
                color: "#fff",
                letterSpacing: "-0.02em",
                marginTop: "0.5rem",
              }}
            >
              GymGaze Media Kit
            </h1>
            <p style={{ color: "#999", marginTop: "0.4rem", fontSize: "0.95rem" }}>
              Rate cards, network stats, audience data & ad formats
            </p>
          </div>
          {/* CTA buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={undefined}
              data-action="print"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: "#D4FF4F", color: "#0A0A0A" }}
              id="media-kit-print-btn"
            >
              ⬇ Download PDF
            </button>
            <a
              href="mailto:hello@gymgaze.co.za"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "transparent",
                color: "#D4FF4F",
                border: "1px solid rgba(212,255,79,0.35)",
              }}
            >
              📅 Book a Campaign
            </a>
          </div>
        </div>
      </div>

      {/* Network Stats — 4 big tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          {
            label: "Active Venues",
            value: totalVenues.toLocaleString("en-ZA"),
            icon: "🏟️",
            color: "#D4FF4F",
            sub: "SA-wide network",
          },
          {
            label: "Total Screens",
            value: totalScreens.toLocaleString("en-ZA"),
            icon: "📺",
            color: "#60A5FA",
            sub: "Always-on displays",
          },
          {
            label: "Active Members",
            value: totalMembers > 0 ? totalMembers.toLocaleString("en-ZA") : "50,000+",
            icon: "👥",
            color: "#4ADE80",
            sub: "Captive audience",
          },
          {
            label: "Monthly Entries",
            value: totalMonthlyEntries > 0 ? totalMonthlyEntries.toLocaleString("en-ZA") : "200,000+",
            icon: "📈",
            color: "#FB923C",
            sub: "High-frequency visits",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-4 md:p-5"
            style={{ borderRadius: 16 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: "1.25rem" }}>{stat.icon}</span>
              <p
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: "#999" }}
              >
                {stat.label}
              </p>
            </div>
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
            <p className="text-xs mt-2" style={{ color: "#666" }}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      <MediaKitClient
        settings={settingsResult.data ?? null}
        enquiries={enquiriesResult.data ?? []}
        pricingTiers={(pricingTiersResult.data ?? []) as PricingTier[]}
        avgMalePct={avgMalePct}
        avgFemalePct={avgFemalePct}
      />
    </div>
  );
}
