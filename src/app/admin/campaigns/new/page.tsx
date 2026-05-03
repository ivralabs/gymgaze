"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type GymBrand = { name: string };

type Venue = {
  id: string;
  name: string;
  city: string;
  region: string | null; // schema uses "region" (not province)
  status: string;
  active_members: number;
  gym_brand_id: string | null;
  gym_brands: GymBrand | null;
};

type DealType = "fixed" | "cpm" | "share";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const MIN_MEMBERS_OPTIONS = [
  { label: "Any", value: 0 },
  { label: "100+", value: 100 },
  { label: "250+", value: 250 },
  { label: "500+", value: 500 },
  { label: "1000+", value: 1000 },
];

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtR(n: number | null | undefined) {
  if (n == null) return "—";
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const glass = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "20px",
} as const;

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  outline: "none",
  width: "100%",
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "14px",
} as const;

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "500" as const,
  marginBottom: "8px",
  color: "#C8C8C8",
};

const sectionLabel = {
  fontSize: "11px",
  fontWeight: "600" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#D4FF4F",
  marginBottom: "20px",
};

const divider = { borderTop: "1px solid rgba(255,255,255,0.08)", margin: "16px 0" };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter();

  // All venues fetched
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);

  // Filter state
  const [filterProvince, setFilterProvince] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterNetwork, setFilterNetwork] = useState("");
  const [filterMinMembers, setFilterMinMembers] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [advertiser, setAdvertiser] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Deal structure
  const [dealType, setDealType] = useState<DealType>("fixed");
  const [amountFixed, setAmountFixed] = useState("");
  const [cpmRate, setCpmRate] = useState("");
  const [cpmOverride, setCpmOverride] = useState("");
  const [revenueSharePct, setRevenueSharePct] = useState("");
  const [gymSharePct, setGymSharePct] = useState("0");

  // Submit state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch venues ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((data) => {
        setAllVenues(Array.isArray(data) ? data : []);
        setVenuesLoading(false);
      })
      .catch(() => setVenuesLoading(false));
  }, []);

  // ─── Derived filter options ────────────────────────────────────────────────
  const uniqueNetworks = useMemo(() => {
    const names = allVenues
      .map((v) => v.gym_brands?.name)
      .filter(Boolean) as string[];
    return Array.from(new Set(names)).sort();
  }, [allVenues]);

  const citiesForProvince = useMemo(() => {
    const base = filterProvince
      ? allVenues.filter((v) => v.region === filterProvince)
      : allVenues;
    const cities = base.map((v) => v.city).filter(Boolean);
    return Array.from(new Set(cities)).sort();
  }, [allVenues, filterProvince]);

  // ─── Matched venues ────────────────────────────────────────────────────────
  const matchedVenues = useMemo(() => {
    return allVenues.filter((v) => {
      if (filterProvince && v.region !== filterProvince) return false;
      if (filterCity && v.city !== filterCity) return false;
      if (filterNetwork && v.gym_brands?.name !== filterNetwork) return false;
      if (filterMinMembers && (v.active_members ?? 0) < filterMinMembers) return false;
      return true;
    });
  }, [allVenues, filterProvince, filterCity, filterNetwork, filterMinMembers]);

  // ─── Selected venue objects ────────────────────────────────────────────────
  const selectedVenueObjects = useMemo(
    () => allVenues.filter((v) => selectedVenues.includes(v.id)),
    [allVenues, selectedVenues]
  );

  // ─── Calculations ──────────────────────────────────────────────────────────
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const diff = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : null;
  }, [startDate, endDate]);

  const totalMembers = useMemo(
    () =>
      selectedVenueObjects.reduce(
        (sum, v) => sum + (v.active_members ?? 0),
        0
      ),
    [selectedVenueObjects]
  );

  const estimatedImpressions = useMemo(() => {
    if (!durationDays || totalMembers === 0) return 0;
    return Math.round(totalMembers * durationDays * 0.3);
  }, [totalMembers, durationDays]);

  const estimatedTotal = useMemo((): number | null => {
    if (dealType === "fixed") {
      return amountFixed ? parseFloat(amountFixed) : null;
    }
    if (dealType === "cpm") {
      if (cpmOverride) return parseFloat(cpmOverride);
      if (!cpmRate) return null;
      return (parseFloat(cpmRate) * estimatedImpressions) / 1000;
    }
    return null; // share = variable
  }, [dealType, amountFixed, cpmRate, cpmOverride, estimatedImpressions]);

  const gymCut = useMemo(() => {
    if (estimatedTotal == null) return null;
    const pct = parseFloat(gymSharePct || "0");
    return (estimatedTotal * pct) / 100;
  }, [estimatedTotal, gymSharePct]);

  const gymgazeMargin = useMemo(() => {
    if (estimatedTotal == null) return null;
    return estimatedTotal - (gymCut ?? 0);
  }, [estimatedTotal, gymCut]);

  // ─── Venue toggle helpers ──────────────────────────────────────────────────
  function toggleVenue(id: string) {
    setSelectedVenues((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function selectAll() {
    const ids = matchedVenues.map((v) => v.id);
    setSelectedVenues((prev) => Array.from(new Set([...prev, ...ids])));
  }

  function clearAll() {
    const ids = new Set(matchedVenues.map((v) => v.id));
    setSelectedVenues((prev) => prev.filter((id) => !ids.has(id)));
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const chargedAmount =
      dealType === "fixed"
        ? amountFixed
          ? parseFloat(amountFixed)
          : null
        : dealType === "cpm"
        ? estimatedTotal
        : null;

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          advertiser: advertiser || null,
          contact_person: contactPerson || null,
          contact_email: contactEmail || null,
          start_date: startDate || null,
          end_date: endDate || null,
          deal_type: dealType,
          amount_charged_zar: chargedAmount,
          cpm_rate: dealType === "cpm" && cpmRate ? parseFloat(cpmRate) : null,
          revenue_share_percent:
            dealType === "share" && revenueSharePct
              ? parseFloat(revenueSharePct)
              : null,
          gym_revenue_share_percent: gymSharePct ? parseFloat(gymSharePct) : null,
          notes: notes || null,
          venue_ids: selectedVenues,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create campaign");
      }
      router.push("/admin/campaigns");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  }

  // ─── Pill toggle component ─────────────────────────────────────────────────
  function DealPill({
    value,
    label,
  }: {
    value: DealType;
    label: string;
  }) {
    const active = dealType === value;
    return (
      <button
        type="button"
        onClick={() => setDealType(value)}
        style={{
          padding: "8px 18px",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          border: active
            ? "1px solid rgba(212,255,79,0.4)"
            : "1px solid rgba(255,255,255,0.10)",
          background: active
            ? "rgba(212,255,79,0.12)"
            : "rgba(255,255,255,0.04)",
          color: active ? "#D4FF4F" : "#A3A3A3",
          transition: "all 0.15s",
        }}
      >
        {label}
      </button>
    );
  }

  // ─── Dropdown style ────────────────────────────────────────────────────────
  const selectStyle = {
    ...inputStyle,
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    cursor: "pointer",
    paddingRight: "36px",
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "32px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <Link
          href="/admin/campaigns"
          style={{
            padding: "8px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#C8C8C8",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            New Campaign
          </h1>
          <p style={{ color: "#B0B0B0", fontSize: "13px", marginTop: "2px" }}>
            Build a smart media plan
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "20px",
            fontSize: "13px",
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#EF4444",
          }}
        >
          {error}
        </div>
      )}

      {/* Two-column layout */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60% 40%",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* ── LEFT COLUMN ── */}
          <div>
            {/* ── SECTION 1: Campaign Details ── */}
            <div style={glass}>
              <p style={sectionLabel}>Campaign Details</p>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Campaign Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Protein Campaign"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Advertiser / Brand *</label>
                <input
                  required
                  value={advertiser}
                  onChange={(e) => setAdvertiser(e.target.value)}
                  placeholder="e.g. Evox Nutrition"
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label style={labelStyle}>Contact Person</label>
                  <input
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Agency or brand contact"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@brand.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>
            </div>

            {/* ── SECTION 2: Flight Dates ── */}
            <div style={glass}>
              <p style={sectionLabel}>Flight Dates</p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Date *</label>
                  <input
                    required
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {durationDays && (
                <p style={{ color: "#D4FF4F", fontSize: "13px", marginTop: "10px" }}>
                  {durationDays} day campaign
                </p>
              )}
            </div>

            {/* ── SECTION 3: Venue Targeting ── */}
            <div style={glass}>
              <p style={sectionLabel}>Venue Targeting</p>

              {/* Filter row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                {/* Province */}
                <div style={{ position: "relative", flex: "1 1 140px" }}>
                  <select
                    value={filterProvince}
                    onChange={(e) => {
                      setFilterProvince(e.target.value);
                      setFilterCity("");
                    }}
                    style={selectStyle}
                  >
                    <option value="">All Provinces</option>
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div style={{ position: "relative", flex: "1 1 120px" }}>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">All Cities</option>
                    {citiesForProvince.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Network */}
                <div style={{ position: "relative", flex: "1 1 140px" }}>
                  <select
                    value={filterNetwork}
                    onChange={(e) => setFilterNetwork(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">All Networks</option>
                    {uniqueNetworks.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min members */}
                <div style={{ position: "relative", flex: "1 1 120px" }}>
                  <select
                    value={filterMinMembers}
                    onChange={(e) => setFilterMinMembers(Number(e.target.value))}
                    style={selectStyle}
                  >
                    {MIN_MEMBERS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Matched count + controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "13px", color: "#B0B0B0" }}>
                  <span style={{ color: "#FFFFFF", fontWeight: 600 }}>
                    {matchedVenues.length}
                  </span>{" "}
                  venue{matchedVenues.length !== 1 ? "s" : ""} match
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={selectAll}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#D4FF4F",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 4px",
                    }}
                  >
                    Select All
                  </button>
                  <span style={{ color: "#777" }}>·</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#B0B0B0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 4px",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Venue list */}
              {venuesLoading ? (
                <p style={{ fontSize: "13px", color: "#B0B0B0" }}>
                  Loading venues...
                </p>
              ) : matchedVenues.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#B0B0B0" }}>
                  No venues match the selected filters.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "320px",
                    overflowY: "auto",
                  }}
                >
                  {matchedVenues.map((venue) => {
                    const checked = selectedVenues.includes(venue.id);
                    return (
                      <label
                        key={venue.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          cursor: "pointer",
                          background: checked
                            ? "rgba(212,255,79,0.06)"
                            : "rgba(255,255,255,0.03)",
                          border: `1px solid ${
                            checked
                              ? "rgba(212,255,79,0.20)"
                              : "rgba(255,255,255,0.08)"
                          }`,
                          transition: "all 0.15s",
                        }}
                      >
                        {/* Custom checkbox */}
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "4px",
                            flexShrink: 0,
                            marginTop: "2px",
                            backgroundColor: checked ? "#D4FF4F" : "transparent",
                            border: `1.5px solid ${
                              checked ? "#D4FF4F" : "rgba(255,255,255,0.15)"
                            }`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {checked && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="#0A0A0A"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={checked}
                          onChange={() => toggleVenue(venue.id)}
                          style={{ display: "none" }}
                        />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#FFFFFF",
                              margin: 0,
                            }}
                          >
                            {venue.name}
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#B0B0B0",
                              margin: "2px 0 0",
                            }}
                          >
                            {[venue.city, venue.region].filter(Boolean).join(", ")}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#999",
                              margin: "2px 0 0",
                            }}
                          >
                            Network: {venue.gym_brands?.name ?? "—"} &nbsp;·&nbsp; Members:{" "}
                            {venue.active_members
                              ? venue.active_members.toLocaleString("en-ZA")
                              : "—"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 4: Deal Structure ── */}
            <div style={glass}>
              <p style={sectionLabel}>Deal Structure</p>

              {/* Deal type pill toggle */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                <DealPill value="fixed" label="Fixed Fee" />
                <DealPill value="cpm" label="CPM" />
                <DealPill value="share" label="Revenue Share" />
              </div>

              {/* Fixed Fee */}
              {dealType === "fixed" && (
                <div>
                  <label style={labelStyle}>Total Amount (ZAR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountFixed}
                    onChange={(e) => setAmountFixed(e.target.value)}
                    placeholder="e.g. 25000"
                    style={inputStyle}
                  />
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginTop: "8px",
                    }}
                  >
                    Advertiser pays a fixed amount for the campaign run.
                  </p>
                </div>
              )}

              {/* CPM */}
              {dealType === "cpm" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>CPM Rate (ZAR per 1,000 impressions) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cpmRate}
                      onChange={(e) => setCpmRate(e.target.value)}
                      placeholder="e.g. 45"
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p style={{ fontSize: "12px", color: "#999", margin: "0 0 6px" }}>
                      Estimated Impressions
                    </p>
                    <p
                      style={{
                        fontSize: "18px",
                        fontFamily: "Inter Tight, sans-serif",
                        fontWeight: 700,
                        color: "#FFFFFF",
                        margin: 0,
                      }}
                    >
                      {estimatedImpressions.toLocaleString("en-ZA")}
                    </p>
                    <p style={{ fontSize: "11px", color: "#8A8A8A", marginTop: "4px" }}>
                      {totalMembers.toLocaleString()} members × {durationDays ?? 0} days × 0.3
                      daily visibility
                    </p>

                    {cpmRate && estimatedImpressions > 0 && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#D4FF4F",
                          marginTop: "10px",
                        }}
                      >
                        R{cpmRate} CPM × {estimatedImpressions.toLocaleString()} est. impressions
                        ={" "}
                        <strong>
                          {fmtR((parseFloat(cpmRate) * estimatedImpressions) / 1000)}
                        </strong>
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Override Total (ZAR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cpmOverride}
                      onChange={(e) => setCpmOverride(e.target.value)}
                      placeholder="Optional manual override"
                      style={inputStyle}
                    />
                    <p style={{ fontSize: "12px", color: "#8A8A8A", marginTop: "6px" }}>
                      If set, this overrides the auto-calculated CPM total.
                    </p>
                  </div>
                </div>
              )}

              {/* Revenue Share */}
              {dealType === "share" && (
                <div>
                  <label style={labelStyle}>Revenue Share % *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={revenueSharePct}
                    onChange={(e) => setRevenueSharePct(e.target.value)}
                    placeholder="e.g. 20"
                    style={{ ...inputStyle, width: "160px" }}
                  />
                  <p style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
                    Billed monthly based on actual ad revenue generated.
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#B0B0B0",
                      marginTop: "12px",
                      fontStyle: "italic",
                    }}
                  >
                    Total: Variable — based on delivery
                  </p>
                </div>
              )}

              {/* Gym Revenue Split (CPM + Share + Fixed) */}
              {(dealType === "cpm" || dealType === "share" || dealType === "fixed") && (
                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "20px",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#D4FF4F",
                      marginBottom: "4px",
                    }}
                  >
                    Gym Revenue Split
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#8A8A8A",
                      marginBottom: "14px",
                    }}
                  >
                    Specify what % of advertiser revenue goes to the gym.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>Gym Share %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={gymSharePct}
                        onChange={(e) => setGymSharePct(e.target.value)}
                        placeholder="0"
                        style={{ ...inputStyle, width: "120px" }}
                      />
                    </div>
                  </div>

                  {estimatedTotal != null && (
                    <div
                      style={{
                        marginTop: "14px",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        fontSize: "13px",
                        lineHeight: "1.8",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#999" }}>Advertiser pays:</span>
                        <span style={{ color: "#FFFFFF", fontWeight: 600 }}>
                          {fmtR(estimatedTotal)}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#999" }}>
                          Gym share ({gymSharePct || 0}%):
                        </span>
                        <span style={{ color: "#B0B0B0" }}>{fmtR(gymCut)}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "4px",
                          paddingTop: "6px",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <span style={{ color: "#D4FF4F", fontWeight: 600 }}>
                          GymGaze keeps:
                        </span>
                        <span
                          style={{
                            color: "#D4FF4F",
                            fontFamily: "Inter Tight, sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {fmtR(gymgazeMargin)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Sticky Summary ── */}
          <div style={{ position: "sticky", top: "32px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#D4FF4F",
                  marginBottom: "20px",
                }}
              >
                Campaign Summary
              </p>

              {/* Campaign info */}
              <div style={{ marginBottom: "4px" }}>
                <SummaryRow label="Campaign" value={name || "—"} />
                <SummaryRow label="Advertiser" value={advertiser || "—"} />
                <SummaryRow
                  label="Duration"
                  value={
                    durationDays
                      ? `${durationDays} days (${formatDate(startDate)} – ${formatDate(endDate)})`
                      : "—"
                  }
                />
              </div>

              <div style={divider} />

              {/* Inventory */}
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#8A8A8A",
                  marginBottom: "12px",
                }}
              >
                Inventory
              </p>
              <SummaryRow
                label="Venues"
                value={`${selectedVenues.length} selected`}
              />
              <SummaryRow
                label="Est. Reach"
                value={
                  totalMembers > 0
                    ? `${totalMembers.toLocaleString("en-ZA")} members`
                    : "—"
                }
              />

              <div style={divider} />

              {/* Financials */}
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#8A8A8A",
                  marginBottom: "12px",
                }}
              >
                Financials
              </p>
              <SummaryRow
                label="Deal Type"
                value={
                  dealType === "fixed"
                    ? "Fixed Fee"
                    : dealType === "cpm"
                    ? "CPM"
                    : "Revenue Share"
                }
              />

              {dealType === "fixed" && (
                <SummaryRow label="Total" value={amountFixed ? fmtR(parseFloat(amountFixed)) : "—"} highlight />
              )}

              {dealType === "cpm" && (
                <>
                  <SummaryRow
                    label="Rate"
                    value={cpmRate ? `R${cpmRate}/CPM` : "—"}
                  />
                  <SummaryRow
                    label="Est. Impressions"
                    value={
                      estimatedImpressions > 0
                        ? estimatedImpressions.toLocaleString("en-ZA")
                        : "—"
                    }
                  />
                  <SummaryRow
                    label="Total"
                    value={estimatedTotal != null ? fmtR(estimatedTotal) : "—"}
                    highlight
                  />
                </>
              )}

              {dealType === "share" && (
                <SummaryRow
                  label="Revenue Share"
                  value={
                    revenueSharePct
                      ? `${revenueSharePct}% of revenue (variable)`
                      : "Variable — based on delivery"
                  }
                />
              )}

              {gymSharePct && parseFloat(gymSharePct) > 0 && (
                <SummaryRow
                  label="Gym Split"
                  value={`${gymSharePct}%${gymCut != null ? ` (${fmtR(gymCut)} est.)` : ""}`}
                />
              )}

              {gymgazeMargin != null && (
                <SummaryRow
                  label="GymGaze"
                  value={`${fmtR(gymgazeMargin)} (est. margin)`}
                  highlight
                />
              )}

              <div style={divider} />

              {/* Submit button */}
              <button
                type="submit"
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: "Inter Tight, sans-serif",
                  cursor: saving ? "not-allowed" : "pointer",
                  backgroundColor: saving ? "#555" : "#D4FF4F",
                  color: "#0A0A0A",
                  border: "none",
                  letterSpacing: "-0.01em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {saving ? "Creating..." : "Create Campaign →"}
              </button>

              <Link
                href="/admin/campaigns"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "#8A8A8A",
                  textDecoration: "none",
                }}
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Summary Row ───────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "8px",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "12px", color: "#999", flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: "13px",
          fontWeight: highlight ? 700 : 500,
          fontFamily: highlight ? "Inter Tight, sans-serif" : undefined,
          color: highlight ? "#FFFFFF" : "#A3A3A3",
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}
