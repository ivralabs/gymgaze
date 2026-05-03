import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA")}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CampaignsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, advertiser, deal_type, start_date, end_date, amount_charged_zar, campaign_venues(id)")
    .order("start_date", { ascending: false });

  const rows = campaigns ?? [];
  const nowStr = new Date().toISOString().slice(0, 10);

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
            Campaigns
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Track ad campaigns across venues</p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <Link
              href="/admin/campaigns/new"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
            >
              <Plus size={14} strokeWidth={2.5} />
              New Campaign
            </Link>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20" style={{ borderRadius: 16 }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(212,255,79,0.08)" }}>
            <Megaphone size={26} color="#D4FF4F" strokeWidth={1.5} />
          </div>
          <p className="text-white font-medium mb-1">No campaigns yet</p>
          <p className="text-sm mb-5" style={{ color: "#909090" }}>Create your first campaign to start tracking advertising.</p>
          <Link href="/admin/campaigns/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}>
            <Plus size={16} strokeWidth={2.5} />
            New Campaign
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
                  {["Name", "Advertiser", "Deal Type", "Start Date", "End Date", "Amount (ZAR)", "Venues", ""].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#909090", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((campaign) => {
                  const venueCount = Array.isArray(campaign.campaign_venues) ? campaign.campaign_venues.length : 0;
                  const isActive = campaign.start_date && campaign.end_date && campaign.start_date <= nowStr && campaign.end_date >= nowStr;
                  return (
                    <tr key={campaign.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/campaigns/${campaign.id}`} className="text-sm font-medium text-white hover:text-[#D4FF4F] transition-colors">
                            {campaign.name}
                          </Link>
                          {isActive && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(212,255,79,0.12)", color: "#D4FF4F" }}>Live</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>{campaign.advertiser ?? "—"}</td>
                      <td className="px-6 py-4">
                        {campaign.deal_type ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider" style={{
                            backgroundColor: campaign.deal_type === "fixed" ? "rgba(212,255,79,0.10)" : campaign.deal_type === "cpm" ? "rgba(99,179,237,0.10)" : "rgba(167,139,250,0.10)",
                            color: campaign.deal_type === "fixed" ? "#D4FF4F" : campaign.deal_type === "cpm" ? "#63B3ED" : "#A78BFA",
                          }}>
                            {campaign.deal_type === "fixed" ? "Fixed Fee" : campaign.deal_type === "cpm" ? "CPM" : "Rev Share"}
                          </span>
                        ) : <span style={{ color: "#444" }}>—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm tabular-nums" style={{ color: "#A3A3A3" }}>{formatDate(campaign.start_date)}</td>
                      <td className="px-6 py-4 text-sm tabular-nums" style={{ color: "#A3A3A3" }}>{formatDate(campaign.end_date)}</td>
                      <td className="px-6 py-4 text-sm font-mono tabular-nums" style={{ color: "#FFFFFF" }}>
                        {campaign.amount_charged_zar != null ? formatCurrency(campaign.amount_charged_zar) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>{venueCount}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/campaigns/${campaign.id}`} className="text-xs font-medium" style={{ color: "#D4FF4F" }}>View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.map((campaign) => {
              const venueCount = Array.isArray(campaign.campaign_venues) ? campaign.campaign_venues.length : 0;
              const isActive = campaign.start_date && campaign.end_date && campaign.start_date <= nowStr && campaign.end_date >= nowStr;
              const dealColor = campaign.deal_type === "fixed" ? "#D4FF4F" : campaign.deal_type === "cpm" ? "#63B3ED" : "#A78BFA";
              const dealBg = campaign.deal_type === "fixed" ? "rgba(212,255,79,0.10)" : campaign.deal_type === "cpm" ? "rgba(99,179,237,0.10)" : "rgba(167,139,250,0.10)";
              const dealLabel = campaign.deal_type === "fixed" ? "Fixed Fee" : campaign.deal_type === "cpm" ? "CPM" : campaign.deal_type === "revenue_share" ? "Rev Share" : campaign.deal_type ?? "—";
              return (
                <Link key={campaign.id} href={`/admin/campaigns/${campaign.id}`} className="glass-card block rounded-2xl p-4" style={{ borderRadius: 16, textDecoration: "none" }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{campaign.name}</p>
                        {isActive && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(212,255,79,0.12)", color: "#D4FF4F" }}>Live</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#666" }}>{campaign.advertiser ?? "—"}</p>
                    </div>
                    {campaign.deal_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider flex-shrink-0" style={{ backgroundColor: dealBg, color: dealColor }}>
                        {dealLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap pt-3 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#A3A3A3" }}>
                    <span>{formatDate(campaign.start_date)} → {formatDate(campaign.end_date)}</span>
                    <span style={{ color: "#fff" }}>{campaign.amount_charged_zar != null ? formatCurrency(campaign.amount_charged_zar) : "—"}</span>
                    <span>{venueCount} venue{venueCount !== 1 ? "s" : ""}</span>
                    <span className="ml-auto font-medium" style={{ color: "#D4FF4F" }}>View →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
