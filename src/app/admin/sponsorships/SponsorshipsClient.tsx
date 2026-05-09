"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Sparkles, Eye, Pencil, PauseCircle, Newspaper, Trophy, Cloud } from "lucide-react";
import CreateSponsorshipModal from "./CreateSponsorshipModal";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WidgetType = "news" | "sports" | "weather" | "bundle";
export type SponsorshipStatus = "active" | "paused" | "expired" | "draft";
export type BillingPeriod = "monthly" | "weekly";
export type Coverage = "network" | "city";

export interface Sponsorship {
  id: string;
  brand_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  widget_type: string;
  coverage: string;
  city: string | null;
  billing_period: string;
  rate: number;
  status: string;
  start_date: string;
  end_date: string | null;
  logo_url: string | null;
  brand_colour: string | null;
  tagline: string | null;
  amount_collected: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueBrief {
  id: string;
  name: string;
  city: string | null;
  status: string | null;
}

interface Props {
  sponsorships: Sponsorship[];
  venues: VenueBrief[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return "Open";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function fmtR(n: number | null | undefined): string {
  if (n == null) return "—";
  return `R ${Number(n).toLocaleString("en-ZA")}`;
}

// ─── Widget meta ──────────────────────────────────────────────────────────────

const WIDGET_META: Record<string, {
  label: string;
  duration: string;
  icon: React.ReactNode;
  tintBg: string;
  tintBorder: string;
  tintText: string;
  badgeBg: string;
  badgeColor: string;
}> = {
  news: {
    label: "News Widget",
    duration: "30s",
    icon: <Newspaper size={22} strokeWidth={1.5} />,
    tintBg: "rgba(96,165,250,0.06)",
    tintBorder: "rgba(96,165,250,0.18)",
    tintText: "#60A5FA",
    badgeBg: "rgba(96,165,250,0.14)",
    badgeColor: "#60A5FA",
  },
  sports: {
    label: "Sports Widget",
    duration: "30s",
    icon: <Trophy size={22} strokeWidth={1.5} />,
    tintBg: "rgba(74,222,128,0.06)",
    tintBorder: "rgba(74,222,128,0.18)",
    tintText: "#4ADE80",
    badgeBg: "rgba(74,222,128,0.14)",
    badgeColor: "#4ADE80",
  },
  weather: {
    label: "Weather Widget",
    duration: "15s",
    icon: <Cloud size={22} strokeWidth={1.5} />,
    tintBg: "rgba(34,211,238,0.06)",
    tintBorder: "rgba(34,211,238,0.18)",
    tintText: "#22D3EE",
    badgeBg: "rgba(34,211,238,0.14)",
    badgeColor: "#22D3EE",
  },
  bundle: {
    label: "All 3 Bundle",
    duration: "All",
    icon: <Sparkles size={22} strokeWidth={1.5} />,
    tintBg: "rgba(212,255,79,0.06)",
    tintBorder: "rgba(212,255,79,0.18)",
    tintText: "#D4FF4F",
    badgeBg: "rgba(212,255,79,0.14)",
    badgeColor: "#D4FF4F",
  },
};

const WIDGET_PRICES: Record<string, { monthly: number; weekly: number }> = {
  news:    { monthly: 12000, weekly: 3500 },
  sports:  { monthly: 15000, weekly: 4500 },
  weather: { monthly: 8500,  weekly: 2500 },
  bundle:  { monthly: 30000, weekly: 0 },
};

// ─── Badge components ─────────────────────────────────────────────────────────

function WidgetBadge({ type }: { type: string }) {
  const meta = WIDGET_META[type];
  if (!meta) return <span style={{ color: "#777", fontSize: 12 }}>—</span>;
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
      style={{ backgroundColor: meta.badgeBg, color: meta.badgeColor }}
    >
      {meta.label.replace(" Widget", "").replace(" Bundle", " Bundle")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active:  { bg: "rgba(74,222,128,0.15)",  color: "#4ADE80" },
    paused:  { bg: "rgba(251,191,36,0.15)",  color: "#FBBF24" },
    expired: { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
    draft:   { bg: "rgba(113,113,122,0.18)", color: "#A1A1AA" },
  };
  const info = map[status] ?? { bg: "rgba(113,113,122,0.18)", color: "#A1A1AA" };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      {label}
    </span>
  );
}

// ─── Widget availability card ─────────────────────────────────────────────────

function WidgetCard({
  type,
  activeSponsor,
  onAddSponsor,
}: {
  type: "news" | "sports" | "weather";
  activeSponsor: Sponsorship | null;
  onAddSponsor: (type: WidgetType) => void;
}) {
  const meta = WIDGET_META[type];
  const prices = WIDGET_PRICES[type];
  const isAvailable = !activeSponsor;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: meta.tintBg,
        border: `1px solid ${meta.tintBorder}`,
        borderRadius: 16,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color: meta.tintText }}>
            {meta.icon}
            <span
              className="text-base font-bold"
              style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.01em" }}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-xs" style={{ color: "#888" }}>
            {meta.duration} · Full Network
          </p>
        </div>
      </div>

      {/* Sponsor status */}
      <div className="flex-1">
        {isAvailable ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "#4ADE80" }}
            />
            <span className="text-sm font-semibold" style={{ color: "#4ADE80" }}>
              AVAILABLE
            </span>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" style={{ color: meta.tintText }}>✓</span>
              <span className="text-sm font-semibold text-white">
                {activeSponsor.brand_name}
              </span>
            </div>
            <p className="text-xs" style={{ color: "#999" }}>
              {formatDate(activeSponsor.start_date)} → {formatDate(activeSponsor.end_date)}
            </p>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div>
        <p className="text-sm font-bold text-white tabular-nums">
          R{prices.monthly.toLocaleString("en-ZA")}/mo
          <span className="text-xs font-normal ml-1" style={{ color: "#888" }}>
            · R{prices.weekly.toLocaleString("en-ZA")}/wk
          </span>
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => onAddSponsor(type)}
        className="w-full py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
        style={{
          backgroundColor: isAvailable ? meta.tintText : "rgba(255,255,255,0.06)",
          color: isAvailable ? "#0A0A0A" : "#888",
          border: isAvailable ? "none" : "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {isAvailable ? "Add Sponsor" : "New Sponsor (queued)"}
      </button>
    </div>
  );
}

// ─── Filter select style ───────────────────────────────────────────────────────

const filterSelectStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  outline: "none",
  borderRadius: "10px",
  padding: "8px 14px",
  fontSize: "13px",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SponsorshipsClient({ sponsorships: initial, venues }: Props) {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>(initial);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [preselectedWidget, setPreselectedWidget] = useState<WidgetType | undefined>();

  // Find active sponsors per widget
  const activeSponsorMap = useMemo(() => {
    const map: Record<string, Sponsorship | null> = {
      news: null, sports: null, weather: null,
    };
    for (const s of sponsorships) {
      if (s.status !== "active") continue;
      if (s.widget_type === "bundle") {
        if (!map.news)    map.news    = s;
        if (!map.sports)  map.sports  = s;
        if (!map.weather) map.weather = s;
      } else if (s.widget_type in map && !map[s.widget_type]) {
        map[s.widget_type] = s;
      }
    }
    return map;
  }, [sponsorships]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return sponsorships;
    return sponsorships.filter((s) => s.status === statusFilter);
  }, [sponsorships, statusFilter]);

  function handleOpenModal(type?: WidgetType) {
    setPreselectedWidget(type);
    setShowModal(true);
  }

  function handleCreated(s: Sponsorship) {
    setSponsorships((prev) => [s, ...prev]);
    setShowModal(false);
  }

  async function handlePause(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/sponsorships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      const updated = await res.json() as Sponsorship;
      setSponsorships((prev) => prev.map((s) => s.id === id ? updated : s));
    } catch {
      // silent
    }
  }

  return (
    <>
      {/* Widget availability cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(["news", "sports", "weather"] as const).map((type) => (
          <WidgetCard
            key={type}
            type={type}
            activeSponsor={activeSponsorMap[type]}
            onAddSponsor={handleOpenModal}
          />
        ))}
      </div>

      {/* Filter bar + Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="draft">Draft</option>
          </select>
          {filtered.length !== sponsorships.length && (
            <span style={{ fontSize: 13, color: "#999" }}>
              Showing {filtered.length} of {sponsorships.length}
            </span>
          )}
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Add Sponsorship
        </button>
      </div>

      {/* Empty state */}
      {sponsorships.length === 0 ? (
        <div
          className="glass-card rounded-2xl flex flex-col items-center justify-center py-20"
          style={{ borderRadius: 16 }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
          >
            <Sparkles size={26} color="#D4FF4F" strokeWidth={1.5} />
          </div>
          <p className="text-white font-medium mb-1">No sponsorships yet</p>
          <p className="text-sm mb-5" style={{ color: "#B0B0B0" }}>
            Monetise News, Sports and Weather widgets with brand sponsorships.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Sponsorship
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="glass-card rounded-2xl flex flex-col items-center justify-center py-16"
          style={{ borderRadius: 16 }}
        >
          <p className="text-white font-medium mb-1">No sponsorships match filters</p>
          <button
            className="text-sm mt-3"
            style={{ color: "#D4FF4F" }}
            onClick={() => setStatusFilter("all")}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                  }}
                >
                  {["Brand", "Widget", "Coverage", "Period", "Rate", "Dates", "Collected", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#B0B0B0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const rate = Number(s.rate) || 0;
                  const collected = Number(s.amount_collected) || 0;

                  return (
                    <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      {/* Brand */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {s.logo_url ? (
                            <img
                              src={s.logo_url}
                              alt=""
                              className="w-7 h-7 rounded-lg object-contain flex-shrink-0"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            />
                          ) : (
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                              style={{
                                backgroundColor: s.brand_colour ?? "#FF6B35",
                                color: "#fff",
                              }}
                            >
                              {s.brand_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-semibold text-white">
                            {s.brand_name}
                          </span>
                        </div>
                      </td>

                      {/* Widget type */}
                      <td className="px-4 py-4">
                        <WidgetBadge type={s.widget_type} />
                      </td>

                      {/* Coverage */}
                      <td className="px-4 py-4 text-sm" style={{ color: "#C8C8C8" }}>
                        {s.coverage === "city" ? s.city ?? "City" : "Network"}
                      </td>

                      {/* Billing period */}
                      <td className="px-4 py-4 text-sm capitalize" style={{ color: "#C8C8C8" }}>
                        {s.billing_period}
                      </td>

                      {/* Rate */}
                      <td className="px-4 py-4 text-sm font-semibold text-white tabular-nums">
                        {fmtR(rate)}
                        <span className="text-xs font-normal" style={{ color: "#888" }}>
                          /{s.billing_period === "weekly" ? "wk" : "mo"}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-4 text-sm tabular-nums whitespace-nowrap" style={{ color: "#C8C8C8" }}>
                        {formatDate(s.start_date)} → {formatDate(s.end_date)}
                      </td>

                      {/* Collected */}
                      <td className="px-4 py-4 text-sm tabular-nums" style={{ color: "#D4FF4F" }}>
                        {fmtR(collected)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={s.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/sponsorships/${s.id}`}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: "rgba(212,255,79,0.1)", color: "#D4FF4F" }}
                          >
                            <Eye size={12} strokeWidth={2} />
                            View
                          </Link>
                          <Link
                            href={`/admin/sponsorships/${s.id}?edit=1`}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}
                          >
                            <Pencil size={12} strokeWidth={2} />
                            Edit
                          </Link>
                          {(s.status === "active" || s.status === "paused") && (
                            <button
                              onClick={() => handlePause(s.id, s.status)}
                              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                              style={{ backgroundColor: "rgba(251,191,36,0.08)", color: "#FBBF24" }}
                            >
                              <PauseCircle size={12} strokeWidth={2} />
                              {s.status === "active" ? "Pause" : "Resume"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((s) => (
              <Link
                key={s.id}
                href={`/admin/sponsorships/${s.id}`}
                className="glass-card block rounded-2xl p-4"
                style={{ borderRadius: 16, textDecoration: "none" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white mb-1">{s.brand_name}</p>
                    <WidgetBadge type={s.widget_type} />
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div
                  className="flex items-center gap-4 flex-wrap pt-3 text-xs"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#C8C8C8" }}
                >
                  <span>{s.coverage === "city" ? s.city ?? "City" : "Network"}</span>
                  <span className="font-semibold text-white">
                    {fmtR(s.rate)}/{s.billing_period === "weekly" ? "wk" : "mo"}
                  </span>
                  <span>{formatDate(s.start_date)} → {formatDate(s.end_date)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Create Sponsorship Modal */}
      {showModal && (
        <CreateSponsorshipModal
          venues={venues}
          sponsorships={sponsorships}
          preselectedWidget={preselectedWidget}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
