import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import StaticSitesClient from "./StaticSitesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function StaticSitesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const svc = serviceClient();

  const { data: sitesRaw } = await svc
    .from("static_sites")
    .select("*, venues(id, name, city)")
    .order("created_at", { ascending: false });

  const { data: venues } = await svc
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
    created_at: string;
    venues: { id: string; name: string; city: string | null } | null;
  }

  const sites = ((sitesRaw ?? []) as unknown[]).map((s) => {
    const row = s as Record<string, unknown>;
    const venueRaw = row.venues as { id: string; name: string; city: string | null }[] | { id: string; name: string; city: string | null } | null;
    const venue = Array.isArray(venueRaw) ? (venueRaw[0] ?? null) : venueRaw;
    return { ...row, venues: venue } as StaticSiteRow;
  });

  const totalSites = sites.length;
  const activeSites = sites.filter((s) => s.is_active !== false).length;
  const venuesCovered = new Set(sites.map((s) => s.venue_id)).size;
  const siteTypes = new Set(sites.map((s) => s.site_type).filter(Boolean)).size;

  return (
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

      <StaticSitesClient sites={sites} venues={venues ?? []} />
    </div>
  );
}
