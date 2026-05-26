"use client";

import React, { useEffect, useMemo } from "react";
import { Printer } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VenueRow = {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  active_members: number | null;
  monthly_entries: number | null;
  cover_image_url?: string | null;
  operating_hours?: Record<string, { open: string; close: string; closed: boolean }> | null;
  screens: { id: string; is_active: boolean | null; slots_7sec: number | null; slots_15sec: number | null; location_in_venue: string | null; size_inches: number | null }[] | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type PricingTier = {
  id: string;
  tier_key: string;
  label: string;
  cpm_zar: number;
  min_spend: number;
  duration_sec: number;
  description: string | null;
  color: string;
  bg: string;
  sort_order: number;
};

interface Props {
  venues: VenueRow[];
  pricingTiers: PricingTier[];
  cpm: number;
  weeks: number;
  clientName: string;
  flightStart: string;
  flightEnd: string;
  groupByCity: boolean;
  clientLat?: number | null;
  clientLng?: number | null;
  clientAddress?: string;
  clientLocations?: { lat: number; lng: number; address: string }[];
  radius?: number | null;
}

// ─── Media constants ──────────────────────────────────────────────────────────
const PLAYS_PER_SCREEN_PER_WEEK = 1487;

const ATTENTION = {
  reception:   0.85,
  gym_floor:   0.60,
  changerooms: 0.75,
  default:     0.65,
};

const DWELL_BENCHMARK = {
  gym_minutes: 55,
  roadside_seconds: 5,
};

const ATTENTION_QUALITY_SCORE = 8.5;

const FORMAT_BENCHMARKS = [
  { name: "GymGaze DOOH",    cpm: 85,  attention: 0.65, color: "#D4FF4F" },
  { name: "Roadside OOH",   cpm: 45,  attention: 0.05, color: "#A1A1AA" },
  { name: "Radio",          cpm: 120, attention: 0.40, color: "#FF6B35" },
  { name: "Digital Display",cpm: 15,  attention: 0.02, color: "#6EE7B7" },
  { name: "TV (Prime)",     cpm: 280, attention: 0.40, color: "#C084FC" },
];

// Active member rate — 65% of registered members actually visit each month
const ACTIVE_RATE = 0.65;

// ─── Impact model ─────────────────────────────────────────────────────────────
function calcMetrics(v: VenueRow, weeks: number) {
  const screens = Array.isArray(v.screens) ? v.screens.filter((s) => s.is_active).length : 0;
  const activeMembers = v.active_members ?? 0;
  const monthlyEntries = v.monthly_entries ?? 0;

  const activeThisMonth = Math.round(activeMembers * ACTIVE_RATE);
  const ots = Math.round(monthlyEntries * (weeks / 4.3));
  const reachUncapped = Math.round(activeThisMonth * Math.min(weeks / 4.3, 1.5));
  const reach = Math.min(reachUncapped, activeMembers);
  const frequency = reach > 0 ? Math.round((ots / reach) * 10) / 10 : 0;
  const attentionFactor = ATTENTION.default;
  const impact = Math.round(reach * attentionFactor);
  const playsOts = screens * PLAYS_PER_SCREEN_PER_WEEK * weeks;

  return { screens, ots, reach, frequency, impact, playsOts, activeMembers, activeThisMonth };
}

// ─── Haversine distance ──────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function nearestLocation(
  venueLat: number,
  venueLng: number,
  locations: { lat: number; lng: number; address: string }[]
): { lat: number; lng: number; address: string; distanceKm: number } | null {
  let nearest: { lat: number; lng: number; address: string } | null = null;
  let minDist = Infinity;
  for (const loc of locations) {
    const d = haversineKm(venueLat, venueLng, loc.lat, loc.lng);
    if (d < minDist) { minDist = d; nearest = loc; }
  }
  return nearest ? { ...nearest, distanceKm: minDist } : null;
}

// ─── Image helpers ───────────────────────────────────────────────
function optimizeImageUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return "";
  // Route through our /api/img proxy which uses sharp to resize + JPEG-compress.
  // Edge-cached so repeat fetches are instant.
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

function fmtFreq(f: number) {
  return `${f.toFixed(1)}×`;
}

function fmtFull(n: number) {
  return n.toLocaleString("en-ZA");
}

// ─── Operating hours helpers ─────────────────────────────────────────────────
function calcAvgDailyHours(oh: Record<string, { open: string; close: string; closed: boolean }> | null | undefined): number {
  if (!oh) return 17;
  const days = Object.values(oh);
  const openDays = days.filter(d => !d.closed);
  if (openDays.length === 0) return 17;
  const totalHours = openDays.reduce((sum, d) => {
    const [oh2, om] = d.open.split(":").map(Number);
    const [ch, cm] = d.close.split(":").map(Number);
    return sum + ((ch + cm / 60) - (oh2 + om / 60));
  }, 0);
  return totalHours / 7;
}

function fmtOperatingHours(oh: Record<string, { open: string; close: string; closed: boolean }> | null | undefined): string {
  if (!oh) return "05:00 – 22:00";
  const weekdays = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const wdOpen = weekdays.map(d => oh[d]).filter(Boolean).filter(d => !d.closed);
  if (wdOpen.length === 0) return "05:00 – 22:00";
  const mon = oh["Monday"];
  const sat = oh["Saturday"];
  const sun = oh["Sunday"];
  let result = mon && !mon.closed ? `Mon–Fri ${mon.open}–${mon.close}` : "";
  if (sat && !sat.closed) result += ` · Sat ${sat.open}–${sat.close}`;
  if (sun && !sun.closed) result += ` · Sun ${sun.open}–${sun.close}`;
  return result || "05:00 – 22:00";
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

// A4 landscape at 96dpi = 1123 × 794. We use 1123×780 — width matches exactly,
// height is 14px under to absorb any pixel rounding. NO margin between pages —
// the page-break CSS handles separation, margin causes extra blank pages.
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
export default function RateCardPrint({
  venues,
  pricingTiers,
  cpm,
  weeks,
  clientName,
  flightStart,
  flightEnd,
  groupByCity,
  clientLat,
  clientLng,
  clientAddress,
  clientLocations: clientLocationsProp,
  radius,
}: Props) {
  // Resolve effective locations — new multi-location param takes priority;
  // fall back to legacy single-location params for backward compat.
  const clientLocations: { lat: number; lng: number; address: string }[] = (() => {
    if (clientLocationsProp && clientLocationsProp.length > 0) return clientLocationsProp;
    if (clientLat != null && clientLng != null) return [{ lat: clientLat, lng: clientLng, address: clientAddress ?? "" }];
    return [];
  })();
  const effectiveCpm = cpm;

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

  // ── Per-venue metrics ──────────────────────────────────────────────────────
  const venueData = useMemo(() => {
    return venues.map((v) => {
      const m = calcMetrics(v, weeks);
      const cost = (m.playsOts / 1000) * effectiveCpm;
      const costPerUnique = m.reach > 0 ? cost / m.reach : 0;
      return { ...v, ...m, cost, costPerUnique };
    });
  }, [venues, weeks, effectiveCpm]);

  // ── City rollup ────────────────────────────────────────────────────────────
  const cityData = useMemo(() => {
    const map = new Map<string, { ots: number; reach: number; impact: number; screens: number; venues: number; cost: number }>();
    venueData.forEach((v) => {
      const key = v.city ?? "Unknown";
      const e = map.get(key) ?? { ots: 0, reach: 0, impact: 0, screens: 0, venues: 0, cost: 0 };
      map.set(key, { ots: e.ots + v.ots, reach: e.reach + v.reach, impact: e.impact + v.impact, screens: e.screens + v.screens, venues: e.venues + 1, cost: e.cost + v.cost });
    });
    return Array.from(map.entries())
      .map(([city, d]) => ({ city, ...d, frequency: d.reach > 0 ? Math.round((d.ots / d.reach) * 10) / 10 : 0 }))
      .sort((a, b) => b.reach - a.reach);
  }, [venueData]);

  // ── Province rollup ────────────────────────────────────────────────────────
  const provinceData = useMemo(() => {
    const map = new Map<string, { ots: number; reach: number; impact: number; screens: number; venues: number; cost: number }>();
    venueData.forEach((v) => {
      const key = v.province ?? "Unknown";
      const e = map.get(key) ?? { ots: 0, reach: 0, impact: 0, screens: 0, venues: 0, cost: 0 };
      map.set(key, { ots: e.ots + v.ots, reach: e.reach + v.reach, impact: e.impact + v.impact, screens: e.screens + v.screens, venues: e.venues + 1, cost: e.cost + v.cost });
    });
    return Array.from(map.entries())
      .map(([province, d]) => ({ province, ...d, frequency: d.reach > 0 ? Math.round((d.ots / d.reach) * 10) / 10 : 0 }))
      .sort((a, b) => b.reach - a.reach);
  }, [venueData]);

  // ── Quote totals (all venues) ──────────────────────────────────────────────
  const quoteTotals = useMemo(() => {
    const ots    = venueData.reduce((s, v) => s + v.ots, 0);
    const reach  = venueData.reduce((s, v) => s + v.reach, 0);
    const impact = venueData.reduce((s, v) => s + v.impact, 0);
    const screens = venueData.reduce((s, v) => s + v.screens, 0);
    const cost   = venueData.reduce((s, v) => s + v.cost, 0);
    const freq   = reach > 0 ? Math.round((ots / reach) * 10) / 10 : 0;
    const costPerUnique = reach > 0 ? cost / reach : 0;
    return { ots, reach, impact, screens, cost, freq, costPerUnique };
  }, [venueData]);

  const selectedTier = pricingTiers.find((t) => t.cpm_zar === effectiveCpm) ?? pricingTiers[0];
  const slotDuration = selectedTier?.duration_sec ?? 15;
  const slotLabel = `${slotDuration}s`;
  const tierLabel = selectedTier?.label ?? "Custom";
  const gymgazeEcpm = Math.round(effectiveCpm / ATTENTION.default);
  const today = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
  const totalActiveMembers = venueData.reduce((s, v) => s + (v.activeMembers ?? 0), 0);

  const benchmarksForCard = FORMAT_BENCHMARKS.map((b) => ({
    ...b,
    cpm: b.name === "GymGaze DOOH" ? effectiveCpm : b.cpm,
    ecpm: b.name === "GymGaze DOOH" ? gymgazeEcpm : Math.round(b.cpm / b.attention),
  })).sort((a, b) => a.ecpm - b.ecpm);
  const maxBenchmarkEcpm = Math.max(...benchmarksForCard.map((b) => b.ecpm));

  // City grouping helper
  const citiesInProvince = (pvenues: typeof venueData) => {
    const map = new Map<string, typeof venueData>();
    pvenues.forEach(v => {
      const city = v.city ?? "Unknown";
      if (!map.has(city)) map.set(city, []);
      map.get(city)!.push(v);
    });
    return Array.from(map.entries()).map(([city, vs]) => ({ city, venues: vs }));
  };

  // Group quoteVenues by province
  const venuesByProvince = venueData.reduce((acc, v) => {
    const prov = v.province ?? "Other";
    if (!acc[prov]) acc[prov] = [];
    acc[prov].push(v);
    return acc;
  }, {} as Record<string, typeof venueData>);
  const provinces = Object.keys(venuesByProvince).sort();

  // Campaign package data
  const topCity = cityData[0];
  const topCityVenues = venueData.filter(v => v.city === topCity?.city);
  const topCityCost = topCityVenues.reduce((s, v) => s + v.cost, 0);
  const topCityReach = topCityVenues.reduce((s, v) => s + v.reach, 0);

  const topProvince = provinceData[0];
  const topProvinceVenues = venueData.filter(v => v.province === topProvince?.province);
  const topProvinceCost = topProvinceVenues.reduce((s, v) => s + v.cost, 0);
  const topProvinceReach = topProvinceVenues.reduce((s, v) => s + v.reach, 0);

  return (
    <>
      {/* Print CSS is in /rate-card-print/layout.tsx — do not duplicate here.
         Duplicating with conflicting units (mm vs px) caused page-bleed bugs. */}
      <style>{`
        @media print {
          /* Belt-and-braces: only colour preservation here, sizing comes from layout */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print toolbar — hidden when printing */}
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
        <span style={{ color: "#D4FF4F", fontWeight: 700, fontSize: 14 }}>⚡ GymGaze Rate Card — {venueData.length} venue{venueData.length !== 1 ? "s" : ""} · {weeks} weeks · R{effectiveCpm} CPM</span>
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
          {/* Dot-grid decorative background — stronger alpha for print fidelity */}
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

          {/* Center: headline */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", fontFamily: "Inter Tight, sans-serif", lineHeight: 1, textAlign: "center" }}>
              MEDIA RATE CARD
            </div>
            <div style={{ width: 60, height: 3, background: "#D4FF4F", borderRadius: 2, margin: "16px auto 0" }} />
            <div style={{ marginTop: 20, fontSize: 22, fontWeight: 600, color: "#D4FF4F", letterSpacing: "-0.01em" }}>
              {clientName || "GymGaze Gym DOOH Network"}
            </div>
            <div style={{ marginTop: 10, fontSize: 15, color: "#666", letterSpacing: "0.04em" }}>
              {flightStart && flightEnd ? `${flightStart} — ${flightEnd}` : today}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "center" }}>
              <div style={{ background: "rgba(212,255,79,0.15)", border: "1px solid rgba(212,255,79,0.3)", borderRadius: 20, padding: "5px 16px", color: "#D4FF4F", fontSize: 13, fontWeight: 700 }}>
                {tierLabel} · {slotLabel} slot · R{effectiveCpm} CPM
              </div>
            </div>
          </div>

          {/* Bottom-left: CONFIDENTIAL */}
          <div style={{ position: "absolute", bottom: 36, left: 40, zIndex: 2 }}>
            <span style={{ background: "#D4FF4F", color: "#0a0a0a", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase" }}>Confidential</span>
          </div>

          {/* Bottom-right: network stats */}
          <div style={{ position: "absolute", bottom: 36, right: 40, zIndex: 2, display: "flex", gap: 10 }}>
            {[
              `${quoteTotals.screens} Screens`,
              `${venueData.length} Venues`,
              `${fmtNum(totalActiveMembers)} Active Members`,
            ].map((pill) => (
              <span key={pill} style={{ background: "rgba(212, 255, 79, 0.15)", border: "1px solid rgba(212, 255, 79, 0.3)", borderRadius: 20, color: "#D4FF4F", fontSize: 12, fontWeight: 700, padding: "4px 14px", letterSpacing: "0.02em" }}>
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* ═══ PAGE 2 — NETWORK SUMMARY ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE, background: "#ffffff" }}>
          <PageHeader rightContent={clientName ? `${clientName} — Media Proposal` : "Media Proposal"} />

          <div style={{ padding: "28px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            {/* 4 stat tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {([
                { label: "Total Screens", value: quoteTotals.screens.toString() },
                { label: "Total Reach", value: fmtFull(quoteTotals.reach) },
                { label: "OTS", value: fmtFull(quoteTotals.ots) },
                { label: "eCPM", value: `R${gymgazeEcpm}` },
              ] as { label: string; value: string }[]).map(({ label, value }) => (
                <div key={label} style={{ background: "#111111", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* eCPM benchmark chart */}
            <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "20px 24px", flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 16 }}>eCPM Benchmark — Cost Per Attended Impression</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {benchmarksForCard.map((b) => {
                  const isGymgaze = b.name === "GymGaze DOOH";
                  const barWidth = Math.round((b.ecpm / maxBenchmarkEcpm) * 100);
                  return (
                    <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 12, background: isGymgaze ? "rgba(212,255,79,0.08)" : "transparent", borderRadius: 6, padding: "4px 8px", margin: "0 -8px" }}>
                      <div style={{ width: 140, fontSize: 12, fontWeight: isGymgaze ? 700 : 500, color: isGymgaze ? "#0a0a0a" : "#555", flexShrink: 0 }}>{b.name}</div>
                      <div style={{ flex: 1, background: "#E5E7EB", borderRadius: 4, height: 10 }}>
                        <div style={{ width: `${barWidth}%`, height: 10, borderRadius: 4, background: isGymgaze ? "#D4FF4F" : "#9CA3AF", transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ width: 90, textAlign: "right", fontSize: 12, fontWeight: isGymgaze ? 700 : 500, color: isGymgaze ? "#0a0a0a" : "#555", flexShrink: 0 }}>R{Math.round(b.ecpm)} eCPM</div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 14 }}>
                eCPM = CPM ÷ attention rate. Lower = better value per registered impression.
                GymGaze: {DWELL_BENCHMARK.gym_minutes}min avg session vs {DWELL_BENCHMARK.roadside_seconds}s roadside glance.
                Attention Quality: {ATTENTION_QUALITY_SCORE}/10 (captive, gym demographic LSM 7–10).
              </p>
            </div>
          </div>
        </div>

        {/* ═══ PAGE 3 — CAMPAIGN PACKAGES ═══ */}
        {(() => {
          const nationalCost = quoteTotals.cost;
          const nationalReach = quoteTotals.reach;

          return (
            <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE, background: "#F7F7F5" }}>
              <PageHeader rightContent="Campaign Packages" />

              <div style={{ padding: "8px 32px 0", fontSize: 13, color: "#888" }}>
                Choose a package or build a custom campaign — all prices calculated at {tierLabel} {slotLabel} · R{effectiveCpm} CPM
              </div>

              <div style={{ display: "flex", gap: 16, padding: "16px 32px", flex: 1 }}>
                {[
                  {
                    name: "City Sprint",
                    desc: `${topCity?.city ?? "Top City"} · ${weeks} weeks · ${slotLabel} slot`,
                    price: fmtR(Math.round(topCityCost)),
                    reach: fmtFull(topCityReach),
                    screens: topCityVenues.reduce((s, v) => s + v.screens, 0),
                    tag: "ENTRY",
                    tagColor: "#6EE7B7",
                  },
                  {
                    name: "Provincial Blitz",
                    desc: `${topProvince?.province ?? "Top Province"} · ${weeks} weeks · ${slotLabel} slot`,
                    price: fmtR(Math.round(topProvinceCost)),
                    reach: fmtFull(topProvinceReach),
                    screens: topProvinceVenues.reduce((s, v) => s + v.screens, 0),
                    tag: "POPULAR",
                    tagColor: "#D4FF4F",
                  },
                  {
                    name: "National Launch",
                    desc: `All ${venueData.length} venues · ${weeks} weeks · ${slotLabel} slot`,
                    price: fmtR(Math.round(nationalCost)),
                    reach: fmtFull(nationalReach),
                    screens: quoteTotals.screens,
                    tag: "MAXIMUM",
                    tagColor: "#C084FC",
                  },
                ].map((pkg) => (
                  <div key={pkg.name} style={{
                    flex: 1,
                    background: pkg.tag === "POPULAR" ? "#0a0a0a" : "#FFFFFF",
                    borderRadius: 16,
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    border: pkg.tag === "POPULAR" ? "2px solid #D4FF4F" : "1.5px solid #E5E7EB",
                    boxShadow: pkg.tag === "POPULAR" ? "0 4px 24px rgba(212,255,79,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {/* Tag badge */}
                    <div style={{
                      position: "absolute", top: 16, right: 16,
                      fontSize: 10, fontWeight: 800, color: pkg.tag === "POPULAR" ? "#0a0a0a" : pkg.tagColor,
                      background: pkg.tag === "POPULAR" ? "#D4FF4F" : `${pkg.tagColor}22`,
                      border: pkg.tag === "POPULAR" ? "none" : `1px solid ${pkg.tagColor}55`,
                      borderRadius: 20, padding: "3px 10px", letterSpacing: "0.1em",
                    }}>{pkg.tag}</div>

                    <div style={{ fontSize: 18, fontWeight: 800, color: pkg.tag === "POPULAR" ? "#ffffff" : "#0a0a0a", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.01em", paddingRight: 60 }}>{pkg.name}</div>
                    <div style={{ fontSize: 12, color: pkg.tag === "POPULAR" ? "#999" : "#888" }}>{pkg.desc}</div>
                    <div style={{ height: 1, background: pkg.tag === "POPULAR" ? "rgba(255,255,255,0.08)" : "#F0F0F0" }} />
                    <div style={{ fontSize: 38, fontWeight: 900, color: pkg.tag === "POPULAR" ? "#D4FF4F" : "#0a0a0a", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>{pkg.price}</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                      {[
                        { label: "Est. Reach", value: pkg.reach },
                        { label: "Screens", value: pkg.screens.toString() },
                        { label: "Duration", value: `${weeks} weeks` },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${pkg.tag === "POPULAR" ? "rgba(255,255,255,0.06)" : "#F5F5F5"}`, fontSize: 12 }}>
                          <span style={{ color: pkg.tag === "POPULAR" ? "#666" : "#999" }}>{label}</span>
                          <span style={{ color: pkg.tag === "POPULAR" ? "#ffffff" : "#0a0a0a", fontWeight: 600 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "0 32px 20px", fontSize: 11, color: "#999" }}>
                * Packages calculated at {fmtR(effectiveCpm)} CPM · {weeks}-week flight · Subject to availability · Min. spend R{(pricingTiers[0]?.min_spend ?? 2500).toLocaleString("en-ZA")}
              </div>
            </div>
          );
        })()}

        {/* ═══ PAGES 4–N — PER-VENUE PROPERTY CARDS (grouped by province) ═══ */}
        {provinces.map((province, pIdx) => {
          const pvenues = venuesByProvince[province];
          const provScreens = pvenues.reduce((s, v) => s + v.screens, 0);
          const provMembers = pvenues.reduce((s, v) => s + v.activeMembers, 0);
          return (
            <React.Fragment key={province}>
              {/* Province divider page */}
              <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE, background: "#0a0a0a", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(212,255,79,0.16) 1.2px, transparent 1.2px)", backgroundSize: "28px 28px", pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#D4FF4F" }}>Province</div>
                  <div style={{ fontSize: 72, fontWeight: 900, color: "#ffffff", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>{province}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    {[
                      `${pvenues.length} Venue${pvenues.length !== 1 ? "s" : ""}`,
                      `${provScreens} Screen${provScreens !== 1 ? "s" : ""}`,
                      `${fmtFull(provMembers)} Active Members`,
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

              {/* Venue property cards or city summary cards for this province */}
              {groupByCity ? (
                // City summary cards mode
                citiesInProvince(pvenues).map(({ city, venues: cityVenues }, cIdx) => {
                  const isLastCard = pIdx === provinces.length - 1 && cIdx === citiesInProvince(pvenues).length - 1;
                  const cityScreens = cityVenues.reduce((s, v) => s + v.screens, 0);
                  const cityMembers = cityVenues.reduce((s, v) => s + v.activeMembers, 0);
                  const cityOts = cityVenues.reduce((s, v) => s + v.ots, 0);
                  const cityPlays = cityVenues.reduce((s, v) => s + v.screens * PLAYS_PER_SCREEN_PER_WEEK * 4, 0);
                  const cityFreq = cityMembers > 0 ? Math.round((cityOts / cityMembers) * 10) / 10 : 0;
                  const city7sSlots = cityVenues.reduce((s, v) => {
                    const active = Array.isArray(v.screens) ? (v.screens as { is_active: boolean | null; slots_7sec: number | null }[]).filter(sc => sc.is_active) : [];
                    return s + active.reduce((ss, sc) => ss + (sc.slots_7sec ?? 8), 0);
                  }, 0);
                  const city15sSlots = cityVenues.reduce((s, v) => {
                    const active = Array.isArray(v.screens) ? (v.screens as { is_active: boolean | null; slots_15sec: number | null }[]).filter(sc => sc.is_active) : [];
                    return s + active.reduce((ss, sc) => ss + (sc.slots_15sec ?? 4), 0);
                  }, 0);
                  const cityCost = cityVenues.reduce((s, v) => s + v.cost, 0);
                  return (
                    <div
                      key={city}
                      className={isLastCard && pricingTiers.length === 0 ? undefined : "page-break"}
                      data-print-page="true"
                      style={{ ...PAGE_STYLE, background: "#ffffff" }}
                    >
                      <PageHeader rightContent={<span>{city}<span style={{ color: "#999", fontWeight: 400 }}> · {province}</span></span>} />

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{ display: "flex", height: 350, flexShrink: 0, overflow: "hidden" }}>
                          {/* LEFT: venue list */}
                          <div style={{ width: "55%", background: "#fff", flexShrink: 0, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" as const }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#888", marginBottom: 8 }}>Venues in {city}</div>
                            {cityVenues.map((cv) => (
                              <div key={cv.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                                {cv.cover_image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={optimizeImageUrl(cv.cover_image_url, 80, 70)} alt={cv.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: 40, height: 40, borderRadius: 6, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: "#D4FF4F" }}>{cv.name.charAt(0)}</span>
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0a", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{cv.name}</div>
                                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{cv.screens} screen{cv.screens !== 1 ? "s" : ""} · {fmtFull(cv.activeMembers)} members</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* RIGHT: city aggregate stats */}
                          <div style={{ flex: 1, background: "#111111", display: "flex", flexDirection: "column", justifyContent: "center", gap: 0, padding: "28px 32px" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#D4FF4F", marginBottom: 16 }}>City Totals</div>
                            {[
                              { label: "Total Screens", value: cityScreens.toString(), accent: "#D4FF4F", large: true },
                              { label: "Active Members", value: fmtFull(cityMembers), accent: "#fff", large: false },
                              { label: "Total OTS", value: fmtFull(cityOts), accent: "#A1A1AA", large: false },
                              { label: "Monthly Impressions", value: fmtFull(cityPlays), accent: "#fff", large: false },
                              { label: "Avg Frequency", value: fmtFreq(cityFreq), accent: "#FF6B35", large: false },
                              { label: "7s Slots", value: city7sSlots.toString(), accent: "#6EE7B7", large: false },
                              { label: "15s Slots", value: city15sSlots.toString(), accent: "#C084FC", large: false },
                            ].map(({ label, value, accent, large }, idx) => (
                              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: large ? "0 0 12px" : "5px 0", borderBottom: idx === 0 ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.04)", marginBottom: idx === 0 ? 12 : 0 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "#555" }}>{label}</span>
                                <span style={{ fontSize: large ? 28 : 13, fontWeight: large ? 800 : 600, color: accent, fontFamily: "Inter Tight, sans-serif" }}>{value}</span>
                              </div>
                            ))}
                            <div style={{ marginTop: 12, fontSize: 11, color: "#555", fontStyle: "italic" as const }}>
                              {cityVenues.length} venue{cityVenues.length !== 1 ? "s" : ""} across {city}, {province} — combined audience of {fmtFull(cityMembers)} active members
                            </div>
                          </div>
                        </div>

                        {/* Narrative */}
                        <div style={{ padding: "14px 32px 0", fontSize: 13, color: "#555" }}>
                          <strong style={{ color: "#0a0a0a" }}>{cityVenues.length} venue{cityVenues.length !== 1 ? "s" : ""}</strong> across <strong style={{ color: "#0a0a0a" }}>{city}</strong>, {province} — combined audience of <strong style={{ color: "#0a0a0a" }}>{fmtFull(cityMembers)}</strong> active members · {fmtR(Math.round(cityCost))} total investment
                        </div>

                        {/* Data strip */}
                        {(() => {
                          const avgDailyHours = cityVenues.reduce((sum, cv) => sum + calcAvgDailyHours(cv.operating_hours as Record<string, { open: string; close: string; closed: boolean }> | null), 0) / cityVenues.length;
                          const loopsPerDay = Math.round(3600 * avgDailyHours / 251);
                          const loopsPerMonth = Math.round(loopsPerDay * 7 * 4.3);
                          return (
                            <div style={{ borderTop: "1px solid #E5E7EB", padding: "10px 32px", background: "#F3F4F6", marginTop: "auto" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: 32, fontSize: 11, color: "#555" }}>
                                <span><strong style={{ color: "#0a0a0a" }}>Loop:</strong> ~4 min · 16 plays per loop</span>
                                <span>·</span>
                                <span><strong style={{ color: "#0a0a0a" }}>Per day:</strong> {(loopsPerDay * 16).toLocaleString("en-ZA")} plays</span>
                                <span>·</span>
                                <span><strong style={{ color: "#0a0a0a" }}>Per week:</strong> {(loopsPerDay * 7 * 16).toLocaleString("en-ZA")} plays</span>
                                <span>·</span>
                                <span><strong style={{ color: "#0a0a0a" }}>Per month:</strong> {(loopsPerMonth * 16).toLocaleString("en-ZA")} plays</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Default: per-venue cards
                pvenues.map((v, vIdx) => {
                  const isLastVenue = pIdx === provinces.length - 1 && vIdx === pvenues.length - 1;
                  const activeScreens = Array.isArray(v.screens) ? v.screens.filter(s => s.is_active) : [];
                  return (
                    <div
                      key={v.id}
                      className={isLastVenue && pricingTiers.length === 0 ? undefined : "page-break"}
                      data-print-page="true"
                      style={{ ...PAGE_STYLE, background: "#ffffff" }}
                    >
                      <PageHeader rightContent={<span>{v.name}{v.city ? <span style={{ color: "#999", fontWeight: 400 }}> · {v.city}</span> : null}</span>} />

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        {/* Main content: photo + location */}
                        <div style={{ display: "flex", height: 350, flexShrink: 0, overflow: "hidden" }}>
                          {/* LEFT: venue photo */}
                          <div style={{ width: "55%", position: "relative", background: "#111", flexShrink: 0 }}>
                            {v.cover_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={optimizeImageUrl(v.cover_image_url, 800, 75)}
                                alt={v.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
                                <span style={{ fontSize: 22, fontWeight: 800, color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif", textAlign: "center", padding: "0 24px" }}>{v.name}</span>
                              </div>
                            )}
                          </div>
                          {/* RIGHT: location info panel */}
                          <div style={{ flex: 1, background: "#111111", display: "flex", flexDirection: "column", justifyContent: "center", gap: 0, padding: "28px 32px" }}>
                            <div style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", marginBottom: 4 }}>{v.city ?? "—"}</div>
                            <div style={{ fontSize: 13, color: "#D4FF4F", fontWeight: 600, marginBottom: 20 }}>{v.province ?? "—"}</div>
                            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 20 }} />
                            {[
                              { label: "Placement", value: activeScreens.length > 0 && activeScreens[0].location_in_venue ? activeScreens[0].location_in_venue.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "In-Venue" },
                              { label: "Avg Session", value: "55 min" },
                              { label: "Audience", value: "LSM 7–10" },
                            ].map(({ label, value }) => (
                              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <span style={{ fontSize: 11, color: "#666", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{label}</span>
                                <span style={{ fontSize: 12, color: "#ccc", fontWeight: 500 }}>{value}</span>
                              </div>
                            ))}
                            <div style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: 11, color: "#666", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>Operating Hours</div>
                              <div style={{ fontSize: 12, color: "#ccc", fontWeight: 500 }}>{fmtOperatingHours(v.operating_hours as Record<string, { open: string; close: string; closed: boolean }> | null)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Narrative line */}
                        <div style={{ padding: "14px 32px 0", fontSize: 13, color: "#555" }}>
                          This gym is located in <strong style={{ color: "#0a0a0a" }}>{v.city ?? "—"}</strong>, {v.province ?? "—"}, serving <strong style={{ color: "#0a0a0a" }}>{fmtFull(v.activeMembers)}</strong> active members with an avg. session length of <strong style={{ color: "#0a0a0a" }}>55 minutes</strong>.
                        </div>

                        {/* Data grid */}
                        {(() => {
                          return (
                            <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, margin: "0 0 0 0", padding: "16px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                              {[
                                { label: `Rate PM (${slotLabel})`, value: fmtR(Math.round(v.cost)) },
                                { label: "City", value: v.city ?? "—" },
                                { label: "Screens", value: v.screens.toString() },
                                { label: "Province", value: v.province ?? "—" },
                                { label: "Monthly Impressions", value: fmtFull(v.screens * PLAYS_PER_SCREEN_PER_WEEK * 4) },
                                { label: "OTS", value: fmtFull(v.ots) },
                                { label: "Active Members", value: fmtFull(v.activeMembers) },
                                { label: "Avg Frequency", value: fmtFreq(v.frequency) },
                              ].map(({ label, value }) => (
                                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #E5E7EB" }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666" }}>{label}</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", fontFamily: "Inter Tight, sans-serif" }}>{value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Proximity info — white space between data grid and spec strip */}
                        {v.latitude != null && v.longitude != null && clientLocations.length > 0 ? (() => {
                          const near = nearestLocation(v.latitude, v.longitude, clientLocations);
                          return near ? (
                            <div style={{ padding: "7px 32px", borderTop: "1px solid #E5E7EB" }}>
                              <span style={{ fontSize: 11, color: "#999" }}>📍 Nearest client location: <strong style={{ color: "#777", fontWeight: 600 }}>{near.address}</strong> — {near.distanceKm.toFixed(1)} km</span>
                            </div>
                          ) : null;
                        })() : null}

                        {/* Spec strip */}
                        {(() => {
                          const avgDailyHours = calcAvgDailyHours(v.operating_hours as Record<string, { open: string; close: string; closed: boolean }> | null);
                          const loopsPerDay = Math.round(3600 * avgDailyHours / 251);
                          const loopsPerMonth = Math.round(loopsPerDay * 7 * 4.3);
                          return (
                            <div style={{ borderTop: "1px solid #E5E7EB", padding: "10px 32px", background: "#F3F4F6", marginTop: "auto" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: 32, fontSize: 11, color: "#555" }}>
                                <span><strong style={{ color: "#0a0a0a" }}>Loop:</strong> ~4 min · 16 plays per loop</span>
                                <span>·</span>
                                <span><strong style={{ color: "#0a0a0a" }}>Per day:</strong> {(loopsPerDay * 16).toLocaleString("en-ZA")} plays</span>
                                <span>·</span>
                                <span><strong style={{ color: "#0a0a0a" }}>Per week:</strong> {(loopsPerDay * 7 * 16).toLocaleString("en-ZA")} plays</span>
                                <span>·</span>
                                <span><strong style={{ color: "#0a0a0a" }}>Per month:</strong> {(loopsPerMonth * 16).toLocaleString("en-ZA")} plays</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })
              )}
            </React.Fragment>
          );
        })}

        {/* ═══ LAST PAGE — PRICING TIERS + FOOTER ═══ */}
        <div data-print-page="true" style={{ ...PAGE_STYLE, background: "#ffffff" }}>
          <PageHeader rightContent={clientName ? `Investment Summary — ${clientName}` : "Investment Summary"} />

          <div style={{ padding: "24px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* TOP ROW: investment hero + flight details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Investment hero tile */}
              <div style={{ background: "#0a0a0a", borderRadius: 16, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 8, border: "1px solid rgba(212,255,79,0.2)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#D4FF4F" }}>Total Investment</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>{fmtR(Math.round(quoteTotals.cost))}</div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{tierLabel} · {slotLabel} slot · R{effectiveCpm} CPM</div>
              </div>

              {/* Flight details tile */}
              <div style={{ background: "#F9FAFB", borderRadius: 16, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 14, border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#888" }}>Flight Details</div>
                {[
                  { label: "Duration", value: `${weeks} weeks` },
                  { label: "Venues", value: venueData.length.toString() },
                  { label: "Total Screens", value: quoteTotals.screens.toString() },
                  { label: "Total Reach", value: fmtFull(quoteTotals.reach) },
                  { label: "Cost Per Unique", value: `R${quoteTotals.costPerUnique.toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderBottom: "1px solid #F0F0F0", paddingBottom: 6 }}>
                    <span style={{ color: "#888" }}>{label}</span>
                    <span style={{ color: "#0a0a0a", fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM ROW: pricing tiers table + terms */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, flex: 1 }}>

              {/* Pricing tiers */}
              {pricingTiers.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#888", marginBottom: 10 }}>Pricing Tiers</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        {["Tier", "Slot", "CPM", "Min Spend"].map((h) => (
                          <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: "2px solid #E5E7EB" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pricingTiers.map((tier) => {
                        const isSelected = tier.cpm_zar === effectiveCpm;
                        return (
                          <tr key={tier.id} style={{ borderBottom: "1px solid #F3F4F6", background: isSelected ? "rgba(212,255,79,0.06)" : "transparent", borderLeft: isSelected ? "3px solid #D4FF4F" : "3px solid transparent" }}>
                            <td style={{ padding: "8px 12px", fontWeight: isSelected ? 700 : 500, color: "#111", fontSize: 12 }}>{tier.label}{isSelected ? " ✓" : ""}</td>
                            <td style={{ padding: "8px 12px", color: "#555", fontSize: 12 }}>{tier.duration_sec}s</td>
                            <td style={{ padding: "8px 12px", fontWeight: isSelected ? 700 : 500, color: isSelected ? "#0a0a0a" : "#555", fontSize: 12 }}>R{tier.cpm_zar}</td>
                            <td style={{ padding: "8px 12px", color: "#555", fontSize: 12 }}>R{tier.min_spend.toLocaleString("en-ZA")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Terms */}
              <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "20px 24px", border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#888", marginBottom: 12 }}>Terms &amp; Contact</div>
                {[
                  { label: "Minimum Spend", value: `R${pricingTiers[0]?.min_spend?.toLocaleString("en-ZA") ?? "2,500"}` },
                  { label: "Contact", value: "hello@gymgaze.co.za" },
                  { label: "Quote Validity", value: "30 days from issue" },
                  { label: "Booking", value: "Subject to availability" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #EEEEEE", fontSize: 12 }}>
                    <span style={{ color: "#888", fontWeight: 500 }}>{label}</span>
                    <span style={{ color: "#0a0a0a", fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer bar */}
          <div style={{ background: "#0a0a0a", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
            <LogoLockup />
            <span style={{ fontSize: 11, color: "#666" }}>gymgaze.vercel.app · Generated {today}</span>
          </div>
        </div>

        {/* Print button at bottom — hidden when printing */}
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
