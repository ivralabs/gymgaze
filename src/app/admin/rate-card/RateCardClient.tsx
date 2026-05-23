"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VenueRow = {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  active_members: number | null;
  monthly_entries: number | null;
  screens: { id: string; is_active: boolean | null }[] | null;
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
// Loop = 251s → ~228 plays/screen/day (16h operating) → 1,596/week
const PLAYS_PER_SCREEN_PER_WEEK = 1596;

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  const [expandedSection, setExpandedSection] = useState<"gym" | "city" | "province" | "national" | null>("gym");

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

  function copyQuote() {
    const venueList = quoteVenues
      .map((v) => `  • ${v.name} (${v.city ?? "—"}) — ${v.screens} screens | OTS ${fmtNum(v.ots)} | Reach ${fmtNum(v.reach)} | Freq ${fmtFreq(v.frequency)} | Impact ${fmtNum(v.impact)}`)
      .join("\n");

    const selectedTier = pricingTiers.find((t) => t.cpm_zar === effectiveCpm);

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
            <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#C084FC" }}>R{national.costPerUnique.toFixed(2)}</p>
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

      {/* ── 3: Quote Builder ──────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6" style={{ borderRadius: 16 }}>
        <p style={LABEL}>Quick Quote Builder</p>

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
        <div className="flex flex-wrap gap-2 mb-5">
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

        {/* Quote summary */}
        <div className="rounded-xl p-5 mb-4" style={{ background: "rgba(212,255,79,0.04)", border: "1px solid rgba(212,255,79,0.12)" }}>
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

        <button
          onClick={copyQuote}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: copiedQuote ? "rgba(74,222,128,0.12)" : "rgba(212,255,79,0.10)",
            color: copiedQuote ? "#4ADE80" : "#D4FF4F",
            border: `1px solid ${copiedQuote ? "rgba(74,222,128,0.3)" : "rgba(212,255,79,0.25)"}`,
          }}
        >
          {copiedQuote ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} strokeWidth={2} />}
          {copiedQuote ? "Copied!" : "Copy Media Proposal"}
        </button>
      </div>
    </div>
  );
}
