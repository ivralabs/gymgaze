export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CampaignsClient from "./CampaignsClient";
import SponsorshipsClient from "../sponsorships/SponsorshipsClient";
import CampaignsTabsWrapper from "./CampaignsTabsWrapper";

export default async function CampaignsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ── Fetch campaigns ──────────────────────────────────────────────────────────
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(
      `
      id,
      client_name,
      client_type,
      contact_name,
      contact_email,
      contact_phone,
      format,
      status,
      start_date,
      end_date,
      total_value,
      amount_collected,
      notes,
      created_at,
      campaign_venues(id, venue_id)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error);
  }

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city, status")
    .order("name");

  // Summary stats
  const rows = campaigns ?? [];
  const totalCampaigns = rows.length;
  const activeCampaigns = rows.filter((c) => c.status === "active").length;
  const totalRevenue = rows.reduce((sum, c) => sum + (Number(c.total_value) || 0), 0);
  const totalCollected = rows.reduce((sum, c) => sum + (Number(c.amount_collected) || 0), 0);
  const totalOutstanding = totalRevenue - totalCollected;

  // ── Fetch sponsorships ───────────────────────────────────────────────────────
  const { data: sponsorships, error: sponsorshipsError } = await supabase
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

  if (sponsorshipsError) {
    console.error("Error fetching sponsorships:", sponsorshipsError);
  }

  const { data: venuesForSponsors } = await supabase
    .from("venues")
    .select("id, name, city, status")
    .order("name");

  const sponsorRows = sponsorships ?? [];
  const activeSponsors = sponsorRows.filter((s) => s.status === "active");
  const activeCount = activeSponsors.length;
  const availableSlots = 3 - new Set(
    activeSponsors.map((s) => s.widget_type === "bundle" ? ["news", "sports", "weather"] : [s.widget_type]).flat()
  ).size;
  const mrr = activeSponsors.reduce((sum, s) => {
    const r = Number(s.rate) || 0;
    return sum + (s.billing_period === "weekly" ? r * 4.33 : r);
  }, 0);
  const totalSponsorCollected = sponsorRows.reduce((sum, s) => sum + (Number(s.amount_collected) || 0), 0);

  // ── Build tab content ────────────────────────────────────────────────────────
  const campaignsContent = (
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
            Ad Campaigns
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            Manage ad campaigns, track revenue and collection
          </p>
        </div>
      </div>

      {/* Summary stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>Total Campaigns</p>
          <p className="text-2xl md:text-3xl font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>{totalCampaigns}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#999", fontWeight: 600 }}><span className="inline-block w-2 h-2 rounded-full bg-green-500" />Active</p>
          <p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: "#4ADE80" }}>{activeCampaigns}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>Total Revenue</p>
          <p className="text-xl md:text-2xl font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>R{totalRevenue.toLocaleString("en-ZA")}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#999", fontWeight: 600 }}><span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#D4FF4F" }} />Collected</p>
          <p className="text-xl md:text-2xl font-bold tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: "#D4FF4F" }}>R{totalCollected.toLocaleString("en-ZA")}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#999", fontWeight: 600 }}><span className="inline-block w-2 h-2 rounded-full bg-orange-400" />Outstanding</p>
          <p className="text-xl md:text-2xl font-bold tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: totalOutstanding > 0 ? "#FB923C" : "#4ADE80" }}>R{totalOutstanding.toLocaleString("en-ZA")}</p>
        </div>
      </div>

      <CampaignsClient campaigns={rows} venues={venues ?? []} />
    </div>
  );

  const sponsorshipsContent = (
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
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>Active Sponsors</p>
          <p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: "#4ADE80" }}>{activeCount}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>Available Slots</p>
          <p className="text-2xl md:text-3xl font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {Math.max(0, availableSlots)}<span className="text-base font-medium" style={{ color: "#666" }}>/3</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#999", fontWeight: 600 }}><span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#D4FF4F" }} />Monthly Revenue</p>
          <p className="text-xl md:text-2xl font-bold tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: "#D4FF4F" }}>R{Math.round(mrr).toLocaleString("en-ZA")}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>Total Collected</p>
          <p className="text-xl md:text-2xl font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>R{totalSponsorCollected.toLocaleString("en-ZA")}</p>
        </div>
      </div>

      <SponsorshipsClient sponsorships={sponsorRows} venues={venuesForSponsors ?? []} />
    </div>
  );

  return (
    <CampaignsTabsWrapper
      campaignsContent={campaignsContent}
      sponsorshipsContent={sponsorshipsContent}
    />
  );
}
