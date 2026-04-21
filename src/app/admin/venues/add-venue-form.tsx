"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Upload } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

type Brand = { id: string; name: string };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AddVenueForm({ brands }: { brands: Brand[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Section 1 — Venue Identity
  const [name, setName] = useState("");
  const [gymBrandId, setGymBrandId] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("active");

  // Section 2 — Photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Section 3 — Foot Traffic
  const [dailyEntries, setDailyEntries] = useState("");
  const [weeklyEntries, setWeeklyEntries] = useState("");
  const [monthlyEntries, setMonthlyEntries] = useState("");
  const [lastEntryDate, setLastEntryDate] = useState("");

  // Section 4 — Contract
  const [contractType, setContractType] = useState<"fixed" | "share" | "both" | null>(null);
  const [monthlyRental, setMonthlyRental] = useState("");
  const [revenueSharePercent, setRevenueSharePercent] = useState("");

  // Section 5 — Operational Details (UI only — not in DB schema yet)
  const [screenCount, setScreenCount] = useState("");
  const [capacity, setCapacity] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setName(""); setGymBrandId(""); setCity(""); setProvince("");
    setAddress(""); setRegion(""); setStatus("active");
    setPhotoFile(null); setPhotoPreview(null);
    setDailyEntries(""); setWeeklyEntries(""); setMonthlyEntries(""); setLastEntryDate("");
    setContractType(null); setMonthlyRental(""); setRevenueSharePercent("");
    setScreenCount(""); setCapacity(""); setOpeningHours(""); setManagerName(""); setManagerPhone("");
    setError(null);
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Build venue payload — only columns that exist in the schema
      const venuePayload: Record<string, unknown> = {
        name,
        city,
        address: address || null,
        gym_brand_id: gymBrandId || null,
        status,
        region: region || null,
      };

      // Foot traffic — columns exist in schema
      if (dailyEntries) venuePayload.daily_entries = parseInt(dailyEntries);
      if (weeklyEntries) venuePayload.weekly_entries = parseInt(weeklyEntries);
      if (monthlyEntries) venuePayload.monthly_entries = parseInt(monthlyEntries);

      // Step 1 — Create venue
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venuePayload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create venue");
      }

      const venue = await res.json();
      const venueId = venue.id;

      // Step 2 — Upload photo if selected
      if (photoFile && venueId) {
        try {
          const { error: uploadError } = await supabase.storage
            .from("venue-photos")
            .upload(`covers/${venueId}.webp`, photoFile, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("venue-photos")
              .getPublicUrl(`covers/${venueId}.webp`);

            if (urlData?.publicUrl) {
              // Try to update cover_photo_url — column may not exist yet, ignore errors
              await supabase
                .from("venues")
                .update({ cover_photo_url: urlData.publicUrl })
                .eq("id", venueId);
            }
          }
        } catch {
          // Photo upload is non-blocking — venue was created successfully
        }
      }

      // Step 3 — Create contract if type selected
      if (contractType) {
        try {
          const contractPayload: Record<string, unknown> = {
            venue_id: venueId,
            start_date: new Date().toISOString().split("T")[0],
            monthly_rental_zar:
              contractType === "fixed" || contractType === "both"
                ? monthlyRental
                  ? parseInt(monthlyRental)
                  : null
                : null,
            revenue_share_percent:
              contractType === "share" || contractType === "both"
                ? revenueSharePercent
                  ? parseFloat(revenueSharePercent)
                  : null
                : null,
          };

          await fetch("/api/contracts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contractPayload),
          });
        } catch {
          // Contract creation is non-blocking
        }
      }

      handleClose();
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    outline: "none",
    width: "100%",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "#A3A3A3",
    marginBottom: 6,
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#D4FF4F",
    marginBottom: 16,
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    margin: "24px 0",
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
        style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", height: "44px" }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Add Venue
      </button>

      {/* Overlay + Drawer — portalled to document.body to escape stacking context */}
      {mounted && open && createPortal(
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              zIndex: 50,
            }}
            onClick={handleClose}
          />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "600px",
          maxWidth: "100vw",
          zIndex: 51,
          display: "flex",
          flexDirection: "column",
          background: "rgba(15,15,15,0.97)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderLeft: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily: "Inter Tight, sans-serif",
            }}
          >
            Add Venue
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 8,
              padding: "6px 6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} color="#909090" strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#EF4444",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              {error}
            </div>
          )}

          <form id="add-venue-form" onSubmit={handleSubmit}>
            {/* ── SECTION 1: Venue Identity ─────────────────────────── */}
            <p style={sectionLabelStyle}>Venue Identity</p>

            {/* Venue Name — full width */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Venue Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. FitZone Sandton"
                style={inputStyle}
              />
            </div>

            {/* Network — full width */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Network *</label>
              <select
                value={gymBrandId}
                onChange={(e) => setGymBrandId(e.target.value)}
                required
                style={{ ...inputStyle, appearance: "none" }}
              >
                <option value="">Select network...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City + Province — 2-col */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>City *</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="e.g. Sandton"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Province</label>
                <input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="e.g. Gauteng"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Address — full width */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
                style={inputStyle}
              />
            </div>

            {/* Region + Status — 2-col */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 }}>
              <div>
                <label style={labelStyle}>Region / Area Tag</label>
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Cape Town CBD"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="coming_soon">Coming Soon</option>
                </select>
              </div>
            </div>

            <div style={dividerStyle} />

            {/* ── SECTION 2: Venue Cover Photo ──────────────────────── */}
            <p style={sectionLabelStyle}>Venue Cover Photo</p>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: "2rem",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(255,255,255,0.02)",
                transition: "border-color 0.2s",
                marginBottom: 0,
              }}
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Venue cover preview"
                  style={{ maxHeight: 160, borderRadius: 8, margin: "0 auto" }}
                />
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    <Upload size={24} color="#D4FF4F" />
                  </div>
                  <p style={{ color: "#A3A3A3", marginTop: 8, fontSize: 14 }}>
                    Click to upload venue cover photo
                  </p>
                  <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                    PNG, JPG up to 5MB
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />

            <div style={dividerStyle} />

            {/* ── SECTION 3: Foot Traffic ───────────────────────────── */}
            <p style={sectionLabelStyle}>Foot Traffic</p>
            <p style={{ color: "#666", fontSize: 12, marginBottom: 16, marginTop: -8 }}>
              Enter the most recent foot traffic data for this venue
            </p>

            {/* 3-col grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Daily Entries</label>
                <input
                  type="number"
                  value={dailyEntries}
                  onChange={(e) => setDailyEntries(e.target.value)}
                  placeholder="0"
                  min={0}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Weekly Entries</label>
                <input
                  type="number"
                  value={weeklyEntries}
                  onChange={(e) => setWeeklyEntries(e.target.value)}
                  placeholder="0"
                  min={0}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Monthly Entries</label>
                <input
                  type="number"
                  value={monthlyEntries}
                  onChange={(e) => setMonthlyEntries(e.target.value)}
                  placeholder="0"
                  min={0}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>Last Recorded Date</label>
              <input
                type="date"
                value={lastEntryDate}
                onChange={(e) => setLastEntryDate(e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>

            <div style={dividerStyle} />

            {/* ── SECTION 4: Contract ───────────────────────────────── */}
            <p style={sectionLabelStyle}>Contract Type</p>

            {/* Toggle pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {(["fixed", "share", "both"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setContractType(contractType === type ? null : type)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    ...(contractType === type
                      ? { backgroundColor: "#D4FF4F", color: "#0A0A0A", border: "none" }
                      : {
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "#A3A3A3",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }),
                  }}
                >
                  {type === "fixed" ? "Fixed Rental" : type === "share" ? "Revenue Share" : "Both"}
                </button>
              ))}
            </div>

            {/* Conditional contract fields */}
            {contractType && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 }}>
                {(contractType === "fixed" || contractType === "both") && (
                  <div>
                    <label style={labelStyle}>Monthly Rental (ZAR)</label>
                    <input
                      type="number"
                      value={monthlyRental}
                      onChange={(e) => setMonthlyRental(e.target.value)}
                      placeholder="e.g. 5000"
                      min={0}
                      style={inputStyle}
                    />
                  </div>
                )}
                {(contractType === "share" || contractType === "both") && (
                  <div>
                    <label style={labelStyle}>Revenue Share %</label>
                    <input
                      type="number"
                      value={revenueSharePercent}
                      onChange={(e) => setRevenueSharePercent(e.target.value)}
                      placeholder="e.g. 15"
                      min={0}
                      max={100}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
            )}

            <div style={dividerStyle} />

            {/* ── SECTION 5: Operational Details ───────────────────── */}
            <p style={sectionLabelStyle}>Operational Details</p>
            <p style={{ color: "#666", fontSize: 12, marginBottom: 16, marginTop: -8 }}>
              These fields will be available once the database migration is applied
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Number of Screens</label>
                <input
                  type="number"
                  value={screenCount}
                  onChange={(e) => setScreenCount(e.target.value)}
                  placeholder="e.g. 3"
                  min={0}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Max members"
                  min={0}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Opening Hours</label>
              <input
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Mon-Fri 05:00-22:00, Sat-Sun 07:00-18:00"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 }}>
              <div>
                <label style={labelStyle}>Venue Manager Name</label>
                <input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Manager name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Venue Manager Phone</label>
                <input
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  placeholder="+27 ..."
                  style={inputStyle}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            background: "rgba(15,15,15,0.98)",
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#A3A3A3",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-venue-form"
            disabled={saving}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              backgroundColor: saving ? "#555" : "#D4FF4F",
              color: "#0A0A0A",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "Inter Tight, sans-serif",
            }}
          >
            {saving ? "Creating..." : "Create Venue"}
          </button>
        </div>
      </div>
        </>,
        document.body
      )}
    </>
  );
}
