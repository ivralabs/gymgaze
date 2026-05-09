"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Check } from "lucide-react";
import type { Campaign, VenueBrief, CampaignFormat, CampaignStatus, ClientType } from "./CampaignsClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  venues: VenueBrief[];
  onClose: () => void;
  onCreated: (campaign: Campaign) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CPM_RATES: Record<CampaignFormat, number> = {
  standard_7s:   65,
  premium_15s:   85,
  prime_15s:     120,
  spotlight_30s: 160,
};

const FORMAT_OPTIONS: { value: CampaignFormat; label: string; rate: number }[] = [
  { value: "standard_7s",   label: "Standard 7s",   rate: 65 },
  { value: "premium_15s",   label: "Premium 15s",   rate: 85 },
  { value: "prime_15s",     label: "Prime 15s",     rate: 120 },
  { value: "spotlight_30s", label: "Spotlight 30s", rate: 160 },
];

const STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: "draft",     label: "Draft" },
  { value: "active",    label: "Active" },
  { value: "paused",    label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const WEEKLY_IMPRESSIONS_PER_VENUE = 1487;

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  outline: "none",
  width: "100%",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  marginBottom: "6px",
  color: "#C8C8C8",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#D4FF4F",
  marginBottom: "14px",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateCampaignModal({ venues, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [clientName, setClientName] = useState("");
  const [clientType, setClientType] = useState<ClientType>("agency");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [format, setFormat] = useState<CampaignFormat>("premium_15s");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("draft");

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ─── Live CPM calculation ─────────────────────────────────────────────────

  const weeks = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 7);
    return diff > 0 ? Math.ceil(diff) : 0;
  }, [startDate, endDate]);

  const venueCount = selectedVenues.length;
  const cpmRate = CPM_RATES[format];
  const totalImpressions = WEEKLY_IMPRESSIONS_PER_VENUE * weeks * venueCount;
  const totalValue = Math.round((totalImpressions / 1000) * cpmRate);

  const breakdownText = useMemo(() => {
    if (!weeks || !venueCount) return null;
    return `${WEEKLY_IMPRESSIONS_PER_VENUE.toLocaleString()} × ${weeks} week${weeks !== 1 ? "s" : ""} × ${venueCount} venue${venueCount !== 1 ? "s" : ""} = ${totalImpressions.toLocaleString()} impressions @ R${cpmRate} CPM = R${totalValue.toLocaleString("en-ZA")}`;
  }, [weeks, venueCount, totalImpressions, cpmRate, totalValue]);

  // ─── Venue toggle ─────────────────────────────────────────────────────────

  function toggleVenue(id: string) {
    setSelectedVenues((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) { setError("Client name is required"); return; }
    if (!startDate || !endDate) { setError("Start and end dates are required"); return; }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName.trim(),
          client_type: clientType,
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
          format,
          status,
          start_date: startDate,
          end_date: endDate,
          total_value: totalValue,
          amount_collected: 0,
          notes: notes || null,
          venue_ids: selectedVenues,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create campaign");
      }

      const created = await res.json();
      onCreated(created as Campaign);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating campaign");
      setSaving(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.10)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            <h2
              className="text-base font-bold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.01em" }}
            >
              New Campaign
            </h2>
            <p style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
              CPM-based ad campaign
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "rgba(255,255,255,0.07)", color: "#A3A3A3" }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-7">
          {error && (
            <div
              className="text-sm px-4 py-3 rounded-xl"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
            >
              {error}
            </div>
          )}

          <form id="create-campaign-form" onSubmit={handleSubmit}>
            {/* ── Section 1: Client ── */}
            <div>
              <p style={sectionTitle}>Client</p>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Client Name *</label>
                  <input
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Evox Nutrition, Brand X"
                    style={inputStyle}
                  />
                </div>

                {/* Client type toggle */}
                <div>
                  <label style={labelStyle}>Client Type</label>
                  <div className="flex gap-2">
                    {(["agency", "direct"] as ClientType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setClientType(t)}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          border: clientType === t ? "1px solid rgba(212,255,79,0.4)" : "1px solid rgba(255,255,255,0.10)",
                          background: clientType === t ? "rgba(212,255,79,0.10)" : "rgba(255,255,255,0.04)",
                          color: clientType === t ? "#D4FF4F" : "#A3A3A3",
                        }}
                      >
                        {t === "agency" ? "Agency" : "Direct Brand"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label style={labelStyle}>Contact Name</label>
                    <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@co.za" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+27 ..." style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: Format ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={sectionTitle}>Ad Format</p>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((f) => {
                  const active = format === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFormat(f.value)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left"
                      style={{
                        border: active ? "1px solid rgba(212,255,79,0.35)" : "1px solid rgba(255,255,255,0.08)",
                        background: active ? "rgba(212,255,79,0.08)" : "rgba(255,255,255,0.03)",
                        color: active ? "#D4FF4F" : "#A3A3A3",
                      }}
                    >
                      <span>{f.label}</span>
                      <span
                        className="text-xs font-medium ml-2"
                        style={{ color: active ? "#D4FF4F" : "#666" }}
                      >
                        R{f.rate} CPM
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section 3: Venues ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ ...sectionTitle, marginBottom: 0 }}>Venues</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedVenues(venues.map((v) => v.id))}
                    className="text-xs font-medium"
                    style={{ color: "#D4FF4F" }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVenues([])}
                    className="text-xs font-medium"
                    style={{ color: "#A3A3A3" }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>
                {selectedVenues.length} of {venues.length} venues selected
              </p>
              <div
                className="space-y-1.5 overflow-y-auto"
                style={{ maxHeight: 220 }}
              >
                {venues.map((venue) => {
                  const checked = selectedVenues.includes(venue.id);
                  return (
                    <label
                      key={venue.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: checked ? "rgba(212,255,79,0.06)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${checked ? "rgba(212,255,79,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {/* Custom checkbox */}
                      <div
                        className="flex-shrink-0 flex items-center justify-center"
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          backgroundColor: checked ? "#D4FF4F" : "transparent",
                          border: `1.5px solid ${checked ? "#D4FF4F" : "rgba(255,255,255,0.15)"}`,
                        }}
                        onClick={() => toggleVenue(venue.id)}
                      >
                        {checked && <Check size={10} strokeWidth={3} color="#0A0A0A" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleVenue(venue.id)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{venue.name}</p>
                        <p style={{ fontSize: 11, color: "#999" }}>{venue.city ?? "—"}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Section 4: Dates ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={sectionTitle}>Campaign Dates</p>
              <div className="grid grid-cols-2 gap-3">
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
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
              {weeks > 0 && (
                <p style={{ fontSize: 13, color: "#D4FF4F", marginTop: 8 }}>
                  {weeks} week{weeks !== 1 ? "s" : ""} duration
                </p>
              )}
            </div>

            {/* ── Section 5: CPM Calculation ── */}
            {(weeks > 0 || venueCount > 0) && (
              <div
                className="rounded-xl px-4 py-4"
                style={{ background: "rgba(212,255,79,0.05)", border: "1px solid rgba(212,255,79,0.15)" }}
              >
                <p style={{ ...sectionTitle, color: "#D4FF4F", marginBottom: 8 }}>
                  Auto-Calculated Value
                </p>
                {breakdownText ? (
                  <p style={{ fontSize: 13, color: "#C8C8C8", lineHeight: 1.6 }}>
                    {breakdownText}
                  </p>
                ) : (
                  <p style={{ fontSize: 12, color: "#999" }}>
                    Select venues and dates to see the calculation.
                  </p>
                )}
                {totalValue > 0 && (
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "Inter Tight, sans-serif",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#D4FF4F",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    R{totalValue.toLocaleString("en-ZA")}
                  </p>
                )}
                {totalValue > 0 && totalValue < 2500 && (
                  <p className="mt-1" style={{ fontSize: 12, color: "#FB923C" }}>
                    ⚠ Below minimum spend of R2,500
                  </p>
                )}
              </div>
            )}

            {/* ── Section 6: Notes + Status ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Any additional notes..."
                    style={{ ...inputStyle, resize: "none" }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                    style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0 gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-campaign-form"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: saving ? "#555" : "#D4FF4F",
              color: "#0A0A0A",
              fontFamily: "Inter Tight, sans-serif",
            }}
          >
            {saving ? "Creating…" : "Create Campaign →"}
          </button>
        </div>
      </div>
    </div>
  );
}
