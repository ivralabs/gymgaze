"use client";

import React from "react";
import { Printer } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StaticSitePrintRow {
  id: string;
  label: string;
  site_type: string | null;
  location_in_venue: string | null;
  width_cm: number | null;
  height_cm: number | null;
  is_active: boolean | null;
  photo_url: string | null;
  notes: string | null;
  price_per_month: number | null;
  monthly_impressions: number | null;
  pricing_tier: string | null;
  created_at: string;
  venues: {
    id: string;
    name: string;
    city: string | null;
    province: string | null;
    cover_image_url?: string | null;
  } | null;
}

interface Props {
  sites: StaticSitePrintRow[];
  clientName: string;
  flightStart: string;
  flightEnd: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SITE_TYPE_LABELS: Record<string, string> = {
  poster_frame: "Poster Frame",
  banner: "Banner",
  a_frame: "A-Frame",
  standee: "Standee",
  wall_mount: "Wall Mount",
  window_vinyl: "Window Vinyl",
  other: "Other",
};

const LOCATION_LABELS: Record<string, string> = {
  entrance: "Entrance",
  gym_floor: "Gym Floor",
  reception: "Reception",
  changerooms: "Changerooms",
  car_park: "Car Park",
  corridor: "Corridor",
  other: "Other",
};

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  Premium: { bg: "#FFF9C4", text: "#92600A" },
  Standard: { bg: "#E3F2FD", text: "#1565C0" },
  Entry: { bg: "#E8F5E9", text: "#2E7D32" },
};

function fmtZar(n: number) {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDims(w: number | null, h: number | null) {
  if (w && h) return `${w}cm × ${h}cm`;
  if (w) return `${w}cm wide`;
  if (h) return `${h}cm tall`;
  return "—";
}

// Group sites by venue
function groupByVenue(sites: StaticSitePrintRow[]) {
  const map = new Map<string, { venue: StaticSitePrintRow["venues"]; sites: StaticSitePrintRow[] }>();
  for (const site of sites) {
    const key = site.venues?.id ?? "unknown";
    if (!map.has(key)) map.set(key, { venue: site.venues, sites: [] });
    map.get(key)!.sites.push(site);
  }
  return Array.from(map.values());
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaticSitesPrint({ sites, clientName, flightStart, flightEnd }: Props) {
  const groups = groupByVenue(sites);
  const totalSites = sites.length;
  const totalMonthly = sites.reduce((sum, s) => sum + (s.price_per_month ?? 0), 0);
  const totalImpressions = sites.reduce((sum, s) => sum + (s.monthly_impressions ?? 0), 0);

  const today = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div id="rate-card-root" style={{ background: "white", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Print toolbar */}
      <div
        className="no-print flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}
      >
        <div>
          <p className="text-xs font-medium" style={{ color: "#555" }}>
            Static Sites Rate Card · {totalSites} site{totalSites !== 1 ? "s" : ""}
          </p>
          {clientName && <p className="text-xs" style={{ color: "#999" }}>Prepared for: {clientName}</p>}
        </div>
        <button
          onClick={() => window.print()}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#0a0a0a", color: "white",
            border: "none", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Printer size={14} strokeWidth={2} /> Print / Save PDF
        </button>
      </div>

      {/* Cover page */}
      <div data-print-page="true" style={{ width: 1123, height: 780, background: "#0A0A0A", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, boxSizing: "border-box" }}>
        {/* Logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, background: "#D4FF4F", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontWeight: 900, fontSize: 18, color: "#0A0A0A" }}>G</span>
          </div>
          <span style={{ color: "#D4FF4F", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>GymGaze</span>
        </div>

        {/* Hero text */}
        <div>
          <p style={{ color: "#D4FF4F", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
            Static Installations · Rate Card
          </p>
          <h1 style={{ color: "#fff", fontSize: 56, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
            {clientName || "GymGaze"}<br />
            <span style={{ color: "#D4FF4F" }}>Static Sites</span>
          </h1>
          {(flightStart || flightEnd) && (
            <p style={{ color: "#888", fontSize: 15 }}>
              Campaign Period: {flightStart}{flightStart && flightEnd ? " – " : ""}{flightEnd}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 40 }}>
          {[
            { label: "Sites Proposed", value: totalSites.toString() },
            { label: "Total Rate / Month", value: totalMonthly > 0 ? fmtZar(totalMonthly) : "—" },
            { label: "Total Impressions / Month", value: totalImpressions > 0 ? totalImpressions.toLocaleString("en-ZA") : "—" },
            { label: "Venues", value: groups.length.toString() },
          ].map((stat) => (
            <div key={stat.label}>
              <p style={{ color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{stat.label}</p>
              <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{stat.value}</p>
            </div>
          ))}
          <div style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
            <p style={{ color: "#444", fontSize: 11 }}>Prepared {today}</p>
          </div>
        </div>
      </div>

      {/* Sites pages — 3 sites per page */}
      {Array.from({ length: Math.ceil(sites.length / 3) }, (_, pageIdx) => {
        const pageSites = sites.slice(pageIdx * 3, pageIdx * 3 + 3);
        return (
          <div
            key={pageIdx}
            data-print-page="true"
            style={{
              width: 1123, height: 780, background: "white", boxSizing: "border-box",
              padding: "32px 48px", display: "flex", flexDirection: "column",
            }}
          >
            {/* Page header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 20, height: 20, background: "#D4FF4F", borderRadius: 4 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: "#0A0A0A", letterSpacing: "-0.01em" }}>GymGaze Static Sites</span>
              </div>
              {clientName && <span style={{ fontSize: 12, color: "#999" }}>{clientName}</span>}
              <span style={{ fontSize: 11, color: "#bbb" }}>Page {pageIdx + 2}</span>
            </div>

            {/* Sites grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, flex: 1 }}>
              {pageSites.map((site) => {
                const tierStyle = site.pricing_tier ? TIER_COLORS[site.pricing_tier] : null;
                return (
                  <div
                    key={site.id}
                    style={{
                      border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden",
                      display: "flex", flexDirection: "column",
                    }}
                  >
                    {/* Photo */}
                    <div style={{ height: 160, background: "#f3f4f6", overflow: "hidden", position: "relative" }}>
                      {site.photo_url ? (
                        <img src={site.photo_url} alt={site.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 28, color: "#d1d5db" }}>📍</span>
                        </div>
                      )}
                      {site.pricing_tier && tierStyle && (
                        <span style={{
                          position: "absolute", top: 8, right: 8,
                          background: tierStyle.bg, color: tierStyle.text,
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        }}>
                          {site.pricing_tier}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: "#0A0A0A", marginBottom: 2 }}>{site.label}</p>
                        <p style={{ fontSize: 11, color: "#888" }}>
                          {site.venues?.name ?? "—"}
                          {site.venues?.city ? ` · ${site.venues.city}` : ""}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {site.site_type && (
                          <span style={{ fontSize: 10, fontWeight: 600, background: "#f3f4f6", color: "#555", padding: "2px 8px", borderRadius: 20 }}>
                            {SITE_TYPE_LABELS[site.site_type] ?? site.site_type}
                          </span>
                        )}
                        {site.location_in_venue && (
                          <span style={{ fontSize: 10, background: "#f3f4f6", color: "#555", padding: "2px 8px", borderRadius: 20 }}>
                            {LOCATION_LABELS[site.location_in_venue] ?? site.location_in_venue}
                          </span>
                        )}
                        {(site.width_cm || site.height_cm) && (
                          <span style={{ fontSize: 10, background: "#f3f4f6", color: "#555", padding: "2px 8px", borderRadius: 20, fontVariantNumeric: "tabular-nums" }}>
                            {fmtDims(site.width_cm, site.height_cm)}
                          </span>
                        )}
                      </div>

                      {/* Pricing */}
                      <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 16 }}>
                        {site.price_per_month != null ? (
                          <div>
                            <p style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rate / Month</p>
                            <p style={{ fontSize: 16, fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.02em" }}>{fmtZar(site.price_per_month)}</p>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: 10, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rate</p>
                            <p style={{ fontSize: 13, color: "#bbb" }}>POA</p>
                          </div>
                        )}
                        {site.monthly_impressions != null && (
                          <div>
                            <p style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em" }}>Impr. / Month</p>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>{site.monthly_impressions.toLocaleString("en-ZA")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Summary page */}
      {sites.length > 0 && (
        <div
          data-print-page="true"
          style={{
            width: 1123, height: 780, background: "white", boxSizing: "border-box",
            padding: "48px 64px", display: "flex", flexDirection: "column",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0A0A0A", letterSpacing: "-0.02em", margin: "0 0 6px" }}>Summary</h2>
            <p style={{ color: "#888", fontSize: 13 }}>All proposed static sites and pricing</p>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #0A0A0A" }}>
                {["Label", "Venue", "Type", "Dimensions", "Location", "Rate / Month", "Impressions / Mo", "Tier"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((site, i) => (
                <tr key={site.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "8px 8px", fontWeight: 600, color: "#0A0A0A" }}>{site.label}</td>
                  <td style={{ padding: "8px 8px", color: "#555" }}>{site.venues?.name ?? "—"}{site.venues?.city ? ` · ${site.venues.city}` : ""}</td>
                  <td style={{ padding: "8px 8px", color: "#555" }}>{site.site_type ? (SITE_TYPE_LABELS[site.site_type] ?? site.site_type) : "—"}</td>
                  <td style={{ padding: "8px 8px", color: "#555", fontVariantNumeric: "tabular-nums" }}>{fmtDims(site.width_cm, site.height_cm)}</td>
                  <td style={{ padding: "8px 8px", color: "#555" }}>{site.location_in_venue ? (LOCATION_LABELS[site.location_in_venue] ?? site.location_in_venue) : "—"}</td>
                  <td style={{ padding: "8px 8px", fontWeight: 700, color: "#0A0A0A" }}>{site.price_per_month != null ? fmtZar(site.price_per_month) : "—"}</td>
                  <td style={{ padding: "8px 8px", color: "#555" }}>{site.monthly_impressions != null ? site.monthly_impressions.toLocaleString("en-ZA") : "—"}</td>
                  <td style={{ padding: "8px 8px" }}>
                    {site.pricing_tier ? (
                      <span style={{
                        background: TIER_COLORS[site.pricing_tier]?.bg ?? "#f3f4f6",
                        color: TIER_COLORS[site.pricing_tier]?.text ?? "#555",
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      }}>
                        {site.pricing_tier}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #0A0A0A" }}>
                <td colSpan={5} style={{ padding: "10px 8px", fontWeight: 700, fontSize: 13, color: "#0A0A0A" }}>
                  Total ({totalSites} site{totalSites !== 1 ? "s" : ""})
                </td>
                <td style={{ padding: "10px 8px", fontWeight: 800, fontSize: 14, color: "#0A0A0A" }}>
                  {totalMonthly > 0 ? fmtZar(totalMonthly) + " / mo" : "—"}
                </td>
                <td style={{ padding: "10px 8px", fontWeight: 700, color: "#374151" }}>
                  {totalImpressions > 0 ? totalImpressions.toLocaleString("en-ZA") : "—"}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <p style={{ fontSize: 11, color: "#bbb" }}>GymGaze · Static Advertising Network</p>
            <p style={{ fontSize: 11, color: "#bbb" }}>Prepared {today}</p>
          </div>
        </div>
      )}
    </div>
  );
}
