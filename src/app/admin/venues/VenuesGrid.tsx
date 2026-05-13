"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Monitor, Users, TrendingUp, Image as ImageIcon, MapPin, X, Award } from "lucide-react";

type Brand = { id: string; name: string; logo_url?: string | null; primary_color?: string | null };

type Venue = {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  region: string | null;
  status: string | null;
  active_members: number | null;
  daily_entries: number | null;
  weekly_entries: number | null;
  monthly_entries: number | null;
  // Supabase returns 1:1 FK joins as arrays — we normalise in the component
  gym_brands: Brand | Brand[] | null;
  screens: { id: string; is_active: boolean | null }[] | null;
  venue_photos: { id: string; status: string | null }[] | null;
  cover_image_url: string | null;
  cover_position: number | null;
};

function getBrand(raw: Brand | Brand[] | null): Brand | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:      { label: "Active",      color: "#D4FF4F", bg: "rgba(212,255,79,0.10)",  dot: "#D4FF4F" },
  inactive:    { label: "Inactive",    color: "#B0B0B0", bg: "rgba(102,102,102,0.15)", dot: "#555" },
  coming_soon: { label: "Coming Soon", color: "#F59E0B", bg: "rgba(245,158,11,0.10)",  dot: "#F59E0B" },
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function compliancePct(photos: { status: string | null }[] | null): number {
  if (!photos || photos.length === 0) return 0;
  const approved = photos.filter((p) => p.status === "approved").length;
  return Math.round((approved / photos.length) * 100);
}

function complianceColor(pct: number): string {
  if (pct >= 80) return "#D4FF4F";
  if (pct >= 50) return "#F59E0B";
  if (pct > 0)   return "#EF4444";
  return "#333";
}

function VenueCard({ venue }: { venue: Venue }) {
  const status = STATUS_CONFIG[venue.status ?? "inactive"] ?? STATUS_CONFIG.inactive;
  const brand = getBrand(venue.gym_brands);
  const screenCount = Array.isArray(venue.screens) ? venue.screens.length : 0;
  const activeScreens = Array.isArray(venue.screens) ? venue.screens.filter((s) => s.is_active).length : 0;
  const photos = venue.venue_photos ?? [];
  const compliance = compliancePct(photos);
  const cColor = complianceColor(compliance);
  const brandColor = brand?.primary_color ?? "#D4FF4F";

  return (
    <Link
      href={`/admin/venues/${venue.id}`}
      className="glass-card block rounded-2xl overflow-hidden group transition-all duration-200"
      style={{ borderRadius: 16, textDecoration: "none" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.18)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.border = ""; }}
    >
      {/* Card header — cover image or colour band */}
      <div
        className="relative flex items-end px-5 pt-5 pb-4"
        style={{
          background: venue.cover_image_url ? "#000" : `linear-gradient(135deg, ${brandColor}18 0%, rgba(255,255,255,0.03) 100%)`,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          minHeight: 88,
          overflow: "hidden",
        }}
      >
        {/* Cover image as <img> — more reliable than CSS background, respects object-position */}
        {venue.cover_image_url && (
          <img
            src={venue.cover_image_url}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: `center ${venue.cover_position ?? 50}%`,
              display: "block",
            }}
            loading="eager"
          />
        )}
        {/* Strong gradient overlay — ensures text is always readable */}
        {venue.cover_image_url && (
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.82) 100%)" }} />
        )}
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mr-3"
          style={{
            background: `${brandColor}22`,
            border: `1.5px solid ${brandColor}44`,
          }}
        >
          {brand?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt={brand.name} className="w-7 h-7 object-contain" />
          ) : (
            <span style={{ fontSize: 14, fontWeight: 800, color: brandColor, fontFamily: "Inter Tight, sans-serif" }}>
              {initials(venue.name)}
            </span>
          )}
        </div>

        {/* Name + location */}
        <div className="flex-1 min-w-0 relative z-10">
          <h3
            className="text-sm font-bold truncate leading-tight"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              color: "#fff",
              textShadow: venue.cover_image_url ? "0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)" : "none",
            }}
          >
            {venue.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} color={venue.cover_image_url ? "rgba(255,255,255,0.6)" : "#666"} strokeWidth={2} />
            <p className="text-xs truncate" style={{
              color: venue.cover_image_url ? "rgba(255,255,255,0.7)" : "#999",
              textShadow: venue.cover_image_url ? "0 1px 3px rgba(0,0,0,0.9)" : "none",
            }}>
              {[venue.city, venue.province].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        </div>

        {/* Status pill */}
        <div className="flex-shrink-0 ml-2">
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: status.dot }}
            />
            {status.label}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 px-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { icon: Users,   label: "Members", value: (venue.active_members ?? 0).toLocaleString("en-ZA") },
          { icon: Monitor, label: "Screens",  value: activeScreens === screenCount ? `${screenCount}` : `${activeScreens}/${screenCount}` },
          { icon: TrendingUp, label: "Monthly", value: (venue.monthly_entries ?? 0).toLocaleString("en-ZA") },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center py-3 px-2" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon size={13} color="#555" strokeWidth={2} className="mb-1" />
            <p
              className="text-sm font-bold text-white tabular-nums"
              style={{ fontFamily: "Inter Tight, sans-serif", lineHeight: 1 }}
            >
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#8A8A8A" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Bottom row — network + compliance + area tag */}
      <div className="px-5 py-3">
        {/* Network */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs" style={{ color: "#8A8A8A" }}>Network</span>
            <span className="text-xs font-medium truncate" style={{ color: "#C8C8C8" }}>
              {brand?.name ?? "Independent"}
            </span>
          </div>
          {venue.region && (
            <span
              className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.05)", color: "#999" }}
            >
              {venue.region}
            </span>
          )}
        </div>

        {/* Photo compliance bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <ImageIcon size={11} color="#555" strokeWidth={2} />
              <span className="text-xs" style={{ color: "#8A8A8A" }}>Photo compliance</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: cColor }}>
              {photos.length === 0 ? "No photos" : `${compliance}%`}
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
            <div
              style={{
                height: 3,
                width: `${compliance}%`,
                background: cColor,
                borderRadius: 99,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Hover CTA */}
      <div
        className="px-5 pb-3 text-right opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ marginTop: -4 }}
      >
        <span className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>View details →</span>
      </div>
    </Link>
  );
}

interface Props {
  venues: Venue[];
  brands: { id: string; name: string }[];
}

export default function VenuesGrid({ venues, brands }: Props) {
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list" | "scorecard">("grid");

  const filtered = useMemo(() => {
    return venues.filter((v) => {
      const q = search.toLowerCase();
      if (q && !v.name.toLowerCase().includes(q) && !(v.city ?? "").toLowerCase().includes(q) && !(v.province ?? "").toLowerCase().includes(q)) return false;
      if (networkFilter !== "all" && getBrand(v.gym_brands)?.id !== networkFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      return true;
    });
  }, [venues, search, networkFilter, statusFilter]);

  const hasFilters = search || networkFilter !== "all" || statusFilter !== "all";

  // ── Scorecard helpers ──────────────────────────────────────────
  const scorecardRows = useMemo(() => {
    return filtered
      .filter((v) => (v.active_members ?? 0) > 0)
      .map((v) => {
        const members = v.active_members ?? 1;
        const dailyRate  = Math.min(((v.daily_entries   ?? 0) / members) * 100, 100);
        const weeklyRate = Math.min(((v.weekly_entries  ?? 0) / members) * 100, 100);
        const monthlyRate = Math.min(((v.monthly_entries ?? 0) / members) * 100, 100);
        // Weighted composite for sorting: daily 50%, weekly 30%, monthly 20%
        const score = dailyRate * 0.5 + weeklyRate * 0.3 + monthlyRate * 0.2;
        const scoreDisplay = score.toFixed(1);
        const tier =
          score >= 60 ? { label: "High",   color: "#D4FF4F", bg: "rgba(212,255,79,0.10)",  dot: "#D4FF4F" } :
          score >= 30 ? { label: "Medium", color: "#F59E0B", bg: "rgba(245,158,11,0.10)",  dot: "#F59E0B" } :
                        { label: "Low",    color: "#EF4444", bg: "rgba(239,68,68,0.10)",   dot: "#EF4444" };
        return { venue: v, score, scoreDisplay, dailyRate, weeklyRate, monthlyRate, tier };
      })
      .sort((a, b) => b.score - a.score);
  }, [filtered]);

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: active ? "1px solid #D4FF4F" : "1px solid rgba(255,255,255,0.08)",
    background: active ? "#D4FF4F" : "rgba(255,255,255,0.04)",
    color: active ? "#0A0A0A" : "#A3A3A3",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div>
      {/* Filter + search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} color="#555" strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venues, cities..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#fff",
              outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} color="#555" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {/* Status filter */}
          <button onClick={() => setStatusFilter("all")} style={pillStyle(statusFilter === "all")}>All</button>
          <button onClick={() => setStatusFilter("active")} style={pillStyle(statusFilter === "active")}>Active</button>
          <button onClick={() => setStatusFilter("coming_soon")} style={pillStyle(statusFilter === "coming_soon")}>Coming Soon</button>
          <button onClick={() => setStatusFilter("inactive")} style={pillStyle(statusFilter === "inactive")}>Inactive</button>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

          {/* Network filter */}
          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: networkFilter !== "all" ? "#D4FF4F" : "#A3A3A3",
              borderRadius: 99,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
              appearance: "none",
              whiteSpace: "nowrap",
            }}
          >
            <option value="all">All Networks</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: "#8A8A8A" }}>
          {filtered.length === venues.length
            ? `${venues.length} venue${venues.length !== 1 ? "s" : ""}`
            : `${filtered.length} of ${venues.length} venues`}
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setNetworkFilter("all"); setStatusFilter("all"); }}
              className="ml-2 text-xs underline"
              style={{ color: "#D4FF4F" }}
            >
              Clear filters
            </button>
          )}
        </p>

        {/* Grid / List / Scorecard toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["grid", "list", "scorecard"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150"
              style={{
                background: view === v ? "rgba(255,255,255,0.10)" : "transparent",
                color: view === v ? "#fff" : "#555",
              }}
            >
              {v === "grid" ? "⊞ Grid" : v === "list" ? "☰ List" : "🏆 Scorecard"}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl py-16 text-center" style={{ borderRadius: 16 }}>
          <MapPin size={32} color="#333" strokeWidth={1.5} className="mx-auto mb-3" />
          <p className="text-white font-medium mb-1">
            {venues.length === 0 ? "No venues yet" : "No venues match your filters"}
          </p>
          <p className="text-sm" style={{ color: "#8A8A8A" }}>
            {venues.length === 0
              ? "Use 'Add Venue' to get started"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      )}

      {/* Scorecard view */}
      {view === "scorecard" && (
        <div>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4">
            <p className="text-xs" style={{ color: "#8A8A8A" }}>Utilisation % = daily entries (50%) + weekly (30%) + monthly (20%) as % of active members</p>
            <div className="flex items-center gap-3 ml-auto">
              {[
                { label: "High",   color: "#D4FF4F" },
                { label: "Medium", color: "#F59E0B" },
                { label: "Low",    color: "#EF4444" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  <span className="text-xs" style={{ color: "#999" }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {scorecardRows.length === 0 ? (
            <div className="glass-card rounded-2xl py-16 text-center" style={{ borderRadius: 16 }}>
              <Award size={32} color="#333" strokeWidth={1.5} className="mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No attendance data yet</p>
              <p className="text-sm" style={{ color: "#8A8A8A" }}>Update daily/weekly/monthly entries per venue to see scores</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
              {/* Header */}
              <div className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: "2rem 1fr 7rem 6rem 6rem 6rem 7rem", color: "#B0B0B0", background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span>#</span>
                <span>Venue</span>
                <span className="text-right">Utilisation</span>
                <span className="text-right">Daily %</span>
                <span className="text-right">Weekly %</span>
                <span className="text-right">Monthly %</span>
                <span className="text-right">Members</span>
              </div>

              {/* Rows */}
              {scorecardRows.map((row, idx) => {
                const brand = getBrand(row.venue.gym_brands);
                const brandColor = brand?.primary_color ?? "#D4FF4F";
                const isTop3 = idx < 3;
                const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

                return (
                  <Link
                    key={row.venue.id}
                    href={`/admin/venues/${row.venue.id}`}
                    className="grid items-center px-5 py-4 transition-colors duration-150 group"
                    style={{
                      gridTemplateColumns: "2rem 1fr 7rem 6rem 6rem 6rem 7rem",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      textDecoration: "none",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* Rank */}
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: isTop3 ? rankColors[idx] : "#555" }}
                    >
                      {idx + 1}
                    </span>

                    {/* Name + brand */}
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ background: `${brandColor}22`, color: brandColor }}
                      >
                        {row.venue.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{row.venue.name}</p>
                        <p className="text-xs truncate" style={{ color: "#8A8A8A" }}>
                          {[row.venue.city, row.venue.province].filter(Boolean).join(", ") || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Score bar + utilisation % */}
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex-1" style={{ maxWidth: 48 }}>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                          <div
                            style={{
                              height: 4,
                              width: `${Math.min(row.score, 100)}%`,
                              background: row.tier.color,
                              borderRadius: 99,
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-full"
                        style={{ background: row.tier.bg, color: row.tier.color, minWidth: 44, textAlign: "center" }}
                      >
                        {row.scoreDisplay}%
                      </span>
                    </div>

                    {/* Daily % */}
                    <p className="text-sm font-semibold tabular-nums text-right" style={{ color: row.dailyRate >= 60 ? "#D4FF4F" : row.dailyRate >= 30 ? "#F59E0B" : "#EF4444" }}>
                      {row.dailyRate.toFixed(1)}%
                    </p>

                    {/* Weekly % */}
                    <p className="text-sm font-semibold tabular-nums text-right" style={{ color: row.weeklyRate >= 60 ? "#D4FF4F" : row.weeklyRate >= 30 ? "#F59E0B" : "#EF4444" }}>
                      {row.weeklyRate.toFixed(1)}%
                    </p>

                    {/* Monthly % */}
                    <p className="text-sm font-semibold tabular-nums text-right" style={{ color: row.monthlyRate >= 60 ? "#D4FF4F" : row.monthlyRate >= 30 ? "#F59E0B" : "#EF4444" }}>
                      {row.monthlyRate.toFixed(1)}%
                    </p>

                    {/* Members */}
                    <p className="text-sm tabular-nums text-right" style={{ color: "#C8C8C8" }}>
                      {(row.venue.active_members ?? 0).toLocaleString("en-ZA")}
                    </p>
                  </Link>
                );
              })}

              {/* Summary footer */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
              >
                <p className="text-xs" style={{ color: "#8A8A8A" }}>
                  {scorecardRows.length} venue{scorecardRows.length !== 1 ? "s" : ""} ranked
                  {filtered.length > scorecardRows.length && ` · ${filtered.length - scorecardRows.length} excluded (no member data)`}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "#8A8A8A" }}>Network avg utilisation:</span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: "#D4FF4F" }}
                  >
                    {scorecardRows.length > 0
                      ? (scorecardRows.reduce((s, r) => s + r.score, 0) / scorecardRows.length).toFixed(1) + "%"
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                  {["Venue", "Network", "City", "Status", "Members", "Screens", "Compliance", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#B0B0B0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((venue) => {
                  const status = STATUS_CONFIG[venue.status ?? "inactive"] ?? STATUS_CONFIG.inactive;
                  const screenCount = Array.isArray(venue.screens) ? venue.screens.length : 0;
                  const compliance = compliancePct(venue.venue_photos);
                  const cColor = complianceColor(compliance);
                  return (
                    <tr key={venue.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-white">{venue.name}</p>
                        {venue.region && <p className="text-xs mt-0.5" style={{ color: "#8A8A8A" }}>{venue.region}</p>}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#C8C8C8" }}>{getBrand(venue.gym_brands)?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#C8C8C8" }}>{venue.city ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-white tabular-nums">{(venue.active_members ?? 0).toLocaleString("en-ZA")}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#C8C8C8" }}>{screenCount}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div style={{ width: 48, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                            <div style={{ width: `${compliance}%`, height: 3, background: cColor, borderRadius: 99 }} />
                          </div>
                          <span className="text-xs font-semibold tabular-nums" style={{ color: cColor }}>
                            {(venue.venue_photos ?? []).length === 0 ? "—" : `${compliance}%`}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/venues/${venue.id}`} className="text-xs font-medium" style={{ color: "#D4FF4F" }}>View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
