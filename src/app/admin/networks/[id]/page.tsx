import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Phone, Mail, User, Megaphone, Image as ImageIcon } from "lucide-react";
import EditBrandButton from "./EditBrandButton";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import NetworkRevenueChartWrapper from "./NetworkRevenueChartWrapper";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#D4FF4F", bg: "rgba(212,255,79,0.1)" },
  inactive: { label: "Inactive", color: "#909090", bg: "rgba(102,102,102,0.15)" },
  coming_soon: { label: "Coming Soon", color: "#A3A3A3", bg: "rgba(163,163,163,0.15)" },
};

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
};

export default async function NetworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: networkId } = await params;
  const supabase = await createClient();

  // Brand info
  const { data: network } = await supabase
    .from("gym_brands")
    .select("id, name, is_active, contact_name, contact_email, contact_phone, logo_url")
    .eq("id", networkId)
    .maybeSingle();

  if (!network) notFound();

  // Venues with full data
  const { data: venues } = await supabase
    .from("venues")
    .select(
      `
      id, name, city, status, active_members, daily_entries,
      screens(id),
      contracts(monthly_rental_zar, revenue_share_percent, start_date, end_date),
      revenue_entries(rental_zar, revenue_share_zar, month),
      venue_photos(id, status, month)
    `
    )
    .eq("gym_brand_id", networkId)
    .order("name");

  const venueRows = venues ?? [];

  // Active campaigns at this brand's venues
  const venueIds = venueRows.map((v) => v.id);
  let campaignVenues: { campaigns: { id: string; name: string; advertiser: string; start_date: string; end_date: string; amount_charged_zar: number } | null }[] = [];
  if (venueIds.length > 0) {
    const { data } = await supabase
      .from("campaign_venues")
      .select("campaigns(id, name, advertiser, start_date, end_date, amount_charged_zar)")
      .in("venue_id", venueIds);
    campaignVenues = (data ?? []) as unknown as typeof campaignVenues;
  }

  // Current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayStr = now.toISOString().split("T")[0];

  // Computed stats
  const totalVenues = venueRows.length;
  const totalMembers = venueRows.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const mtdRevenue = venueRows.reduce((sum, v) => {
    const entries = Array.isArray(v.revenue_entries) ? v.revenue_entries : [];
    return (
      sum +
      entries
        .filter((e) => e.month === currentMonth)
        .reduce((s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0)
    );
  }, 0);

  // Active campaigns (unique, end_date >= today)
  const seenCampaignIds = new Set<string>();
  const activeCampaigns = campaignVenues
    .map((cv) => cv.campaigns)
    .filter((c): c is NonNullable<typeof c> => !!c && c.end_date >= todayStr)
    .filter((c) => {
      if (seenCampaignIds.has(c.id)) return false;
      seenCampaignIds.add(c.id);
      return true;
    });

  // All campaigns (for listing section — including past)
  const seenAll = new Set<string>();
  const allCampaigns = campaignVenues
    .map((cv) => cv.campaigns)
    .filter((c): c is NonNullable<typeof c> => !!c)
    .filter((c) => {
      if (seenAll.has(c.id)) return false;
      seenAll.add(c.id);
      return true;
    })
    .filter((c) => c.end_date >= todayStr);

  // Revenue last 6 months
  const last6: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-ZA", { month: "short", year: "2-digit" });
    last6.push({ key, label });
  }

  const revenueChartData = last6.map(({ key, label }) => {
    const rev = venueRows.reduce((sum, v) => {
      const entries = Array.isArray(v.revenue_entries) ? v.revenue_entries : [];
      return (
        sum +
        entries
          .filter((e) => e.month === key)
          .reduce((s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0)
      );
    }, 0);
    return { month: label, revenue: rev };
  });

  // Photo compliance
  const allPhotos = venueRows.flatMap((v) =>
    Array.isArray(v.venue_photos) ? v.venue_photos : []
  );
  const totalPhotos = allPhotos.length;
  const approvedPhotos = allPhotos.filter((p) => p.status === "approved").length;
  const pendingPhotos = allPhotos.filter((p) => p.status === "pending").length;
  const rejectedPhotos = allPhotos.filter((p) => p.status === "rejected").length;
  const overallCompliance =
    totalPhotos > 0 ? Math.round((approvedPhotos / totalPhotos) * 100) : 0;

  function formatRevenue(amount: number) {
    return `R ${amount.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
  }

  function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header row */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/networks"
          className="p-2 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#A3A3A3",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            {network.name}
          </h1>
          <span
            className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{
              backgroundColor:
                network.is_active !== false
                  ? "rgba(212,255,79,0.1)"
                  : "rgba(102,102,102,0.15)",
              color: network.is_active !== false ? "#D4FF4F" : "#909090",
            }}
          >
            {network.is_active !== false ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Stats tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Venues", value: totalVenues.toString(), sub: "locations" },
          {
            label: "Active Members",
            value: totalMembers.toLocaleString("en-ZA"),
            sub: "across all venues",
          },
          { label: "MTD Revenue", value: formatRevenue(mtdRevenue), sub: "this month" },
          {
            label: "Active Campaigns",
            value: activeCampaigns.length.toString(),
            sub: "running now",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-5" style={cardStyle}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#666" }}>
              {stat.label}
            </p>
            <p
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "#555" }}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column: brand info + revenue chart */}
      <div className="flex gap-6 mb-8" style={{ alignItems: "stretch" }}>
        {/* LEFT: Brand info */}
        <div className="rounded-2xl p-6" style={{ ...cardStyle, flex: "0 0 40%" }}>
          <div className="flex items-center gap-4 mb-6">
            {(network as { logo_url?: string }).logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(network as { logo_url: string }).logo_url}
                alt={network.name}
                className="w-14 h-14 rounded-xl object-cover"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
              >
                <Building2 size={26} color="#D4FF4F" strokeWidth={2} />
              </div>
            )}
            <div>
              <h2
                className="text-base font-bold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                {network.name}
              </h2>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    network.is_active !== false
                      ? "rgba(212,255,79,0.1)"
                      : "rgba(102,102,102,0.15)",
                  color: network.is_active !== false ? "#D4FF4F" : "#909090",
                }}
              >
                {network.is_active !== false ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {network.contact_name && (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <User size={14} color="#909090" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#909090" }}>
                    Contact
                  </p>
                  <p className="text-sm text-white">{network.contact_name}</p>
                </div>
              </div>
            )}
            {network.contact_email && (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <Mail size={14} color="#909090" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#909090" }}>
                    Email
                  </p>
                  <p className="text-sm text-white">{network.contact_email}</p>
                </div>
              </div>
            )}
            {network.contact_phone && (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <Phone size={14} color="#909090" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#909090" }}>
                    Phone
                  </p>
                  <p className="text-sm text-white">{network.contact_phone}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <EditBrandButton
              brand={{
                id: network.id,
                name: network.name,
                contact_name: network.contact_name ?? null,
                contact_email: network.contact_email ?? null,
                contact_phone: network.contact_phone ?? null,
                logo_url: (network as { logo_url?: string }).logo_url ?? null,
                is_active: network.is_active ?? null,
              }}
            />
          </div>
        </div>

        {/* RIGHT: Revenue chart */}
        <div className="rounded-2xl p-6" style={{ ...cardStyle, flex: "1" }}>
          <div className="flex items-center justify-between mb-5">
            <h3
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Revenue — Last 6 Months
            </h3>
            <span className="text-xs" style={{ color: "#666" }}>
              Rental + Revenue Share
            </span>
          </div>
          <NetworkRevenueChartWrapper data={revenueChartData} />
        </div>
      </div>

      {/* Venues table */}
      <div className="rounded-2xl overflow-hidden mb-8" style={cardStyle}>
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
              Venues ({venueRows.length})
            </h3>
          </div>
          <Link
            href="/admin/venues/new"
            className="text-xs font-medium"
            style={{ color: "#D4FF4F" }}
          >
            Add venue
          </Link>
        </div>

        {venueRows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm" style={{ color: "#909090" }}>
            No venues linked to this network yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="w-full" style={{ minWidth: 700 }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  {["Venue", "City", "Members", "Screens", "MTD Revenue", "Contract", "Photos", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "#909090" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {venueRows.map((venue, idx) => {
                  const status = statusConfig[venue.status] ?? statusConfig.inactive;
                  const screenCount = Array.isArray(venue.screens) ? venue.screens.length : 0;
                  const venueMtd = (Array.isArray(venue.revenue_entries)
                    ? venue.revenue_entries
                    : []
                  )
                    .filter((e) => e.month === currentMonth)
                    .reduce(
                      (s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0),
                      0
                    );
                  const contract =
                    Array.isArray(venue.contracts) && venue.contracts.length > 0
                      ? venue.contracts[0]
                      : null;
                  const photos = Array.isArray(venue.venue_photos) ? venue.venue_photos : [];
                  const totalP = photos.length;
                  const approvedP = photos.filter((p) => p.status === "approved").length;
                  const compliancePct =
                    totalP > 0 ? Math.round((approvedP / totalP) * 100) : 0;

                  return (
                    <tr
                      key={venue.id}
                      className="glass-table-row"
                      style={{
                        borderTop: idx >= 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      }}
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/venues/${venue.id}`}
                          className="text-sm font-medium text-white hover:text-[#D4FF4F] transition-colors"
                        >
                          {venue.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#A3A3A3" }}>
                        {venue.city ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-white">
                        {(venue.active_members ?? 0).toLocaleString("en-ZA")}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#A3A3A3" }}>
                        {screenCount}
                      </td>
                      <td className="px-5 py-4 text-sm text-white">
                        {formatRevenue(venueMtd)}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {contract ? (
                          <span className="text-white">
                            {formatRevenue(contract.monthly_rental_zar ?? 0)}/mo
                          </span>
                        ) : (
                          <span style={{ color: "#F59E0B" }}>No contract</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">
                            {approvedP}/{totalP} approved
                          </span>
                          {totalP > 0 && (
                            <span
                              className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor:
                                  compliancePct >= 80
                                    ? "rgba(212,255,79,0.12)"
                                    : compliancePct >= 50
                                    ? "rgba(245,158,11,0.12)"
                                    : "rgba(239,68,68,0.12)",
                                color:
                                  compliancePct >= 80
                                    ? "#D4FF4F"
                                    : compliancePct >= 50
                                    ? "#F59E0B"
                                    : "#EF4444",
                              }}
                            >
                              {compliancePct}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                          style={{ backgroundColor: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Campaigns */}
      <div className="rounded-2xl p-6 mb-8" style={cardStyle}>
        <div className="flex items-center gap-2 mb-5">
          <Megaphone size={16} color="#D4FF4F" strokeWidth={2} />
          <h3
            className="text-sm font-semibold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Active Campaigns
          </h3>
        </div>

        {allCampaigns.length === 0 ? (
          <div className="text-center py-8" style={{ color: "#555" }}>
            <Megaphone size={32} color="#333" style={{ margin: "0 auto 12px" }} />
            <p className="text-sm">No active campaigns</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{campaign.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#A3A3A3" }}>
                    {campaign.advertiser} &middot; {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif" }}
                  >
                    {formatRevenue(campaign.amount_charged_zar ?? 0)}
                  </p>
                  <p className="text-xs" style={{ color: "#555" }}>
                    charged
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Compliance Summary */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <div className="flex items-center gap-2 mb-5">
          <ImageIcon size={16} color="#D4FF4F" strokeWidth={2} />
          <h3
            className="text-sm font-semibold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Photo Compliance
          </h3>
        </div>

        <div className="flex items-end gap-4 mb-5">
          <span
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontSize: "3.5rem",
              fontWeight: 800,
              lineHeight: 1,
              color: overallCompliance >= 80 ? "#D4FF4F" : overallCompliance >= 50 ? "#F59E0B" : "#EF4444",
            }}
          >
            {overallCompliance}%
          </span>
          <span className="text-sm mb-2" style={{ color: "#666" }}>
            overall compliance
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 6,
            height: 6,
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              background: overallCompliance >= 80 ? "#D4FF4F" : overallCompliance >= 50 ? "#F59E0B" : "#EF4444",
              width: `${overallCompliance}%`,
              borderRadius: 6,
              height: 6,
              transition: "width 0.3s",
            }}
          />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Approved", count: approvedPhotos, color: "#D4FF4F" },
            { label: "Pending", count: pendingPhotos, color: "#F59E0B" },
            { label: "Rejected", count: rejectedPhotos, color: "#EF4444" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p
                className="text-2xl font-bold"
                style={{ color: item.color, fontFamily: "Inter Tight, sans-serif" }}
              >
                {item.count}
              </p>
              <p className="text-xs mt-1" style={{ color: "#666" }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs mt-4" style={{ color: "#444" }}>
          {totalPhotos} total photos across {totalVenues} venue{totalVenues !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
