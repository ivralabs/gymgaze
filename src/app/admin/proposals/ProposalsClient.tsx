"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  ExternalLink,
  Trash2,
  Copy,
  Download,
  Building2,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import Toast, { useToast } from "@/components/gymgaze/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Network = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type Proposal = {
  id: string;
  title: string;
  version: number;
  status: string;
  created_at: string;
  updated_at: string | null;
  revenue_split_partner_pct: number;
  revenue_split_gymgaze_pct: number;
  cpm_benchmark: number;
  gym_networks: Network | null;
  partnership_proposal_venues: { id: string }[];
};

type Props = {
  initialProposals: Proposal[];
  networks: Network[];
};

// ─── Status pill ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft:    { bg: "rgba(156,163,175,0.15)", color: "#9CA3AF", label: "Draft" },
  sent:     { bg: "rgba(96,165,250,0.15)",  color: "#60A5FA", label: "Sent" },
  accepted: { bg: "rgba(74,222,128,0.15)",  color: "#4ADE80", label: "Accepted" },
  rejected: { bg: "rgba(248,113,113,0.15)", color: "#F87171", label: "Rejected" },
  expired:  { bg: "rgba(251,191,36,0.15)",  color: "#FBBF24", label: "Expired" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20, letterSpacing: "0.05em",
    }}>
      {s.label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProposalsClient({ initialProposals, networks }: Props) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [proposals, setProposals] = useState(initialProposals);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProposals((prev) => prev.filter((p) => p.id !== id));
      showToast("Proposal deleted", "success");
    } catch {
      showToast("Failed to delete proposal", "error");
    } finally {
      setDeleting(null);
    }
  }

  async function handleDuplicate(proposal: Proposal) {
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network_id: proposal.gym_networks?.id,
          title: `${proposal.title} (copy)`,
          version: proposal.version,
          status: "draft",
          revenue_split_partner_pct: proposal.revenue_split_partner_pct,
          revenue_split_gymgaze_pct: proposal.revenue_split_gymgaze_pct,
          cpm_benchmark: proposal.cpm_benchmark,
        }),
      });
      if (!res.ok) throw new Error("Duplicate failed");
      showToast("Proposal duplicated", "success");
      router.refresh();
    } catch {
      showToast("Failed to duplicate", "error");
    }
  }

  function handleDownloadPDF(id: string, title: string) {
    const filename = `${title.replace(/\s+/g, "-")}.pdf`;
    window.open(`/api/proposals/${id}/pdf?filename=${encodeURIComponent(filename)}`, "_blank");
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100 }}>
      <Toast {...toast} onDismiss={hideToast} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <FileText size={22} color="#D4FF4F" strokeWidth={2} />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "Inter Tight, sans-serif", margin: 0 }}>
              Partnership Proposals
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            Build and manage partnership proposals for gym networks.
          </p>
        </div>
        <Link
          href="/admin/proposals/new"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "#D4FF4F", color: "#0a0a0a",
            fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Proposal
        </Link>
      </div>

      {/* Network summary chips */}
      {networks.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {networks.map((n) => (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: 12, color: "#ccc",
            }}>
              <Building2 size={13} color="#888" />
              {n.name}
            </div>
          ))}
        </div>
      )}

      {/* Proposals list */}
      {proposals.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px 32px",
          background: "rgba(255,255,255,0.03)", borderRadius: 16,
          border: "1px dashed rgba(255,255,255,0.12)",
        }}>
          <FileText size={40} color="#444" strokeWidth={1.5} style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>No proposals yet</div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
            Create your first partnership proposal to get started.
          </div>
          <Link
            href="/admin/proposals/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 10,
              background: "#D4FF4F", color: "#0a0a0a",
              fontWeight: 700, fontSize: 13, textDecoration: "none",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Proposal
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 20,
              }}
            >
              {/* Network logo / initial */}
              <div style={{
                width: 48, height: 48, borderRadius: 10, background: "rgba(212,255,79,0.1)",
                border: "1px solid rgba(212,255,79,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {proposal.gym_networks?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/img?url=${encodeURIComponent(proposal.gym_networks.logo_url)}&w=60&q=80`}
                    alt={proposal.gym_networks.name}
                    style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6 }}
                  />
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#D4FF4F" }}>
                    {(proposal.gym_networks?.name ?? "?").charAt(0)}
                  </span>
                )}
              </div>

              {/* Main info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {proposal.title}
                  </span>
                  <StatusPill status={proposal.status} />
                  <span style={{ fontSize: 11, color: "#666" }}>v{proposal.version}</span>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                    <Building2 size={12} color="#666" />
                    {proposal.gym_networks?.name ?? "No network"}
                  </span>
                  <span style={{ fontSize: 12, color: "#888" }}>
                    {proposal.revenue_split_partner_pct}/{proposal.revenue_split_gymgaze_pct} split
                  </span>
                  <span style={{ fontSize: 12, color: "#888" }}>
                    R{proposal.cpm_benchmark} CPM
                  </span>
                  <span style={{ fontSize: 12, color: "#888" }}>
                    {proposal.partnership_proposal_venues?.length ?? 0} venues
                  </span>
                  <span style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                    <CalendarDays size={12} color="#666" />
                    {new Date(proposal.created_at).toLocaleDateString("en-ZA")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleDownloadPDF(proposal.id, proposal.title)}
                  title="Download PDF"
                  style={{
                    padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.06)",
                    border: "none", cursor: "pointer", color: "#ccc",
                    display: "flex", alignItems: "center",
                  }}
                >
                  <Download size={15} strokeWidth={2} />
                </button>
                <button
                  onClick={() => handleDuplicate(proposal)}
                  title="Duplicate"
                  style={{
                    padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.06)",
                    border: "none", cursor: "pointer", color: "#ccc",
                    display: "flex", alignItems: "center",
                  }}
                >
                  <Copy size={15} strokeWidth={2} />
                </button>
                <Link
                  href={`/proposal-print/${proposal.id}`}
                  target="_blank"
                  title="Preview PDF"
                  style={{
                    padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.06)",
                    border: "none", cursor: "pointer", color: "#ccc",
                    display: "flex", alignItems: "center", textDecoration: "none",
                  }}
                >
                  <ExternalLink size={15} strokeWidth={2} />
                </Link>
                <button
                  onClick={() => handleDelete(proposal.id, proposal.title)}
                  disabled={deleting === proposal.id}
                  title="Delete"
                  style={{
                    padding: "8px", borderRadius: 8, background: "rgba(248,113,113,0.1)",
                    border: "none", cursor: "pointer", color: "#F87171",
                    display: "flex", alignItems: "center",
                    opacity: deleting === proposal.id ? 0.5 : 1,
                  }}
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
                <Link
                  href={`/admin/proposals/${proposal.id}`}
                  style={{
                    padding: "8px 14px", borderRadius: 8,
                    background: "rgba(212,255,79,0.1)",
                    border: "1px solid rgba(212,255,79,0.2)",
                    color: "#D4FF4F", textDecoration: "none", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  Edit <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
