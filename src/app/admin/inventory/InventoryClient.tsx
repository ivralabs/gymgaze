"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Filter,
  BarChart2,
} from "lucide-react";

interface Brand {
  id: string;
  name: string;
  primary_color: string | null;
}

interface Venue {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  gym_brand_id: string | null;
  gym_brands: Brand | Brand[] | null;
}

interface Campaign {
  id: string;
  name: string;
  advertiser: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Booking {
  id: string;
  screen_id: string;
  slots_7sec_used: number;
  slots_15sec_used: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  campaigns: Campaign | Campaign[] | null;
}

interface ScreenRow {
  id: string;
  label: string;
  size_inches: number | null;
  resolution: string | null;
  orientation: string | null;
  is_active: boolean;
  slots_7sec_total: number;
  slots_15sec_total: number;
  slots_7sec_used: number;
  slots_15sec_used: number;
  slots_7sec_available: number;
  slots_15sec_available: number;
  occupancy_pct: number;
  status: "available" | "partial" | "full";
  venues: Venue | null;
  bookings: Booking[];
}

function StatusPill({ status }: { status: "available" | "partial" | "full" }) {
  const map = {
    available: { label: "Available", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: CheckCircle2 },
    partial: { label: "Partial", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: AlertCircle },
    full: { label: "Full", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: XCircle },
  };
  const { label, color, bg, icon: Icon } = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color, background: bg }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}

function SlotBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color: "#999", minWidth: 32, textAlign: "right" }}>
        {used}/{total}
      </span>
    </div>
  );
}

function getVenue(screen: ScreenRow): Venue | null {
  if (!screen.venues) return null;
  return Array.isArray(screen.venues) ? screen.venues[0] : screen.venues;
}

function getBrand(venue: Venue | null): Brand | null {
  if (!venue?.gym_brands) return null;
  return Array.isArray(venue.gym_brands) ? venue.gym_brands[0] : venue.gym_brands;
}

function getCampaign(b: Booking): Campaign | null {
  if (!b.campaigns) return null;
  return Array.isArray(b.campaigns) ? b.campaigns[0] : b.campaigns;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Add Booking Modal ──────────────────────────────────────────────────────
function AddBookingModal({
  screen,
  campaigns,
  onClose,
  onSaved,
}: {
  screen: ScreenRow;
  campaigns: Campaign[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [campaignId, setCampaignId] = useState("");
  const [slots7, setSlots7] = useState(1);
  const [slots15, setSlots15] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!campaignId) { setError("Select a campaign"); return; }
    if (slots7 === 0 && slots15 === 0) { setError("Book at least 1 slot"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/inventory/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screen_id: screen.id,
          campaign_id: campaignId,
          slots_7sec_used: slots7,
          slots_15sec_used: slots15,
          start_date: startDate || null,
          end_date: endDate || null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
          Book Slots — {screen.label}
        </h2>
        <p style={{ color: "#999", fontSize: 13 }}>
          Venue: {getVenue(screen)?.name ?? "—"} · Available: {screen.slots_7sec_available}×7.5s, {screen.slots_15sec_available}×15s
        </p>

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>Campaign *</span>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <option value="">Select campaign…</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.advertiser ? ` — ${c.advertiser}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>7.5s Slots (max {screen.slots_7sec_available})</span>
              <input
                type="number"
                min={0}
                max={screen.slots_7sec_available}
                value={slots7}
                onChange={(e) => setSlots7(Math.min(screen.slots_7sec_available, Math.max(0, parseInt(e.target.value) || 0)))}
                className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>15s Slots (max {screen.slots_15sec_available})</span>
              <input
                type="number"
                min={0}
                max={screen.slots_15sec_available}
                value={slots15}
                onChange={(e) => setSlots15(Math.min(screen.slots_15sec_available, Math.max(0, parseInt(e.target.value) || 0)))}
                className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>Notes (optional)</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 30s total airtime per loop"
              className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", color: "#999" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "#D4FF4F", color: "#0A0A0A", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Book Slots"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function InventoryClient({ campaigns }: { campaigns: Campaign[] }) {
  const [inventory, setInventory] = useState<ScreenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "partial" | "full">("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [bookingScreen, setBookingScreen] = useState<ScreenRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) setInventory(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  async function handleDeleteBooking(bookingId: string) {
    if (!confirm("Remove this booking?")) return;
    setDeletingId(bookingId);
    try {
      await fetch(`/api/inventory/bookings?id=${bookingId}`, { method: "DELETE" });
      await fetchInventory();
    } finally {
      setDeletingId(null);
    }
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filtered = inventory.filter((s) => {
    const venue = getVenue(s);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.label.toLowerCase().includes(q) ||
      venue?.name?.toLowerCase().includes(q) ||
      venue?.city?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary stats
  const totalScreens = inventory.length;
  const availableCount = inventory.filter((s) => s.status === "available").length;
  const partialCount = inventory.filter((s) => s.status === "partial").length;
  const fullCount = inventory.filter((s) => s.status === "full").length;
  const total7Slots = inventory.reduce((s, r) => s + r.slots_7sec_total, 0);
  const used7Slots = inventory.reduce((s, r) => s + r.slots_7sec_used, 0);
  const total15Slots = inventory.reduce((s, r) => s + r.slots_15sec_total, 0);
  const used15Slots = inventory.reduce((s, r) => s + r.slots_15sec_used, 0);
  const overallOccupancy =
    total7Slots + total15Slots > 0
      ? Math.round(((used7Slots + used15Slots) / (total7Slots + total15Slots)) * 100)
      : 0;

  const statusColors = { available: "#22c55e", partial: "#f59e0b", full: "#ef4444" };
  const statusFilters: { key: typeof statusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalScreens },
    { key: "available", label: "🟢 Available", count: availableCount },
    { key: "partial", label: "🟡 Partial", count: partialCount },
    { key: "full", label: "🔴 Full", count: fullCount },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Booking modal */}
      {bookingScreen && (
        <AddBookingModal
          screen={bookingScreen}
          campaigns={campaigns}
          onClose={() => setBookingScreen(null)}
          onSaved={() => { setBookingScreen(null); fetchInventory(); }}
        />
      )}

      {/* Header */}
      <div className="glass-panel relative overflow-hidden rounded-2xl mb-6 md:mb-8" style={{ borderRadius: 16 }}>
        <div className="relative z-10 p-5 md:p-8">
          <h1
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Inventory
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>Screen slot availability across all venues</p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { label: "Total Screens", value: totalScreens, color: "#D4FF4F" },
              { label: "Overall Occupancy", value: `${overallOccupancy}%`, color: overallOccupancy >= 80 ? "#ef4444" : overallOccupancy >= 40 ? "#f59e0b" : "#22c55e" },
              { label: "7.5s Slots", value: `${used7Slots}/${total7Slots}`, color: "#60a5fa" },
              { label: "15s Slots", value: `${used15Slots}/${total15Slots}`, color: "#a78bfa" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex flex-col px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "#777" }}>{label}</span>
                <span className="text-xl font-bold mt-0.5" style={{ color, fontFamily: "Inter Tight, sans-serif" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div
          className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Search size={16} color="#666" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search screen, venue, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600"
          />
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.06)", color: "#999", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <RefreshCw size={14} strokeWidth={2} />
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {statusFilters.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: statusFilter === key ? "rgba(212,255,79,0.12)" : "rgba(255,255,255,0.05)",
              color: statusFilter === key ? "#D4FF4F" : "#888",
              border: `1px solid ${statusFilter === key ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {label} <span style={{ opacity: 0.6 }}>({count})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24" style={{ color: "#555" }}>
          <RefreshCw size={24} className="animate-spin mr-3" />
          <span>Loading inventory…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Monitor size={40} color="#333" />
          <p style={{ color: "#555" }}>{totalScreens === 0 ? "No screens added yet. Add screens to venues first." : "No screens match your filters."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Table header (desktop only) */}
          <div
            className="hidden md:grid text-xs font-semibold px-4 py-2 rounded-xl"
            style={{
              color: "#666",
              background: "rgba(255,255,255,0.03)",
              gridTemplateColumns: "1fr 1fr 1fr 120px 120px 80px 44px",
              gap: "1rem",
            }}
          >
            <span>Screen</span>
            <span>Venue</span>
            <span>Network</span>
            <span>7.5s Slots</span>
            <span>15s Slots</span>
            <span>Status</span>
            <span />
          </div>

          {filtered.map((screen) => {
            const venue = getVenue(screen);
            const brand = getBrand(venue);
            const isExpanded = expandedRows.has(screen.id);

            return (
              <div
                key={screen.id}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
              >
                {/* Main row */}
                <div
                  className="grid items-center px-4 py-3 gap-4 cursor-pointer"
                  style={{
                    gridTemplateColumns: "1fr",
                    // desktop: use CSS via className
                  }}
                >
                  {/* Mobile layout */}
                  <div className="md:hidden flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor size={16} color="#D4FF4F" strokeWidth={2} />
                        <span className="text-sm font-bold text-white">{screen.label}</span>
                        <StatusPill status={screen.status} />
                      </div>
                      <button onClick={() => setBookingScreen(screen)} style={{ color: "#D4FF4F" }}>
                        <Plus size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: "#888" }}>{venue?.name ?? "—"} · {venue?.city ?? "—"}</p>
                    {brand && (
                      <span
                        className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${brand.primary_color ?? "#FF6B35"}22`, color: brand.primary_color ?? "#FF6B35" }}
                      >
                        {brand.name}
                      </span>
                    )}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#666", minWidth: 28 }}>7.5s</span>
                        <SlotBar used={screen.slots_7sec_used} total={screen.slots_7sec_total} color="#60a5fa" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#666", minWidth: 28 }}>15s</span>
                        <SlotBar used={screen.slots_15sec_used} total={screen.slots_15sec_total} color="#a78bfa" />
                      </div>
                    </div>
                    {screen.bookings.length > 0 && (
                      <button
                        onClick={() => toggleRow(screen.id)}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "#888", marginTop: 2 }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {screen.bookings.length} booking{screen.bookings.length !== 1 ? "s" : ""}
                      </button>
                    )}
                  </div>

                  {/* Desktop layout */}
                  <div
                    className="hidden md:grid items-center gap-4"
                    style={{ gridTemplateColumns: "1fr 1fr 1fr 120px 120px 80px 44px" }}
                    onClick={() => screen.bookings.length > 0 && toggleRow(screen.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Monitor size={15} color="#D4FF4F" strokeWidth={2} />
                      <span className="text-sm font-semibold text-white">{screen.label}</span>
                      {!screen.is_active && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#666" }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-white">{venue?.name ?? "—"}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#777" }}>{venue?.city ?? "—"}</p>
                    </div>
                    <div>
                      {brand ? (
                        <span
                          className="inline-block text-xs px-2 py-1 rounded-full font-semibold"
                          style={{ background: `${brand.primary_color ?? "#FF6B35"}22`, color: brand.primary_color ?? "#FF6B35" }}
                        >
                          {brand.name}
                        </span>
                      ) : (
                        <span style={{ color: "#555" }}>—</span>
                      )}
                    </div>
                    <SlotBar used={screen.slots_7sec_used} total={screen.slots_7sec_total} color="#60a5fa" />
                    <SlotBar used={screen.slots_15sec_used} total={screen.slots_15sec_total} color="#a78bfa" />
                    <StatusPill status={screen.status} />
                    <div className="flex items-center justify-end gap-1">
                      {screen.bookings.length > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleRow(screen.id); }}
                          className="flex items-center justify-center w-8 h-8 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setBookingScreen(screen); }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs"
                        style={{ background: "rgba(212,255,79,0.12)", color: "#D4FF4F" }}
                        title="Add booking"
                      >
                        <Plus size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded bookings */}
                {isExpanded && screen.bookings.length > 0 && (
                  <div
                    className="px-4 pb-4 flex flex-col gap-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-xs font-semibold pt-3" style={{ color: "#666" }}>Active Bookings</p>
                    {screen.bookings.map((b) => {
                      const campaign = getCampaign(b);
                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {campaign?.name ?? "Unknown Campaign"}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                              {campaign?.advertiser ?? "—"}
                              {(b.start_date || b.end_date) && (
                                <> · {formatDate(b.start_date)} → {formatDate(b.end_date)}</>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {b.slots_7sec_used > 0 && (
                              <span className="text-xs px-2 py-1 rounded-lg font-mono" style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>
                                {b.slots_7sec_used}×7.5s
                              </span>
                            )}
                            {b.slots_15sec_used > 0 && (
                              <span className="text-xs px-2 py-1 rounded-lg font-mono" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>
                                {b.slots_15sec_used}×15s
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              disabled={deletingId === b.id}
                              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                              title="Remove booking"
                            >
                              <Trash2 size={13} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
