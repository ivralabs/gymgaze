"use client";

import React, { useState, useMemo } from "react";
import { suggestMonthlyImpressions } from "@/lib/staticSiteImpressions";
import { fmtDimensionsM } from "@/lib/dimensions";
import {
  Calculator,
  MapPin,
  Building2,
  Globe,
  ChevronDown,
  ChevronUp,
  FileText,
  Printer,
  X,
  Layers,
  TrendingUp,
  DollarSign,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StaticSiteForCard = {
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
    monthly_entries?: number | null;
  } | null;
};

interface Props {
  sites: StaticSiteForCard[];
}

// ─── Labels ───────────────────────────────────────────────────────────────────
const SITE_TYPE_LABELS: Record<string, string> = {
  poster_frame:  "Poster Frame",
  banner:        "Banner",
  a_frame:       "A-Frame",
  standee:       "Standee",
  wall_mount:    "Wall Mount",
  window_vinyl:  "Window Vinyl",
  other:         "Other",
};

function fmtSiteType(type: string | null): string {
  if (!type) return "—";
  return SITE_TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function fmtR(n: number) {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Returns [value, isEstimated] */
function effectiveImpressions(site: StaticSiteForCard): [number, boolean] {
  if (site.monthly_impressions != null) return [site.monthly_impressions, false];
  const est = suggestMonthlyImpressions(
    site.venues?.monthly_entries ?? null,
    site.location_in_venue
  );
  return est != null ? [est, true] : [0, false];
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StaticSitesRateCardClient({ sites }: Props) {
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [flightStart, setFlightStart] = useState("");
  const [flightEnd, setFlightEnd] = useState("");
  const [pdfStatus, setPdfStatus] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterType, setFilterType] = useState("");
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<"sites" | "province" | null>("sites");

  // ── Filter options ────────────────────────────────────────────────────────
  const provinces = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => { if (s.venues?.province) set.add(s.venues.province); });
    return Array.from(set).sort();
  }, [sites]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.venues?.city) {
        if (!filterProvince || s.venues.province === filterProvince) {
          set.add(s.venues.city);
        }
      }
    });
    return Array.from(set).sort();
  }, [sites, filterProvince]);

  const siteTypes = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => { if (s.site_type) set.add(s.site_type); });
    return Array.from(set).sort();
  }, [sites]);

  // ── Filtered + grouped sites ──────────────────────────────────────────────
  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      if (filterProvince && s.venues?.province !== filterProvince) return false;
      if (filterCity && s.venues?.city !== filterCity) return false;
      if (filterType && s.site_type !== filterType) return false;
      return true;
    });
  }, [sites, filterProvince, filterCity, filterType]);

  // Group by venue
  const sitesByVenue = useMemo(() => {
    const map = new Map<string, { venueName: string; venueCity: string | null; venueProvince: string | null; sites: StaticSiteForCard[] }>();
    filteredSites.forEach((s) => {
      const vid = s.venue_id;
      if (!map.has(vid)) {
        map.set(vid, {
          venueName: s.venues?.name ?? "Unknown Venue",
          venueCity: s.venues?.city ?? null,
          venueProvince: s.venues?.province ?? null,
          sites: [],
        });
      }
      map.get(vid)!.sites.push(s);
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => a.venueName.localeCompare(b.venueName));
  }, [filteredSites]);

  // Group by province (for province breakdown section)
  const sitesByProvince = useMemo(() => {
    const map = new Map<string, StaticSiteForCard[]>();
    filteredSites.forEach((s) => {
      const p = s.venues?.province ?? "Other";
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(s);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredSites]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  function toggleSite(id: string) {
    setSelectedSites((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function toggleVenueAll(venueSites: StaticSiteForCard[]) {
    const ids = venueSites.map((s) => s.id);
    const allSelected = ids.every((id) => selectedSites.includes(id));
    if (allSelected) {
      setSelectedSites((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedSites((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  function selectAll() {
    setSelectedSites(filteredSites.map((s) => s.id));
  }

  function clearAll() {
    setSelectedSites([]);
  }

  // ── Quote selection ───────────────────────────────────────────────────────
  const quoteSites = selectedSites.length > 0
    ? sites.filter((s) => selectedSites.includes(s.id))
    : filteredSites;

  const totalMonthlyValue = quoteSites.reduce((sum, s) => sum + (s.price_per_month ?? 0), 0);
  const totalImpressions = quoteSites.reduce((sum, s) => sum + effectiveImpressions(s)[0], 0);
  const annualValue = totalMonthlyValue * 12;

  // ── Open print page ───────────────────────────────────────────────────────
  function openPrintPage() {
    const ids = selectedSites.length > 0 ? selectedSites : filteredSites.map((s) => s.id);
    const printUrl = `/static-sites-print?` + new URLSearchParams({
      sites: ids.join(","),
      client: clientName,
      start: flightStart,
      end: flightEnd,
    }).toString();
    window.open(printUrl, "_blank");
  }

  // ── Download PDF ─────────────────────────────────────────────────────────
  async function downloadPdf() {
    setPdfStatus("Generating PDF…");
    try {
      const ids = selectedSites.length > 0 ? selectedSites : filteredSites.map((s) => s.id);
      const params = new URLSearchParams({
        source: "static-sites",
        sites: ids.join(","),
        client: clientName,
        start: flightStart,
        end: flightEnd,
        filename: `GymGaze-Static-Rate-Card-${clientName ? clientName.replace(/[^a-zA-Z0-9-]/g, "_") + "-" : ""}${new Date().toISOString().slice(0, 10)}.pdf`,
      });

      const res = await fetch(`/api/rate-card/pdf?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`PDF API returned ${res.status}: ${errBody.slice(0, 200)}`);
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `GymGaze-Static-Rate-Card-${clientName ? clientName.replace(/[^a-zA-Z0-9-]/g, "_") + "-" : ""}${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      setPdfStatus("");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setPdfStatus("");
      alert(`PDF generation failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  const LABEL: React.CSSProperties = {
    fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.08em", color: "#D4FF4F", marginBottom: "12px",
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
            Static Sites Rate Card
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            Build a client proposal · select sites · download PDF
          </p>
        </div>
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div
        className="rounded-xl px-5 py-4 flex flex-wrap gap-6 items-center mb-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div>
          <p className="text-xs mb-0.5" style={{ color: "#555" }}>Total Monthly</p>
          <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#D4FF4F" }}>{fmtR(Math.round(totalMonthlyValue))}</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: "#555" }}>Annual Value</p>
          <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#fff" }}>{fmtR(Math.round(annualValue))}</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: "#555" }}>Sites Selected</p>
          <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#fff" }}>{quoteSites.length}</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: "#555" }}>Monthly Impressions</p>
          <p className="text-xl font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#A1A1AA" }}>{fmtNum(totalImpressions)}</p>
        </div>
      </div>

      {/* ── Campaign details ───────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderRadius: 16 }}>
        <p style={LABEL}>Campaign Details</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Client Name</label>
            <input
              type="text"
              placeholder="e.g. Brand X"
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
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderRadius: 16 }}>
        <p style={LABEL}>Filters</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Province</label>
            <select
              value={filterProvince}
              onChange={(e) => { setFilterProvince(e.target.value); setFilterCity(""); }}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <option value="">All Provinces</option>
              {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>City</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Site Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <option value="">All Types</option>
              {siteTypes.map((t) => <option key={t} value={t}>{fmtSiteType(t)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={selectAll}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "rgba(212,255,79,0.08)", color: "#D4FF4F", border: "1px solid rgba(212,255,79,0.2)" }}
          >
            Select All ({filteredSites.length})
          </button>
          {selectedSites.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.04)", color: "#888", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <X size={12} strokeWidth={2.5} />
              Clear ({selectedSites.length})
            </button>
          )}
        </div>
      </div>

      {/* ── Sites by Venue ─────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderRadius: 16 }}>
        <div className="flex items-center justify-between mb-4">
          <p style={LABEL}>Sites by Venue</p>
          <SectionToggle id="sites" label={`${filteredSites.length} sites`} icon={Layers} />
        </div>

        {expandedSection === "sites" && (
          <div className="space-y-2">
            {sitesByVenue.map(({ id: vid, venueName, venueCity, venueProvince, sites: venueSites }) => {
              const allSelected = venueSites.every((s) => selectedSites.includes(s.id));
              const someSelected = venueSites.some((s) => selectedSites.includes(s.id));
              const isExpanded = expandedVenue === vid;
              const venueMonthly = venueSites.reduce((sum, s) => sum + (s.price_per_month ?? 0), 0);

              return (
                <div
                  key={vid}
                  style={{
                    background: someSelected ? "rgba(212,255,79,0.04)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${someSelected ? "rgba(212,255,79,0.15)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {/* Venue header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = !allSelected && someSelected;
                        }}
                        onChange={() => toggleVenueAll(venueSites)}
                        className="w-4 h-4 accent-[#D4FF4F] cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">{venueName}</div>
                        <div className="text-xs" style={{ color: "#666" }}>
                          {venueCity}{venueProvince ? ` · ${venueProvince}` : ""} · {venueSites.length} site{venueSites.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: "#D4FF4F" }}>
                        {fmtR(Math.round(venueMonthly))}/mo
                      </span>
                      <button
                        onClick={() => setExpandedVenue(isExpanded ? null : vid)}
                        style={{ color: "#666" }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Venue sites list */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      {venueSites.map((site) => {
                        const isSelected = selectedSites.includes(site.id);
                        return (
                          <div
                            key={site.id}
                            onClick={() => toggleSite(site.id)}
                            className="flex items-center gap-3 px-6 py-2.5 cursor-pointer transition-colors"
                            style={{
                              background: isSelected ? "rgba(212,255,79,0.06)" : "rgba(255,255,255,0.01)",
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSite(site.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 accent-[#D4FF4F] cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{site.label}</div>
                              <div className="text-xs" style={{ color: "#666" }}>
                                {fmtSiteType(site.site_type)}
                                {(site.width_cm != null || site.height_cm != null) ? ` · ${fmtDimensionsM(site.width_cm, site.height_cm, { compact: true })}` : ""}
                                {site.location_in_venue ? ` · ${site.location_in_venue.replace(/_/g, " ")}` : ""}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-bold" style={{ fontFamily: "Inter Tight, sans-serif", color: isSelected ? "#D4FF4F" : "#fff" }}>
                                {fmtR(Math.round(site.price_per_month ?? 0))}
                              </div>
                              {(() => {
                                const [impr, isEst] = effectiveImpressions(site);
                                return impr > 0 ? (
                                  <div className="text-xs" style={{ color: "#666" }}>
                                    {fmtNum(impr)} impr{isEst ? <sup style={{ color: "#555", fontSize: "0.6em" }}> (est.)</sup> : null}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSites.length === 0 && (
              <div className="text-center py-8" style={{ color: "#555" }}>
                <Layers size={24} strokeWidth={1.5} className="mx-auto mb-2" />
                <p className="text-sm">No sites match the current filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Province breakdown ────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderRadius: 16 }}>
        <div className="flex items-center justify-between mb-4">
          <p style={LABEL}>Province Breakdown</p>
          <SectionToggle id="province" label={`${sitesByProvince.length} provinces`} icon={Globe} />
        </div>

        {expandedSection === "province" && (
          <div style={{ overflow: "hidden", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Province", "Sites", "Monthly Value", "Impressions/mo"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                        letterSpacing: "0.06em", color: "#555",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(255,255,255,0.02)",
                        textAlign: "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sitesByProvince.map(([province, provSites]) => {
                  const provMonthly = provSites.reduce((s, site) => s + (site.price_per_month ?? 0), 0);
                  const provImpressions = provSites.reduce((s, site) => s + effectiveImpressions(site)[0], 0);
                  return (
                    <tr key={province} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "11px 14px", fontSize: "13px", color: "#C0C0C0", fontWeight: 600 }}>{province}</td>
                      <td style={{ padding: "11px 14px", fontSize: "13px", color: "#C0C0C0" }}>{provSites.length}</td>
                      <td style={{ padding: "11px 14px", fontSize: "13px", color: "#D4FF4F", fontWeight: 700, fontFamily: "Inter Tight, sans-serif" }}>{fmtR(Math.round(provMonthly))}</td>
                      <td style={{ padding: "11px 14px", fontSize: "13px", color: "#A1A1AA" }}>{fmtNum(provImpressions)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Download toolbar ─────────────────────────────────────────────────── */}
      <div
        className="glass-card rounded-2xl p-6 flex flex-wrap items-center gap-4"
        style={{ borderRadius: 16, borderColor: "rgba(212,255,79,0.15)", borderWidth: 1, borderStyle: "solid" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            {quoteSites.length} site{quoteSites.length !== 1 ? "s" : ""} selected
            {selectedSites.length === 0 ? " (all visible)" : ""}
            {" · "}<span style={{ color: "#D4FF4F" }}>{fmtR(Math.round(totalMonthlyValue))}/mo</span>
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#555" }}>
            Annual: {fmtR(Math.round(annualValue))} · {fmtNum(totalImpressions)} impressions/mo
          </p>
          {pdfStatus && (
            <p className="text-xs mt-1 font-semibold" style={{ color: "#D4FF4F" }}>{pdfStatus}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={openPrintPage}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <Printer size={16} strokeWidth={2} />
            Print in Browser
          </button>
          <button
            onClick={downloadPdf}
            disabled={!!pdfStatus}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: pdfStatus ? "rgba(212,255,79,0.4)" : "#D4FF4F",
              color: "#0a0a0a",
              border: "none",
              cursor: pdfStatus ? "not-allowed" : "pointer",
            }}
          >
            <FileText size={16} strokeWidth={2.5} />
            {pdfStatus || "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
