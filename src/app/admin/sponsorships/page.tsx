import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SponsorshipsClient from "./SponsorshipsClient";

export const metadata = {
  title: "Sponsorships | GymGaze Admin",
};

export default async function SponsorshipsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch all sponsorships
  const { data: sponsorships, error } = await supabase
    .from("sponsorships")
    .select(`
      id,
      brand_name,
      contact_name,
      contact_email,
      contact_phone,
      widget_type,
      coverage,
      city,
      billing_period,
      rate,
      status,
      start_date,
      end_date,
      logo_url,
      brand_colour,
      tagline,
      amount_collected,
      notes,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sponsorships:", error);
  }

  // Fetch venues for city dropdown
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city, status")
    .order("name");

  const rows = sponsorships ?? [];
  const activeRows = rows.filter((s) => s.status === "active");

  // Summary stats
  const activeCount = activeRows.length;
  const availableSlots = 3 - new Set(activeRows.map((s) => s.widget_type === "bundle" ? ["news","sports","weather"] : [s.widget_type]).flat()).size;

  // Monthly recurring revenue — normalise weekly rates to monthly equivalent
  const mrr = activeRows.reduce((sum, s) => {
    const r = Number(s.rate) || 0;
    return sum + (s.billing_period === "weekly" ? r * 4.33 : r);
  }, 0);

  const totalCollected = rows.reduce((sum, s) => sum + (Number(s.amount_collected) || 0), 0);

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
            Sponsorships
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            Widget sponsors — News, Sports &amp; Weather across the GymGaze network
          </p>
        </div>
      </div>

      {/* Summary stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>
            Active Sponsors
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
            {activeCount}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>
            Available Slots
          </p>
          <p
            className="text-2xl md:text-3xl font-bold text-white tabular-nums"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            {Math.max(0, availableSlots)}
            <span className="text-base font-medium" style={{ color: "#666" }}>/3</span>
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p
            className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"
            style={{ color: "#999", fontWeight: 600 }}
          >
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#D4FF4F" }} />
            Monthly Revenue
          </p>
          <p
            className="text-xl md:text-2xl font-bold tabular-nums"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "#D4FF4F",
            }}
          >
            R{Math.round(mrr).toLocaleString("en-ZA")}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>
            Total Collected
          </p>
          <p
            className="text-xl md:text-2xl font-bold text-white tabular-nums"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            R{totalCollected.toLocaleString("en-ZA")}
          </p>
        </div>
      </div>

      {/* Client component — widget cards, table, modals */}
      <SponsorshipsClient
        sponsorships={rows}
        venues={venues ?? []}
      />
    </div>
  );
}
