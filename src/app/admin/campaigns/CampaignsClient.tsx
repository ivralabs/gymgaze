"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Megaphone, Eye, Pencil, FileText } from "lucide-react";
import CreateCampaignModal from "./CreateCampaignModal";
import { useRole } from "@/lib/useRole";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CampaignFormat = "standard_7s" | "premium_15s" | "prime_15s" | "spotlight_30s";
export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "cancelled";
export type ClientType = "agency" | "direct";

export interface Campaign {
  id: string;
  client_name: string | null;
  client_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  format: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  total_value: number | null;
  amount_collected: number | null;
  notes: string | null;
  created_at: string;
  campaign_venues: { id: string; venue_id: string }[];
}

export interface VenueBrief {
  id: string;
  name: string;
  city: string | null;
  status: string | null;
}

interface Props {
  campaigns: Campaign[];
  venues: VenueBrief[];
  // canCreate/canEdit resolved server-side and passed down for SSR accuracy;
  // client useRole() is the source of truth once loaded
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function fmtR(n: number | null | undefined): string {
  if (n == null) return "—";
  return `R ${n.toLocaleString("en-ZA")}`;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function FormatBadge({ format }: { format: string | null }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    standard_7s:  { label: "Standard 7s",  bg: "rgba(113,113,122,0.18)", color: "#A1A1AA" },
    premium_15s:  { label: "Premium 15s",  bg: "rgba(255,107,53,0.18)",  color: "#FF6B35" },
    prime_15s:    { label: "Prime 15s",    bg: "rgba(212,255,79,0.14)",  color: "#D4FF4F" },
    spotlight_30s:{ label: "Spotlight 30s",bg: "rgba(168,85,247,0.18)", color: "#C084FC" },
  };
  const info = format ? map[format] : null;
  if (!info) return <span style={{ color: "#777", fontSize: 12 }}>—</span>;
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      {info.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { bg: string; color: string }> = {
    draft:     { bg: "rgba(113,113,122,0.18)", color: "#A1A1AA" },
    active:    { bg: "rgba(74,222,128,0.15)",  color: "#4ADE80" },
    paused:    { bg: "rgba(251,191,36,0.15)",  color: "#FBBf24" },
    completed: { bg: "rgba(96,165,250,0.15)",  color: "#60A5FA" },
    cancelled: { bg: "rgba(239,68,68,0.15)",   color: "#F87171" },
  };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
  const info = status ? map[status] : null;
  if (!info) return <span style={{ color: "#777", fontSize: 12 }}>{label}</span>;
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      {label}
    </span>
  );
}

function ClientTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const isAgency = type === "agency";
  return (
    <span
      className="text-xs font-medium px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: isAgency ? "rgba(96,165,250,0.12)" : "rgba(251,146,60,0.12)",
        color: isAgency ? "#60A5FA" : "#FB923C",
      }}
    >
      {isAgency ? "Agency" : "Direct"}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const CLIENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Clients" },
  { value: "agency", label: "Agency" },
  { value: "direct", label: "Direct" },
];

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

export default function CampaignsClient({ campaigns: initialCampaigns, venues }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const { canCreate, canEdit, loading: roleLoading } = useRole();

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (clientTypeFilter !== "all" && c.client_type !== clientTypeFilter) return false;
      return true;
    });
  }, [campaigns, statusFilter, clientTypeFilter]);

  function handleCreated(campaign: Campaign) {
    setCampaigns((prev) => [campaign, ...prev]);
    setShowModal(false);
  }

  return (
    <>
      {/* Filter bar + Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={filterSelectStyle}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={clientTypeFilter}
            onChange={(e) => setClientTypeFilter(e.target.value)}
            style={filterSelectStyle}
          >
            {CLIENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {filtered.length !== campaigns.length && (
            <span style={{ fontSize: 13, color: "#999" }}>
              Showing {filtered.length} of {campaigns.length}
            </span>
          )}
        </div>

        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Campaign
          </button>
        )}
      </div>

      {/* Empty state */}
      {campaigns.length === 0 ? (
        <div
          className="glass-card rounded-2xl flex flex-col items-center justify-center py-20"
          style={{ borderRadius: 16 }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
          >
            <Megaphone size={26} color="#D4FF4F" strokeWidth={1.5} />
          </div>
          <p className="text-white font-medium mb-1">No campaigns yet</p>
          <p className="text-sm mb-5" style={{ color: "#B0B0B0" }}>
            Create your first campaign to start tracking ad revenue.
          </p>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Campaign
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="glass-card rounded-2xl flex flex-col items-center justify-center py-16"
          style={{ borderRadius: 16 }}
        >
          <p className="text-white font-medium mb-1">No campaigns match filters</p>
          <button
            className="text-sm mt-3"
            style={{ color: "#D4FF4F" }}
            onClick={() => { setStatusFilter("all"); setClientTypeFilter("all"); }}
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
                  {["Client", "Format", "Venues", "Dates", "Value", "Collected", "Status", "Actions"].map((h) => (
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
                {filtered.map((campaign) => {
                  const venueCount = campaign.campaign_venues?.length ?? 0;
                  const totalVal = Number(campaign.total_value) || 0;
                  const collected = Number(campaign.amount_collected) || 0;
                  const pct = totalVal > 0 ? Math.min(100, Math.round((collected / totalVal) * 100)) : 0;
                  const isFullyCollected = totalVal > 0 && collected >= totalVal;

                  return (
                    <tr key={campaign.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      {/* Client */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-white">
                            {campaign.client_name ?? "—"}
                          </span>
                          <ClientTypeBadge type={campaign.client_type} />
                        </div>
                      </td>

                      {/* Format */}
                      <td className="px-4 py-4">
                        <FormatBadge format={campaign.format} />
                      </td>

                      {/* Venues */}
                      <td className="px-4 py-4 text-sm" style={{ color: "#C8C8C8" }}>
                        {venueCount} venue{venueCount !== 1 ? "s" : ""}
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-4 text-sm tabular-nums whitespace-nowrap" style={{ color: "#C8C8C8" }}>
                        {formatDate(campaign.start_date)} → {formatDate(campaign.end_date)}
                      </td>

                      {/* Value */}
                      <td className="px-4 py-4 text-sm font-semibold text-white tabular-nums">
                        {fmtR(campaign.total_value)}
                      </td>

                      {/* Collected */}
                      <td className="px-4 py-4" style={{ minWidth: 120 }}>
                        <div className="flex flex-col gap-1">
                          <span
                            className="text-sm tabular-nums"
                            style={{ color: isFullyCollected ? "#4ADE80" : "#C8C8C8" }}
                          >
                            {fmtR(campaign.amount_collected)}
                          </span>
                          {totalVal > 0 && !isFullyCollected && (
                            <div
                              className="w-full rounded-full overflow-hidden"
                              style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: pct >= 100 ? "#4ADE80" : "#FF6B35",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={campaign.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/campaigns/${campaign.id}`}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: "rgba(212,255,79,0.1)", color: "#D4FF4F" }}
                          >
                            <Eye size={12} strokeWidth={2} />
                            View
                          </Link>
                          <Link
                            href={`/admin/campaigns/${campaign.id}/report`}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}
                          >
                            <FileText size={12} strokeWidth={2} />
                            Report
                          </Link>
                          <Link
                            href={`/admin/campaigns/${campaign.id}?edit=1`}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}
                          >
                            <Pencil size={12} strokeWidth={2} />
                            Edit
                          </Link>
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
            {filtered.map((campaign) => {
              const venueCount = campaign.campaign_venues?.length ?? 0;
              const totalVal = Number(campaign.total_value) || 0;
              const collected = Number(campaign.amount_collected) || 0;
              const pct = totalVal > 0 ? Math.min(100, Math.round((collected / totalVal) * 100)) : 0;

              return (
                <Link
                  key={campaign.id}
                  href={`/admin/campaigns/${campaign.id}`}
                  className="glass-card block rounded-2xl p-4"
                  style={{ borderRadius: 16, textDecoration: "none" }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">
                          {campaign.client_name ?? "—"}
                        </p>
                        <ClientTypeBadge type={campaign.client_type} />
                      </div>
                      <div className="mt-1.5">
                        <FormatBadge format={campaign.format} />
                      </div>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </div>

                  <div
                    className="flex items-center gap-4 flex-wrap pt-3 text-xs"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#C8C8C8" }}
                  >
                    <span>{formatDate(campaign.start_date)} → {formatDate(campaign.end_date)}</span>
                    <span className="font-semibold" style={{ color: "#fff" }}>
                      {fmtR(campaign.total_value)}
                    </span>
                    <span>{venueCount} venue{venueCount !== 1 ? "s" : ""}</span>
                  </div>

                  {totalVal > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#999" }}>
                        <span>Collected</span>
                        <span>{pct}%</span>
                      </div>
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 100 ? "#4ADE80" : "#FF6B35",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Create Campaign Modal — only reachable if canCreate */}
      {showModal && canCreate && (
        <CreateCampaignModal
          venues={venues}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
