"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenueEntry {
  id: string;
  venue_id: string;
  month: string; // "YYYY-MM-DD"
  rental_zar: number | null;
  revenue_share_zar: number | null;
  venues?: { name: string; gym_brand_id: string | null } | null;
}

interface Venue {
  id: string;
  name: string;
  active_members: number | null;
  status: string | null;
  gym_brand_id: string | null;
}

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  amount_charged_zar: number | null;
}

interface Brand {
  id: string;
  name: string;
}

interface Photo {
  id: string;
  status: string | null;
  venue_id: string;
  month: string | null;
}

interface Props {
  revenueEntries: RevenueEntry[];
  venues: Venue[];
  campaigns: Campaign[];
  brands: Brand[];
  photos: Photo[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatZAR = (val: number) => `R ${val.toLocaleString("en-ZA")}`;

const LIME = "#D4FF4F";
const GREY = "#A3A3A3";
const DIM = "#555555";

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: "24px",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15,15,15,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <p style={{ color: "#909090", fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? LIME, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" && p.name !== "Campaigns" ? formatZAR(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const CampaignTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15,15,15,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <p style={{ color: "#909090", fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? LIME, fontSize: 13, fontWeight: 600 }}>
          {p.name === "Revenue" ? `Revenue: ${formatZAR(p.value)}` : `Active Campaigns: ${p.value}`}
        </p>
      ))}
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div
    style={{
      ...glassCard,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
    }}
  >
    <p style={{ color: "#555", fontSize: 14, textAlign: "center" }}>{message}</p>
  </div>
);

function getMonthsBack(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
  }
  return months;
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

function monthShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA", { month: "short" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsClient({ revenueEntries, venues, campaigns, brands, photos }: Props) {
  const [dateRange, setDateRange] = useState<3 | 6 | 12>(12);
  const [brandFilter, setBrandFilter] = useState<string>("all");

  const today = new Date();
  const thisMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}-01`;

  // Filter entries by brand
  const filteredEntries = useMemo(() => {
    if (brandFilter === "all") return revenueEntries;
    return revenueEntries.filter((e) => e.venues?.gym_brand_id === brandFilter);
  }, [revenueEntries, brandFilter]);

  const filteredVenues = useMemo(() => {
    if (brandFilter === "all") return venues;
    return venues.filter((v) => v.gym_brand_id === brandFilter);
  }, [venues, brandFilter]);

  // ── KPI: this month entries
  const thisMthEntries = filteredEntries.filter((e) => e.month?.slice(0, 7) === thisMonthKey.slice(0, 7));
  const lastMthEntries = filteredEntries.filter((e) => e.month?.slice(0, 7) === lastMonthKey.slice(0, 7));

  const totalRevMTD = thisMthEntries.reduce((s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0);
  const rentalMTD = thisMthEntries.reduce((s, e) => s + (e.rental_zar ?? 0), 0);
  const shareMTD = thisMthEntries.reduce((s, e) => s + (e.revenue_share_zar ?? 0), 0);

  const activeVenues = filteredVenues.filter((v) => v.status === "active").length;

  const activeCampaigns = campaigns.filter((c) => {
    const start = new Date(c.start_date);
    const end = new Date(c.end_date);
    return start <= today && end >= today;
  }).length;

  const thisMonthPhotos = photos.filter((p) => p.month?.slice(0, 7) === thisMonthKey.slice(0, 7));
  const approvedThisMth = thisMonthPhotos.filter((p) => p.status === "approved").length;
  const photoCompliance =
    thisMonthPhotos.length > 0 ? Math.round((approvedThisMth / thisMonthPhotos.length) * 100) : 0;

  const kpis = [
    { label: "Total Revenue MTD", value: formatZAR(totalRevMTD), highlight: true },
    { label: "Rental Income MTD", value: formatZAR(rentalMTD) },
    { label: "Revenue Share MTD", value: formatZAR(shareMTD) },
    { label: "Active Venues", value: activeVenues.toString() },
    { label: "Active Campaigns", value: activeCampaigns.toString() },
    { label: "Photo Compliance", value: `${photoCompliance}%` },
  ];

  // ── Revenue Trend: last N months
  const trendMonths = getMonthsBack(dateRange);
  const revenueByMonth = useMemo(() => {
    return trendMonths.map((mKey) => {
      const entries = filteredEntries.filter((e) => e.month?.slice(0, 7) === mKey.slice(0, 7));
      const rental = entries.reduce((s, e) => s + (e.rental_zar ?? 0), 0);
      const share = entries.reduce((s, e) => s + (e.revenue_share_zar ?? 0), 0);
      return {
        month: monthShort(mKey),
        fullMonth: monthLabel(mKey),
        "Rental Income": rental,
        "Revenue Share": share,
        Total: rental + share,
      };
    });
  }, [filteredEntries, dateRange]);

  // ── Income Split (all filtered data)
  const totalRentalAll = filteredEntries.reduce((s, e) => s + (e.rental_zar ?? 0), 0);
  const totalShareAll = filteredEntries.reduce((s, e) => s + (e.revenue_share_zar ?? 0), 0);
  const splitData = [
    { name: "Rental Income", value: totalRentalAll },
    { name: "Revenue Share", value: totalShareAll },
  ];

  // ── Top Venues by Revenue (all filtered)
  const venueRevMap: Record<string, { name: string; rental: number; share: number }> = {};
  filteredEntries.forEach((e) => {
    if (!venueRevMap[e.venue_id]) {
      venueRevMap[e.venue_id] = {
        name: e.venues?.name ?? "Unknown",
        rental: 0,
        share: 0,
      };
    }
    venueRevMap[e.venue_id].rental += e.rental_zar ?? 0;
    venueRevMap[e.venue_id].share += e.revenue_share_zar ?? 0;
  });
  const topVenuesData = Object.values(venueRevMap)
    .map((v) => ({ name: v.name, Revenue: v.rental + v.share, Rental: v.rental, Share: v.share }))
    .sort((a, b) => b.Revenue - a.Revenue)
    .slice(0, 10);

  // ── Campaign Activity: active campaigns per month
  const campaignActivityData = useMemo(() => {
    return trendMonths.map((mKey) => {
      const mDate = new Date(mKey);
      const firstDay = new Date(mDate.getFullYear(), mDate.getMonth(), 1);
      const lastDay = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0);
      const count = campaigns.filter((c) => {
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);
        return start <= lastDay && end >= firstDay;
      }).length;
      const entries = filteredEntries.filter((e) => e.month?.slice(0, 7) === mKey.slice(0, 7));
      const revenue = entries.reduce((s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0);
      return {
        month: monthShort(mKey),
        Campaigns: count,
        Revenue: revenue,
      };
    });
  }, [campaigns, filteredEntries, dateRange]);

  // ── Venue Utilisation
  const utilData = filteredVenues
    .filter((v) => v.status === "active")
    .map((v) => ({ name: v.name, Members: v.active_members ?? 0 }))
    .sort((a, b) => b.Members - a.Members)
    .slice(0, 10);

  // ── Photo Compliance donut
  const approvedCount = photos.filter((p) => p.status === "approved").length;
  const pendingCount = photos.filter((p) => p.status === "pending").length;
  const rejectedCount = photos.filter((p) => p.status === "rejected").length;
  const complianceData = [
    { name: "Approved", value: approvedCount },
    { name: "Pending", value: pendingCount },
    { name: "Rejected", value: rejectedCount },
  ];

  // ── MoM Growth
  const momMonths = getMonthsBack(13);
  const momData = momMonths.map((mKey) => {
    const entries = filteredEntries.filter((e) => e.month?.slice(0, 7) === mKey.slice(0, 7));
    return entries.reduce((s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0);
  });
  const momSparkline = momMonths.slice(1).map((mKey, i) => {
    const prev = momData[i];
    const curr = momData[i + 1];
    const growth = prev > 0 ? ((curr - prev) / prev) * 100 : null;
    return { month: monthShort(mKey), growth };
  });
  const currentMomTotal = momData[momData.length - 1];
  const prevMomTotal = momData[momData.length - 2];
  const momGrowthPct =
    prevMomTotal > 0 ? ((currentMomTotal - prevMomTotal) / prevMomTotal) * 100 : null;
  const momColor =
    momGrowthPct === null ? "#555" : momGrowthPct >= 0 ? "#4ADE80" : "#F87171";

  return (
    <div style={{ padding: "32px", minHeight: "100vh" }}>
      {/* ── Hero Panel */}
      <div style={{ ...glassCard, marginBottom: 24, padding: "32px" }}>
        <h1
          style={{
            fontFamily: "Inter Tight, sans-serif",
            fontWeight: 800,
            fontSize: "2.5rem",
            color: "#fff",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Analytics
        </h1>
        <p style={{ color: "#666", marginTop: "0.5rem", margin: "8px 0 0 0" }}>
          Revenue performance, venue utilisation, and campaign health
        </p>
      </div>

      {/* ── KPI Tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {kpis.map((kpi, i) => (
          <div
            key={i}
            style={{
              ...glassCard,
              padding: "20px",
              border: kpi.highlight
                ? "1px solid rgba(212,255,79,0.2)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#909090",
                margin: "0 0 12px 0",
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 800,
                fontSize: "1.75rem",
                color: kpi.highlight ? LIME : "#FFFFFF",
                letterSpacing: "-0.02em",
                margin: "0 0 6px 0",
                lineHeight: 1.1,
              }}
            >
              {kpi.value}
            </p>
            <span
              style={{
                fontSize: 10,
                color: "#555",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 99,
                padding: "2px 8px",
              }}
            >
              this month
            </span>
          </div>
        ))}
      </div>

      {/* ── Filter Row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Date range pills */}
        <div style={{ display: "flex", gap: 8 }}>
          {([3, 6, 12] as const).map((n) => (
            <button
              key={n}
              onClick={() => setDateRange(n)}
              style={{
                padding: "6px 16px",
                borderRadius: 99,
                border: `1px solid ${dateRange === n ? LIME : "rgba(255,255,255,0.08)"}`,
                background: dateRange === n ? LIME : "rgba(255,255,255,0.04)",
                color: dateRange === n ? "#0A0A0A" : "#A3A3A3",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                backdropFilter: "blur(12px)",
              }}
            >
              {n}M
            </button>
          ))}
        </div>

        {/* Brand filter */}
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          style={{
            padding: "6px 16px",
            borderRadius: 99,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#A3A3A3",
            fontSize: 13,
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <option value="all">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Revenue Trend — full width */}
      <div style={{ ...glassCard, marginBottom: 24 }}>
        <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "0 0 4px 0" }}>
          Monthly Revenue — Last {dateRange} Months
        </h2>
        <p style={{ color: "#555", fontSize: 12, margin: "0 0 20px 0" }}>
          Rental + Revenue Share stacked
        </p>
        {revenueByMonth.every((d) => d.Total === 0) ? (
          <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "#555", fontSize: 14 }}>
              No revenue data for this period. Add entries via Revenue Management.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueByMonth} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRental" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={LIME} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={LIME} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradShare" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GREY} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GREY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "#555", fontSize: 12 }} />
              <Area type="monotone" dataKey="Rental Income" stackId="1" stroke={LIME} fill="url(#gradRental)" strokeWidth={2} />
              <Area type="monotone" dataKey="Revenue Share" stackId="1" stroke={GREY} fill="url(#gradShare)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Income Split | Top Venues — 2 col */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 24 }}>
        {/* Income Split Donut */}
        <div style={glassCard}>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "0 0 4px 0" }}>
            Income Split
          </h2>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 16px 0" }}>Rental vs Revenue Share</p>
          {totalRentalAll + totalShareAll === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#555", fontSize: 13, textAlign: "center" }}>No data — enter revenue for this period.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={splitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill={LIME} />
                    <Cell fill={GREY} />
                  </Pie>
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const total = totalRentalAll + totalShareAll;
                      const pct = total > 0 ? Math.round((payload[0].value / total) * 100) : 0;
                      return (
                        <div style={{ background: "rgba(15,15,15,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px" }}>
                          <p style={{ color: "#909090", fontSize: 11 }}>{payload[0].name}</p>
                          <p style={{ color: LIME, fontSize: 13, fontWeight: 600 }}>{formatZAR(payload[0].value)} ({pct}%)</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8 }}>
                {splitData.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: i === 0 ? LIME : GREY }} />
                      <span style={{ color: "#A3A3A3", fontSize: 12 }}>{d.name}</span>
                    </div>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                      {formatZAR(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Venues by Revenue */}
        <div style={glassCard}>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "0 0 4px 0" }}>
            Top Venues by Total Revenue
          </h2>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 16px 0" }}>Top 10 venues</p>
          {topVenuesData.length === 0 ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#555", fontSize: 14 }}>No revenue data for the selected period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart layout="vertical" data={topVenuesData} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#A3A3A3", fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div style={{ background: "rgba(15,15,15,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px" }}>
                        <p style={{ color: "#909090", fontSize: 11, marginBottom: 4 }}>{label}</p>
                        <p style={{ color: LIME, fontSize: 13, fontWeight: 600 }}>Total: {formatZAR(payload[0].payload.Revenue)}</p>
                        <p style={{ color: "#A3A3A3", fontSize: 12 }}>Rental: {formatZAR(payload[0].payload.Rental)}</p>
                        <p style={{ color: "#A3A3A3", fontSize: 12 }}>Share: {formatZAR(payload[0].payload.Share)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="Revenue" fill={LIME} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Campaign Activity | MoM Growth — 2 col */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Campaign Activity */}
        <div style={glassCard}>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "0 0 4px 0" }}>
            Campaign Activity & Revenue Overlap
          </h2>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 16px 0" }}>
            Active campaigns per month vs. revenue
          </p>
          {campaignActivityData.every((d) => d.Revenue === 0 && d.Campaigns === 0) ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#555", fontSize: 14 }}>No campaign or revenue data.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={campaignActivityData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCampaigns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={LIME} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={LIME} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="revenue" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="campaigns" orientation="right" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CampaignTooltip />} />
                <Legend wrapperStyle={{ color: "#555", fontSize: 12 }} />
                <Area yAxisId="revenue" type="monotone" dataKey="Revenue" stroke={GREY} fill="none" strokeWidth={2} />
                <Area yAxisId="campaigns" type="monotone" dataKey="Campaigns" stroke={LIME} fill="url(#gradCampaigns)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* MoM Revenue Growth */}
        <div style={glassCard}>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "0 0 4px 0" }}>
            MoM Revenue Growth
          </h2>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 20px 0" }}>
            vs. prior month
          </p>
          {momGrowthPct === null ? (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#555", fontSize: 13, textAlign: "center" }}>
                Not enough data — at least 2 months of revenue entries required.
              </p>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 800,
                  fontSize: "3rem",
                  color: momColor,
                  letterSpacing: "-0.02em",
                  margin: "0 0 4px 0",
                  lineHeight: 1,
                }}
              >
                {momGrowthPct >= 0 ? "+" : ""}{momGrowthPct.toFixed(1)}%
              </p>
              <p style={{ color: "#555", fontSize: 11, margin: "0 0 16px 0" }}>
                {formatZAR(prevMomTotal)} → {formatZAR(currentMomTotal)}
              </p>
              <ResponsiveContainer width="100%" height={70}>
                <LineChart data={momSparkline} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Line
                    type="monotone"
                    dataKey="growth"
                    stroke={momColor}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* ── Venue Utilisation | Photo Compliance — 2 col */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Venue Utilisation */}
        <div style={glassCard}>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "0 0 4px 0" }}>
            Venue Utilisation — Active Members
          </h2>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 16px 0" }}>
            Top 10 active venues by member count
          </p>
          {utilData.length === 0 || utilData.every((d) => d.Members === 0) ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#555", fontSize: 14 }}>No active venues found.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={utilData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div style={{ background: "rgba(15,15,15,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px" }}>
                        <p style={{ color: "#909090", fontSize: 11, marginBottom: 4 }}>{label}</p>
                        <p style={{ color: LIME, fontSize: 13, fontWeight: 600 }}>Active Members: {payload[0].value}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="Members" fill={LIME} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {utilData.length > 0 && (
            <p style={{ color: "#555", fontSize: 12, marginTop: 12 }}>
              Network total: {filteredVenues.filter(v => v.status === "active").reduce((s, v) => s + (v.active_members ?? 0), 0).toLocaleString()} active members across {filteredVenues.filter(v => v.status === "active").length} venues
            </p>
          )}
        </div>

        {/* Photo Compliance Donut */}
        <div style={glassCard}>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "0 0 4px 0" }}>
            Photo Compliance Rate
          </h2>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 16px 0" }}>All time</p>
          {approvedCount + pendingCount + rejectedCount === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#555", fontSize: 13, textAlign: "center" }}>No photos submitted for this period.</p>
            </div>
          ) : (
            <>
              <div style={{ position: "relative" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill={LIME} />
                      <Cell fill={GREY} />
                      <Cell fill={DIM} />
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const total = approvedCount + pendingCount + rejectedCount;
                        const pct = total > 0 ? Math.round((payload[0].value / total) * 100) : 0;
                        return (
                          <div style={{ background: "rgba(15,15,15,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px" }}>
                            <p style={{ color: "#909090", fontSize: 11 }}>{payload[0].name}</p>
                            <p style={{ color: LIME, fontSize: 13, fontWeight: 600 }}>{payload[0].value} ({pct}%)</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                  <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "1.5rem", color: LIME, margin: 0 }}>
                    {approvedCount + pendingCount + rejectedCount > 0
                      ? `${Math.round((approvedCount / (approvedCount + pendingCount + rejectedCount)) * 100)}%`
                      : "—"}
                  </p>
                  <p style={{ fontSize: 10, color: "#555", margin: 0 }}>approved</p>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {[
                  { label: "Approved", count: approvedCount, color: LIME },
                  { label: "Pending", count: pendingCount, color: GREY },
                  { label: "Rejected", count: rejectedCount, color: DIM },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                      <span style={{ color: "#A3A3A3", fontSize: 12 }}>{s.label}</span>
                    </div>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
