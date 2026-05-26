"use client";

import React, { useEffect } from "react";
import { Printer } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GymNetwork = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
};

export type ProposalVenueRow = {
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
    monthly_entries: number | null;
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
  gym_networks: GymNetwork | null;
  partnership_proposal_venues: ProposalVenueRow[];
};

export type AllVenue = {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  active_members: number | null;
  monthly_entries: number | null;
};

interface Props {
  proposal: Proposal;
  allVenues: AllVenue[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LIME = "#D4FF4F";
const DARK = "#0a0a0a";
const GREY_TEXT = "#555";
const BORDER_GREY = "#E5E7EB";
const PLAYS_PER_SCREEN_PER_WEEK = 1487;
const SELL_THROUGH = 0.60;

// Page dimensions (A4 landscape at 96dpi)
const PAGE_W = 1123;
const PAGE_H = 780;

const PAGE_STYLE: React.CSSProperties = {
  width: `${PAGE_W}px`,
  height: `${PAGE_H}px`,
  maxHeight: `${PAGE_H}px`,
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
  background: "#ffffff",
};

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtR(n: number) {
  return `R\u00a0${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}
function fmtFull(n: number) {
  return n.toLocaleString("en-ZA");
}
function todayStr() {
  return new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Revenue calculation per venue ───────────────────────────────────────────
function calcMonthlyRevenue(screens: number, cpmBenchmark: number, partnerPct: number): number {
  // 16 slots × 1487 plays/screen/week × 4.33 weeks/month
  const playsPerMonth = 16 * PLAYS_PER_SCREEN_PER_WEEK * 4.33 * screens;
  const grossRevenue = (playsPerMonth / 1000) * cpmBenchmark * SELL_THROUGH;
  return grossRevenue * (partnerPct / 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GymGazeLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const boxSize = size === "lg" ? 40 : size === "sm" ? 24 : 32;
  const fontSize = size === "lg" ? 24 : size === "sm" ? 14 : 18;
  const textSize = size === "lg" ? 24 : size === "sm" ? 14 : 18;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: boxSize, height: boxSize, background: LIME, borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize, fontWeight: 900, color: DARK, lineHeight: 1 }}>G</span>
      </div>
      <span style={{
        fontSize: textSize, fontWeight: 800, color: DARK,
        letterSpacing: "-0.02em", fontFamily: "Inter Tight, sans-serif",
      }}>GymGaze</span>
    </div>
  );
}

function PageHeader({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{
      height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 36px", flexShrink: 0,
      borderBottom: `2px solid ${LIME}`,
      background: "#fff",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{left}</div>
      {right && <div style={{ fontSize: 12, color: "#888" }}>{right}</div>}
    </div>
  );
}

function PageFooter({ page, total, networkName }: { page: number; total: number; networkName: string }) {
  return (
    <div style={{
      height: 36, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 36px", borderTop: `1px solid ${BORDER_GREY}`,
      background: "#fafafa", flexShrink: 0,
    }}>
      <span style={{ fontSize: 10, color: "#aaa" }}>
        CONFIDENTIAL — {networkName} × GymGaze Strategic Media Partnership
      </span>
      <span style={{ fontSize: 10, color: "#bbb" }}>
        {page} / {total}
      </span>
    </div>
  );
}

function LimeDivider() {
  return <div style={{ height: 3, background: LIME, borderRadius: 2, width: 40, margin: "10px 0" }} />;
}

function StatBox({
  value, label, accent = DARK,
}: { value: string; label: string; accent?: string }) {
  return (
    <div style={{
      border: `1.5px solid ${BORDER_GREY}`, borderRadius: 12,
      padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 34, fontWeight: 800, color: accent, fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
    </div>
  );
}

function LimeCallout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      border: `2px solid ${LIME}`, borderRadius: 10, padding: "14px 18px",
      background: "rgba(212,255,79,0.06)",
    }}>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProposalPrint({ proposal, allVenues }: Props) {
  const network = proposal.gym_networks;
  const networkName = network?.name ?? "Gym Network";
  const partnerPct = proposal.revenue_split_partner_pct;
  const gymgazePct = proposal.revenue_split_gymgaze_pct;
  const cpm = proposal.cpm_benchmark;
  const gracePeriod = proposal.grace_period_months;
  const dedicatedSlots = proposal.dedicated_slots_count;
  const slotSeconds = proposal.dedicated_slot_seconds;

  const proposalVenues = proposal.partnership_proposal_venues ?? [];
  const venueCount = proposalVenues.length;

  // Total active members across proposal venues
  const totalActiveMembers = proposalVenues.reduce((s, pv) => {
    return s + (pv.venues?.active_members ?? 0);
  }, 0);

  // Province breakdown
  const provinceMap = new Map<string, number>();
  proposalVenues.forEach((pv) => {
    const prov = pv.venues?.province ?? "Unknown";
    provinceMap.set(prov, (provinceMap.get(prov) ?? 0) + 1);
  });

  // Per-venue revenue projections
  const venueRevenues = proposalVenues.map((pv) => {
    const screens = pv.screens_planned || 2;
    const monthly = pv.monthly_rental_projection ?? calcMonthlyRevenue(screens, cpm, partnerPct);
    return {
      ...pv,
      monthly,
      screens,
    };
  });
  const totalMonthlyRevenue = venueRevenues.reduce((s, v) => s + v.monthly, 0);

  const today = todayStr();
  const flightLabel = proposal.flight_start && proposal.flight_end
    ? `${proposal.flight_start} — ${proposal.flight_end}`
    : today;

  const TOTAL_PAGES = 12;

  // Auto-print unless headless
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("noAutoPrint") === "1") return;
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print toolbar */}
      <div className="no-print" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: DARK, borderBottom: `1px solid rgba(212,255,79,0.2)`,
        padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ color: LIME, fontWeight: 700, fontSize: 14 }}>
          ⚡ Partnership Proposal — {networkName} × GymGaze
        </span>
        <button
          onClick={() => window.print()}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 18px", borderRadius: 10, background: LIME,
            color: DARK, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
          }}
        >
          <Printer size={14} strokeWidth={2.5} />
          Print / Save PDF
        </button>
      </div>
      <div className="no-print" style={{ height: 56 }} />

      <div id="proposal-print-root" style={{ fontFamily: "Inter, sans-serif", padding: "24px 0" }}>

        {/* ═══ PAGE 1 — COVER ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          {/* Header band: dual-branded */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "28px 48px", borderBottom: `1px solid ${BORDER_GREY}`, flexShrink: 0,
          }}>
            {/* Left: gym network */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {network?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/img?url=${encodeURIComponent(network.logo_url)}&w=120&q=80`}
                  alt={networkName}
                  style={{ height: 44, maxWidth: 140, objectFit: "contain" }}
                />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: 8, background: "#f0f0f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#555" }}>
                    {networkName.charAt(0)}
                  </span>
                </div>
              )}
              <span style={{ fontSize: 18, fontWeight: 700, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                {networkName}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 40, background: BORDER_GREY }} />

            {/* Right: GymGaze */}
            <GymGazeLogo size="md" />
          </div>

          {/* Center: main content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 80px", gap: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#999", marginBottom: 20 }}>
              Strategic Partnership Proposal
            </div>
            <div style={{
              fontSize: 58, fontWeight: 900, color: DARK, letterSpacing: "-0.03em",
              fontFamily: "Inter Tight, sans-serif", lineHeight: 1, textAlign: "center",
            }}>
              Strategic Media<br />Partnership
            </div>
            <LimeDivider />
            <div style={{ fontSize: 22, fontWeight: 700, color: "#333", marginTop: 4, fontFamily: "Inter Tight, sans-serif" }}>
              {networkName} × GymGaze
            </div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 10 }}>{flightLabel}</div>
          </div>

          {/* Footer strip */}
          <div style={{
            padding: "18px 48px", borderTop: `1px solid ${BORDER_GREY}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{
                background: LIME, color: DARK, fontSize: 10, fontWeight: 800,
                letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase",
              }}>Confidential</span>
              <span style={{
                border: `1px solid ${BORDER_GREY}`, color: "#666", fontSize: 10, fontWeight: 600,
                padding: "4px 12px", borderRadius: 20,
              }}>v{proposal.version}</span>
            </div>
            <span style={{ fontSize: 11, color: "#aaa" }}>Generated {today}</span>
          </div>
        </div>

        {/* ═══ PAGE 2 — EXECUTIVE SUMMARY ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Executive Summary" right={`${networkName} × GymGaze`} />

          <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden" }}>
            {/* Left: 4-paragraph narrative */}
            <div style={{ flex: 1, padding: "28px 36px", display: "flex", flexDirection: "column", gap: 18, overflowY: "hidden" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif", marginBottom: 8 }}>
                  A new revenue stream, zero capital outlay.
                </div>
                <LimeDivider />
              </div>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                This proposal outlines a strategic media partnership between <strong style={{ color: DARK }}>{networkName}</strong> and <strong style={{ color: DARK }}>GymGaze</strong>. By installing a turnkey DOOH (digital out-of-home) advertising network across your {venueCount} venues, {networkName} unlocks a recurring revenue stream with no capital expenditure — screens are installed, operated, and maintained by GymGaze at no cost to the gym.
              </p>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                GymGaze handles the full stack: hardware procurement, installation, ad sales, content moderation, technical support, and monthly reporting. Our platform places premium South African brands in front of a captive, high-value gym audience — LSM 7–10, average session length 55 minutes. You benefit from the revenue without the operational burden.
              </p>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                Commercial terms are simple: <strong style={{ color: DARK }}>{partnerPct}% of net ad revenue to {networkName}</strong>, {gymgazePct}% retained by GymGaze. A <strong style={{ color: DARK }}>{gracePeriod}-month grace period</strong> applies from installation completion — no revenue obligations during hardware setup and initial pipeline ramp-up.
              </p>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                In return, {networkName} provides: venue access for installation, electrical and network connectivity for screens, monthly Proof of Flight confirmation from venue managers, and a monthly member data feed to support audience verification and reporting. Each venue also retains <strong style={{ color: DARK }}>{dedicatedSlots} × {slotSeconds}-second dedicated slot</strong> per loop for your own brand content.
              </p>
            </div>

            {/* Right: key facts callout */}
            <div style={{ width: 280, padding: "28px 28px 28px 0", display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 }}>
              <LimeCallout>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 14 }}>
                  Key Facts
                </div>
                {[
                  { label: "Venues", value: `${venueCount}` },
                  { label: "Active Members", value: fmtFull(totalActiveMembers) },
                  { label: "Revenue Split", value: `${partnerPct}/${gymgazePct}` },
                  { label: "Grace Period", value: `${gracePeriod} months` },
                  { label: "CPM Benchmark", value: `R${cpm}` },
                  { label: "Dedicated Slot", value: `${dedicatedSlots} × ${slotSeconds}s` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", padding: "7px 0",
                    borderBottom: `1px solid rgba(0,0,0,0.06)`, fontSize: 12,
                  }}>
                    <span style={{ color: "#777" }}>{label}</span>
                    <span style={{ fontWeight: 700, color: DARK }}>{value}</span>
                  </div>
                ))}
              </LimeCallout>

              {/* Province pills */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: 10 }}>
                  Geographic Spread
                </div>
                {Array.from(provinceMap.entries()).map(([prov, count]) => (
                  <div key={prov} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "6px 0", borderBottom: `1px solid ${BORDER_GREY}`, fontSize: 12,
                  }}>
                    <span style={{ color: GREY_TEXT }}>{prov}</span>
                    <span style={{ fontWeight: 600, color: DARK }}>{count} venue{count !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <PageFooter page={2} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 3 — THE OPPORTUNITY ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="The Opportunity" right="Why DOOH in Gyms?" />

          <div style={{ flex: 1, padding: "28px 36px", display: "flex", flexDirection: "column", gap: 24, overflow: "hidden" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                A captive, premium audience with nowhere to look but your screen.
              </div>
              <LimeDivider />
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, marginTop: 10, maxWidth: 680 }}>
                Gym-goers are unlike any other out-of-home audience. They arrive with purpose, stay for extended periods, and return multiple times a week — creating unmatched frequency and dwell time for advertisers. The GymGaze network targets LSM 7–10 South Africans at the moment they are most receptive: mid-workout, between sets, post-class. This demographic commands premium CPMs and delivers genuine brand recall.
              </p>
            </div>

            {/* 3-column stat callouts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                {
                  value: "8.5 / 10",
                  label: "Attention Quality Score",
                  sub: "Captive, in-venue environment vs 0.5/10 for scrolling social",
                  accent: LIME,
                },
                {
                  value: fmtNum(Math.round(totalActiveMembers / Math.max(venueCount, 1))),
                  label: "Active Members / Venue",
                  sub: "Monthly active visitors per venue in the network",
                  accent: DARK,
                },
                {
                  value: "3.5×",
                  label: "Visits / Member / Week",
                  sub: "Average gym visitation frequency — industry benchmark",
                  accent: DARK,
                },
              ].map(({ value, label, sub, accent }) => (
                <div key={label} style={{
                  background: "#fafafa", border: `1.5px solid ${BORDER_GREY}`,
                  borderRadius: 12, padding: "22px 24px",
                  borderTop: `3px solid ${LIME}`,
                }}>
                  <div style={{ fontSize: 38, fontWeight: 900, color: accent, fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 6, lineHeight: 1.5 }}>
                    {sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Why it matters */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { icon: "🎯", title: "Captive Audience", desc: "Members cannot skip or scroll — ads play in the environment they chose to be in." },
                { icon: "⏱️", title: "55-Min Avg Session", desc: "Unmatched dwell time vs 5-second roadside glances or 2-second social scroll." },
                { icon: "💎", title: "Premium Demographic", desc: "LSM 7–10, health-conscious, above-average income — exactly who brands pay premium for." },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ padding: "12px 0", borderTop: `1px solid ${BORDER_GREY}` }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: DARK, margin: "6px 0 4px" }}>{title}</div>
                  <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, color: "#bbb", marginTop: "auto" }}>
              Source: GymGaze network data · Industry DOOH benchmarks · South African Out of Home Advertising Association (OOHSA)
            </div>
          </div>

          <PageFooter page={3} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 4 — NETWORK FOOTPRINT ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Network Footprint" right={`${venueCount} Venues`} />

          <div style={{ flex: 1, padding: "24px 36px", display: "flex", gap: 32, overflow: "hidden" }}>
            {/* Left: province summary */}
            <div style={{ width: 260, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 12 }}>
                By Province
              </div>
              {Array.from(provinceMap.entries()).map(([prov, count]) => (
                <div key={prov} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{prov}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3 }}>
                    <div style={{ height: 6, background: LIME, borderRadius: 3, width: `${(count / venueCount) * 100}%` }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 24, padding: "16px", background: "#fafafa", borderRadius: 10, border: `1px solid ${BORDER_GREY}` }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>{venueCount}</div>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Total Venues</div>
                <div style={{ height: 1, background: BORDER_GREY, margin: "10px 0" }} />
                <div style={{ fontSize: 30, fontWeight: 900, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>{fmtFull(totalActiveMembers)}</div>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Active Members</div>
              </div>
            </div>

            {/* Right: venue table */}
            <div style={{ flex: 1, overflowY: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    {["Venue", "City", "Province", "Active Members", "Screens Planned"].map((h) => (
                      <th key={h} style={{
                        padding: "8px 12px", textAlign: "left", fontWeight: 700,
                        color: "#888", fontSize: 10, textTransform: "uppercase",
                        letterSpacing: "0.06em", borderBottom: `2px solid ${BORDER_GREY}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {venueRevenues.map((pv, idx) => (
                    <tr key={pv.id} style={{ borderBottom: `1px solid ${BORDER_GREY}`, background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "7px 12px", fontWeight: 600, color: DARK }}>{pv.venues?.name ?? "—"}</td>
                      <td style={{ padding: "7px 12px", color: GREY_TEXT }}>{pv.venues?.city ?? "—"}</td>
                      <td style={{ padding: "7px 12px", color: GREY_TEXT }}>{pv.venues?.province ?? "—"}</td>
                      <td style={{ padding: "7px 12px", color: GREY_TEXT }}>{fmtFull(pv.venues?.active_members ?? 0)}</td>
                      <td style={{ padding: "7px 12px", fontWeight: 600, color: DARK }}>{pv.screens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ padding: "0 36px 8px" }}>
            <p style={{ fontSize: 10, color: "#bbb", margin: 0 }}>
              * All venues currently active. New venues added to the partnership subject to mutual written agreement. Member counts represent active registered members.
            </p>
          </div>

          <PageFooter page={4} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 5 — CPM EDUCATION ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Understanding CPM" right="How Your Revenue Is Calculated" />

          <div style={{ flex: 1, padding: "28px 36px", display: "flex", gap: 40, overflow: "hidden" }}>
            {/* Left column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                  What is CPM?
                </div>
                <LimeDivider />
                <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, marginTop: 10 }}>
                  <strong style={{ color: DARK }}>CPM (Cost Per Mille)</strong> is the standard pricing unit in advertising — it means the price an advertiser pays for every 1,000 ad plays (impressions). GymGaze's benchmark rate is <strong style={{ color: DARK }}>R{cpm} CPM</strong> for the gym network.
                </p>
              </div>

              {/* Example calc */}
              <LimeCallout>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 12 }}>
                  Example Calculation
                </div>
                {[
                  { step: "1", label: "Advertiser books 100,000 impressions", value: "100,000 plays" },
                  { step: "2", label: `At R${cpm} CPM`, value: `R${(100_000 / 1000 * cpm).toLocaleString("en-ZA")} gross` },
                  { step: "3", label: `${networkName} share (${partnerPct}%)`, value: fmtR(Math.round(100_000 / 1000 * cpm * partnerPct / 100)) },
                ].map(({ step, label, value }) => (
                  <div key={step} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", background: LIME,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: DARK, flexShrink: 0,
                    }}>{step}</div>
                    <span style={{ flex: 1, fontSize: 12, color: GREY_TEXT }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>{value}</span>
                  </div>
                ))}
              </LimeCallout>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 6 }}>Why CPM matters to you</div>
                <p style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                  The more impressions GymGaze sells on your screens, the more revenue your venues earn. Our sales team actively books advertisers to maximise sell-through across the network. Higher foot traffic = more plays = more impressions = more revenue to you.
                </p>
              </div>
            </div>

            {/* Right column: 3-step diagram */}
            <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Revenue Flow</div>
              {[
                { icon: "🏢", label: "Advertiser pays", sub: `R${cpm} per 1,000 plays` },
                { icon: "📺", label: "Impressions delivered", sub: "On your screens, to your members" },
                { icon: "💰", label: "Revenue split", sub: `${partnerPct}% to you · ${gymgazePct}% to GymGaze` },
              ].map(({ icon, label, sub }, idx) => (
                <div key={label}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 18px", background: "#fafafa",
                    border: `1.5px solid ${BORDER_GREY}`, borderRadius: 10,
                  }}>
                    <span style={{ fontSize: 24 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{sub}</div>
                    </div>
                  </div>
                  {idx < 2 && (
                    <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                      <div style={{ fontSize: 18, color: "#ccc" }}>↓</div>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ marginTop: 12 }}>
                <StatBox
                  value={`R${cpm}`}
                  label="Benchmark CPM"
                  accent={DARK}
                />
              </div>
            </div>
          </div>

          <PageFooter page={5} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 6 — REVENUE MODEL ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Revenue Model" right={`${partnerPct}/${gymgazePct} Split`} />

          <div style={{ flex: 1, padding: "24px 36px", display: "flex", gap: 36, overflow: "hidden" }}>
            {/* Left: split visual */}
            <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                  The {partnerPct}/{gymgazePct} Revenue Split
                </div>
                <LimeDivider />
              </div>

              {/* Visual split bar */}
              <div>
                <div style={{ display: "flex", height: 60, borderRadius: 8, overflow: "hidden", border: `1px solid ${BORDER_GREY}` }}>
                  <div style={{
                    width: `${partnerPct}%`, background: LIME, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: DARK }}>{partnerPct}%</span>
                  </div>
                  <div style={{
                    flex: 1, background: DARK, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{gymgazePct}%</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#888" }}>
                  <span>{networkName}</span>
                  <span>GymGaze</span>
                </div>
              </div>

              {/* Split breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  padding: "16px 18px", background: "rgba(212,255,79,0.08)",
                  border: `1.5px solid ${LIME}`, borderRadius: 10,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>{partnerPct}%</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: "4px 0" }}>to {networkName}</div>
                  <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>
                    Applies to digital screen ad revenue and static site rental income. Paid monthly, net 30 from month-end.
                  </div>
                </div>
                <div style={{
                  padding: "16px 18px", background: "#fafafa",
                  border: `1.5px solid ${BORDER_GREY}`, borderRadius: 10,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>{gymgazePct}%</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: "4px 0" }}>to GymGaze</div>
                  <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>
                    Covers ad sales, hardware operations, content moderation, ad serving infrastructure, and monthly reporting.
                  </div>
                </div>
              </div>
            </div>

            {/* Right: important exclusion + commercials */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Sponsorship exclusion callout — IMPORTANT */}
              <div style={{
                border: `2px solid ${LIME}`, borderRadius: 10, padding: "16px 18px",
                background: "rgba(212,255,79,0.04)",
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 8 }}>
                  ⚠️ Important Exclusion
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 6 }}>
                  Widget Sponsorships Are Excluded
                </div>
                <p style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: DARK }}>Widget sponsorships</strong> (News ticker, Sports scores, Weather widget) are <strong style={{ color: DARK }}>excluded from the revenue split</strong>. These premium placements remain 100% GymGaze revenue and are sold directly to national sponsors. They are separate from the standard DOOH advertising inventory.
                </p>
              </div>

              {/* What's included */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 10 }}>What the split covers</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Digital screen ads", included: proposal.digital_screens_included },
                    { label: "Static site rentals", included: proposal.static_sites_included },
                    { label: "Widget sponsorships", included: !proposal.sponsorships_excluded },
                    { label: "Dedicated slots (excl.)", included: false },
                  ].map(({ label, included }) => (
                    <div key={label} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", borderRadius: 8,
                      background: included ? "rgba(212,255,79,0.06)" : "#fafafa",
                      border: `1px solid ${included ? LIME : BORDER_GREY}`,
                    }}>
                      <span style={{ fontSize: 14 }}>{included ? "✅" : "❌"}</span>
                      <span style={{ fontSize: 12, color: included ? DARK : "#888", fontWeight: included ? 600 : 400 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "auto", fontSize: 10, color: "#bbb" }}>
                * Revenue calculated net of agency commissions and VAT. All amounts in South African Rand (ZAR).
              </div>
            </div>
          </div>

          <PageFooter page={6} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 7 — PER-VENUE REVENUE PROJECTION ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Revenue Projection" right={`${partnerPct}% Partner Share · R${cpm} CPM · 60% Sell-Through`} />

          <div style={{ flex: 1, padding: "20px 36px", display: "flex", flexDirection: "column", gap: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {["Venue", "City", "Screens", "Static Sites", "Est. Monthly Revenue (Your Share)"].map((h) => (
                    <th key={h} style={{
                      padding: "9px 12px", textAlign: "left", fontWeight: 700,
                      color: "#888", fontSize: 10, textTransform: "uppercase",
                      letterSpacing: "0.06em", borderBottom: `2px solid ${BORDER_GREY}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {venueRevenues.map((pv, idx) => (
                  <tr key={pv.id} style={{ borderBottom: `1px solid ${BORDER_GREY}`, background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "7px 12px", fontWeight: 600, color: DARK }}>{pv.venues?.name ?? "—"}</td>
                    <td style={{ padding: "7px 12px", color: GREY_TEXT }}>{pv.venues?.city ?? "—"}</td>
                    <td style={{ padding: "7px 12px", color: DARK, fontWeight: 600 }}>{pv.screens}</td>
                    <td style={{ padding: "7px 12px", color: GREY_TEXT }}>{pv.static_sites_planned}</td>
                    <td style={{ padding: "7px 12px", fontWeight: 700, color: DARK }}>{fmtR(Math.round(pv.monthly))}</td>
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ background: "rgba(212,255,79,0.08)", borderTop: `2px solid ${LIME}` }}>
                  <td colSpan={4} style={{ padding: "10px 12px", fontWeight: 800, color: DARK, fontSize: 13 }}>TOTAL (All Venues)</td>
                  <td style={{ padding: "10px 12px", fontWeight: 900, color: DARK, fontSize: 15, fontFamily: "Inter Tight, sans-serif" }}>{fmtR(Math.round(totalMonthlyRevenue))}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 16, fontSize: 10, color: "#bbb", lineHeight: 1.6 }}>
              * These are projections only, not guaranteed revenue. Calculation: 16 slots × 1,487 plays/screen/week × 4.33 weeks/month × R{cpm} CPM × 60% sell-through × {partnerPct}% partner share.
              Actual revenue depends on advertiser demand, sell-through rates, and campaign bookings. GymGaze does not guarantee minimum revenue.
            </div>
          </div>

          <PageFooter page={7} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 8 — GRACE PERIOD + DEDICATED SLOT ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Partner Benefits" right="Grace Period & Dedicated Content Slot" />

          <div style={{ flex: 1, padding: "28px 36px", display: "flex", gap: 32, overflow: "hidden" }}>
            {/* Left: Grace period */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                  {gracePeriod}-Month
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                  Grace Period
                </div>
                <LimeDivider />
              </div>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                From the date of installation completion at each venue, {networkName} enters a <strong style={{ color: DARK }}>{gracePeriod}-month grace period</strong>. During this period, <strong style={{ color: DARK }}>no revenue obligations exist</strong> — the partner owes nothing while GymGaze commissions hardware, installs screens, and builds the initial advertiser pipeline.
              </p>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                The grace period exists because responsible DOOH partnerships require time to: complete hardware installation across all venues (4–8 weeks), develop and on-board initial advertiser campaigns, ensure content moderation and scheduling systems are running correctly.
              </p>

              {/* Timeline */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 12 }}>Timeline from signing</div>
                {[
                  { label: "Weeks 1–2", desc: "Site surveys at each venue" },
                  { label: "Weeks 3–8", desc: "Hardware procurement + installation" },
                  { label: "Month 1–2", desc: `Grace period begins — R0 owed to ${networkName}` },
                  { label: "Month 3+", desc: "First revenue payable" },
                ].map(({ label, desc }, idx) => (
                  <div key={label} style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    padding: "8px 0", borderBottom: `1px solid ${BORDER_GREY}`,
                  }}>
                    <div style={{
                      width: 70, fontSize: 10, fontWeight: 700, color: idx === 2 ? DARK : "#888",
                      background: idx === 2 ? LIME : "#f5f5f5",
                      padding: "3px 8px", borderRadius: 20, textAlign: "center", flexShrink: 0,
                    }}>{label}</div>
                    <span style={{ fontSize: 12, color: GREY_TEXT }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: BORDER_GREY, flexShrink: 0 }} />

            {/* Right: Dedicated slot */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                  {dedicatedSlots} × {slotSeconds}s
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                  Dedicated Content Slot
                </div>
                <LimeDivider />
              </div>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                Every content loop on every GymGaze screen reserves <strong style={{ color: DARK }}>{dedicatedSlots} × {slotSeconds}-second slot</strong> exclusively for {networkName} content. This slot is yours to use for any brand communication you choose.
              </p>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                GymGaze provides the slot and scheduling. {networkName} provides the creative. There is no cost for this slot — it is part of the partnership agreement.
              </p>

              {/* Use cases */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: DARK }}>Suggested uses for your dedicated slot:</div>
                {[
                  "New member referral campaigns",
                  "Class / PT session promotions",
                  "Seasonal offers & challenges",
                  "Brand awareness & values messaging",
                  "Emergency / operational notices",
                ].map((use) => (
                  <div key={use} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: GREY_TEXT }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, flexShrink: 0 }} />
                    {use}
                  </div>
                ))}
              </div>

              <LimeCallout>
                <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 4 }}>Creative specs</div>
                <div style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.5 }}>
                  Resolution: 1920×1080 (landscape). Format: MP4 or JPG/PNG. Duration: {slotSeconds}s max. Delivery: upload via GymGaze portal, minimum 5 business days before go-live.
                </div>
              </LimeCallout>
            </div>
          </div>

          <PageFooter page={8} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 9 — OPERATIONAL OBLIGATIONS ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Operational Obligations" right="What Each Party Provides" />

          <div style={{ flex: 1, padding: "24px 36px", display: "flex", gap: 20, overflow: "hidden" }}>
            {[
              {
                title: `${networkName} Provides`,
                color: LIME,
                bg: "rgba(212,255,79,0.06)",
                border: LIME,
                items: [
                  "Venue access for site surveys and installation",
                  "Dedicated electrical supply per screen location",
                  "Stable internet / network connection at each screen",
                  "Monthly Proof of Flight upload via GymGaze portal (venue managers)",
                  "Monthly member data feed: active member count, demographic summary, footfall data",
                  "Advertiser exclusion list (industries / brands you will not accept)",
                  "Named venue manager contact per location",
                  "Reasonable access for maintenance and upgrades",
                ],
              },
              {
                title: "GymGaze Provides",
                color: DARK,
                bg: "#fafafa",
                border: BORDER_GREY,
                items: [
                  "Hardware procurement (screens, media players, mounts)",
                  "Professional installation at each venue",
                  "Remote monitoring and technical support",
                  "Content moderation — no harmful, illegal, or off-brand ads",
                  "Ad sales team — actively booking advertisers",
                  "Monthly impressions + revenue reporting dashboard",
                  "Dedicated slot scheduling per your creative",
                  "Maintenance, repair, and screen replacement if needed",
                  "Compliance with POPIA and OOHSA standards",
                ],
              },
              {
                title: "Jointly Managed",
                color: "#555",
                bg: "#fff",
                border: BORDER_GREY,
                items: [
                  "Advertiser category exclusion list (partner defines; GymGaze enforces)",
                  "Content approval process for partner's dedicated slot",
                  "Venue expansion discussions — new locations subject to mutual agreement",
                  "Annual performance review and CPM rate review",
                  "Emergency protocol for screen downtime",
                ],
              },
            ].map(({ title, color, bg, border, items }) => (
              <div key={title} style={{
                flex: 1, padding: "18px 20px", borderRadius: 12,
                background: bg, border: `1.5px solid ${border}`,
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "Inter Tight, sans-serif" }}>{title}</div>
                <div style={{ height: 2, background: color, borderRadius: 1, opacity: 0.3, width: 30 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((item) => (
                    <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 5 }} />
                      <span style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <PageFooter page={9} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 10 — COMMERCIAL TERMS ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Commercial Terms" right="Key Contractual Provisions" />

          <div style={{ flex: 1, padding: "24px 36px", display: "flex", gap: 32, overflow: "hidden" }}>
            {/* Left column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                Agreement Structure
              </div>
              <LimeDivider />
              {[
                { label: "Initial Term", value: "24 months from installation completion (recommended)" },
                { label: "Renewal", value: "Month-to-month thereafter, unless terminated per notice clause" },
                { label: "Payment Cycle", value: `${proposal.payment_cycle.charAt(0).toUpperCase() + proposal.payment_cycle.slice(1)}, paid net 30 from month-end` },
                { label: "Reporting Cadence", value: `${proposal.reporting_cadence.charAt(0).toUpperCase() + proposal.reporting_cadence.slice(1)} impressions + revenue dashboard via GymGaze platform` },
                { label: "Termination Notice", value: "90 days written notice after initial 12 months" },
                { label: "Early Termination", value: "Subject to hardware recovery costs if within initial term" },
                { label: "Force Majeure", value: "Standard force majeure provisions apply — neither party liable for delays due to events beyond reasonable control" },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "grid", gridTemplateColumns: "200px 1fr", gap: 12,
                  padding: "8px 0", borderBottom: `1px solid ${BORDER_GREY}`, fontSize: 12,
                }}>
                  <span style={{ fontWeight: 700, color: DARK }}>{label}</span>
                  <span style={{ color: GREY_TEXT }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Right column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                IP & Data
              </div>
              <LimeDivider />
              {[
                { label: "Platform IP", value: "GymGaze retains all rights to platform software, ad-serving technology, and operational systems" },
                { label: "Brand IP", value: `${networkName} retains all rights to its brand, venue identity, and member data` },
                { label: "Data Ownership", value: "Member data remains the property of the gym. GymGaze uses aggregated, anonymised data for performance optimisation and audience reporting only" },
                { label: "POPIA Compliance", value: "Both parties agree to process personal information in accordance with the Protection of Personal Information Act, 2013" },
                { label: "Advertiser Data", value: "Campaign performance data shared with advertisers is anonymised and aggregated — no individual member data disclosed" },
                { label: "Content Rights", value: "Advertiser creative materials are the property of the advertiser. GymGaze holds a licence to display approved content on the network" },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "grid", gridTemplateColumns: "180px 1fr", gap: 12,
                  padding: "8px 0", borderBottom: `1px solid ${BORDER_GREY}`, fontSize: 12,
                }}>
                  <span style={{ fontWeight: 700, color: DARK }}>{label}</span>
                  <span style={{ color: GREY_TEXT }}>{value}</span>
                </div>
              ))}

              <div style={{ marginTop: 8 }}>
                <LimeCallout>
                  <div style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.6 }}>
                    <strong style={{ color: DARK }}>Note:</strong> This document is a commercial proposal and summary of intended terms. The binding agreement will be a formal Partnership Agreement drafted and signed by both parties. All terms are subject to final negotiation and legal review.
                  </div>
                </LimeCallout>
              </div>
            </div>
          </div>

          <PageFooter page={10} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 11 — NEXT STEPS ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Next Steps" right="From Proposal to Live Network" />

          <div style={{ flex: 1, padding: "28px 36px", display: "flex", gap: 48, overflow: "hidden" }}>
            {/* Numbered steps */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif", marginBottom: 24 }}>
                From today to your first revenue cheque.
              </div>
              {[
                {
                  step: "01",
                  title: "Review & Sign Proposal",
                  desc: "Both parties review this proposal, align on final terms, and sign the formal Partnership Agreement.",
                  timeline: "Week 1",
                },
                {
                  step: "02",
                  title: "Site Surveys",
                  desc: "GymGaze technical team visits each venue to assess screen placement, electrical supply, and network connectivity.",
                  timeline: "Weeks 1–2",
                },
                {
                  step: "03",
                  title: "Hardware & Installation",
                  desc: "Screens, media players, and mounting hardware are procured and installed by our team at no cost to you.",
                  timeline: "Weeks 3–8",
                },
                {
                  step: "04",
                  title: "Grace Period Begins",
                  desc: `${gracePeriod}-month grace period commences from installation completion. No revenue obligations during this period.`,
                  timeline: `Months 1–${gracePeriod}`,
                },
                {
                  step: "05",
                  title: "First Revenue Payable",
                  desc: "Revenue sharing commences from month 3. Monthly statements delivered via the GymGaze reporting dashboard.",
                  timeline: "Month 3+",
                },
              ].map(({ step, title, desc, timeline }, idx) => (
                <div key={step} style={{ display: "flex", gap: 20, paddingBottom: 20, position: "relative" }}>
                  {/* Step number */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 48, flexShrink: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: idx === 4 ? LIME : "#f0f0f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800,
                      color: idx === 4 ? DARK : "#666",
                    }}>{step}</div>
                    {idx < 4 && (
                      <div style={{ flex: 1, width: 1, background: BORDER_GREY, minHeight: 20 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{title}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#888", background: "#f5f5f5", padding: "2px 8px", borderRadius: 20 }}>{timeline}</div>
                    </div>
                    <div style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact card */}
            <div style={{ width: 280, flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 16 }}>
                Ready to move forward?
              </div>
              <div style={{
                background: DARK, borderRadius: 12, padding: "24px 20px",
                display: "flex", flexDirection: "column", gap: 16,
              }}>
                <GymGazeLogo size="sm" />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                    {process.env.NEXT_PUBLIC_CONTACT_NAME ?? "GymGaze Sales Team"}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {process.env.NEXT_PUBLIC_CONTACT_TITLE ?? "Partnership Development"}
                  </div>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: "✉️", value: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@gymgaze.co.za" },
                    { icon: "📱", value: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+27 __ ___ ____" },
                    { icon: "🌐", value: "gymgaze.co.za" },
                  ].map(({ icon, value }) => (
                    <div key={value} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#aaa" }}>
                      <span>{icon}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 16, fontSize: 10, color: "#bbb", lineHeight: 1.6 }}>
                This proposal is valid for 30 days from the date of issue. Please reach out with any questions before the expiry date.
              </div>
            </div>
          </div>

          <PageFooter page={11} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 12 — SIGNATURES ═══ */}
        <div data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Acceptance & Signatures" right="Partnership Agreement" />

          <div style={{ flex: 1, padding: "32px 48px", display: "flex", flexDirection: "column", gap: 24, overflow: "hidden" }}>
            {/* Intro */}
            <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif", marginBottom: 8 }}>
                Acceptance of Proposal
              </div>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                By signing below, both parties confirm that they have read, understood, and agree to the commercial terms and operational obligations outlined in this proposal. This signed document serves as the basis for drafting the formal Partnership Agreement.
              </p>
            </div>

            {/* Signature blocks */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, flex: 1 }}>
              {[
                { party: networkName, role: "Partner — Authorised Representative", logo: "left" },
                { party: "GymGaze", role: "GymGaze — Authorised Representative", logo: "right" },
              ].map(({ party, role }) => (
                <div key={party} style={{
                  border: `1.5px solid ${BORDER_GREY}`, borderRadius: 12,
                  padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                    {party}
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>{role}</div>
                  <div style={{ height: 1, background: BORDER_GREY }} />

                  {/* Signature line */}
                  <div>
                    <div style={{ height: 60, borderBottom: `1.5px solid ${DARK}`, marginBottom: 6 }} />
                    <div style={{ fontSize: 11, color: "#aaa" }}>Signature</div>
                  </div>

                  {/* Name */}
                  <div>
                    <div style={{ height: 36, borderBottom: `1px solid ${BORDER_GREY}`, marginBottom: 6 }} />
                    <div style={{ fontSize: 11, color: "#aaa" }}>Full Name & Designation</div>
                  </div>

                  {/* Date */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                      <div style={{ height: 36, borderBottom: `1px solid ${BORDER_GREY}`, marginBottom: 6 }} />
                      <div style={{ fontSize: 11, color: "#aaa" }}>Date</div>
                    </div>
                    <div>
                      <div style={{ height: 36, borderBottom: `1px solid ${BORDER_GREY}`, marginBottom: 6 }} />
                      <div style={{ fontSize: 11, color: "#aaa" }}>Date of Witness</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div style={{ textAlign: "center", fontSize: 10, color: "#ccc" }}>
              This proposal was generated on {today} · Proposal ID: {proposal.id} · v{proposal.version} · CONFIDENTIAL
            </div>
          </div>

          <PageFooter page={12} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* Print button at bottom — hidden when printing */}
        <div className="no-print" style={{ marginTop: 16, display: "flex", justifyContent: "center", paddingBottom: 40 }}>
          <button
            onClick={() => window.print()}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 10, background: DARK,
              color: LIME, border: `2px solid ${LIME}`, fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}
          >
            <Printer size={16} strokeWidth={2.5} />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </>
  );
}
