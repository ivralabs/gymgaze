"use client";

import { useState, useEffect, useMemo } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { Sponsorship, VenueBrief, WidgetType, BillingPeriod, Coverage } from "./SponsorshipsClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  venues: VenueBrief[];
  sponsorships: Sponsorship[];
  preselectedWidget?: WidgetType;
  onClose: () => void;
  onCreated: (s: Sponsorship) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WIDGET_OPTIONS: { value: WidgetType; label: string; monthly: number; weekly: number; emoji: string }[] = [
  { value: "news",    label: "News",           emoji: "📰", monthly: 12000, weekly: 3500 },
  { value: "sports",  label: "Sports",         emoji: "⚽", monthly: 15000, weekly: 4500 },
  { value: "weather", label: "Weather",        emoji: "🌤️", monthly: 8500,  weekly: 2500 },
  { value: "bundle",  label: "All 3 Bundle",   emoji: "✨", monthly: 30000, weekly: 0 },
];

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
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#D4FF4F",
  marginBottom: "14px",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateSponsorshipModal({
  venues,
  sponsorships,
  preselectedWidget,
  onClose,
  onCreated,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [widgetType, setWidgetType] = useState<WidgetType>(preselectedWidget ?? "news");
  const [coverage, setCoverage] = useState<Coverage>("network");
  const [city, setCity] = useState("");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [rate, setRate] = useState<number>(12000);
  const [brandColour, setBrandColour] = useState("#FF6B35");
  const [tagline, setTagline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Auto-populate rate when widget or billing period changes
  useEffect(() => {
    const opt = WIDGET_OPTIONS.find((o) => o.value === widgetType);
    if (!opt) return;
    const newRate = billingPeriod === "monthly" ? opt.monthly : opt.weekly;
    setRate(newRate);
  }, [widgetType, billingPeriod]);

  // Unique cities from venues
  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const v of venues) {
      if (v.city) set.add(v.city);
    }
    return Array.from(set).sort();
  }, [venues]);

  // Conflict detection
  const conflictingSponsor = useMemo<Sponsorship | null>(() => {
    if (widgetType === "bundle") {
      // Check if any of news/sports/weather is active at network scope
      return sponsorships.find((s) =>
        s.status === "active" &&
        ["news", "sports", "weather"].includes(s.widget_type) &&
        s.coverage === "network"
      ) ?? null;
    }
    return sponsorships.find((s) => {
      if (s.status !== "active") return false;
      if (s.widget_type !== widgetType && s.widget_type !== "bundle") return false;
      if (coverage === "network") {
        return s.coverage === "network" || s.widget_type === "bundle";
      }
      // city coverage
      return (s.coverage === "network" || s.widget_type === "bundle") ||
             (s.coverage === "city" && s.city === city);
    }) ?? null;
  }, [widgetType, coverage, city, sponsorships]);

  // Handle logo file selection
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) { setError("Brand name is required"); return; }
    if (!startDate) { setError("Start date is required"); return; }
    if (coverage === "city" && !city) { setError("Please select a city"); return; }
    if (billingPeriod === "weekly" && widgetType === "bundle") {
      setError("Bundle sponsorships are monthly only");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Create the sponsorship record first
      const res = await fetch("/api/sponsorships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name:    brandName.trim(),
          contact_name:  contactName || null,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
          widget_type:   widgetType,
          coverage,
          city:          coverage === "city" ? city : null,
          billing_period: billingPeriod,
          rate,
          status:        "active",
          start_date:    startDate,
          end_date:      endDate || null,
          brand_colour:  brandColour,
          tagline:       tagline || null,
          notes:         notes || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Failed to create sponsorship");
      }

      const created = await res.json() as Sponsorship;

      // 2. Upload logo if provided (best-effort — don't fail if storage not configured)
      if (logoFile && created.id) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const ext = logoFile.name.split(".").pop() ?? "png";
          const path = `sponsorships/${created.id}/logo.${ext}`;

          const { data: uploadData } = await supabase.storage
            .from("sponsorships")
            .upload(path, logoFile, { upsert: true });

          if (uploadData) {
            const { data: urlData } = supabase.storage
              .from("sponsorships")
              .getPublicUrl(path);

            if (urlData?.publicUrl) {
              // Patch logo_url
              await fetch(`/api/sponsorships/${created.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logo_url: urlData.publicUrl }),
              });
              created.logo_url = urlData.publicUrl;
            }
          }
        } catch {
          // Logo upload failed — continue without logo
        }
      }

      onCreated(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating sponsorship");
      setSaving(false);
    }
  }

  const isBundleWeekly = widgetType === "bundle" && billingPeriod === "weekly";

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
              New Sponsorship
            </h2>
            <p style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
              Widget sponsorship — flat monthly or weekly fee
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

          {/* Conflict warning */}
          {conflictingSponsor && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FDE68A" }}
            >
              <AlertTriangle size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5" style={{ color: "#FBBF24" }} />
              <span>
                <strong>{conflictingSponsor.brand_name}</strong> currently sponsors this widget
                {conflictingSponsor.end_date ? ` (ends ${formatDate(conflictingSponsor.end_date)})` : " (open-ended)"}.
                This sponsorship will be queued to start after theirs ends.
              </span>
            </div>
          )}

          <form id="create-sponsorship-form" onSubmit={handleSubmit}>

            {/* ── Section 1: Brand ── */}
            <div>
              <p style={sectionTitle}>Brand</p>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Brand Name *</label>
                  <input
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Nike SA, Castle Lager"
                    style={inputStyle}
                  />
                </div>
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

            {/* ── Section 2: Widget Type ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={sectionTitle}>Widget Type</p>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_OPTIONS.map((opt) => {
                  const active = widgetType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWidgetType(opt.value)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left"
                      style={{
                        border: active ? "1px solid rgba(212,255,79,0.35)" : "1px solid rgba(255,255,255,0.08)",
                        background: active ? "rgba(212,255,79,0.08)" : "rgba(255,255,255,0.03)",
                        color: active ? "#D4FF4F" : "#A3A3A3",
                      }}
                    >
                      <span>{opt.emoji} {opt.label}</span>
                      <span className="text-xs font-medium ml-2" style={{ color: active ? "#D4FF4F" : "#666" }}>
                        R{opt.monthly.toLocaleString("en-ZA")}/mo
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section 3: Coverage ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={sectionTitle}>Coverage</p>
              <div className="flex gap-2 mb-3">
                {(["network", "city"] as Coverage[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCoverage(c)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      border: coverage === c ? "1px solid rgba(212,255,79,0.4)" : "1px solid rgba(255,255,255,0.10)",
                      background: coverage === c ? "rgba(212,255,79,0.10)" : "rgba(255,255,255,0.04)",
                      color: coverage === c ? "#D4FF4F" : "#A3A3A3",
                    }}
                  >
                    {c === "network" ? "🌐 Full Network" : "📍 By City"}
                  </button>
                ))}
              </div>
              {coverage === "city" && (
                <div>
                  <label style={labelStyle}>City *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required={coverage === "city"}
                    style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                  >
                    <option value="">Select city…</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ── Section 4: Billing ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={sectionTitle}>Billing</p>
              <div className="space-y-4">
                {/* Billing period toggle */}
                <div>
                  <label style={labelStyle}>Billing Period</label>
                  <div className="flex gap-2">
                    {(["monthly", "weekly"] as BillingPeriod[]).map((p) => {
                      const disabled = p === "weekly" && widgetType === "bundle";
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && setBillingPeriod(p)}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            border: billingPeriod === p && !disabled ? "1px solid rgba(212,255,79,0.4)" : "1px solid rgba(255,255,255,0.10)",
                            background: billingPeriod === p && !disabled ? "rgba(212,255,79,0.10)" : "rgba(255,255,255,0.04)",
                            color: disabled ? "#555" : billingPeriod === p ? "#D4FF4F" : "#A3A3A3",
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.5 : 1,
                          }}
                        >
                          {p === "monthly" ? "Monthly" : "Weekly"}
                          {p === "weekly" && widgetType === "bundle" && (
                            <span className="block text-xs font-normal" style={{ color: "#666" }}>Bundle only monthly</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rate */}
                <div>
                  <label style={labelStyle}>Rate (auto-filled, editable for custom deals)</label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                      style={{ color: "#D4FF4F" }}
                    >
                      R
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={rate}
                      onChange={(e) => setRate(Number(e.target.value))}
                      style={{ ...inputStyle, paddingLeft: "28px" }}
                    />
                  </div>
                  {isBundleWeekly && (
                    <p className="text-xs mt-1" style={{ color: "#FB923C" }}>
                      Bundle sponsorships are sold on a monthly basis only.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 5: Branding ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={sectionTitle}>Branding</p>
              <div className="space-y-4">
                {/* Brand colour */}
                <div>
                  <label style={labelStyle}>Brand Colour</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColour}
                      onChange={(e) => setBrandColour(e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer flex-shrink-0"
                      style={{ background: "transparent", padding: 0 }}
                    />
                    <input
                      type="text"
                      value={brandColour}
                      onChange={(e) => setBrandColour(e.target.value)}
                      placeholder="#FF6B35"
                      maxLength={7}
                      style={{ ...inputStyle, fontFamily: "monospace" }}
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div>
                  <label style={labelStyle}>Tagline</label>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder={`Brought to you by ${brandName || "Brand"}`}
                    style={inputStyle}
                  />
                </div>

                {/* Logo upload */}
                <div>
                  <label style={labelStyle}>Logo (optional)</label>
                  <div className="flex items-center gap-3">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-12 h-12 rounded-lg object-contain flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      />
                    )}
                    <label
                      className="flex-1 flex items-center justify-center py-3 rounded-xl cursor-pointer transition-opacity hover:opacity-80 text-sm"
                      style={{
                        border: "1px dashed rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.02)",
                        color: "#888",
                      }}
                    >
                      {logoFile ? logoFile.name : "Click to upload logo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 6: Dates ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={sectionTitle}>Flight Dates</p>
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
                  <label style={labelStyle}>End Date <span style={{ color: "#666" }}>(optional — open-ended)</span></label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* ── Section 7: Notes ── */}
            <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional notes…"
                  style={{ ...inputStyle, resize: "none" }}
                />
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
            form="create-sponsorship-form"
            disabled={saving || isBundleWeekly}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: saving ? "#555" : "#D4FF4F",
              color: "#0A0A0A",
              fontFamily: "Inter Tight, sans-serif",
            }}
          >
            {saving ? "Creating…" : "Create Sponsorship →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return "open-ended";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}
