"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";

interface VenueData {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  province: string | null;
  status: string | null;
  active_members: number | null;
  daily_entries: number | null;
  weekly_entries: number | null;
  monthly_entries: number | null;
  capacity: number | null;
  manager_name: string | null;
  manager_phone: string | null;
  operating_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
}

interface Props {
  venue: VenueData;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ["00", "30"]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

type DayHours = { open: string; close: string; closed: boolean };

const DEFAULT_HOURS: DayHours = { open: "05:00", close: "22:00", closed: false };
const WEEKEND_HOURS: DayHours = { open: "07:00", close: "18:00", closed: false };

function defaultHours(): Record<string, DayHours> {
  return Object.fromEntries(
    DAYS.map((d) => [d, d === "Saturday" || d === "Sunday" ? { ...WEEKEND_HOURS } : { ...DEFAULT_HOURS }])
  );
}

export default function EditVenueButton({ venue }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Form state — pre-filled from venue
  const [name, setName] = useState(venue.name ?? "");
  const [city, setCity] = useState(venue.city ?? "");
  const [province, setProvince] = useState(venue.province ?? "");
  const [address, setAddress] = useState(venue.address ?? "");
  const [region, setRegion] = useState(venue.region ?? "");
  const [status, setStatus] = useState(venue.status ?? "active");
  const [activeMembers, setActiveMembers] = useState(venue.active_members != null ? String(venue.active_members) : "");
  const [dailyEntries, setDailyEntries] = useState(venue.daily_entries != null ? String(venue.daily_entries) : "");
  const [weeklyEntries, setWeeklyEntries] = useState(venue.weekly_entries != null ? String(venue.weekly_entries) : "");
  const [monthlyEntries, setMonthlyEntries] = useState(venue.monthly_entries != null ? String(venue.monthly_entries) : "");
  const [capacity, setCapacity] = useState(venue.capacity != null ? String(venue.capacity) : "");
  const [managerName, setManagerName] = useState(venue.manager_name ?? "");
  const [managerPhone, setManagerPhone] = useState(venue.manager_phone ?? "");
  const [operatingHours, setOperatingHours] = useState<Record<string, DayHours>>(
    venue.operating_hours ?? defaultHours()
  );

  function updateDay(day: string, patch: Partial<DayHours>) {
    setOperatingHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name,
        city,
        address: address || null,
        region: region || null,
        province: province || null,
        status,
        active_members: activeMembers !== "" ? parseInt(activeMembers) : null,
        daily_entries: dailyEntries !== "" ? parseInt(dailyEntries) : null,
        weekly_entries: weeklyEntries !== "" ? parseInt(weeklyEntries) : null,
        monthly_entries: monthlyEntries !== "" ? parseInt(monthlyEntries) : null,
        capacity: capacity !== "" ? parseInt(capacity) : null,
        manager_name: managerName || null,
        manager_phone: managerPhone || null,
        operating_hours: operatingHours,
      };

      const res = await fetch(`/api/venues/${venue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to update venue");
      }

      setOpen(false);
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
    textTransform: "uppercase" as const,
    color: "#D4FF4F",
    marginBottom: 16,
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    margin: "24px 0",
  };

  return (
    <>
      {/* Edit button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#A3A3A3",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#A3A3A3";
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
        }}
      >
        <Pencil size={15} strokeWidth={2} />
        <span className="hidden sm:inline">Edit Venue</span>
      </button>

      {/* Portal drawer */}
      {mounted && open && createPortal(
        <>
          {/* Overlay */}
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50 }}
            onClick={() => setOpen(false)}
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
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", fontFamily: "Inter Tight, sans-serif" }}>
                  Edit Venue
                </h2>
                <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{venue.name}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 8,
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} color="#909090" strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
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

              <form id="edit-venue-form" onSubmit={handleSubmit}>

                {/* ── Venue Identity ── */}
                <p style={sectionLabelStyle}>Venue Identity</p>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Venue Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>City *</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} required placeholder="e.g. Sandton" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Province</label>
                    <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="e.g. Gauteng" style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" style={inputStyle} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Area Tag</label>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ ...inputStyle, appearance: "none" as const }}>
                      <option value="">Select area type...</option>
                      <option value="Shopping Mall">Shopping Mall</option>
                      <option value="Shopping Centre">Shopping Centre</option>
                      <option value="Free Standing">Free Standing</option>
                      <option value="Office Park">Office Park</option>
                      <option value="Residential Estate">Residential Estate</option>
                      <option value="Industrial Park">Industrial Park</option>
                      <option value="CBD">CBD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, appearance: "none" as const }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="coming_soon">Coming Soon</option>
                    </select>
                  </div>
                </div>

                <div style={dividerStyle} />

                {/* ── Foot Traffic ── */}
                <p style={sectionLabelStyle}>Foot Traffic</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Daily Entries</label>
                    <input type="number" value={dailyEntries} onChange={(e) => setDailyEntries(e.target.value)} placeholder="0" min={0} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Weekly Entries</label>
                    <input type="number" value={weeklyEntries} onChange={(e) => setWeeklyEntries(e.target.value)} placeholder="0" min={0} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Monthly Entries</label>
                    <input type="number" value={monthlyEntries} onChange={(e) => setMonthlyEntries(e.target.value)} placeholder="0" min={0} style={inputStyle} />
                  </div>
                </div>

                <div style={dividerStyle} />

                {/* ── Operational Details ── */}
                <p style={sectionLabelStyle}>Operational Details</p>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Active Members</label>
                  <input type="number" value={activeMembers} onChange={(e) => setActiveMembers(e.target.value)} placeholder="e.g. 450" min={0} style={inputStyle} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Capacity (Max Members)</label>
                    <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Max members" min={0} style={inputStyle} />
                  </div>
                  <div>
                    {/* spacer */}
                  </div>
                </div>

                {/* Operating Hours */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...labelStyle, marginBottom: 10 }}>Operating Hours</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {DAYS.map((day) => {
                      const h = operatingHours[day] ?? DEFAULT_HOURS;
                      return (
                        <div
                          key={day}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "90px 1fr 1fr 80px",
                            gap: 8,
                            alignItems: "center",
                            opacity: h.closed ? 0.45 : 1,
                            transition: "opacity 0.15s",
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#A3A3A3", fontWeight: 500 }}>{day.slice(0, 3)}</span>
                          <select disabled={h.closed} value={h.open} onChange={(e) => updateDay(day, { open: e.target.value })} style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }}>
                            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select disabled={h.closed} value={h.close} onChange={(e) => updateDay(day, { close: e.target.value })} style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }}>
                            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => updateDay(day, { closed: !h.closed })}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 10,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              border: "none",
                              transition: "all 0.15s",
                              backgroundColor: h.closed ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)",
                              color: h.closed ? "#EF4444" : "#666",
                            }}
                          >
                            {h.closed ? "Closed" : "Open"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Manager Name</label>
                    <input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Manager name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Manager Phone</label>
                    <input value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} placeholder="+27 ..." style={inputStyle} />
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                padding: "16px 24px",
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                background: "rgba(15,15,15,0.98)",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                form="edit-venue-form"
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
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
