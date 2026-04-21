import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Megaphone, Calendar, DollarSign } from "lucide-react";

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

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) notFound();

  const { data: campaignVenues } = await supabase
    .from("campaign_venues")
    .select("venue_id, venues(id, name, city, status)")
    .eq("campaign_id", id);

  type VenueInfo = { id: string; name: string; city: string; status: string };
  const venues = (campaignVenues ?? []).map((cv) => cv.venues as unknown as VenueInfo | null).filter((v): v is VenueInfo => v !== null);

  const now = new Date().toISOString().slice(0, 10);
  const isActive =
    campaign.start_date &&
    campaign.end_date &&
    campaign.start_date <= now &&
    campaign.end_date >= now;

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/campaigns"
          className="p-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.10)", color: "#A3A3A3" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
            >
              {campaign.name}
            </h1>
            {isActive && (
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ backgroundColor: "rgba(212,255,79,0.12)", color: "#D4FF4F" }}
              >
                Live
              </span>
            )}
            {campaign.deal_type && (
              <span
                className="text-xs px-2 py-1 rounded-full font-medium uppercase"
                style={{
                  backgroundColor:
                    campaign.deal_type === "fixed" ? "rgba(212,255,79,0.10)" :
                    campaign.deal_type === "cpm" ? "rgba(99,179,237,0.10)" :
                    "rgba(167,139,250,0.10)",
                  color:
                    campaign.deal_type === "fixed" ? "#D4FF4F" :
                    campaign.deal_type === "cpm" ? "#63B3ED" :
                    "#A78BFA",
                }}
              >
                {campaign.deal_type === "fixed" ? "Fixed Fee" : campaign.deal_type === "cpm" ? "CPM" : "Rev Share"}
              </span>
            )}
          </div>
          {campaign.advertiser && (
            <p className="text-sm mt-0.5" style={{ color: "#909090" }}>
              {campaign.advertiser}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign details */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
            >
              <Megaphone size={16} color="#D4FF4F" strokeWidth={2} />
            </div>
            <h2
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Campaign Details
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs mb-0.5" style={{ color: "#909090" }}>Advertiser</p>
              <p className="text-sm text-white">{campaign.advertiser ?? "—"}</p>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs mb-0.5" style={{ color: "#909090" }}>Start Date</p>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} color="#A3A3A3" strokeWidth={2} />
                  <p className="text-sm text-white tabular-nums">{formatDate(campaign.start_date)}</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs mb-0.5" style={{ color: "#909090" }}>End Date</p>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} color="#A3A3A3" strokeWidth={2} />
                  <p className="text-sm text-white tabular-nums">{formatDate(campaign.end_date)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs mb-0.5" style={{ color: "#909090" }}>Amount Charged</p>
              <div className="flex items-center gap-1.5">
                <DollarSign size={13} color="#D4FF4F" strokeWidth={2} />
                <p className="text-sm font-semibold text-white tabular-nums font-mono">
                  {campaign.amount_charged_zar != null
                    ? formatCurrency(campaign.amount_charged_zar)
                    : "—"}
                </p>
              </div>
            </div>

            {campaign.deal_type === "cpm" && campaign.cpm_rate != null && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#909090" }}>CPM Rate</p>
                <p className="text-sm font-mono text-white">R{campaign.cpm_rate}/CPM</p>
              </div>
            )}

            {campaign.deal_type === "share" && campaign.revenue_share_percent != null && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#909090" }}>Revenue Share</p>
                <p className="text-sm font-mono text-white">{campaign.revenue_share_percent}%</p>
              </div>
            )}

            {campaign.gym_revenue_share_percent != null && campaign.gym_revenue_share_percent > 0 && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#909090" }}>Gym Split</p>
                <p className="text-sm font-mono text-white">{campaign.gym_revenue_share_percent}%</p>
              </div>
            )}

            {(campaign.contact_person || campaign.contact_email) && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#909090" }}>Contact</p>
                {campaign.contact_person && (
                  <p className="text-sm text-white">{campaign.contact_person}</p>
                )}
                {campaign.contact_email && (
                  <p className="text-sm" style={{ color: "#A3A3A3" }}>{campaign.contact_email}</p>
                )}
              </div>
            )}

            {campaign.notes && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#909090" }}>Notes</p>
                <p className="text-sm" style={{ color: "#A3A3A3" }}>{campaign.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Venues */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={cardStyle}>
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-2">
              <MapPin size={16} color="#D4FF4F" strokeWidth={2} />
              <h3
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                Venues ({venues.length})
              </h3>
            </div>
          </div>

          {venues.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm" style={{ color: "#909090" }}>
              No venues attached to this campaign.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
                  {["Venue", "City", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#909090" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {venues.map((venue) => (
                  <tr
                    key={venue.id}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/venues/${venue.id}`}
                        className="text-sm font-medium text-white hover:text-[#D4FF4F] transition-colors"
                      >
                        {venue.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>
                      {venue.city}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          backgroundColor:
                            venue.status === "active"
                              ? "rgba(212,255,79,0.1)"
                              : "rgba(102,102,102,0.15)",
                          color: venue.status === "active" ? "#D4FF4F" : "#909090",
                        }}
                      >
                        {venue.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
