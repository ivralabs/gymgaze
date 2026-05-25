"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, CheckCircle2, ChevronDown, Search, Mail, Phone, Users } from "lucide-react";
import { useRole } from "@/lib/useRole";
import type { PipelineDeal, AggregatedContact } from "./page";

// ─── Types & constants ────────────────────────────────────────────────────────

type Stage = PipelineDeal["stage"];

const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: "prospect",      label: "Prospect",      color: "#A3A3A3" },
  { key: "proposal_sent", label: "Proposal Sent", color: "#60A5FA" },
  { key: "negotiating",   label: "Negotiating",   color: "#FBBF24" },
  { key: "closed_won",    label: "Closed Won",    color: "#4ADE80" },
  { key: "closed_lost",   label: "Closed Lost",   color: "#F87171" },
];

function fmtR(n: number | null | undefined) {
  if (n == null) return "—";
  return `R ${Number(n).toLocaleString("en-ZA")}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── AddDealModal ─────────────────────────────────────────────────────────────

type AddDealModalProps = {
  onClose: () => void;
  onCreated: (deal: PipelineDeal) => void;
};

function AddDealModal({ onClose, onCreated }: AddDealModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_type: "direct" as "direct" | "agency",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    estimated_value: "",
    stage: "prospect" as Stage,
    expected_close_date: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  function set(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_name.trim()) { setError("Client name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
          expected_close_date: form.expected_close_date || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to create"); return; }
      onCreated(json as PipelineDeal);
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "9px 12px",
    color: "#FFFFFF",
    fontSize: 14,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    color: "#A3A3A3",
    marginBottom: 6,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto"
        style={{
          background: "rgba(16,16,16,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          maxHeight: "90vh",
        }}
      >
        <h2
          className="text-lg font-bold text-white mb-5"
          style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
        >
          Add Deal
        </h2>

        <form onSubmit={submit} className="space-y-4">
          {/* Client name */}
          <div>
            <label style={labelStyle}>Client Name *</label>
            <input
              style={inputStyle}
              value={form.client_name}
              onChange={(e) => set("client_name", e.target.value)}
              placeholder="e.g. Nike SA"
              required
            />
          </div>

          {/* Client type */}
          <div>
            <label style={labelStyle}>Client Type</label>
            <select
              style={inputStyle}
              value={form.client_type}
              onChange={(e) => set("client_type", e.target.value)}
            >
              <option value="direct">Direct</option>
              <option value="agency">Agency</option>
            </select>
          </div>

          {/* Contact name + email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input
                style={inputStyle}
                value={form.contact_name}
                onChange={(e) => set("contact_name", e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label style={labelStyle}>Contact Email</label>
              <input
                type="email"
                style={inputStyle}
                value={form.contact_email}
                onChange={(e) => set("contact_email", e.target.value)}
                placeholder="john@brand.co.za"
              />
            </div>
          </div>

          {/* Phone + value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Contact Phone</label>
              <input
                style={inputStyle}
                value={form.contact_phone}
                onChange={(e) => set("contact_phone", e.target.value)}
                placeholder="+27 82 000 0000"
              />
            </div>
            <div>
              <label style={labelStyle}>Estimated Value (R)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                style={inputStyle}
                value={form.estimated_value}
                onChange={(e) => set("estimated_value", e.target.value)}
                placeholder="50000"
              />
            </div>
          </div>

          {/* Stage + expected close */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Stage</label>
              <select
                style={inputStyle}
                value={form.stage}
                onChange={(e) => set("stage", e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Expected Close Date</label>
              <input
                type="date"
                style={inputStyle}
                value={form.expected_close_date}
                onChange={(e) => set("expected_close_date", e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any context..."
            />
          </div>

          {error && <p className="text-sm" style={{ color: "#F87171" }}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Adding..." : "Add Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DealCard ─────────────────────────────────────────────────────────────────

type DealCardProps = {
  deal: PipelineDeal;
  canCreate: boolean;
  onStageChange: (id: string, stage: Stage) => void;
};

function DealCard({ deal, canCreate, onStageChange }: DealCardProps) {
  const [open, setOpen] = useState(false);
  const isWon = deal.stage === "closed_won";
  const isLost = deal.stage === "closed_lost";

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        opacity: isLost ? 0.5 : 1,
        position: "relative",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{deal.client_name}</p>
          {deal.contact_name && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "#8A8A8A" }}>{deal.contact_name}</p>
          )}
        </div>
        {isWon && <CheckCircle2 size={16} color="#4ADE80" strokeWidth={2} className="flex-shrink-0 mt-0.5" />}
      </div>

      {/* Badges + value */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: deal.client_type === "agency"
              ? "rgba(255,107,53,0.15)" : "rgba(96,165,250,0.15)",
            color: deal.client_type === "agency" ? "#FF6B35" : "#60A5FA",
          }}
        >
          {deal.client_type === "agency" ? "Agency" : "Direct"}
        </span>
        {deal.estimated_value != null && (
          <span className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>
            {fmtR(deal.estimated_value)}
          </span>
        )}
      </div>

      {/* Close date */}
      {deal.expected_close_date && (
        <p className="text-xs mb-3" style={{ color: "#8A8A8A" }}>
          Close: {fmtDate(deal.expected_close_date)}
        </p>
      )}

      {/* Move dropdown */}
      {canCreate && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg w-full justify-between"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#A3A3A3",
            }}
          >
            Move to stage
            <ChevronDown size={12} />
          </button>
          {open && (
            <div
              className="absolute bottom-full mb-1 left-0 right-0 rounded-xl overflow-hidden z-20"
              style={{
                background: "rgba(18,18,18,0.98)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {STAGES.filter((s) => s.key !== deal.stage).map((s) => (
                <button
                  key={s.key}
                  onClick={() => { onStageChange(deal.id, s.key); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                  style={{ color: s.color }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ContactCard ─────────────────────────────────────────────────────────────

function fmtR_contact(n: number) {
  return `R ${Number(n).toLocaleString("en-ZA")}`;
}

function ContactCard({ c }: { c: AggregatedContact }) {
  const isAgency = c.client_type === "agency";
  return (
    <div
      className="glass-card rounded-2xl p-5 flex flex-col gap-3"
      style={{ borderRadius: 16 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-base font-bold text-white truncate"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            {c.contact_name ?? "Unknown Contact"}
          </p>
          {c.client_name && (
            <p className="text-sm mt-0.5 truncate" style={{ color: "#A3A3A3" }}>
              {c.client_name}
            </p>
          )}
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: isAgency ? "rgba(255,107,53,0.15)" : "rgba(96,165,250,0.15)",
            color: isAgency ? "#FF6B35" : "#60A5FA",
          }}
        >
          {isAgency ? "Agency" : "Direct"}
        </span>
      </div>

      {/* Contact details */}
      <div className="space-y-1.5">
        {c.contact_email && (
          <div className="flex items-center gap-2">
            <Mail size={13} color="#A3A3A3" strokeWidth={2} className="flex-shrink-0" />
            <a
              href={`mailto:${c.contact_email}`}
              className="text-sm truncate hover:text-white transition-colors"
              style={{ color: "#C8C8C8" }}
            >
              {c.contact_email}
            </a>
          </div>
        )}
        {c.contact_phone && (
          <div className="flex items-center gap-2">
            <Phone size={13} color="#A3A3A3" strokeWidth={2} className="flex-shrink-0" />
            <span className="text-sm" style={{ color: "#C8C8C8" }}>{c.contact_phone}</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-1.5">
          <Users size={13} color="#8A8A8A" strokeWidth={2} />
          <span className="text-xs" style={{ color: "#8A8A8A" }}>
            {c.campaign_count} campaign{c.campaign_count !== 1 ? "s" : ""}
          </span>
        </div>
        {c.total_value > 0 && (
          <span className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>
            {fmtR_contact(c.total_value)}
          </span>
        )}
      </div>
    </div>
  );
}

function ContactsTab({ contacts }: { contacts: AggregatedContact[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.contact_name?.toLowerCase().includes(q) ||
        c.contact_email?.toLowerCase().includes(q) ||
        c.client_name?.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={16}
          color="#666"
          strokeWidth={2}
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          type="text"
          placeholder="Search by name, email, or company…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl py-3 pl-10 pr-4 text-sm"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#FFFFFF",
            outline: "none",
          }}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="glass-card rounded-2xl p-10 text-center"
          style={{ borderRadius: 16 }}
        >
          <p className="text-sm" style={{ color: "#A3A3A3" }}>
            {query ? "No contacts match your search." : "No contacts yet — they appear from campaigns."}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {filtered.map((c, i) => (
            <ContactCard key={c.contact_email || `no-email-${i}`} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PipelineClient ───────────────────────────────────────────────────────────

export default function PipelineClient({ deals: initialDeals, contacts }: { deals: PipelineDeal[]; contacts: AggregatedContact[] }) {
  const { canCreate, loading } = useRole();
  const [deals, setDeals] = useState<PipelineDeal[]>(initialDeals);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"deals" | "contacts">("deals");
  const router = useRouter();

  // Stats
  const totalDeals = deals.length;
  const activeDeals = deals.filter((d) =>
    ["prospect", "proposal_sent", "negotiating"].includes(d.stage)
  ).length;
  const closedWon = deals.filter((d) => d.stage === "closed_won").length;
  const pipelineValue = deals
    .filter((d) => d.stage !== "closed_lost")
    .reduce((sum, d) => sum + (d.estimated_value ?? 0), 0);

  async function handleStageChange(id: string, stage: Stage) {
    const res = await fetch(`/api/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) {
      setDeals((prev) =>
        prev.map((d) => (d.id === id ? { ...d, stage, updated_at: new Date().toISOString() } : d))
      );
      router.refresh();
    }
  }

  function handleCreated(deal: PipelineDeal) {
    setDeals((prev) => [deal, ...prev]);
  }

  const statCard = (label: string, value: string | number, sub?: string) => (
    <div
      className="glass-card rounded-2xl p-5"
      style={{ borderRadius: 16 }}
    >
      <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "#999" }}>
        {label}
      </p>
      <div
        className="tabular-nums text-white"
        style={{
          fontFamily: "Inter Tight, sans-serif",
          fontWeight: 800,
          fontSize: "2rem",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && <p className="text-xs mt-1.5" style={{ color: "#8A8A8A" }}>{sub}</p>}
    </div>
  );

  const TAB_STYLE_ACTIVE: React.CSSProperties = {
    color: "#D4FF4F",
    borderBottom: "2px solid #D4FF4F",
    paddingBottom: "10px",
    fontWeight: 600,
  };
  const TAB_STYLE_INACTIVE: React.CSSProperties = {
    color: "#A3A3A3",
    borderBottom: "2px solid transparent",
    paddingBottom: "10px",
    fontWeight: 500,
  };

  return (
    <div className="p-4 md:p-8">
      {/* Hero */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-6"
        style={{ borderRadius: 16 }}
      >
        <div className="relative z-10 p-5 md:p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1
                style={{
                  fontFamily: "Inter Tight, sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
                  color: "#fff",
                  letterSpacing: "-0.02em",
                }}
              >
                Pipeline
              </h1>
              <p style={{ color: "#999", marginTop: "0.5rem" }}>
                Track deals from prospect to close
              </p>
            </div>
            {!loading && canCreate && activeTab === "deals" && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Add Deal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-6 mb-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={() => setActiveTab("deals")}
          className="text-sm transition-colors"
          style={activeTab === "deals" ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE}
        >
          Deals
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className="text-sm transition-colors"
          style={activeTab === "contacts" ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE}
        >
          Contacts
          <span
            className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#A3A3A3" }}
          >
            {contacts.length}
          </span>
        </button>
      </div>

      {/* Tab: Contacts */}
      {activeTab === "contacts" && <ContactsTab contacts={contacts} />}

      {/* Tab: Deals */}
      {activeTab === "deals" && (<>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCard("Total Deals", totalDeals)}
        {statCard("Active", activeDeals, "prospect · proposal · negotiating")}
        {statCard("Closed Won", closedWon)}
        {statCard("Pipeline Value", fmtR(pipelineValue), "excl. lost deals")}
      </div>

      {/* Kanban board */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "repeat(5, minmax(220px, 1fr))",
          overflowX: "auto",
          paddingBottom: 8,
        }}
      >
        {STAGES.map((stageInfo) => {
          const colDeals = deals.filter((d) => d.stage === stageInfo.key);
          const colValue = colDeals.reduce((s, d) => s + (d.estimated_value ?? 0), 0);

          return (
            <div key={stageInfo.key}>
              {/* Column header */}
              <div
                className="rounded-xl px-4 py-3 mb-3 flex items-center justify-between"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: stageInfo.color }}>
                    {stageInfo.label}
                  </span>
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: "#A3A3A3",
                    }}
                  >
                    {colDeals.length}
                  </span>
                </div>
                {colValue > 0 && (
                  <span className="text-xs font-medium" style={{ color: "#8A8A8A" }}>
                    {fmtR(colValue)}
                  </span>
                )}
              </div>

              {/* Deal cards */}
              <div className="space-y-3">
                {colDeals.length === 0 ? (
                  <div
                    className="rounded-xl p-4 text-center text-xs"
                    style={{
                      border: "1px dashed rgba(255,255,255,0.07)",
                      color: "#555",
                    }}
                  >
                    No deals
                  </div>
                ) : (
                  colDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      canCreate={canCreate}
                      onStageChange={handleStageChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      {showModal && (
        <AddDealModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
      </>)}
    </div>
  );
}
