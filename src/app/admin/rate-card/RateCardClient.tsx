"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  TrendingUp,
  MapPin,
  Building2,
  Globe,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Users,
  Repeat2,
  Zap,
  FileText,
  Printer,
  X,
} from "lucide-react";

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
}

// ─── Media constants ──────────────────────────────────────────────────────────
// Loop = 251s (16 slots: 8×7s + 8×15s + widget block) → 1,487 plays/slot/screen/week (based on Edge Fitness operating hours 05:00–22:00)
const PLAYS_PER_SCREEN_PER_WEEK = 1487;

// Attention factors by screen placement
const ATTENTION = {
  reception:   0.85,
  gym_floor:   0.60,
  changerooms: 0.75,
  default:     0.65,
};

// Members visit avg 3.5× per week → repeat exposure builds frequency
const AVG_VISITS_PER_MEMBER_PER_WEEK = 3.5;

// Active member rate — 65% of registered members actually visit each month
const ACTIVE_RATE = 0.65;

const DWELL_BENCHMARK = {
  gym_minutes: 55,        // avg gym session length
  roadside_seconds: 5,    // avg billboard glance
};

// Attention Quality Score — calibrated against typical OOH formats
// Composite of: dwell time, captive audience, audience quality, novelty
const ATTENTION_QUALITY_SCORE = 8.5; // out of 10
const AUDIENCE_QUALITY_SCORE = 8.5;  // gym demographic = LSM 7-10

const FORMAT_BENCHMARKS = [
  { name: "GymGaze DOOH",    cpm: 85,  attention: 0.65, color: "#D4FF4F" }, // dynamic — replaced with effectiveCpm at render
  { name: "Roadside OOH",   cpm: 45,  attention: 0.05, color: "#A1A1AA" },
  { name: "Radio",          cpm: 120, attention: 0.40, color: "#FF6B35" },
  { name: "Digital Display",cpm: 15,  attention: 0.02, color: "#6EE7B7" },
  { name: "TV (Prime)",     cpm: 280, attention: 0.40, color: "#C084FC" },
];

// ─── Impact model ─────────────────────────────────────────────────────────────
// OTS        = monthly_entries × (weeks / 4.3)           — foot traffic during flight
// activeThisMonth = active_members × ACTIVE_RATE          — members who actually visit
// Reach      = activeThisMonth × min(weeks/4.3, 1.5)     — unique individuals, flight-scaled
// Freq       = OTS / Reach                               — avg exposures per person
// Impact     = Reach × attention_factor                  — quality-weighted reach

function calcMetrics(v: VenueRow, weeks: number) {
  const screens = Array.isArray(v.screens) ? v.screens.filter((s) => s.is_active).length : 0;
  const activeMembers = v.active_members ?? 0;
  const monthlyEntries = v.monthly_entries ?? 0;

  // Active member rate — 65% of registered members actually visit each month
  const activeThisMonth = Math.round(activeMembers * ACTIVE_RATE);

  // OTS: foot traffic during the flight
  const ots = Math.round(monthlyEntries * (weeks / 4.3));

  // Reach: actual unique members who visit this month, scaled to flight
  // For multi-month flights, reach grows but caps at total active members
  const reachUncapped = Math.round(activeThisMonth * Math.min(weeks / 4.3, 1.5));
  const reach = Math.min(reachUncapped, activeMembers);

  // Frequency = OTS / Reach (real avg exposures per person)
  const frequency = reach > 0 ? Math.round((ots / reach) * 10) / 10 : 0;

  // Impact = reach × attention factor
  const attentionFactor = ATTENTION.default;
  const impact = Math.round(reach * attentionFactor);

  // Plays-based OTS for CPM billing
  const playsOts = screens * PLAYS_PER_SCREEN_PER_WEEK * weeks;

  return { screens, ots, reach, frequency, impact, playsOts, activeMembers, activeThisMonth };
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

// Full number formatter for print — no abbreviation
function fmtFull(n: number) {
  return n.toLocaleString("en-ZA");
}

// ─── Operating hours helpers ─────────────────────────────────────────────────

// Calculate average daily operating hours from venue operating_hours JSONB
function calcAvgDailyHours(oh: Record<string, { open: string; close: string; closed: boolean }> | null | undefined): number {
  if (!oh) return 17; // fallback
  const days = Object.values(oh);
  const openDays = days.filter(d => !d.closed);
  if (openDays.length === 0) return 17;
  const totalHours = openDays.reduce((sum, d) => {
    const [oh2, om] = d.open.split(":").map(Number);
    const [ch, cm] = d.close.split(":").map(Number);
    return sum + ((ch + cm / 60) - (oh2 + om / 60));
  }, 0);
  return totalHours / 7; // avg over 7 days (including closed days — they contribute 0)
}

// Format operating hours for display — show weekday range + weekend
function fmtOperatingHours(oh: Record<string, { open: string; close: string; closed: boolean }> | null | undefined): string {
  if (!oh) return "05:00 – 22:00";
  const weekdays = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const wdOpen = weekdays.map(d => oh[d]).filter(Boolean).filter(d => !d.closed);
  if (wdOpen.length === 0) return "05:00 – 22:00";
  // Use Monday as representative weekday
  const mon = oh["Monday"];
  const sat = oh["Saturday"];
  const sun = oh["Sunday"];
  let result = mon && !mon.closed ? `Mon–Fri ${mon.open}–${mon.close}` : "";
  if (sat && !sat.closed) result += ` · Sat ${sat.open}–${sat.close}`;
  if (sun && !sun.closed) result += ` · Sun ${sun.open}–${sun.close}`;
  return result || "05:00 – 22:00";
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  tooltip,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  tooltip?: string;
}) {
  return (
    <div
      className="glass-card rounded-2xl p-4 md:p-5 flex flex-col gap-2"
      style={{ borderRadius: 16 }}
      title={tooltip}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} color={accent ?? "#888"} strokeWidth={2} />
        <p className="text-xs uppercase tracking-wider" style={{ color: "#888", fontWeight: 600 }}>{label}</p>
      </div>
      <p
        className="text-2xl md:text-3xl font-bold tabular-nums"
        style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: accent ?? "#fff" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "#8A8A8A" }}>{sub}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RateCardClient({ venues, pricingTiers }: Props) {
  const defaultCpm = pricingTiers.find((t) => t.tier_key === "premium")?.cpm_zar
    ?? pricingTiers[0]?.cpm_zar
    ?? 85;

  const [cpm, setCpm] = useState(defaultCpm);
  const [customCpm, setCustomCpm] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [flightStart, setFlightStart] = useState("");
  const [flightEnd, setFlightEnd] = useState("");
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [showRateCard, setShowRateCard] = useState(false);
  const [pdfStatus, setPdfStatus] = useState("");
  const [expandedSection, setExpandedSection] = useState<"gym" | "city" | "province" | "national" | null>("gym");
  const [groupByCity, setGroupByCity] = useState(false);

  const effectiveCpm = customCpm ? parseFloat(customCpm) || 0 : cpm;
  const months = Math.round((weeks / 4) * 10) / 10;

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
      map.set(key, {
        ots: e.ots + v.ots,
        reach: e.reach + v.reach,
        impact: e.impact + v.impact,
        screens: e.screens + v.screens,
        venues: e.venues + 1,
        cost: e.cost + v.cost,
      });
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
      map.set(key, {
        ots: e.ots + v.ots,
        reach: e.reach + v.reach,
        impact: e.impact + v.impact,
        screens: e.screens + v.screens,
        venues: e.venues + 1,
        cost: e.cost + v.cost,
      });
    });
    return Array.from(map.entries())
      .map(([province, d]) => ({ province, ...d, frequency: d.reach > 0 ? Math.round((d.ots / d.reach) * 10) / 10 : 0 }))
      .sort((a, b) => b.reach - a.reach);
  }, [venueData]);

  // ── National ───────────────────────────────────────────────────────────────
  const national = useMemo(() => {
    const ots    = venueData.reduce((s, v) => s + v.ots, 0);
    const reach  = venueData.reduce((s, v) => s + v.reach, 0);
    const impact = venueData.reduce((s, v) => s + v.impact, 0);
    const screens = venueData.reduce((s, v) => s + v.screens, 0);
    const cost   = venueData.reduce((s, v) => s + v.cost, 0);
    const freq   = reach > 0 ? Math.round((ots / reach) * 10) / 10 : 0;
    const costPerUnique = reach > 0 ? cost / reach : 0;
    return { ots, reach, impact, screens, cost, freq, costPerUnique, venues: venues.length };
  }, [venueData, venues.length]);

  // ── Quote selection ────────────────────────────────────────────────────────
  const quoteVenues = selectedVenues.length > 0
    ? venueData.filter((v) => selectedVenues.includes(v.id))
    : venueData;

  const quoteTotals = useMemo(() => {
    const ots    = quoteVenues.reduce((s, v) => s + v.ots, 0);
    const reach  = quoteVenues.reduce((s, v) => s + v.reach, 0);
    const impact = quoteVenues.reduce((s, v) => s + v.impact, 0);
    const screens = quoteVenues.reduce((s, v) => s + v.screens, 0);
    const cost   = quoteVenues.reduce((s, v) => s + v.cost, 0);
    const freq   = reach > 0 ? Math.round((ots / reach) * 10) / 10 : 0;
    const costPerUnique = reach > 0 ? cost / reach : 0;
    return { ots, reach, impact, screens, cost, freq, costPerUnique };
  }, [quoteVenues]);

  function toggleVenue(id: string) {
    setSelectedVenues((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function openPrintPage() {
    const printUrl = `/rate-card-print?` + new URLSearchParams({
      venues: selectedVenues.join(","),
      cpm: effectiveCpm.toString(),
      weeks: weeks.toString(),
      client: clientName,
      start: flightStart,
      end: flightEnd,
      groupByCity: groupByCity.toString(),
    }).toString();
    window.open(printUrl, "_blank");
  }

  // Client-side PDF generation via html2canvas + jsPDF. Always landscape, no dialog.
  async function downloadPdf() {
    setPdfStatus("Loading rate card…");
    try {
      const { generateRateCardPdf } = await import("@/lib/generateRateCardPdf");
      await generateRateCardPdf({
        venues: selectedVenues,
        cpm: effectiveCpm,
        weeks,
        clientName,
        flightStart,
        flightEnd,
        groupByCity,
        onProgress: (cur, total, label) => {
          if (total > 1) setPdfStatus(`${label} (${cur}/${total})`);
          else setPdfStatus(label);
        },
      });
      setPdfStatus("");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setPdfStatus("");
      alert(`PDF generation failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  function copyQuote() {
    const venueList = quoteVenues
      .map((v) => `  • ${v.name} (${v.city ?? "—"}) — ${v.screens} screens | Members ${fmtNum(v.activeMembers)} active | OTS ${fmtNum(v.ots)} | Reach ${fmtNum(v.reach)} | Freq ${fmtFreq(v.frequency)} | Impact ${fmtNum(v.impact)}`)
      .join("\n");

    const selectedTier = pricingTiers.find((t) => t.cpm_zar === effectiveCpm);
    const gymgazeEcpm = Math.round(effectiveCpm / ATTENTION.default);
    const roadsideEcpm = Math.round(45 / 0.05);
    const tvEcpm = Math.round(280 / 0.40);
    const totalActiveMembers = quoteVenues.reduce((s, v) => s + (v.activeMembers ?? 0), 0);

    const text = [
      `GymGaze DOOH Media Proposal`,
      `═══════════════════════════`,
      clientName ? `Client:    ${clientName}` : null,
      flightStart && flightEnd ? `Flight:    ${flightStart} → ${flightEnd}` : null,
      `Duration:  ${weeks} weeks`,
      `Tier:      ${selectedTier?.label ?? "Custom"} @ R${effectiveCpm} CPM`,
      ``,
      `MEDIA METRICS`,
      `─────────────`,
      `OTS (Opportunities To See): ${fmtNum(quoteTotals.ots)}`,
      `Reach (Unique Individuals): ${fmtNum(quoteTotals.reach)}`,
      `Average Frequency:          ${fmtFreq(quoteTotals.freq)}`,
      `Impact Score:               ${fmtNum(quoteTotals.impact)}`,
      `Cost Per Unique:            R${quoteTotals.costPerUnique.toFixed(2)}`,
      `Active Members (total):     ${fmtNum(totalActiveMembers)}`,
      `Attention Quality Score:    ${ATTENTION_QUALITY_SCORE}/10 (captive audience, 55min avg session)`,
      ``,
      `MEDIA VALUE BENCHMARK`,
      `─────────────────────`,
      `GymGaze eCPM:   R${gymgazeEcpm}  ← effective cost per attended impression`,
      `Roadside OOH:   R${roadsideEcpm} eCPM`,
      `TV (Prime):     R${tvEcpm} eCPM`,
      ``,
      `VENUES (${quoteVenues.length})`,
      `─────────────`,
      venueList,
      ``,
      `INVESTMENT`,
      `─────────────`,
      `Total Screens:  ${quoteTotals.screens}`,
      `Total Cost:     ${fmtR(Math.round(quoteTotals.cost))}`,
      ``,
      `Min. spend R${pricingTiers[0]?.min_spend?.toLocaleString("en-ZA") ?? "2,500"}. Subject to availability.`,
      `Generated by GymGaze · gymgaze.vercel.app`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2500);
    });
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  const LABEL: React.CSSProperties = {
    fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.08em", color: "#D4FF4F", marginBottom: "12px",
  };

  const TH: React.CSSProperties = {
    fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.06em", color: "#555", padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  const TD: React.CSSProperties = {
    padding: "11px 14px", fontSize: "13px", color: "#C0C0C0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  };

  function SectionToggle({ id, label, icon: Icon }: { id: typeof expandedSection; label: string; icon: React.ElementType }) {
    const isOpen = expandedSection === id;
    return (
      <button
        onClick={() => setExpandedSection(isOpen ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
        style={{
          background: isOpen ? "rgba(212,255,79,0.06)" : "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          color: isOpen ? "#D4FF4F" : "#888",
        }}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon size={15} strokeWidth={2} />
          {label}
        </span>
        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8" style={{ maxWidth: 1100 }}>

      {/* Header */}
      <div className="glass-panel relative overflow-hidden rounded-2xl mb-6" style={{ borderRadius: 16 }}>
        <div className="relative z-10 p-5 md:p-8">
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,5vw,2.5rem)", color: "#fff", letterSpacing: "-0.02em" }}>
            Rate Card
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            CPM calculator · OTS · Reach · Frequency · Impact · Quote builder
          </p>
        </div>
      </div>

      {/* ── 1: CPM Calculator ─────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderRadius: 16 }}>
        <p style={LABEL}>CPM Calculator</p>

        {/* Tier pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {pricingTiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => { setCpm(tier.cpm_zar); setCustomCpm(""); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: cpm === tier.cpm_zar && !customCpm ? tier.bg : "rgba(255,255,255,0.04)",
                color: cpm === tier.cpm_zar && !customCpm ? tier.color : "#666",
                border: `1px solid ${cpm === tier.cpm_zar && !customCpm ? tier.color + "44" : "rgba(255,255,255,0.08)"}`,
              }}
              title={tier.description ?? ""}
            >
              {tier.label} — R{tier.cpm_zar}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Custom CPM (R)</label>
            <input
              type="number"
              placeholder={`${effectiveCpm}`}
              value={customCpm}
              onChange={(e) => setCustomCpm(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Flight Duration (weeks)</label>
            <input
              type="number"
              min={1}
              value={weeks}
              onChange={(e) => setWeeks(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div className="flex items-end">
            <div className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(212,255,79,0.06)", border: "1px solid rgba(212,255,79,0.15)" }}>
              <p className="text-xs mb-1" style={{ color: "#D4FF4F", fontWeight: 600 }}>≈ {months} month{months !== 1 ? "s" : ""}</p>
              <p className="text-xs" style={{ color: "#666" }}>Active CPM: <span style={{ color: "#fff", fontWeight: 600 }}>R{effectiveCpm}</span></p>
            </div>
          </div>
        </div>

        {/* National impact summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard
            icon={Eye}
            label="OTS"
            value={fmtNum(national.ots)}
            sub="Opportunities to see"
            accent="#A1A1AA"
            tooltip="Total times the ad could be seen — foot traffic during the flight period"
          />
          <MetricCard
            icon={Users}
            label="Reach"
            value={fmtNum(national.reach)}
            sub="Unique individuals"
            accent="#D4FF4F"
            tooltip="Estimated unique people reached — based on active members (65% of registered) scaled to flight duration"
          />
          <MetricCard
            icon={Repeat2}
            label="Frequency"
            value={fmtFreq(national.freq)}
            sub="Avg exposures per person"
            accent="#FF6B35"
            tooltip="How many times the average person sees the ad — gym members visit 3–4× per week"
          />
          <MetricCard
            icon={Zap}
            label="Impact"
            value={fmtNum(national.impact)}
            sub={`R${national.costPerUnique.toFixed(2)} per unique`}
            accent="#C084FC"
            tooltip="Quality-weighted reach — accounts for attention level at each screen placement"
          />
          <MetricCard
            icon={TrendingUp}
            label="Quality Index"
            value={`${ATTENTION_QUALITY_SCORE}/10`}
            sub={`Audience LSM 7–10`}
            accent="#D4FF4F"
            tooltip={`Composite of dwell time (${DWELL_BENCHMARK.gym_minutes}min vs ${DWELL_BENCHMARK.roadside_seconds}s billboard), captive audience, demographic (LSM 7-10), and novelty.`}
          />
        </div>

        {/* Cost summary strip */}
        <div
          className="mt-4 rounded-xl px-5 py-4 flex flex-wrap gap-6 items-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <p className="text-xs mb-0.5" style={{ color: "#555" }}>Total Investment</p>
            <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#fff" }}>{fmtR(Math.round(national.cost))}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "#555" }}>Per Week</p>
            <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#fff" }}>{fmtR(Math.round(national.cost / weeks))}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "#555" }}>Cost Per Unique</p>
            <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#C084FC" }}>R{national.costPerUnique < 1 ? national.costPerUnique.toFixed(2) : national.costPerUnique.toFixed(2)}</p>
          </div>
          <div title="Effective CPM after attention quality adjustment">
            <p className="text-xs mb-0.5" style={{ color: "#555" }}>eCPM</p>
            <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#D4FF4F" }}>R{(effectiveCpm / ATTENTION.default).toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "#555" }}>Screens</p>
            <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#fff" }}>{national.screens}</p>
          </div>
          <div className="ml-auto">
            <TrendingUp size={20} color="#D4FF4F" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* ── Format Benchmark ──────────────────────────────────────── */}
      {(() => {
        const gymgazeEcpm = effectiveCpm / ATTENTION.default;
        const benchmarks = FORMAT_BENCHMARKS.map((b) => ({
          ...b,
          cpm: b.name === "GymGaze DOOH" ? effectiveCpm : b.cpm,
          ecpm: b.name === "GymGaze DOOH" ? gymgazeEcpm : b.cpm / b.attention,
        })).sort((a, b) => a.ecpm - b.ecpm);
        const maxEcpm = Math.max(...benchmarks.map((b) => b.ecpm));
        return (
          <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderRadius: 16 }}>
            <p style={LABEL}>Format Benchmark — eCPM (cost per attended impression)</p>
            <div className="flex flex-col gap-3">
              {benchmarks.map((b) => {
                const isGymgaze = b.name === "GymGaze DOOH";
                const barWidth = Math.round((b.ecpm / maxEcpm) * 100);
                return (
                  <div
                    key={b.name}
                    className="flex items-center gap-3"
                    style={isGymgaze ? { padding: "6px 8px", borderRadius: 10, border: `1px solid ${b.color}44`, boxShadow: `0 0 8px ${b.color}22` } : {}}
                  >
                    <div style={{ width: 130, fontSize: 12, fontWeight: isGymgaze ? 700 : 500, color: isGymgaze ? b.color : "#888", flexShrink: 0 }}>
                      {b.name}
                    </div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 8 }}>
                      <div style={{ width: `${barWidth}%`, height: 8, borderRadius: 4, background: b.color, opacity: isGymgaze ? 1 : 0.55, transition: "width 0.4s ease" }} />
                    </div>
                    <div style={{ width: 80, textAlign: "right", fontSize: 12, fontWeight: isGymgaze ? 700 : 500, color: isGymgaze ? b.color : "#666", flexShrink: 0 }}>
                      R{Math.round(b.ecpm)} eCPM
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-4" style={{ color: "#555" }}>
              eCPM = CPM ÷ attention rate. Lower = better value per impression that actually registers.
            </p>
          </div>
        );
      })()}

      {/* ── 2: Impression Breakdown ───────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderRadius: 16 }}>
        <p style={LABEL}>Media Metrics Breakdown — {weeks} weeks @ R{effectiveCpm} CPM</p>
        <p className="text-xs mb-5" style={{ color: "#555" }}>
          OTS derived from monthly foot traffic · Reach = active members (65% of registered) scaled to flight · Impact = reach × attention factor (0.65 default)
        </p>

        <div className="flex flex-col gap-2">

          {/* Per Gym */}
          <SectionToggle id="gym" label={`Per Gym (${venues.length})`} icon={MapPin} />
          {expandedSection === "gym" && (
            <div className="rounded-xl overflow-x-auto mb-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ ...TH, textAlign: "left" }}>Venue</th>
                    <th style={{ ...TH, textAlign: "left" }}>City</th>
                    <th style={{ ...TH, textAlign: "right" }}>Screens</th>
                    <th style={{ ...TH, textAlign: "right" }}>OTS</th>
                    <th style={{ ...TH, textAlign: "right" }}>Reach</th>
                    <th style={{ ...TH, textAlign: "right" }}>Freq</th>
                    <th style={{ ...TH, textAlign: "right" }}>Impact</th>
                    <th style={{ ...TH, textAlign: "right" }}>Cost</th>
                    <th style={{ ...TH, textAlign: "right" }}>/ Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {venueData.length === 0 ? (
                    <tr><td colSpan={9} style={{ ...TD, textAlign: "center", color: "#555" }}>No venues found</td></tr>
                  ) : venueData.map((v) => (
                    <tr key={v.id}>
                      <td style={{ ...TD, color: "#fff", fontWeight: 500 }}>{v.name}</td>
                      <td style={TD}>{v.city ?? "—"}</td>
                      <td style={{ ...TD, textAlign: "right" }}>{v.screens}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#A1A1AA" }}>{fmtNum(v.ots)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#D4FF4F" }}>{fmtNum(v.reach)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#FF6B35" }}>{fmtFreq(v.frequency)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#C084FC" }}>{fmtNum(v.impact)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#fff", fontWeight: 600 }}>{fmtR(Math.round(v.cost))}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#666" }}>R{v.costPerUnique.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Per City */}
          <SectionToggle id="city" label={`Per City (${cityData.length})`} icon={Building2} />
          {expandedSection === "city" && (
            <div className="rounded-xl overflow-x-auto mb-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ ...TH, textAlign: "left" }}>City</th>
                    <th style={{ ...TH, textAlign: "right" }}>Venues</th>
                    <th style={{ ...TH, textAlign: "right" }}>Screens</th>
                    <th style={{ ...TH, textAlign: "right" }}>OTS</th>
                    <th style={{ ...TH, textAlign: "right" }}>Reach</th>
                    <th style={{ ...TH, textAlign: "right" }}>Freq</th>
                    <th style={{ ...TH, textAlign: "right" }}>Impact</th>
                    <th style={{ ...TH, textAlign: "right" }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {cityData.map((c) => (
                    <tr key={c.city}>
                      <td style={{ ...TD, color: "#fff", fontWeight: 500 }}>{c.city}</td>
                      <td style={{ ...TD, textAlign: "right" }}>{c.venues}</td>
                      <td style={{ ...TD, textAlign: "right" }}>{c.screens}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#A1A1AA" }}>{fmtNum(c.ots)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#D4FF4F" }}>{fmtNum(c.reach)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#FF6B35" }}>{fmtFreq(c.frequency)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#C084FC" }}>{fmtNum(c.impact)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#fff", fontWeight: 600 }}>{fmtR(Math.round(c.cost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Per Province */}
          <SectionToggle id="province" label={`Per Province (${provinceData.length})`} icon={MapPin} />
          {expandedSection === "province" && (
            <div className="rounded-xl overflow-x-auto mb-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ ...TH, textAlign: "left" }}>Province</th>
                    <th style={{ ...TH, textAlign: "right" }}>Venues</th>
                    <th style={{ ...TH, textAlign: "right" }}>Screens</th>
                    <th style={{ ...TH, textAlign: "right" }}>OTS</th>
                    <th style={{ ...TH, textAlign: "right" }}>Reach</th>
                    <th style={{ ...TH, textAlign: "right" }}>Freq</th>
                    <th style={{ ...TH, textAlign: "right" }}>Impact</th>
                    <th style={{ ...TH, textAlign: "right" }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {provinceData.map((p) => (
                    <tr key={p.province}>
                      <td style={{ ...TD, color: "#fff", fontWeight: 500 }}>{p.province}</td>
                      <td style={{ ...TD, textAlign: "right" }}>{p.venues}</td>
                      <td style={{ ...TD, textAlign: "right" }}>{p.screens}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#A1A1AA" }}>{fmtNum(p.ots)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#D4FF4F" }}>{fmtNum(p.reach)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#FF6B35" }}>{fmtFreq(p.frequency)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#C084FC" }}>{fmtNum(p.impact)}</td>
                      <td style={{ ...TD, textAlign: "right", color: "#fff", fontWeight: 600 }}>{fmtR(Math.round(p.cost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* National */}
          <SectionToggle id="national" label="National Network" icon={Globe} />
          {expandedSection === "national" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              <MetricCard icon={Eye}     label="OTS"       value={fmtNum(national.ots)}    sub="Total opportunities"       accent="#A1A1AA" />
              <MetricCard icon={Users}   label="Reach"     value={fmtNum(national.reach)}  sub="Unique individuals"        accent="#D4FF4F" />
              <MetricCard icon={Repeat2} label="Frequency" value={fmtFreq(national.freq)}  sub="Avg exposures per person"  accent="#FF6B35" />
              <MetricCard icon={Zap}     label="Impact"    value={fmtNum(national.impact)} sub={`R${national.costPerUnique.toFixed(2)} / unique`} accent="#C084FC" />
            </div>
          )}
        </div>
      </div>

      {/* ── 3: Rate Card Generator ───────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6" style={{ borderRadius: 16 }}>
        <p style={LABEL}>Rate Card Generator</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Client Name</label>
            <input type="text" placeholder="e.g. Ogilvy SA / Nike SA" value={clientName} onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Flight Start</label>
            <input type="date" value={flightStart} onChange={(e) => setFlightStart(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", colorScheme: "dark" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Flight End</label>
            <input type="date" value={flightEnd} onChange={(e) => setFlightEnd(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", colorScheme: "dark" }} />
          </div>
        </div>

        <p className="text-xs font-semibold mb-3" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Select Venues <span style={{ color: "#555", textTransform: "none", fontWeight: 400 }}>(leave blank = all)</span>
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {venues.map((v) => {
            const selected = selectedVenues.includes(v.id);
            return (
              <button key={v.id} onClick={() => toggleVenue(v.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: selected ? "rgba(212,255,79,0.12)" : "rgba(255,255,255,0.04)",
                  color: selected ? "#D4FF4F" : "#888",
                  border: `1px solid ${selected ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}>
                {v.name}{v.city ? ` · ${v.city}` : ""}
              </button>
            );
          })}
        </div>

        {/* Quote summary strip */}
        <div className="rounded-xl p-5 mb-5" style={{ background: "rgba(212,255,79,0.04)", border: "1px solid rgba(212,255,79,0.12)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div>
              <p className="text-xs mb-1" style={{ color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>OTS</p>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>{fmtNum(quoteTotals.ots)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#D4FF4F", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reach</p>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>{fmtNum(quoteTotals.reach)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#C084FC", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Impact</p>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>{fmtNum(quoteTotals.impact)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#FF6B35", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Cost</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#FF6B35" }}>{fmtR(Math.round(quoteTotals.cost))}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#555" }}>
            <span>{quoteVenues.length} venue{quoteVenues.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{quoteTotals.screens} screens</span>
            <span>·</span>
            <span>{weeks} weeks</span>
            <span>·</span>
            <span>R{effectiveCpm} CPM</span>
            <span>·</span>
            <span>Freq {fmtFreq(quoteTotals.freq)}</span>
            <span>·</span>
            <span style={{ color: "#C084FC" }}>R{quoteTotals.costPerUnique.toFixed(2)} / unique</span>
          </div>
        </div>

        {/* Generate Rate Card button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRateCard(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: "#D4FF4F",
              color: "#0a0a0a",
              border: "none",
              boxShadow: "0 0 20px rgba(212,255,79,0.35)",
            }}
          >
            <FileText size={16} strokeWidth={2.5} />
            Generate Rate Card
          </button>
          <button
            onClick={() => setGroupByCity(g => !g)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: groupByCity ? "rgba(212,255,79,0.12)" : "rgba(255,255,255,0.04)",
              color: groupByCity ? "#D4FF4F" : "#666",
              border: `1px solid ${groupByCity ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <Building2 size={14} strokeWidth={2} />
            {groupByCity ? "Grouped by City" : "Group by City"}
          </button>
        </div>
      </div>

      {/* ── Rate Card Modal ────────────────────────────────────────────────── */}
      {showRateCard && (() => {
        const selectedTier = pricingTiers.find((t) => t.cpm_zar === effectiveCpm) ?? pricingTiers[0];
        const slotDuration = selectedTier?.duration_sec ?? 15;
        const slotLabel = `${slotDuration}s`;
        const tierLabel = selectedTier?.label ?? "Custom";
        const gymgazeEcpm = Math.round(effectiveCpm / ATTENTION.default);
        const today = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
        const totalActiveMembers = quoteVenues.reduce((s, v) => s + (v.activeMembers ?? 0), 0);

        const benchmarksForCard = FORMAT_BENCHMARKS.map((b) => ({
          ...b,
          cpm: b.name === "GymGaze DOOH" ? effectiveCpm : b.cpm,
          ecpm: b.name === "GymGaze DOOH" ? gymgazeEcpm : Math.round(b.cpm / b.attention),
        })).sort((a, b) => a.ecpm - b.ecpm);
        const maxBenchmarkEcpm = Math.max(...benchmarksForCard.map((b) => b.ecpm));

        // Logo lockup component (inline, reusable within closure)
        const LogoLockup = ({ dark }: { dark?: boolean }) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, background: "#D4FF4F", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#0a0a0a", lineHeight: 1 }}>G</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: dark ? "#0a0a0a" : "#ffffff", letterSpacing: "-0.02em", fontFamily: "Inter Tight, sans-serif" }}>GymGaze</span>
          </div>
        );

        // Shared header bar for pages 2+
        const PageHeader = ({ rightContent }: { rightContent: React.ReactNode }) => (
          <div style={{ background: "#0a0a0a", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", flexShrink: 0 }}>
            <LogoLockup />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{rightContent}</div>
          </div>
        );

        const PAGE_STYLE: React.CSSProperties = {
          width: "1120px",
          minHeight: "793px",
          position: "relative",
          overflow: "hidden",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, sans-serif",
        };

        return (
          <>
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                #rate-card-printable, #rate-card-printable * { visibility: visible !important; }
                #rate-card-printable {
                  position: static !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                #rate-card-printable > div {
                  width: 100% !important;
                  max-width: 100% !important;
                }
                #rate-card-printable * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print { display: none !important; }
                .page-break { page-break-after: always; break-after: page; }
                @page { size: A4 landscape; margin: 0; }
              }
            `}</style>

            {/* Dark overlay */}
            <div
              className="no-print"
              style={{
                position: "fixed", inset: 0, zIndex: 50,
                background: "rgba(0,0,0,0.92)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                overflowY: "auto",
                padding: "40px 16px",
              }}
            >
              <div style={{ position: "relative", width: "100%", maxWidth: "1160px" }}>
                {/* Toolbar */}
                <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ color: "#D4FF4F", fontWeight: 700, fontSize: 14 }}>⚡ Rate Card Preview — Landscape A4{pdfStatus && <span style={{ marginLeft: 12, color: "#fff", fontWeight: 500, fontSize: 12 }}>• {pdfStatus}</span>}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={downloadPdf}
                      disabled={!!pdfStatus}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 10, background: pdfStatus ? "#666" : "#D4FF4F", color: "#0a0a0a", fontWeight: 700, fontSize: 13, border: "none", cursor: pdfStatus ? "wait" : "pointer", opacity: pdfStatus ? 0.7 : 1 }}
                    >
                      <Printer size={14} strokeWidth={2.5} />
                      {pdfStatus ? "Generating…" : "Download PDF"}
                    </button>
                    <button
                      onClick={openPrintPage}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "rgba(212,255,79,0.1)", color: "#D4FF4F", fontWeight: 600, fontSize: 12, border: "1px solid rgba(212,255,79,0.2)", cursor: "pointer" }}
                      title="Open browser print dialog instead"
                    >
                      Print in Browser
                    </button>
                    <button
                      onClick={() => setShowRateCard(false)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 10, background: "rgba(255,255,255,0.08)", color: "#888", border: "1px solid rgba(255,255,255,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                    >
                      <X size={14} strokeWidth={2} />
                      Close
                    </button>
                  </div>
                </div>

                {/* ── Printable Rate Card ── */}
                <div id="rate-card-printable" style={{ fontFamily: "Inter, sans-serif" }}>

                  {/* ═══ PAGE 1 — COVER ═══ */}
                  <div className="page-break" style={{ ...PAGE_STYLE, background: "#0a0a0a" }}>
                    {/* Dot-grid decorative background */}
                    <div style={{
                      position: "absolute", inset: 0,
                      backgroundImage: "radial-gradient(circle, rgba(212,255,79,0.10) 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                      pointerEvents: "none",
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
                        `${quoteVenues.length} Venues`,
                        `${fmtNum(totalActiveMembers)} Active Members`,
                      ].map((pill) => (
                        <span key={pill} style={{ background: "rgba(212, 255, 79, 0.15)", border: "1px solid rgba(212, 255, 79, 0.3)", borderRadius: 20, color: "#D4FF4F", fontSize: 12, fontWeight: 700, padding: "4px 14px", letterSpacing: "0.02em" }}>
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ═══ PAGE 2 — NETWORK SUMMARY ═══ */}
                  <div className="page-break" style={{ ...PAGE_STYLE, background: "#ffffff" }}>
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
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 14 }}>eCPM = CPM ÷ attention rate. Lower = better value per registered impression.</p>
                      </div>
                    </div>
                  </div>

                  {/* ═══ PAGE 3 — CAMPAIGN PACKAGES ═══ */}
                  {(() => {
                    const topCity = cityData[0];
                    const topCityVenues = venueData.filter(v => v.city === topCity?.city);
                    const topCityCost = topCityVenues.reduce((s, v) => s + v.cost, 0);
                    const topCityReach = topCityVenues.reduce((s, v) => s + v.reach, 0);

                    const topProvince = provinceData[0];
                    const topProvinceVenues = venueData.filter(v => v.province === topProvince?.province);
                    const topProvinceCost = topProvinceVenues.reduce((s, v) => s + v.cost, 0);
                    const topProvinceReach = topProvinceVenues.reduce((s, v) => s + v.reach, 0);

                    const nationalCost = quoteTotals.cost;
                    const nationalReach = quoteTotals.reach;

                    return (
                      <div className="page-break" style={{ ...PAGE_STYLE, background: "#F7F7F5" }}>
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
                              desc: `All ${quoteVenues.length} venues · ${weeks} weeks · ${slotLabel} slot`,
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
                              {/* Tag badge — top right */}
                              <div style={{
                                position: "absolute", top: 16, right: 16,
                                fontSize: 10, fontWeight: 800, color: pkg.tag === "POPULAR" ? "#0a0a0a" : pkg.tagColor,
                                background: pkg.tag === "POPULAR" ? "#D4FF4F" : `${pkg.tagColor}22`,
                                border: pkg.tag === "POPULAR" ? "none" : `1px solid ${pkg.tagColor}55`,
                                borderRadius: 20, padding: "3px 10px", letterSpacing: "0.1em",
                              }}>{pkg.tag}</div>

                              {/* Package name */}
                              <div style={{
                                fontSize: 18, fontWeight: 800,
                                color: pkg.tag === "POPULAR" ? "#ffffff" : "#0a0a0a",
                                fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.01em",
                                paddingRight: 60,
                              }}>{pkg.name}</div>

                              {/* Description */}
                              <div style={{ fontSize: 12, color: pkg.tag === "POPULAR" ? "#999" : "#888" }}>{pkg.desc}</div>

                              {/* Divider */}
                              <div style={{ height: 1, background: pkg.tag === "POPULAR" ? "rgba(255,255,255,0.08)" : "#F0F0F0" }} />

                              {/* Price — BIG */}
                              <div style={{
                                fontSize: 38, fontWeight: 900,
                                color: pkg.tag === "POPULAR" ? "#D4FF4F" : "#0a0a0a",
                                fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1,
                              }}>{pkg.price}</div>

                              {/* Stats rows */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                                {[
                                  { label: "Est. Reach", value: pkg.reach },
                                  { label: "Screens", value: pkg.screens.toString() },
                                  { label: "Duration", value: `${weeks} weeks` },
                                ].map(({ label, value }) => (
                                  <div key={label} style={{
                                    display: "flex", justifyContent: "space-between",
                                    padding: "5px 0",
                                    borderBottom: `1px solid ${pkg.tag === "POPULAR" ? "rgba(255,255,255,0.06)" : "#F5F5F5"}`,
                                    fontSize: 12,
                                  }}>
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
                  {(() => {
                    // City grouping helper
                    const citiesInProvince = (pvenues: typeof quoteVenues) => {
                      const map = new Map<string, typeof quoteVenues>();
                      pvenues.forEach(v => {
                        const city = v.city ?? "Unknown";
                        if (!map.has(city)) map.set(city, []);
                        map.get(city)!.push(v);
                      });
                      return Array.from(map.entries()).map(([city, venues]) => ({ city, venues }));
                    };

                    // Group quoteVenues by province
                    const venuesByProvince = quoteVenues.reduce((acc, v) => {
                      const prov = v.province ?? "Other";
                      if (!acc[prov]) acc[prov] = [];
                      acc[prov].push(v);
                      return acc;
                    }, {} as Record<string, typeof quoteVenues>);
                    const provinces = Object.keys(venuesByProvince).sort();

                    return provinces.map((province, pIdx) => {
                      const pvenues = venuesByProvince[province];
                      const provScreens = pvenues.reduce((s, v) => s + v.screens, 0);
                      const provMembers = pvenues.reduce((s, v) => s + v.activeMembers, 0);
                      return (
                        <React.Fragment key={province}>
                          {/* Province divider page */}
                          <div className="page-break" style={{ width: "1120px", minHeight: "793px", background: "#0a0a0a", position: "relative", overflow: "hidden", marginBottom: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            {/* dot grid decoration */}
                            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(212,255,79,0.08) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
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
                            {/* bottom bar */}
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
                                  style={{ ...PAGE_STYLE, background: "#ffffff" }}
                                >
                                  <PageHeader rightContent={<span>{city}<span style={{ color: "#999", fontWeight: 400 }}> · {province}</span></span>} />

                                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                    {/* Main content: venue list + stats */}
                                    <div style={{ display: "flex", flex: 1, minHeight: 0, maxHeight: 400 }}>
                                      {/* LEFT: venue list */}
                                      <div style={{ width: "55%", background: "#fff", flexShrink: 0, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" as const }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#888", marginBottom: 8 }}>Venues in {city}</div>
                                        {cityVenues.map((cv) => (
                                          <div key={cv.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                                            {cv.cover_image_url ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={cv.cover_image_url} alt={cv.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
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
                                      // Use average of all venues in the city
                                      // Per-venue: use avg of city venues' real operating hours
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
                            const total7sSlots = activeScreens.reduce((sum, s) => sum + (s.slots_7sec ?? 8), 0);
                            const total15sSlots = activeScreens.reduce((sum, s) => sum + (s.slots_15sec ?? 4), 0);
                            return (
                      <div
                        key={v.id}
                        className={isLastVenue && pricingTiers.length === 0 ? undefined : "page-break"}
                        style={{ ...PAGE_STYLE, background: "#ffffff" }}
                      >
                        <PageHeader rightContent={<span>{v.name}{v.city ? <span style={{ color: "#999", fontWeight: 400 }}> · {v.city}</span> : null}</span>} />

                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          {/* Main content: photo + location */}
                          <div style={{ display: "flex", flex: 1, minHeight: 0, maxHeight: 400 }}>
                            {/* LEFT: venue photo */}
                            <div style={{ width: "55%", position: "relative", background: "#111", flexShrink: 0 }}>
                              {v.cover_image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={v.cover_image_url}
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
                              {/* City name large */}
                              <div style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", marginBottom: 4 }}>{v.city ?? "—"}</div>
                              {/* Province */}
                              <div style={{ fontSize: 13, color: "#D4FF4F", fontWeight: 600, marginBottom: 20 }}>{v.province ?? "—"}</div>
                              {/* Divider */}
                              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 20 }} />
                              {/* Location info rows */}
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
                              {/* Operating hours — full-width single row */}
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
                            const total7s = activeScreens.reduce((sum, s) => sum + (s.slots_7sec ?? 8), 0);
                            const total15s = activeScreens.reduce((sum, s) => sum + (s.slots_15sec ?? 4), 0);
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

                          {/* Spec strip */}
                          {(() => {
                            // Per-venue: use real operating hours from DB
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
                    });
                  })()}

                  {/* ═══ LAST PAGE — PRICING TIERS + FOOTER ═══ */}
                  <div style={{ ...PAGE_STYLE, background: "#ffffff" }}>
                    <PageHeader rightContent={clientName ? `Investment Summary — ${clientName}` : "Investment Summary"} />

                    <div style={{ padding: "24px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

                      {/* TOP ROW: big investment hero + flight details */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                        {/* Investment hero tile */}
                        <div style={{
                          background: "#0a0a0a", borderRadius: 16, padding: "28px 32px",
                          display: "flex", flexDirection: "column", gap: 8,
                          border: "1px solid rgba(212,255,79,0.2)",
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#D4FF4F" }}>Total Investment</div>
                          <div style={{ fontSize: 48, fontWeight: 900, color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>{fmtR(Math.round(quoteTotals.cost))}</div>
                          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{tierLabel} · {slotLabel} slot · R{effectiveCpm} CPM</div>
                        </div>

                        {/* Flight details tile */}
                        <div style={{
                          background: "#F9FAFB", borderRadius: 16, padding: "28px 32px",
                          display: "flex", flexDirection: "column", gap: 14,
                          border: "1px solid #E5E7EB",
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#888" }}>Flight Details</div>
                          {[
                            { label: "Duration", value: `${weeks} weeks` },
                            { label: "Venues", value: quoteVenues.length.toString() },
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

                      {/* BOTTOM ROW: pricing tiers table (compact) + terms */}
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

                  {/* Print button inside card (hidden in print, visible on screen) */}
                  <div className="no-print" style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 10 }}>
                    <button
                      onClick={downloadPdf}
                      disabled={!!pdfStatus}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 10, background: "#0a0a0a", color: "#D4FF4F", border: "2px solid #D4FF4F", fontWeight: 700, fontSize: 14, cursor: pdfStatus ? "wait" : "pointer", opacity: pdfStatus ? 0.6 : 1 }}
                    >
                      <Printer size={16} strokeWidth={2.5} />
                      {pdfStatus || "Download PDF"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
