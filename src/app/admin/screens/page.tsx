export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import ScreensClient from "./ScreensClient";
import StaticSitesClient from "../static-sites/StaticSitesClient";
import ScreensTabsWrapper from "./ScreensTabsWrapper";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function ScreensPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ── Fetch digital screens ────────────────────────────────────────────────────
  const { data: screens, error } = await supabase
    .from("screens")
    .select(
      `
      id,
      label,
      location_in_venue,
      size_inches,
      orientation,
      resolution,
      is_active,
      cuecast_status,
      cuecast_last_seen,
      cuecast_player_token,
      notes,
      created_at,
      venue_id,
      venues (
        id,
        name,
        city
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching screens:", error);
  }

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city")
    .order("name");

  interface ScreenRow {
    id: string;
    label: string;
    location_in_venue: string | null;
    size_inches: number | null;
    orientation: string | null;
    resolution: string | null;
    is_active: boolean | null;
    cuecast_status: string | null;
    cuecast_last_seen: string | null;
    cuecast_player_token: string | null;
    notes: string | null;
    created_at: string;
    venue_id: string | null;
    venues: { id: string; name: string; city: string | null } | null;
  }

  const rows = (screens ?? []).map((s) => {
    const venueRaw = s.venues as unknown as
      | { id: string; name: string; city: string | null }[]
      | { id: string; name: string; city: string | null }
      | null;
    const venue = Array.isArray(venueRaw) ? (venueRaw[0] ?? null) : venueRaw;
    return { ...s, venues: venue } as ScreenRow;
  });

  // Summary stats
  const totalScreens = rows.length;
  const onlineCount = rows.filter((s) => s.cuecast_status === "online").length;
  const offlineCount = rows.filter((s) => s.cuecast_status === "offline").length;
  const unpairedCount = rows.filter(
    (s) => !s.cuecast_status || s.cuecast_status === "unpaired"
  ).length;
  const venueIds = new Set(rows.map((s) => s.venue_id).filter(Boolean));
  const venuesWithScreens = venueIds.size;

  // ── Fetch static sites ───────────────────────────────────────────────────────
  const svc = serviceClient();

  const { data: sitesRaw } = await svc
    .from("static_sites")
    .select("*, venues(id, name, city)")
    .order("created_at", { ascending: false });

  const { data: allVenues } = await svc
    .from("venues")
    .select("id, name, city")
    .order("name");

  interface StaticSiteRow {
    id: string;
    venue_id: string;
    label: string;
    site_type: string | null;
    location_in_venue: string | null;
    width_cm: number | null;
    height_cm: number | null;
    is_active: boolean | null;
    photo_url: string | null;
    notes: string | null;
    price_per_month: number | null;
    monthly_impressions: number | null;
    pricing_tier: string | null;
    production_cost: number | null;
    flighting_fee: number | null;
    created_at: string;
    venues: { id: string; name: string; city: string | null } | null;
  }

  const sites = ((sitesRaw ?? []) as unknown[]).map((s) => {
    const row = s as Record<string, unknown>;
    const venueRaw = row.venues as
      | { id: string; name: string; city: string | null }[]
      | { id: string; name: string; city: string | null }
      | null;
    const venue = Array.isArray(venueRaw) ? (venueRaw[0] ?? null) : venueRaw;
    return { ...row, venues: venue } as StaticSiteRow;
  });

  const totalSites = sites.length;
  const activeSites = sites.filter((s) => s.is_active !== false).length;
  const venuesCovered = new Set(sites.map((s) => s.venue_id)).size;
  const siteTypes = new Set(sites.map((s) => s.site_type).filter(Boolean)).size;

  // ── Build tab content ────────────────────────────────────────────────────────
  const screensContent = (
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
            Digital Screens
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            All screens across your network with Cuecast status
          </p>
        </div>
      </div>

      {/* Summary stat bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>Total Screens</p>
          <p className="text-2xl md:text-3xl font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>{totalScreens}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#999", fontWeight: 600 }}><span className="inline-block w-2 h-2 rounded-full bg-green-500" />Online</p>
          <p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: "#4ADE80" }}>{onlineCount}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#999", fontWeight: 600 }}><span className="inline-block w-2 h-2 rounded-full bg-red-500" />Offline</p>
          <p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: "#F87171" }}>{offlineCount}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#999", fontWeight: 600 }}><span className="inline-block w-2 h-2 rounded-full bg-zinc-500" />Unpaired</p>
          <p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: "#A1A1AA" }}>{unpairedCount}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>Venues w/ Screens</p>
          <p className="text-2xl md:text-3xl font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>{venuesWithScreens}</p>
        </div>
      </div>

      <ScreensClient screens={rows} venues={venues ?? []} />
    </div>
  );

  const staticSitesContent = (
    <div className="p-4 md:p-8">
      {/* Hero Panel */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-6 md:mb-8"
        style={{ borderRadius: 16 }}
      >
        <div className="relative z-10 p-5 md:p-8 flex items-center justify-between">
          <div>
            <h1
              style={{
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              Static Sites
            </h1>
            <p style={{ color: "#999", marginTop: "0.5rem" }}>
              Physical advertising installations across your venue network
            </p>
          </div>
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0"
            style={{ background: "rgba(212,255,79,0.12)", border: "1px solid rgba(212,255,79,0.2)" }}
          >
            <span style={{ fontSize: 24 }}>🪧</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: "Total Sites", value: totalSites, color: "#fff" },
          { label: "Active", value: activeSites, color: "#D4FF4F" },
          { label: "Venues Covered", value: venuesCovered, color: "#60A5FA" },
          { label: "Site Types", value: siteTypes, color: "#FB923C" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>{stat.label}</p>
            <p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <StaticSitesClient sites={sites} venues={allVenues ?? []} />
    </div>
  );

  return (
    <ScreensTabsWrapper
      screensContent={screensContent}
      staticSitesContent={staticSitesContent}
    />
  );
}
