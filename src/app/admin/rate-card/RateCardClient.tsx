"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  TrendingUp,
  MapPin,
  Building2,
  Globe,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
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

// Impressions per screen per week based on avg gym operating hours (6am–10pm, 16h/day)
// Loop = 251s → ~228 plays/screen/day → 1,596 plays/screen/week
// Estimated reach: 1 play = ~4 unique eyeballs (dwell time + footfall blend)
const PLAYS_PER_SCREEN_PER_WEEK = 1596;
const EYEBALLS_PER_PLAY = 4;

function screenCount(v: VenueRow) {
  return Array.isArray(v.screens) ? v.screens.filter((s) => s.is_active).length : 0;
}

function venueImpressions(v: VenueRow, weeks: number) {
  const screens = screenCount(v);
  return screens * PLAYS_PER_SCREEN_PER_WEEK * EYEBALLS_PER_PLAY * weeks;
}

function fmtR(n: number) {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

// ─── Card component ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#999", fontWeight: 600 }}>{label}</p>
      <p
        className="text-2xl md:text-3xl font-bold tabular-nums"
        style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1, color: accent ?? "#fff" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs mt-1.5" style={{ color: "#8A8A8A" }}>{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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

  // ── Impression calculations ────────────────────────────────────────────────
  const venueData = useMemo(() => {
    return venues.map((v) => ({
      ...v,
      impressions: venueImpressions(v, weeks),
      screens: screenCount(v),
      cost: ((venueImpressions(v, weeks) / 1000) * effectiveCpm),
    }));
  }, [venues, weeks, effectiveCpm]);

  const cityData = useMemo(() => {
    const map = new Map<string, { impressions: number; screens: number; venues: number }>();
    venueData.forEach((v) => {
      const city = v.city ?? "Unknown";
      const existing = map.get(city) ?? { impressions: 0, screens: 0, venues: 0 };
      map.set(city, {
        impressions: existing.impressions + v.impressions,
        screens: existing.screens + v.screens,
        venues: existing.venues + 1,
      });
    });
    return Array.from(map.entries())
      .map(([city, d]) => ({ city, ...d, cost: (d.impressions / 1000) * effectiveCpm }))
      .sort((a, b) => b.impressions - a.impressions);
  }, [venueData, effectiveCpm]);

  const provinceData = useMemo(() => {
    const map = new Map<string, { impressions: number; screens: number; venues: number }>();
    venueData.forEach((v) => {
      const prov = v.province ?? "Unknown";
      const existing = map.get(prov) ?? { impressions: 0, screens: 0, venues: 0 };
      map.set(prov, {
        impressions: existing.impressions + v.impressions,
        screens: existing.screens + v.screens,
        venues: existing.venues + 1,
      });
    });
    return Array.from(map.entries())
      .map(([province, d]) => ({ province, ...d, cost: (d.impressions / 1000) * effectiveCpm }))
      .sort((a, b) => b.impressions - a.impressions);
  }, [venueData, effectiveCpm]);

  const national = useMemo(() => {
    const totalImpressions = venueData.reduce((s, v) => s + v.impressions, 0);
    const totalScreens = venueData.reduce((s, v) => s + v.screens, 0);
    return {
      impressions: totalImpressions,
      screens: totalScreens,
      venues: venues.length,
      cost: (totalImpressions / 1000) * effectiveCpm,
    };
  }, [venueData, effectiveCpm]);

  // ── Quote builder ──────────────────────────────────────────────────────────
  const quoteVenues = selectedVenues.length > 0
    ? venueData.filter((v) => selectedVenues.includes(v.id))
    : venueData;

  const quoteTotals = useMemo(() => {
    const totalImpressions = quoteVenues.reduce((s, v) => s + v.impressions, 0);
    const totalCost = (totalImpressions / 1000) * effectiveCpm;
    const totalScreens = quoteVenues.reduce((s, v) => s + v.screens, 0);
    return { totalImpressions, totalCost, totalScreens };
  }, [quoteVenues, effectiveCpm]);

  function toggleVenue(id: string) {
    setSelectedVenues((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function copyQuote() {
    const venueList = quoteVenues.map((v) => `  • ${v.name} (${v.city ?? "—"}) — ${v.screens} screens, ${fmtNum(v.impressions)} impressions`).join("\n");
    const text = [
      `GymGaze DOOH Quote`,
      `──────────────────`,
      clientName ? `Client: ${clientName}` : null,
      flightStart && flightEnd ? `Flight: ${flightStart} → ${flightEnd}` : null,
      `Duration: ${weeks} weeks`,
      `CPM: R${effectiveCpm}`,
      ``,
      `Venues (${quoteVenues.length}):`,
      venueList,
      ``,
      `Total Screens: ${quoteTotals.totalScreens}`,
      `Total Impressions: ${fmtNum(quoteTotals.totalImpressions)}`,
      `Total Cost: ${fmtR(quoteTotals.totalCost)}`,
      ``,
      `Min. spend R2,500. Subject to availability.`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2000);
    });
  }

  const SECTION_LABEL_STYLE: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#D4FF4F",
    marginBottom: "12px",
  };

  const TABLE_HEADER: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#555",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  const TABLE_CELL: React.CSSProperties = {
    padding: "12px 16px",
    fontSize: "13px",
    color: "#D0D0D0",
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

  return (
    <div className="p-4 md:p-8" style={{ maxWidth: 1100 }}>
      {/* Page header */}
      <div className="glass-panel relative overflow-hidden rounded-2xl mb-6 md:mb-8" style={{ borderRadius: 16 }}>
        <div className="relative z-10 p-5 md:p-8">
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 5vw, 2.5rem)", color: "#fff", letterSpacing: "-0.02em" }}>
            Rate Card
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            CPM calculator, impression estimates & quick quote builder
          </p>
        </div>
      </div>

      {/* ── Section 1: CPM Calculator ─────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderRadius: 16 }}>
        <p style={SECTION_LABEL_STYLE}>CPM Calculator</p>

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
            >
              {tier.label} — R{tier.cpm_zar}
            </button>
          ))}
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Custom CPM (R)
            </label>
            <input
              type="number"
              placeholder={`${cpm}`}
              value={customCpm}
              onChange={(e) => setCustomCpm(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Flight Duration (weeks)
            </label>
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
            <div
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(212,255,79,0.06)", border: "1px solid rgba(212,255,79,0.15)" }}
            >
              <p className="text-xs mb-1" style={{ color: "#D4FF4F", fontWeight: 600 }}>≈ {months} month{months !== 1 ? "s" : ""}</p>
              <p className="text-xs" style={{ color: "#666" }}>Active CPM: <span style={{ color: "#fff", fontWeight: 600 }}>R{effectiveCpm}</span></p>
            </div>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="National / Week"
            value={fmtR(Math.round((national.impressions / 1000) * effectiveCpm / weeks))}
            sub={`R${effectiveCpm} CPM`}
            accent="#D4FF4F"
          />
          <StatCard
            label="National / Month"
            value={fmtR(Math.round((national.impressions / 1000) * effectiveCpm / months))}
            sub={`${fmtNum(Math.round(national.impressions / weeks))} imp/wk`}
          />
          <StatCard
            label={`Full ${weeks}-Week Flight`}
            value={fmtR(Math.round(national.cost))}
            sub={`${fmtNum(national.impressions)} total impressions`}
            accent="#FF6B35"
          />
          <StatCard
            label="Total Screens"
            value={national.screens.toString()}
            sub={`${national.venues} venue${national.venues !== 1 ? "s" : ""}`}
          />
        </div>
      </div>

      {/* ── Section 2: Impression Estimates ──────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderRadius: 16 }}>
        <p style={SECTION_LABEL_STYLE}>Impression Estimates — {weeks} weeks @ R{effectiveCpm} CPM</p>
        <p className="text-xs mb-5" style={{ color: "#555" }}>
          Based on active screens × {PLAYS_PER_SCREEN_PER_WEEK.toLocaleString()} plays/week × {EYEBALLS_PER_PLAY} eyeballs/play
        </p>

        <div className="flex flex-col gap-2">
          {/* Per Gym */}
          <SectionToggle id="gym" label={`Per Gym (${venues.length})`} icon={MapPin} />
          {expandedSection === "gym" && (
            <div className="rounded-xl overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={{ ...TABLE_HEADER, textAlign: "left" }}>Venue</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "left" }}>City</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Screens</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Members</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Impressions</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {venueData.length === 0 ? (
                    <tr><td colSpan={6} style={{ ...TABLE_CELL, textAlign: "center", color: "#555" }}>No venues found</td></tr>
                  ) : (
                    venueData.map((v) => (
                      <tr key={v.id}>
                        <td style={{ ...TABLE_CELL, color: "#fff", fontWeight: 500 }}>{v.name}</td>
                        <td style={TABLE_CELL}>{v.city ?? "—"}</td>
                        <td style={{ ...TABLE_CELL, textAlign: "right" }}>{v.screens}</td>
                        <td style={{ ...TABLE_CELL, textAlign: "right" }}>{(v.active_members ?? 0).toLocaleString("en-ZA")}</td>
                        <td style={{ ...TABLE_CELL, textAlign: "right", color: "#D4FF4F" }}>{fmtNum(v.impressions)}</td>
                        <td style={{ ...TABLE_CELL, textAlign: "right", color: "#fff", fontWeight: 600 }}>{fmtR(Math.round(v.cost))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Per City */}
          <SectionToggle id="city" label={`Per City (${cityData.length})`} icon={Building2} />
          {expandedSection === "city" && (
            <div className="rounded-xl overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={{ ...TABLE_HEADER, textAlign: "left" }}>City</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Venues</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Screens</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Impressions</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {cityData.map((c) => (
                    <tr key={c.city}>
                      <td style={{ ...TABLE_CELL, color: "#fff", fontWeight: 500 }}>{c.city}</td>
                      <td style={{ ...TABLE_CELL, textAlign: "right" }}>{c.venues}</td>
                      <td style={{ ...TABLE_CELL, textAlign: "right" }}>{c.screens}</td>
                      <td style={{ ...TABLE_CELL, textAlign: "right", color: "#D4FF4F" }}>{fmtNum(c.impressions)}</td>
                      <td style={{ ...TABLE_CELL, textAlign: "right", color: "#fff", fontWeight: 600 }}>{fmtR(Math.round(c.cost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Per Province */}
          <SectionToggle id="province" label={`Per Province (${provinceData.length})`} icon={MapPin} />
          {expandedSection === "province" && (
            <div className="rounded-xl overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={{ ...TABLE_HEADER, textAlign: "left" }}>Province</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Venues</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Screens</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Impressions</th>
                    <th style={{ ...TABLE_HEADER, textAlign: "right" }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {provinceData.map((p) => (
                    <tr key={p.province}>
                      <td style={{ ...TABLE_CELL, color: "#fff", fontWeight: 500 }}>{p.province}</td>
                      <td style={{ ...TABLE_CELL, textAlign: "right" }}>{p.venues}</td>
                      <td style={{ ...TABLE_CELL, textAlign: "right" }}>{p.screens}</td>
                      <td style={{ ...TABLE_CELL, textAlign: "right", color: "#D4FF4F" }}>{fmtNum(p.impressions)}</td>
                      <td style={{ ...TABLE_CELL, textAlign: "right", color: "#fff", fontWeight: 600 }}>{fmtR(Math.round(p.cost))}</td>
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
              <StatCard label="Venues" value={national.venues.toString()} />
              <StatCard label="Screens" value={national.screens.toString()} />
              <StatCard label="Impressions" value={fmtNum(national.impressions)} accent="#D4FF4F" />
              <StatCard label="Total Cost" value={fmtR(Math.round(national.cost))} accent="#FF6B35" />
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Quick Quote Builder ────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6" style={{ borderRadius: 16 }}>
        <p style={SECTION_LABEL_STYLE}>Quick Quote Builder</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Client Name</label>
            <input
              type="text"
              placeholder="e.g. Ogilvy SA / Nike SA"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Flight Start</label>
            <input
              type="date"
              value={flightStart}
              onChange={(e) => setFlightStart(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", colorScheme: "dark" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Flight End</label>
            <input
              type="date"
              value={flightEnd}
              onChange={(e) => setFlightEnd(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", colorScheme: "dark" }}
            />
          </div>
        </div>

        {/* Venue picker */}
        <p className="text-xs font-semibold mb-3" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Select Venues <span style={{ color: "#555", textTransform: "none", fontWeight: 400 }}>(leave blank = all venues)</span>
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {venues.map((v) => {
            const selected = selectedVenues.includes(v.id);
            return (
              <button
                key={v.id}
                onClick={() => toggleVenue(v.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: selected ? "rgba(212,255,79,0.12)" : "rgba(255,255,255,0.04)",
                  color: selected ? "#D4FF4F" : "#888",
                  border: `1px solid ${selected ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {v.name}{v.city ? ` · ${v.city}` : ""}
              </button>
            );
          })}
        </div>

        {/* Quote summary */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: "rgba(212,255,79,0.04)", border: "1px solid rgba(212,255,79,0.12)" }}
        >
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs mb-1" style={{ color: "#D4FF4F", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Screens</p>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>{quoteTotals.totalScreens}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#D4FF4F", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Impressions</p>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>{fmtNum(quoteTotals.totalImpressions)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#FF6B35", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Cost</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#FF6B35" }}>{fmtR(Math.round(quoteTotals.totalCost))}</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "#555" }}>
            {quoteVenues.length} venue{quoteVenues.length !== 1 ? "s" : ""} · {weeks} weeks · R{effectiveCpm} CPM · Min. spend R2,500
          </p>
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
          {copiedQuote ? "Copied to clipboard!" : "Copy Quote Summary"}
        </button>
      </div>
    </div>
  );
}
