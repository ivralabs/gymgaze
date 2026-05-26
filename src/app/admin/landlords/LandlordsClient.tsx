"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Home,
  Download,
  ChevronDown,
  X,
  Check,
  Pencil,
  Building2,
  Search,
} from "lucide-react";
import Toast, { useToast } from "@/components/gymgaze/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LandlordVenue = {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  monthly_entries: number | null;
  active_members: number | null;
  rental_fee_monthly: number | null;
  rental_payment_cycle: string | null;
  rental_start_date: string | null;
  rental_escalation_pct: number | null;
  rental_notes: string | null;
  rental_bank_details: Record<string, unknown> | null;
  rental_updated_at: string | null;
  current_occupancy_pct: number | null;
  occupancy_updated_at: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const OCCUPANCY_FLOOR = 35;

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtZAR(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "R 0";
  return `R\u00a0${Math.round(n).toLocaleString("en-ZA")}`;
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-ZA");
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Inline Fee Editor ────────────────────────────────────────────────────────

function InlineFeeEditor({
  venue,
  onSave,
}: {
  venue: LandlordVenue;
  onSave: (id: string, fee: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(venue.rental_fee_monthly ?? 0));
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setValue(String(venue.rental_fee_monthly ?? 0));
    setEditing(true);
  }

  async function save() {
    const fee = parseFloat(value);
    if (isNaN(fee) || fee < 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(venue.id, fee);
    setSaving(false);
    setEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#A3A3A3", fontSize: 13 }}>R</span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={onKeyDown}
          disabled={saving}
          style={{
            width: 80,
            background: "rgba(212,255,79,0.08)",
            border: "1px solid rgba(212,255,79,0.4)",
            borderRadius: 6,
            padding: "4px 8px",
            color: "#FFFFFF",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={save}
          disabled={saving}
          style={{ color: "#D4FF4F", background: "none", border: "none", cursor: "pointer", padding: 2 }}
          title="Save"
        >
          <Check size={14} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{ color: "#666", background: "none", border: "none", cursor: "pointer", padding: 2 }}
          title="Cancel"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        color: "#FFFFFF",
        fontWeight: 600,
        fontSize: 13,
      }}
      onClick={startEdit}
      title="Click to edit"
    >
      {fmtZAR(venue.rental_fee_monthly)}
      <Pencil size={11} color="#555" strokeWidth={2} />
    </div>
  );
}

// ─── Venue Drawer ─────────────────────────────────────────────────────────────

type DrawerProps = {
  venue: LandlordVenue;
  onClose: () => void;
  onSaved: (updated: LandlordVenue) => void;
};

function VenueDrawer({ venue, onClose, onSaved }: DrawerProps) {
  const [form, setForm] = useState({
    rental_fee_monthly: String(venue.rental_fee_monthly ?? 0),
    rental_payment_cycle: venue.rental_payment_cycle ?? "monthly",
    rental_start_date: venue.rental_start_date ?? "",
    rental_escalation_pct: String(venue.rental_escalation_pct ?? 0),
    rental_notes: venue.rental_notes ?? "",
    rental_bank_account: (venue.rental_bank_details as Record<string, string> | null)?.account ?? "",
    rental_bank_name: (venue.rental_bank_details as Record<string, string> | null)?.bank ?? "",
    rental_bank_branch: (venue.rental_bank_details as Record<string, string> | null)?.branch ?? "",
    rental_bank_reference: (venue.rental_bank_details as Record<string, string> | null)?.reference ?? "",
    current_occupancy_pct: String(venue.current_occupancy_pct ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    const fee = parseFloat(form.rental_fee_monthly);
    if (isNaN(fee) || fee < 0) {
      setError("Rental fee must be a number ≥ 0");
      return;
    }
    setSaving(true);
    setError(null);

    const bankDetails = (
      form.rental_bank_account ||
      form.rental_bank_name ||
      form.rental_bank_branch ||
      form.rental_bank_reference
    )
      ? {
          account: form.rental_bank_account,
          bank: form.rental_bank_name,
          branch: form.rental_bank_branch,
          reference: form.rental_bank_reference,
        }
      : null;

    try {
      const res = await fetch(`/api/landlords/${venue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rental_fee_monthly: fee,
          rental_payment_cycle: form.rental_payment_cycle,
          rental_start_date: form.rental_start_date || null,
          rental_escalation_pct: parseFloat(form.rental_escalation_pct) || 0,
          rental_notes: form.rental_notes || null,
          rental_bank_details: bankDetails,
          current_occupancy_pct: parseFloat(form.current_occupancy_pct) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save");
        return;
      }
      onSaved(json as LandlordVenue);
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "9px 12px",
    color: "#FFFFFF",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    color: "#A3A3A3",
    marginBottom: 5,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(3px)",
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          background: "rgba(14,14,14,0.98)",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#FFFFFF",
                fontFamily: "Inter Tight, sans-serif",
              }}
            >
              {venue.name}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              {venue.city ?? "—"}{venue.province ? `, ${venue.province}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: 8,
              padding: 8,
              cursor: "pointer",
              color: "#A3A3A3",
              display: "flex",
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          {/* Current Occupancy */}
          <div>
            <label style={labelStyle}>Current Occupancy %</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                style={{ ...inputStyle }}
                type="number"
                min={0}
                max={100}
                step={1}
                value={form.current_occupancy_pct}
                onChange={(e) => set("current_occupancy_pct", e.target.value)}
                placeholder="0"
              />
              <span style={{ color: "#A3A3A3", fontSize: 14, flexShrink: 0 }}>%</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 10, color: "#555" }}>
              ≥{OCCUPANCY_FLOOR}% = Active (rental owed) · &lt;{OCCUPANCY_FLOOR}% = Below floor (goes to pot)
            </div>
          </div>

          {/* Monthly fee */}
          <div>
            <label style={labelStyle}>Monthly Rental Fee (ZAR)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#A3A3A3", fontSize: 14, flexShrink: 0 }}>R</span>
              <input
                style={{ ...inputStyle }}
                type="number"
                min={0}
                value={form.rental_fee_monthly}
                onChange={(e) => set("rental_fee_monthly", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Payment cycle */}
          <div>
            <label style={labelStyle}>Payment Cycle</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.rental_payment_cycle}
              onChange={(e) => set("rental_payment_cycle", e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          {/* Start date */}
          <div>
            <label style={labelStyle}>Lease Start Date</label>
            <input
              style={inputStyle}
              type="date"
              value={form.rental_start_date}
              onChange={(e) => set("rental_start_date", e.target.value)}
            />
          </div>

          {/* Escalation */}
          <div>
            <label style={labelStyle}>Annual Escalation %</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.rental_escalation_pct}
              onChange={(e) => set("rental_escalation_pct", e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{
                ...inputStyle,
                minHeight: 80,
                resize: "vertical",
              }}
              value={form.rental_notes}
              onChange={(e) => set("rental_notes", e.target.value)}
              placeholder="Any notes about this rental agreement..."
            />
          </div>

          {/* Bank details */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 18,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#777",
                marginBottom: 14,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Bank Details (for payment)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Bank Name</label>
                <input
                  style={inputStyle}
                  value={form.rental_bank_name}
                  onChange={(e) => set("rental_bank_name", e.target.value)}
                  placeholder="e.g. FNB"
                />
              </div>
              <div>
                <label style={labelStyle}>Account Number</label>
                <input
                  style={inputStyle}
                  value={form.rental_bank_account}
                  onChange={(e) => set("rental_bank_account", e.target.value)}
                  placeholder="e.g. 62000000000"
                />
              </div>
              <div>
                <label style={labelStyle}>Branch Code</label>
                <input
                  style={inputStyle}
                  value={form.rental_bank_branch}
                  onChange={(e) => set("rental_bank_branch", e.target.value)}
                  placeholder="e.g. 250655"
                />
              </div>
              <div>
                <label style={labelStyle}>Payment Reference</label>
                <input
                  style={inputStyle}
                  value={form.rental_bank_reference}
                  onChange={(e) => set("rental_bank_reference", e.target.value)}
                  placeholder="e.g. GG-Sunnyside"
                />
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#F87171",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#A3A3A3",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 2,
              padding: "10px",
              borderRadius: 10,
              background: saving ? "rgba(212,255,79,0.3)" : "#D4FF4F",
              border: "none",
              color: "#0A0A0A",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkActionBar({
  selectedIds,
  onClear,
  onApply,
}: {
  selectedIds: Set<string>;
  onClear: () => void;
  onApply: (fee: number) => void;
}) {
  const [feeInput, setFeeInput] = useState("");

  function apply() {
    const fee = parseFloat(feeInput);
    if (isNaN(fee) || fee < 0) return;
    onApply(fee);
    setFeeInput("");
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "rgba(212,255,79,0.06)",
        border: "1px solid rgba(212,255,79,0.2)",
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "#D4FF4F" }}>
        {selectedIds.size} selected
      </span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#A3A3A3" }}>Set rental to</span>
        <span style={{ color: "#A3A3A3", fontSize: 13 }}>R</span>
        <input
          value={feeInput}
          onChange={(e) => setFeeInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
          placeholder="e.g. 2000"
          type="number"
          min={0}
          style={{
            width: 90,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: "6px 10px",
            color: "#FFF",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={apply}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            background: "#D4FF4F",
            border: "none",
            color: "#0A0A0A",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Apply
        </button>
      </div>
      <button
        onClick={onClear}
        style={{
          background: "none",
          border: "none",
          color: "#666",
          cursor: "pointer",
          display: "flex",
        }}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

// ─── Occupancy Status Pill ───────────────────────────────────────────────────────────

function OccupancyPill({ pct }: { pct: number | null }) {
  const v = pct ?? 0;
  if (v === 0) {
    return (
      <span style={{
        background: "rgba(255,255,255,0.06)", color: "#666",
        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
      }}>Setup Phase</span>
    );
  }
  if (v < OCCUPANCY_FLOOR) {
    return (
      <span style={{
        background: "rgba(245,158,11,0.12)", color: "#F59E0B",
        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
      }}>{v}% — Below Floor</span>
    );
  }
  return (
    <span style={{
      background: "rgba(212,255,79,0.12)", color: "#D4FF4F",
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
    }}>{v}% — Active</span>
  );
}

// ─── Inline Occupancy Editor ────────────────────────────────────────────────────────

function InlineOccupancyEditor({
  venue,
  onSave,
}: {
  venue: LandlordVenue;
  onSave: (id: string, pct: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(venue.current_occupancy_pct ?? 0));
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setValue(String(venue.current_occupancy_pct ?? 0));
    setEditing(true);
  }

  async function save() {
    const pct = parseFloat(value);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(venue.id, pct);
    setSaving(false);
    setEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={onKeyDown}
          disabled={saving}
          type="number"
          min={0}
          max={100}
          style={{
            width: 60,
            background: "rgba(212,255,79,0.08)",
            border: "1px solid rgba(212,255,79,0.4)",
            borderRadius: 6,
            padding: "4px 8px",
            color: "#FFFFFF",
            fontSize: 12,
            outline: "none",
          }}
        />
        <span style={{ color: "#A3A3A3", fontSize: 12 }}>%</span>
        <button
          onClick={save}
          disabled={saving}
          style={{ color: "#D4FF4F", background: "none", border: "none", cursor: "pointer", padding: 2 }}
        >
          <Check size={13} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{ color: "#666", background: "none", border: "none", cursor: "pointer", padding: 2 }}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={startEdit}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
      title="Click to edit occupancy"
    >
      <OccupancyPill pct={venue.current_occupancy_pct} />
      <Pencil size={10} color="#444" strokeWidth={2} />
    </div>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ venues }: { venues: LandlordVenue[] }) {
  const totalPotential = venues.reduce((s, v) => s + (v.rental_fee_monthly ?? 0), 0);
  const totalOwed = venues.reduce((s, v) => {
    const occ = v.current_occupancy_pct ?? 0;
    return s + (occ >= OCCUPANCY_FLOOR ? (v.rental_fee_monthly ?? 0) : 0);
  }, 0);
  const inPot = venues.reduce((s, v) => {
    const occ = v.current_occupancy_pct ?? 0;
    return s + (occ < OCCUPANCY_FLOOR ? (v.rental_fee_monthly ?? 0) : 0);
  }, 0);
  const avgOccupancy = venues.length > 0
    ? venues.reduce((s, v) => s + (v.current_occupancy_pct ?? 0), 0) / venues.length
    : 0;

  const stats = [
    { label: "Rental Potential / mo",   value: fmtZAR(totalPotential), accent: "#D4FF4F", sub: "At full occupancy floor" },
    { label: "Rental Owed / mo",        value: fmtZAR(totalOwed),      accent: "#FFFFFF", sub: `Venues at ≥${OCCUPANCY_FLOOR}%` },
    { label: "In Pot This Month",       value: fmtZAR(inPot),          accent: "#F59E0B", sub: "Below threshold" },
    { label: "Avg Occupancy",           value: `${avgOccupancy.toFixed(1)}%`, accent: "#FFFFFF", sub: "Across all venues" },
    { label: "Venues",                  value: String(venues.length),  accent: "#FFFFFF", sub: "Total" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 12,
        marginBottom: 24,
      }}
    >
      {stats.map(({ label, value, accent, sub }) => (
        <div
          key={label}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: accent,
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: 11, color: "#FFFFFF", marginTop: 5, fontWeight: 600 }}>
            {label}
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Migration Notice ─────────────────────────────────────────────────────────

function MigrationNotice() {
  return (
    <div
      style={{
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.3)",
        borderRadius: 12,
        padding: "24px",
        marginBottom: 24,
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#FBBF24",
            marginBottom: 6,
          }}
        >
          Database migration required
        </div>
        <p style={{ fontSize: 13, color: "#A3A3A3", margin: 0, lineHeight: 1.6 }}>
          The rental fee columns have not been added to the database yet. Run{" "}
          <code
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "1px 6px",
              fontFamily: "monospace",
              fontSize: 12,
              color: "#FBBF24",
            }}
          >
            supabase/schema-landlords-v1.sql
          </code>{" "}
          in the Supabase SQL Editor to enable this section.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialVenues: LandlordVenue[];
}

export default function LandlordsClient({ initialVenues }: Props) {
  const [venues, setVenues] = useState<LandlordVenue[]>(initialVenues);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterProvince, setFilterProvince] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerVenue, setDrawerVenue] = useState<LandlordVenue | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const isMigrationPending =
    venues.length > 0 &&
    venues[0].rental_fee_monthly === undefined;

  // ── Derived lists ──────────────────────────────────────────────────────────

  const cities = useMemo(() => {
    const s = new Set<string>();
    venues.forEach((v) => { if (v.city) s.add(v.city); });
    return Array.from(s).sort();
  }, [venues]);

  const provinces = useMemo(() => {
    const s = new Set<string>();
    venues.forEach((v) => { if (v.province) s.add(v.province); });
    return Array.from(s).sort();
  }, [venues]);

  const filtered = useMemo(() => {
    return venues.filter((v) => {
      if (filterCity !== "all" && v.city !== filterCity) return false;
      if (filterProvince !== "all" && v.province !== filterProvince) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          (v.city ?? "").toLowerCase().includes(q) ||
          (v.province ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [venues, filterCity, filterProvince, search]);

  // ── Running total ──────────────────────────────────────────────────────────

  const totalMonthly = useMemo(
    () => filtered.reduce((s, v) => s + (v.rental_fee_monthly ?? 0), 0),
    [filtered]
  );

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleFeeUpdate = useCallback(async (id: string, fee: number) => {
    try {
      const res = await fetch(`/api/landlords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rental_fee_monthly: fee }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Failed to update", "error");
        return;
      }
      setVenues((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...json } : v))
      );
      showToast(`Rental fee updated to ${fmtZAR(fee)}`, "success");
    } catch {
      showToast("Network error", "error");
    }
  }, [showToast]);

  const handleBulkApply = useCallback(async (fee: number) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const res = await fetch("/api/landlords/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: ids.map((id) => ({ id, rental_fee_monthly: fee })) }),
      });
      const json = await res.json();
      if (!res.ok && json.ok !== true) {
        showToast(json.error ?? "Partial failure", "error");
        return;
      }
      setVenues((prev) =>
        prev.map((v) =>
          selectedIds.has(v.id)
            ? { ...v, rental_fee_monthly: fee, rental_updated_at: new Date().toISOString() }
            : v
        )
      );
      setSelectedIds(new Set());
      showToast(`Updated ${ids.length} venues to ${fmtZAR(fee)}`, "success");
    } catch {
      showToast("Network error", "error");
    }
  }, [selectedIds, showToast]);

  const handleDrawerSaved = useCallback((updated: LandlordVenue) => {
    setVenues((prev) =>
      prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v))
    );
    showToast("Venue rental agreement saved", "success");
  }, [showToast]);

  const handleOccupancyUpdate = useCallback(async (id: string, pct: number) => {
    try {
      const res = await fetch(`/api/landlords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_occupancy_pct: pct }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Failed to update occupancy", "error");
        return;
      }
      setVenues((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...json } : v))
      );
      showToast(`Occupancy updated to ${pct}%`, "success");
    } catch {
      showToast("Network error", "error");
    }
  }, [showToast]);

  async function handleExportCsv() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/landlords/export");
      if (!res.ok) {
        showToast("Export failed", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `landlords-${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Export failed", "error");
    } finally {
      setExportLoading(false);
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((v) => v.id)));
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const thStyle: React.CSSProperties = {
    padding: "9px 14px",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 700,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: 13,
    color: "#A3A3A3",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    verticalAlign: "middle",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        padding: "32px 36px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(212,255,79,0.1)",
              border: "1px solid rgba(212,255,79,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Home size={20} color="#D4FF4F" strokeWidth={2} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#FFFFFF",
                fontFamily: "Inter Tight, sans-serif",
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1,
              }}
            >
              Landlords & Rentals
            </h1>
            <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>
              Manage rental agreements per venue
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={exportLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#A3A3A3",
            fontSize: 13,
            fontWeight: 600,
            cursor: exportLoading ? "not-allowed" : "pointer",
          }}
        >
          <Download size={15} strokeWidth={2} />
          {exportLoading ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Migration notice */}
      {initialVenues.length === 0 && <MigrationNotice />}
      {isMigrationPending && <MigrationNotice />}

      {/* Stats */}
      {venues.length > 0 && !isMigrationPending && (
        <StatsRow venues={venues} />
      )}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "8px 12px",
            flex: 1,
            maxWidth: 260,
          }}
        >
          <Search size={14} color="#555" strokeWidth={2} />
          <input
            style={{
              background: "none",
              border: "none",
              color: "#FFFFFF",
              fontSize: 13,
              outline: "none",
              width: "100%",
            }}
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* City filter */}
        <div style={{ position: "relative" }}>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "8px 32px 8px 12px",
              color: filterCity !== "all" ? "#FFFFFF" : "#777",
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
              appearance: "none",
            }}
          >
            <option value="all">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown
            size={12}
            color="#555"
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          />
        </div>

        {/* Province filter */}
        <div style={{ position: "relative" }}>
          <select
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "8px 32px 8px 12px",
              color: filterProvince !== "all" ? "#FFFFFF" : "#777",
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
              appearance: "none",
            }}
          >
            <option value="all">All Provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown
            size={12}
            color="#555"
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClear={() => setSelectedIds(new Set())}
          onApply={handleBulkApply}
        />
      )}

      {/* Table */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "60px 36px",
              textAlign: "center",
              color: "#555",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Building2 size={36} color="#333" strokeWidth={1.5} />
            <div style={{ fontSize: 14, color: "#555" }}>
              {venues.length === 0
                ? "No venues found. Run the migration SQL first."
                : "No venues match your filters."}
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "rgba(255,255,255,0.03)" }}>
              <tr>
                <th style={{ ...thStyle, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th style={thStyle}>Venue</th>
                <th style={thStyle}>City</th>
                <th style={thStyle}>Province</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Walk-Ins/mo</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Members</th>
                <th style={thStyle}>Occupancy</th>
                <th style={thStyle}>Rental Fee</th>
                <th style={thStyle}>Cycle</th>
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>Last Updated</th>
                <th style={{ ...thStyle, width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((venue, idx) => {
                const selected = selectedIds.has(venue.id);
                return (
                  <tr
                    key={venue.id}
                    style={{
                      background: selected
                        ? "rgba(212,255,79,0.04)"
                        : idx % 2 === 0
                        ? "transparent"
                        : "rgba(255,255,255,0.01)",
                      transition: "background 0.1s",
                    }}
                  >
                    <td style={{ ...tdStyle, width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRow(venue.id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td
                      style={{ ...tdStyle, color: "#FFFFFF", fontWeight: 600, cursor: "pointer" }}
                      onClick={() => setDrawerVenue(venue)}
                    >
                      {venue.name}
                    </td>
                    <td style={tdStyle}>{venue.city ?? "—"}</td>
                    <td style={tdStyle}>{venue.province ?? "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{fmtNum(venue.monthly_entries)}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{fmtNum(venue.active_members)}</td>
                    <td style={tdStyle}>
                      <InlineOccupancyEditor venue={venue} onSave={handleOccupancyUpdate} />
                    </td>
                    <td style={tdStyle}>
                      <InlineFeeEditor venue={venue} onSave={handleFeeUpdate} />
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontSize: 11,
                          color: "#A3A3A3",
                          textTransform: "capitalize",
                        }}
                      >
                        {venue.rental_payment_cycle ?? "monthly"}
                      </span>
                    </td>
                    <td style={tdStyle}>{fmtDate(venue.rental_start_date)}</td>
                    <td style={{ ...tdStyle, fontSize: 11, color: "#555" }}>
                      {venue.rental_updated_at ? fmtDate(venue.rental_updated_at) : "—"}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => setDrawerVenue(venue)}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 7,
                          padding: "5px 10px",
                          color: "#A3A3A3",
                          fontSize: 12,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Pencil size={11} strokeWidth={2} />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer total */}
      {filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "14px 16px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            marginTop: 0,
            background: "rgba(255,255,255,0.02)",
            borderRadius: "0 0 14px 14px",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>
            Total monthly ({filtered.length} venues):
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#D4FF4F",
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            {fmtZAR(totalMonthly)}
          </span>
        </div>
      )}

      {/* Drawer */}
      {drawerVenue && (
        <VenueDrawer
          venue={drawerVenue}
          onClose={() => setDrawerVenue(null)}
          onSaved={handleDrawerSaved}
        />
      )}

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={hideToast}
      />
    </div>
  );
}
