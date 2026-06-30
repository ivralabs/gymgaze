"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import Toast, { useToast } from "@/components/gymgaze/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Network = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
};

type ProposalVenue = {
  id: string;
  venue_id: string;
  screens_planned: number;
  static_sites_planned: number;
  monthly_rental_projection: number | null;
  venues: {
    id: string;
    name: string;
    city: string | null;
    province: string | null;
    active_members: number | null;
  } | null;
};

export type Proposal = {
  id: string;
  title: string;
  version: number;
  status: string;
  revenue_split_partner_pct: number;
  revenue_split_gymgaze_pct: number;
  grace_period_months: number;
  dedicated_slots_count: number;
  dedicated_slot_seconds: number;
  sponsorships_excluded: boolean;
  static_sites_included: boolean;
  digital_screens_included: boolean;
  advertiser_exclusions: string[] | null;
  data_sharing_required: boolean;
  proof_of_flight_required: boolean;
  payment_cycle: string;
  reporting_cadence: string;
  cpm_benchmark: number;
  flight_start: string | null;
  flight_end: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  // Pot-to-credit fields (schema-pot-credit-v1.sql)
  pot_to_credit_enabled: boolean | null;
  pot_to_credit_pct: number | null;
  pot_credit_uses: string[] | null;
  gym_networks: Network | null;
  partnership_proposal_venues: ProposalVenue[];
};

type AllVenue = {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  active_members: number | null;
};

type Props = { proposal: Proposal; allVenues: AllVenue[] };

// ─── Status options ───────────────────────────────────────────────────────────
const STATUSES = ["draft", "sent", "accepted", "rejected", "expired"];
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft:    { bg: "rgba(156,163,175,0.15)", color: "#9CA3AF" },
  sent:     { bg: "rgba(96,165,250,0.15)",  color: "#60A5FA" },
  accepted: { bg: "rgba(74,222,128,0.15)",  color: "#4ADE80" },
  rejected: { bg: "rgba(248,113,113,0.15)", color: "#F87171" },
  expired:  { bg: "rgba(251,191,36,0.15)",  color: "#FBBF24" },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProposalDetailClient({ proposal, allVenues }: Props) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState(proposal.title);
  const [status, setStatus] = useState(proposal.status);
  const [partnerPct, setPartnerPct] = useState(proposal.revenue_split_partner_pct);
  const [gracePeriod, setGracePeriod] = useState(proposal.grace_period_months);
  const [dedicatedSlots, setDedicatedSlots] = useState(proposal.dedicated_slots_count);
  const [slotSeconds, setSlotSeconds] = useState(proposal.dedicated_slot_seconds);
  const [cpm, setCpm] = useState(proposal.cpm_benchmark);
  const [flightStart, setFlightStart] = useState(proposal.flight_start ?? "");
  const [flightEnd, setFlightEnd] = useState(proposal.flight_end ?? "");
  const [expiresAt, setExpiresAt] = useState(proposal.expires_at ?? "");
  const [notes, setNotes] = useState(proposal.notes ?? "");

  const [sponsorshipsExcluded, setSponsorshipsExcluded] = useState(proposal.sponsorships_excluded);
  const [staticSitesIncluded, setStaticSitesIncluded] = useState(proposal.static_sites_included);
  const [digitalScreensIncluded, setDigitalScreensIncluded] = useState(proposal.digital_screens_included);
  const [dataSharingRequired, setDataSharingRequired] = useState(proposal.data_sharing_required);
  const [proofOfFlightRequired, setProofOfFlightRequired] = useState(proposal.proof_of_flight_required);

  // Pot-to-credit state
  const [potToCreditEnabled, setPotToCreditEnabled] = useState(proposal.pot_to_credit_enabled ?? false);
  const [potToCreditPct, setPotToCreditPct] = useState(proposal.pot_to_credit_pct ?? 25);
  const [potCreditUses, setPotCreditUses] = useState<string[]>(
    proposal.pot_credit_uses ?? ["top_up_bonus", "cobranded_marketing", "extra_dedicated_slot"]
  );

  const network = proposal.gym_networks;
  const gymgazePct = 100 - partnerPct;
  const linkedVenueIds = new Set(proposal.partnership_proposal_venues.map((pv) => pv.venue_id));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status,
          revenue_split_partner_pct: partnerPct,
          revenue_split_gymgaze_pct: gymgazePct,
          grace_period_months: gracePeriod,
          dedicated_slots_count: dedicatedSlots,
          dedicated_slot_seconds: slotSeconds,
          cpm_benchmark: cpm,
          flight_start: flightStart || null,
          flight_end: flightEnd || null,
          expires_at: expiresAt || null,
          notes: notes || null,
          sponsorships_excluded: sponsorshipsExcluded,
          static_sites_included: staticSitesIncluded,
          digital_screens_included: digitalScreensIncluded,
          data_sharing_required: dataSharingRequired,
          proof_of_flight_required: proofOfFlightRequired,
          pot_to_credit_enabled: potToCreditEnabled,
          pot_to_credit_pct: potToCreditEnabled ? potToCreditPct : null,
          pot_credit_uses: potCreditUses,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast("Proposal saved", "success");
      router.refresh();
    } catch {
      showToast("Failed to save proposal", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this proposal? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/proposals");
    } catch {
      showToast("Failed to delete", "error");
      setDeleting(false);
    }
  }

  function handleDownloadPDF() {
    const filename = `${title.replace(/\s+/g, "-")}.pdf`;
    window.open(`/api/proposals/${proposal.id}/pdf?filename=${encodeURIComponent(filename)}`, "_blank");
  }

  function handleDownloadScenariosPDF() {
    const filename = `${title.replace(/\s+/g, "-")}-Occupancy-Scenarios.pdf`;
    window.open(`/api/proposals/${proposal.id}/scenarios-pdf?filename=${encodeURIComponent(filename)}`, "_blank");
  }

  function handleDownloadSLA() {
    window.open(`/api/proposals/${proposal.id}/sla`, "_blank");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
    border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)",
    color: "#fff", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
    color: "#888", marginBottom: 6, display: "block",
  };
  const sectionStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14, padding: "22px 24px",
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1000 }}>
      <Toast {...toast} onDismiss={hideToast} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Link href="/admin/proposals" style={{ display: "flex", alignItems: "center", gap: 6, color: "#888", textDecoration: "none", fontSize: 13 }}>
          <ArrowLeft size={15} /> Back
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Inter Tight, sans-serif", margin: 0 }}>
            {proposal.title}
          </h1>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {network?.name ?? "No network"} · v{proposal.version} · {new Date(proposal.created_at).toLocaleDateString("en-ZA")}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/proposal-print/${proposal.id}`}
            target="_blank"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 8,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: "#ccc", textDecoration: "none", fontSize: 12, fontWeight: 600,
            }}
          >
            <ExternalLink size={13} /> Preview
          </Link>
          <button
            onClick={handleDownloadPDF}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 8,
              background: "rgba(212,255,79,0.1)", border: "1px solid rgba(212,255,79,0.2)",
              color: "#D4FF4F", cursor: "pointer", fontSize: 12, fontWeight: 600,
            }}
          >
            <Download size={13} /> Download PDF
          </button>
          <button
            onClick={handleDownloadScenariosPDF}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 8,
              background: "rgba(212,255,79,0.15)", border: "1px solid rgba(212,255,79,0.35)",
              color: "#D4FF4F", cursor: "pointer", fontSize: 12, fontWeight: 600,
            }}
          >
            <FileText size={13} /> Occupancy Scenarios PDF
          </button>
          <button
            onClick={handleDownloadSLA}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 8,
              background: "rgba(212,255,79,0.2)", border: "1px solid rgba(212,255,79,0.5)",
              color: "#D4FF4F", cursor: "pointer", fontSize: 12, fontWeight: 600,
            }}
          >
            <FileText size={13} /> Download SLA
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 8,
              background: "#D4FF4F", border: "none",
              color: "#0a0a0a", cursor: saving ? "default" : "pointer",
              fontSize: 12, fontWeight: 700, opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Core details */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D4FF4F", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Proposal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <div style={{ marginTop: 8 }}>
                  {(() => {
                    const ss = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
                    return (
                      <span style={{
                        background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 20,
                      }}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes…"
                />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D4FF4F", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Revenue</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Partner Revenue %</label>
                <input style={inputStyle} type="number" min={1} max={99} value={partnerPct} onChange={(e) => setPartnerPct(Number(e.target.value))} />
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>GymGaze: {gymgazePct}%</div>
              </div>
              <div>
                <label style={labelStyle}>CPM Benchmark (R)</label>
                <input style={inputStyle} type="number" min={1} value={cpm} onChange={(e) => setCpm(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D4FF4F", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Dates</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Flight Start</label>
                <input style={inputStyle} type="date" value={flightStart} onChange={(e) => setFlightStart(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Flight End</label>
                <input style={inputStyle} type="date" value={flightEnd} onChange={(e) => setFlightEnd(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Expires At</label>
                <input style={inputStyle} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>
          </div>

        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Deal terms */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D4FF4F", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Deal Terms</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Grace Period (months)</label>
                <input style={inputStyle} type="number" min={0} value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} />
              </div>
              <div>
                <label style={labelStyle}>Dedicated Slots</label>
                <input style={inputStyle} type="number" min={0} value={dedicatedSlots} onChange={(e) => setDedicatedSlots(Number(e.target.value))} />
              </div>
              <div>
                <label style={labelStyle}>Slot Duration (sec)</label>
                <input style={inputStyle} type="number" min={1} value={slotSeconds} onChange={(e) => setSlotSeconds(Number(e.target.value))} />
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {[
                { label: "Sponsorships excluded from split", value: sponsorshipsExcluded, set: setSponsorshipsExcluded },
                { label: "Static sites included in split", value: staticSitesIncluded, set: setStaticSitesIncluded },
                { label: "Digital screens included", value: digitalScreensIncluded, set: setDigitalScreensIncluded },
                { label: "Data sharing required", value: dataSharingRequired, set: setDataSharingRequired },
                { label: "Proof of flight required", value: proofOfFlightRequired, set: setProofOfFlightRequired },
              ].map(({ label, value, set }) => (
                <label key={label} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} style={{ accentColor: "#D4FF4F" }} />
                  <span style={{ fontSize: 12, color: "#ccc" }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rental Pot Settings */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D4FF4F", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rental Pot Settings</div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 16, lineHeight: 1.5 }}>
              Control the pot-to-credit conversion programme. Disabled by default — use as a negotiation lever if the partner pushes back on the pure-transparency model.
            </div>

            {/* Toggle */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={potToCreditEnabled}
                onChange={(e) => setPotToCreditEnabled(e.target.checked)}
                style={{ accentColor: "#D4FF4F", marginTop: 2, flexShrink: 0 }}
              />
              <div>
                <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Convert pot to credit (opt-in)</span>
                <div style={{ fontSize: 11, color: "#666", marginTop: 3, lineHeight: 1.5 }}>
                  When enabled, a percentage of unpaid pot balance converts to promotional credits quarterly. Use this as a negotiation lever if the partner pushes back on the pure-transparency model.
                </div>
              </div>
            </label>

            {/* Expanded settings — only when enabled */}
            {potToCreditEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
                {/* Credit conversion percentage */}
                <div>
                  <label style={labelStyle}>Credit conversion percentage</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={potToCreditPct}
                      onChange={(e) => setPotToCreditPct(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "#D4FF4F" }}
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={potToCreditPct}
                      onChange={(e) => setPotToCreditPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                      style={{ ...inputStyle, width: 70, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, color: "#888", flexShrink: 0 }}>%</span>
                  </div>
                </div>

                {/* Credit use checkboxes */}
                <div>
                  <label style={labelStyle}>Credit can be used for</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {([
                      { value: "top_up_bonus",          label: "Top-up bonus on rental payouts" },
                      { value: "cobranded_marketing",   label: "Co-branded marketing campaigns" },
                      { value: "extra_dedicated_slot",  label: "Extra dedicated slot allocation" },
                    ] as const).map(({ value, label }) => (
                      <label key={value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={potCreditUses.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPotCreditUses((prev) => [...prev, value]);
                            } else {
                              setPotCreditUses((prev) => prev.filter((u) => u !== value));
                            }
                          }}
                          style={{ accentColor: "#D4FF4F" }}
                        />
                        <span style={{ fontSize: 12, color: "#ccc" }}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Linked venues */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D4FF4F", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Linked Venues ({proposal.partnership_proposal_venues.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
              {proposal.partnership_proposal_venues.map((pv) => (
                <div key={pv.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{pv.venues?.name ?? pv.venue_id}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>
                      {[pv.venues?.city, pv.venues?.province].filter(Boolean).join(", ")}
                      {pv.venues?.active_members ? ` · ${pv.venues.active_members.toLocaleString("en-ZA")} members` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#888", textAlign: "right" }}>
                    {pv.screens_planned} screens
                  </div>
                </div>
              ))}
              {proposal.partnership_proposal_venues.length === 0 && (
                <div style={{ fontSize: 12, color: "#555", padding: "8px 0" }}>No venues linked yet.</div>
              )}
            </div>
          </div>

          {/* Network info */}
          {network && (
            <div style={sectionStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#D4FF4F", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Network</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Name", value: network.name },
                  { label: "Contact", value: network.primary_contact_name ?? "—" },
                  { label: "Email", value: network.primary_contact_email ?? "—" },
                  { label: "Phone", value: network.primary_contact_phone ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: "#666" }}>{label}</span>
                    <span style={{ color: "#ccc", fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div style={{ ...sectionStyle, border: "1px solid rgba(248,113,113,0.2)", marginTop: "auto" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F87171", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Danger Zone</div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 8,
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                color: "#F87171", cursor: deleting ? "default" : "pointer",
                fontSize: 12, fontWeight: 600, opacity: deleting ? 0.5 : 1,
              }}
            >
              <Trash2 size={13} />
              {deleting ? "Deleting…" : "Delete Proposal"}
            </button>
          </div>
        </div>
      </div>

      {/* PDF generation section */}
      <div style={{ ...sectionStyle, marginTop: 20, border: "1px solid rgba(212,255,79,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#D4FF4F", marginBottom: 4 }}>
              <FileText size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Generate PDF
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              12-page landscape A4 partnership proposal. Generated via Browserless.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href={`/proposal-print/${proposal.id}`}
              target="_blank"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: 8,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#ccc", textDecoration: "none", fontSize: 12, fontWeight: 600,
              }}
            >
              <ExternalLink size={13} /> Preview in Browser
            </Link>
            <button
              onClick={handleDownloadPDF}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 22px", borderRadius: 8,
                background: "#D4FF4F", border: "none",
                color: "#0a0a0a", cursor: "pointer", fontSize: 13, fontWeight: 700,
              }}
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
