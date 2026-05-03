import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddVenueForm from "./add-venue-form";
import VenuesGrid from "./VenuesGrid";

export default async function VenuesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Rich data fetch for cards
  const { data: venues } = await supabase
    .from("venues")
    .select(`
      id, name, city, province, region, status,
      active_members, daily_entries, monthly_entries,
      gym_brands(id, name, logo_url, primary_color),
      screens(id, is_active),
      venue_photos(id, status)
    `)
    .order("name");

  const { data: brands } = await supabase
    .from("gym_brands")
    .select("id, name")
    .order("name");

  // Network-wide summary stats
  const rows = venues ?? [];
  const totalActiveMembers = rows.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalScreens = rows.reduce((s, v) => s + (Array.isArray(v.screens) ? v.screens.length : 0), 0);
  const cities = new Set(rows.map((v) => v.city).filter(Boolean));
  const activeVenues = rows.filter((v) => v.status === "active").length;

  return (
    <div className="p-4 md:p-8">
      {/* Hero Panel */}
      <div className="glass-panel relative overflow-hidden rounded-2xl mb-6 md:mb-8" style={{ borderRadius: 16 }}>
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
            Venues
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>All gym locations across your network</p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <AddVenueForm brands={brands ?? []} />
          </div>
        </div>
      </div>

      {/* Summary stat bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: "Total Venues", value: rows.length.toString(), sub: `${activeVenues} active` },
          { label: "Active Members", value: totalActiveMembers.toLocaleString("en-ZA"), sub: "across all venues" },
          { label: "Screens Live", value: totalScreens.toString(), sub: "digital screens" },
          { label: "Cities", value: cities.size.toString(), sub: "locations covered" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-4 md:p-5"
            style={{ borderRadius: 16 }}
          >
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#666", fontWeight: 600 }}>
              {stat.label}
            </p>
            <p
              className="text-2xl md:text-3xl font-bold text-white tabular-nums"
              style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}
            >
              {stat.value}
            </p>
            <p className="text-xs mt-1.5" style={{ color: "#555" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Venues grid — client component for filtering */}
      <VenuesGrid venues={rows} brands={brands ?? []} />
    </div>
  );
}
