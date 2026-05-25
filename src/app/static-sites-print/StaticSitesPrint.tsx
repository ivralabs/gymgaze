"use client";

import React, { useEffect, useMemo } from "react";
import { Printer } from "lucide-react";
import { fmtDimensionsM } from "@/lib/dimensions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StaticSiteWithVenue = {
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
  price_per_month: number | null;
  monthly_impressions: number | null;
  pricing_tier: string | null;
  venues: {
    id: string;
    name: string;
    city: string | null;
    province: string | null;
    cover_image_url?: string | null;
  } | null;
};

interface Props {
  sites: StaticSiteWithVenue[];
  clientName: string;
  flightStart: string;
  flightEnd: string;
}

// ─── Site type labels ─────────────────────────────────────────────────────────
const SITE_TYPE_LABELS: Record<string, string> = {
  poster_frame:  "Poster Frame",
  banner:        "Banner",
  a_frame:       "A-Frame",
  standee:       "Standee",
  wall_mount:    "Wall Mount",
  window_vinyl:  "Window Vinyl",
  other:         "Other",
};

const LOCATION_LABELS: Record<string, string> = {
  entrance:    "Entrance",
  gym_floor:   "Gym Floor",
  reception:   "Reception",
  changerooms: "Changerooms",
  car_park:    "Car Park",
  corridor:    "Corridor",
  other:       "Other",
};

// ─── Image helpers ─────────────────────────────────────────────────────────────
function optimizeImageUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return "";
  const params = new URLSearchParams({ url, w: String(width), q: String(quality) });
  return `/api/img?${params.toString()}`;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtR(n: number) {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

function fmtFull(n: number) {
  return n.toLocaleString("en-ZA");
}

function fmtSiteId(uuid: string) {
  return `SS-${uuid.slice(0, 8)}`;
}

function fmtDimensions(w: number | null, h: number | null): string {
  return fmtDimensionsM(w, h);
}

function fmtSiteType(type: string | null): string {
  if (!type) return "—";
  return SITE_TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function fmtLocation(loc: string | null): string {
  if (!loc) return "—";
  return LOCATION_LABELS[loc] ?? loc.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function calcCpm(price: number, impressions: number): string {
  if (!impressions || impressions === 0) return "—";
  return `R ${((price * 1000) / impressions).toFixed(2)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LogoLockup({ dark }: { dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, background: "#D4FF4F", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: "#0a0a0a", lineHeight: 1 }}>G</span>
      </div>
      <span style={{ fontSize: 18, fontWeight: 800, color: dark ? "#0a0a0a" : "#ffffff", letterSpacing: "-0.02em", fontFamily: "Inter Tight, sans-serif" }}>GymGaze</span>
    </div>
  );
}

function PageHeader({ rightContent }: { rightContent: React.ReactNode }) {
  return (
    <div style={{ background: "#0a0a0a", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", flexShrink: 0 }}>
      <LogoLockup />
      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{rightContent}</div>
    </div>
  );
}

// A4 landscape at 96dpi — same dimensions as DOOH rate card
const PAGE_W = 1123;
const PAGE_H = 780;
const PAGE_STYLE: React.CSSProperties = {
  width: `${PAGE_W}px`,
  height: `${PAGE_H}px`,
  maxHeight: `${PAGE_H}px`,
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StaticSitesPrint({
  sites,
  clientName,
  flightStart,
  flightEnd,
}: Props) {

  // Auto-print on mount — unless headless renderer asked us not to.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("noAutoPrint") === "1") return;
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // ── Computed totals ─────────────────────────────────────────────────────────
  const totalMonthlyValue = useMemo(() =>
    sites.reduce((s, site) => s + (site.price_per_month ?? 0), 0),
  [sites]);

  const totalImpressions = useMemo(() =>
    sites.reduce((s, site) => s + (site.monthly_impressions ?? 0), 0),
  [sites]);

  const avgRatePerSite = sites.length > 0 ? totalMonthlyValue / sites.length : 0;

  // Average CPM across sites that have both price and impressions
  const sitesWithCpm = sites.filter(s => (s.monthly_impressions ?? 0) > 0 && (s.price_per_month ?? 0) > 0);
  const avgCpm = sitesWithCpm.length > 0
    ? sitesWithCpm.reduce((s, site) => s + ((site.price_per_month! * 1000) / site.monthly_impressions!), 0) / sitesWithCpm.length
    : 0;

  // Group by province
  const sitesByProvince = useMemo(() => {
    const map = new Map<string, StaticSiteWithVenue[]>();
    sites.forEach((site) => {
      const prov = site.venues?.province ?? "Other";
      if (!map.has(prov)) map.set(prov, []);
      map.get(prov)!.push(site);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sites]);

  const provinces = sitesByProvince.map(([p]) => p);

  // Breakdown by type
  const byType = useMemo(() => {
    const map = new Map<string, number>();
    sites.forEach((site) => {
      const t = fmtSiteType(site.site_type);
      map.set(t, (map.get(t) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sites]);

  // Breakdown by province count
  const byProvince = useMemo(() => {
    const map = new Map<string, number>();
    sites.forEach((site) => {
      const p = site.venues?.province ?? "Other";
      map.set(p, (map.get(p) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sites]);

  const today = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print toolbar */}
      <div
        className="no-print"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "#0a0a0a",
          borderBottom: "1px solid rgba(212,255,79,0.2)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#D4FF4F", fontWeight: 700, fontSize: 14 }}>
          ⚡ GymGaze Static Sites Rate Card — {sites.length} site{sites.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => window.print()}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 10, background: "#D4FF4F", color: "#0a0a0a", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
        >
          <Printer size={14} strokeWidth={2.5} />
          Print / Save as PDF
        </button>
      </div>

      {/* Spacer for toolbar */}
      <div className="no-print" style={{ height: 56 }} />

      {/* ── Rate Card Pages ── */}
      <div id="rate-card-root" style={{ fontFamily: "Inter, sans-serif", padding: "24px 0" }}>

        {/* ═══ PAGE 1 — COVER ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE, background: "#0a0a0a" }}>
          {/* Dot-grid decorative background */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(212,255,79,0.18) 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }} />

          {/* Top-left: Logo */}
          <div style={{ position: "absolute", top: 36, left: 40, zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "#D4FF4F", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#0a0a0a", lineHeight: 1 }}>G</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", fontFamily: "Inter Tight, sans-serif" }}>GymGaze</span>
            </div>
          </div>

          {/* Centre: headline */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", fontFamily: "Inter Tight, sans-serif", lineHeight: 1, textAlign: "center" }}>
              STATIC SITES
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#D4FF4F", letterSpacing: "-0.02em", fontFamily: "Inter Tight, sans-serif", lineHeight: 1, textAlign: "center", marginTop: 8 }}>
              RATE CARD
            </div>
            <div style={{ width: 60, height: 3, background: "#D4FF4F", borderRadius: 2, margin: "16px auto 0" }} />
            <div style={{ marginTop: 20, fontSize: 22, fontWeight: 600, color: "#D4FF4F", letterSpacing: "-0.01em" }}>
              {clientName || "GymGaze Static Advertising Network"}
            </div>
            <div style={{ marginTop: 10, fontSize: 15, color: "#666", letterSpacing: "0.04em" }}>
              {flightStart && flightEnd ? `${flightStart} — ${flightEnd}` : today}
            </div>
          </div>

          {/* Bottom-left: CONFIDENTIAL */}
          <div style={{ position: "absolute", bottom: 36, left: 40, zIndex: 2 }}>
            <span style={{ background: "#D4FF4F", color: "#0a0a0a", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase" }}>Confidential</span>
          </div>

          {/* Bottom-right: network stats */}
          <div style={{ position: "absolute", bottom: 36, right: 40, zIndex: 2, display: "flex", gap: 10 }}>
            {[
              `${sites.length} Sites`,
              `${fmtR(Math.round(totalMonthlyValue))}/mo`,
              `${fmtNum(totalImpressions)} Impressions/mo`,
            ].map((pill) => (
              <span key={pill} style={{ background: "rgba(212,255,79,0.15)", border: "1px solid rgba(212,255,79,0.3)", borderRadius: 20, color: "#D4FF4F", fontSize: 12, fontWeight: 700, padding: "4px 14px", letterSpacing: "0.02em" }}>
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* ═══ PAGE 2 — NETWORK SUMMARY ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE, background: "#ffffff" }}>
          <PageHeader rightContent={clientName ? `${clientName} — Static Sites Proposal` : "Static Sites Proposal"} />

          <div style={{ padding: "20px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Stat tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {([
                { label: "Total Sites", value: sites.length.toString() },
                { label: "Monthly Value", value: fmtR(Math.round(totalMonthlyValue)) },
                { label: "Avg Rate / Site", value: fmtR(Math.round(avgRatePerSite)) },
                { label: "Monthly Impressions", value: fmtNum(totalImpressions) },
                { label: "Avg CPM", value: avgCpm > 0 ? `R ${avgCpm.toFixed(2)}` : "—" },
              ] as { label: string; value: string }[]).map(({ label, value }) => (
                <div key={label} style={{ background: "#111111", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Breakdown tables */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flex: 1 }}>
              {/* By type */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 10 }}>Sites by Type</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Type", "Sites", "%"].map((h) => (
                        <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #E5E7EB" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byType.map(([type, count]) => (
                      <tr key={type} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "7px 12px", color: "#111", fontWeight: 500 }}>{type}</td>
                        <td style={{ padding: "7px 12px", color: "#555", fontWeight: 700 }}>{count}</td>
                        <td style={{ padding: "7px 12px", color: "#888" }}>{sites.length > 0 ? Math.round((count / sites.length) * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* By province */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 10 }}>Sites by Province</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Province", "Sites", "%"].map((h) => (
                        <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #E5E7EB" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byProvince.map(([prov, count]) => (
                      <tr key={prov} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "7px 12px", color: "#111", fontWeight: 500 }}>{prov}</td>
                        <td style={{ padding: "7px 12px", color: "#555", fontWeight: 700 }}>{count}</td>
                        <td style={{ padding: "7px 12px", color: "#888" }}>{sites.length > 0 ? Math.round((count / sites.length) * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Narrative */}
            <p style={{ fontSize: 12, color: "#888", borderTop: "1px solid #E5E7EB", paddingTop: 12, marginTop: "auto" }}>
              This proposal covers <strong style={{ color: "#0a0a0a" }}>{sites.length}</strong> static advertising site{sites.length !== 1 ? "s" : ""} across <strong style={{ color: "#0a0a0a" }}>{byProvince.length}</strong> province{byProvince.length !== 1 ? "s" : ""}, representing a total monthly investment of <strong style={{ color: "#0a0a0a" }}>{fmtR(Math.round(totalMonthlyValue))}</strong> and <strong style={{ color: "#0a0a0a" }}>{fmtFull(totalImpressions)}</strong> monthly impressions.
            </p>
          </div>
        </div>

        {/* ═══ PER-PROVINCE SECTIONS ═══ */}
        {sitesByProvince.map(([province, provSites], pIdx) => {
          const provMonthlyValue = provSites.reduce((s, site) => s + (site.price_per_month ?? 0), 0);
          const provImpressions = provSites.reduce((s, site) => s + (site.monthly_impressions ?? 0), 0);

          return (
            <React.Fragment key={province}>
              {/* Province divider page */}
              <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE, background: "#0a0a0a", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(212,255,79,0.16) 1.2px, transparent 1.2px)", backgroundSize: "28px 28px", pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#D4FF4F" }}>Province</div>
                  <div style={{ fontSize: 120, fontWeight: 900, color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 0.9 }}>{province}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                    {[
                      `${provSites.length} Site${provSites.length !== 1 ? "s" : ""}`,
                      `${fmtR(Math.round(provMonthlyValue))}/mo`,
                      `${fmtNum(provImpressions)} Impressions`,
                    ].map((pill) => (
                      <div key={pill} style={{ background: "rgba(212,255,79,0.12)", border: "1px solid rgba(212,255,79,0.25)", borderRadius: 20, padding: "6px 16px", color: "#D4FF4F", fontSize: 13, fontWeight: 600 }}>{pill}</div>
                    ))}
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, background: "#D4FF4F", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#0a0a0a" }}>G</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>GymGaze</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>Section {pIdx + 1} of {provinces.length}</div>
                </div>
              </div>

              {/* Per-site property cards */}
              {provSites.map((site, sIdx) => {
                const price = site.price_per_month ?? 0;
                const impressions = site.monthly_impressions ?? 0;
                const venueName = site.venues?.name ?? "—";
                const venueCity = site.venues?.city ?? "—";
                const sitePhoto = site.photo_url ?? site.venues?.cover_image_url ?? null;

                return (
                  <div
                    key={site.id}
                    className="page-break"
                    data-print-page="true"
                    style={{ ...PAGE_STYLE, background: "#ffffff" }}
                  >
                    <PageHeader
                      rightContent={
                        <span>
                          {venueName}
                          {venueCity !== "—" ? <span style={{ color: "#999", fontWeight: 400 }}> · {venueCity}</span> : null}
                          <span style={{ color: "#D4FF4F", fontWeight: 700, marginLeft: 12, fontFamily: "Inter Tight, sans-serif", fontSize: 12 }}>
                            {fmtSiteId(site.id)}
                          </span>
                        </span>
                      }
                    />

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      {/* Main content: photo + info panel */}
                      <div style={{ display: "flex", height: 330, flexShrink: 0, overflow: "hidden" }}>
                        {/* LEFT ~55%: site photo */}
                        <div style={{ width: "55%", position: "relative", background: "#111", flexShrink: 0 }}>
                          {sitePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={optimizeImageUrl(sitePhoto, 800, 75)}
                              alt={site.label}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111", flexDirection: "column", gap: 12 }}>
                              <span style={{ fontSize: 36, fontWeight: 900, color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif" }}>{venueName.charAt(0)}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#555", textAlign: "center", padding: "0 24px" }}>{site.label}</span>
                            </div>
                          )}
                        </div>

                        {/* RIGHT: dark info panel */}
                        <div style={{ flex: 1, background: "#111111", display: "flex", flexDirection: "column", justifyContent: "center", gap: 0, padding: "24px 28px" }}>
                          {/* Site type */}
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#D4FF4F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                            {fmtSiteType(site.site_type)}
                          </div>
                          {/* Label */}
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", marginBottom: 4 }}>
                            {site.label}
                          </div>
                          {/* Dimensions */}
                          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
                            {fmtDimensions(site.width_cm, site.height_cm)}
                            {site.location_in_venue ? <span> · {fmtLocation(site.location_in_venue)}</span> : null}
                          </div>

                          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 16 }} />

                          {/* Pricing tier pill */}
                          {site.pricing_tier ? (
                            <div style={{ display: "inline-block", marginBottom: 12 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, border: "1px solid rgba(212,255,79,0.4)", borderRadius: 20, padding: "3px 12px", color: "#D4FF4F", letterSpacing: "0.06em" }}>
                                {site.pricing_tier.toUpperCase()}
                              </span>
                            </div>
                          ) : null}

                          {/* Monthly rate — big number */}
                          <div style={{ fontSize: 48, fontWeight: 700, color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
                            {fmtR(Math.round(price))}
                          </div>
                          <div style={{ fontSize: 11, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>per month</div>

                          {/* Monthly impressions */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <span style={{ fontSize: 10, color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly Impressions</span>
                            <span style={{ fontSize: 13, color: "#ccc", fontWeight: 600 }}>{impressions > 0 ? fmtFull(impressions) : "—"}</span>
                          </div>

                          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "12px 0" }} />

                          {/* Venue info */}
                          <div style={{ fontSize: 11, color: "#888" }}>
                            <span style={{ color: "#ccc", fontWeight: 600 }}>{venueName}</span>
                            <span style={{ margin: "0 6px", color: "#444" }}>·</span>
                            <span>{venueCity}</span>
                            {site.venues?.province ? <span><span style={{ margin: "0 6px", color: "#444" }}>·</span>{site.venues.province}</span> : null}
                          </div>
                        </div>
                      </div>

                      {/* Narrative */}
                      <div style={{ padding: "10px 32px 0", fontSize: 13, color: "#555" }}>
                        <strong style={{ color: "#0a0a0a" }}>{fmtSiteType(site.site_type)}</strong> at{" "}
                        <strong style={{ color: "#0a0a0a" }}>{fmtLocation(site.location_in_venue)}</strong> —{" "}
                        {fmtDimensions(site.width_cm, site.height_cm)} ·{" "}
                        {venueName}, {venueCity}{site.venues?.province ? `, ${site.venues.province}` : ""}
                      </div>

                      {/* Data grid */}
                      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", margin: "8px 0 0 0", padding: "12px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                        {[
                          { label: "Monthly Rate (R)", value: fmtR(Math.round(price)) },
                          { label: "Site Type", value: fmtSiteType(site.site_type) },
                          { label: "Monthly Impressions", value: impressions > 0 ? fmtFull(impressions) : "—" },
                          { label: "Location", value: fmtLocation(site.location_in_venue) },
                          { label: "CPM", value: calcCpm(price, impressions) },
                          { label: "Dimensions", value: fmtDimensions(site.width_cm, site.height_cm) },
                          { label: "Annual Value", value: fmtR(Math.round(price * 12)) },
                          { label: "Pricing Tier", value: site.pricing_tier ? site.pricing_tier.toUpperCase() : "—" },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #E5E7EB" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666" }}>{label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", fontFamily: "Inter Tight, sans-serif" }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bottom strip */}
                      <div style={{ background: "#0a0a0a", padding: "8px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                        <LogoLockup />
                        <span style={{ fontSize: 11, color: "#666", fontFamily: "Inter Tight, sans-serif", fontWeight: 700 }}>{fmtSiteId(site.id)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* ═══ LAST PAGE — INVESTMENT SUMMARY ═══ */}
        <div data-print-page="true" style={{ ...PAGE_STYLE, background: "#ffffff" }}>
          <PageHeader rightContent={clientName ? `Investment Summary — ${clientName}` : "Investment Summary"} />

          <div style={{ padding: "20px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 4 }}>All Selected Sites</div>

            {/* Sites table */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Site ID", "Venue", "Type", "Dimensions", "Location", "Monthly Rate"].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #E5E7EB" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "7px 12px", fontFamily: "Inter Tight, sans-serif", fontWeight: 700, color: "#D4FF4F", fontSize: 11, background: "#111" }}>{fmtSiteId(site.id)}</td>
                      <td style={{ padding: "7px 12px", color: "#0a0a0a", fontWeight: 600, fontSize: 11 }}>{site.venues?.name ?? "—"}</td>
                      <td style={{ padding: "7px 12px", color: "#555", fontSize: 11 }}>{fmtSiteType(site.site_type)}</td>
                      <td style={{ padding: "7px 12px", color: "#555", fontSize: 11 }}>{fmtDimensions(site.width_cm, site.height_cm)}</td>
                      <td style={{ padding: "7px 12px", color: "#555", fontSize: 11 }}>{fmtLocation(site.location_in_venue)}</td>
                      <td style={{ padding: "7px 12px", fontWeight: 700, color: "#0a0a0a", fontSize: 12, fontFamily: "Inter Tight, sans-serif" }}>{fmtR(Math.round(site.price_per_month ?? 0))}</td>
                    </tr>
                  ))}
                  {/* Subtotals row */}
                  <tr style={{ background: "#F9FAFB", borderTop: "2px solid #E5E7EB" }}>
                    <td colSpan={5} style={{ padding: "8px 12px", fontWeight: 700, color: "#0a0a0a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Subtotal ({sites.length} sites)</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#0a0a0a", fontSize: 13, fontFamily: "Inter Tight, sans-serif" }}>{fmtR(Math.round(totalMonthlyValue))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals hero */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 4 }}>
              <div style={{ background: "#0a0a0a", borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4, border: "1px solid rgba(212,255,79,0.2)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#D4FF4F" }}>Total Monthly Investment</div>
                <div style={{ fontSize: 38, fontWeight: 900, color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>{fmtR(Math.round(totalMonthlyValue))}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{sites.length} sites · {fmtNum(totalImpressions)} impressions/mo</div>
              </div>
              <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4, border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#888" }}>Total Annual Investment</div>
                <div style={{ fontSize: 38, fontWeight: 900, color: "#0a0a0a", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>{fmtR(Math.round(totalMonthlyValue * 12))}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>12-month commitment</div>
              </div>
            </div>
          </div>

          {/* Footer bar */}
          <div style={{ background: "#0a0a0a", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
            <LogoLockup />
            <span style={{ fontSize: 11, color: "#666" }}>gymgaze.vercel.app · Generated {today}</span>
          </div>
        </div>

        {/* Print button at bottom */}
        <div className="no-print" style={{ marginTop: 16, display: "flex", justifyContent: "center", paddingBottom: 40 }}>
          <button
            onClick={() => window.print()}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 10, background: "#0a0a0a", color: "#D4FF4F", border: "2px solid #D4FF4F", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            <Printer size={16} strokeWidth={2.5} />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </>
  );
}
