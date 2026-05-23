export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScreensClient from "./ScreensClient";

export default async function ScreensPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

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

  // Supabase joins return venues as array; cast to expected shape
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
    const venue = Array.isArray(venueRaw)
      ? (venueRaw[0] ?? null)
      : venueRaw;
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
            Screen Inventory
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            All screens across your network with Cuecast status
          </p>
        </div>
      </div>

      {/* Summary stat bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        <div
          className="glass-card rounded-2xl p-4 md:p-5"
          style={{ borderRadius: 16 }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: "#999", fontWeight: 600 }}
          >
            Total Screens
          </p>
          <p
            className="text-2xl md:text-3xl font-bold text-white tabular-nums"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {totalScreens}
          </p>
        </div>

        <div
          className="glass-card rounded-2xl p-4 md:p-5"
          style={{ borderRadius: 16 }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"
            style={{ color: "#999", fontWeight: 600 }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            Online
          </p>
          <p
            className="text-2xl md:text-3xl font-bold tabular-nums"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "#4ADE80",
            }}
          >
            {onlineCount}
          </p>
        </div>

        <div
          className="glass-card rounded-2xl p-4 md:p-5"
          style={{ borderRadius: 16 }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"
            style={{ color: "#999", fontWeight: 600 }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            Offline
          </p>
          <p
            className="text-2xl md:text-3xl font-bold tabular-nums"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "#F87171",
            }}
          >
            {offlineCount}
          </p>
        </div>

        <div
          className="glass-card rounded-2xl p-4 md:p-5"
          style={{ borderRadius: 16 }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"
            style={{ color: "#999", fontWeight: 600 }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-zinc-500" />
            Unpaired
          </p>
          <p
            className="text-2xl md:text-3xl font-bold tabular-nums"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "#A1A1AA",
            }}
          >
            {unpairedCount}
          </p>
        </div>

        <div
          className="glass-card rounded-2xl p-4 md:p-5"
          style={{ borderRadius: 16 }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: "#999", fontWeight: 600 }}
          >
            Venues w/ Screens
          </p>
          <p
            className="text-2xl md:text-3xl font-bold text-white tabular-nums"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {venuesWithScreens}
          </p>
        </div>
      </div>

      {/* Client component for filter + table */}
      <ScreensClient screens={rows} venues={venues ?? []} />
    </div>
  );
}
