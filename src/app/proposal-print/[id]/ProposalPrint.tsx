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
    rental_fee_monthly: number | null;
    current_occupancy_pct: number | null;
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
  // Occupancy floor fields (added in schema-occupancy-v1.sql)
  occupancy_floor_pct: number | null;
  occupancy_measurement: string | null;
  rental_pot_enabled: boolean | null;
  // Pot-to-credit fields (added in schema-pot-credit-v1.sql)
  pot_to_credit_enabled: boolean | null;
  pot_to_credit_pct: number | null;
  pot_credit_uses: string[] | null;
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
  current_occupancy_pct: number | null;
};

interface Props {
  proposal: Proposal;
  allVenues: AllVenue[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LIME = "#D4FF4F";
const DARK = "#0a0a0a";
const GREY_TEXT = "#333";
const BORDER_GREY = "#E5E7EB";
// Accessible label colors (WCAG AA compliant)
const LABEL_GREY = "#555";   // for small uppercase labels and captions
const CAPTION_GREY = "#666"; // for footnotes/disclaimers (min allowed)
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
// Gross ad revenue = screens × 16 slots × 1487 plays/screen/week × 4.33 weeks × CPM × 60% sell-through / 1000
function calcGrossMonthlyAdRevenue(screens: number, cpmBenchmark: number): number {
  const playsPerMonth = 16 * PLAYS_PER_SCREEN_PER_WEEK * 4.33 * screens;
  return (playsPerMonth / 1000) * cpmBenchmark * SELL_THROUGH;
}

/** @deprecated Use calcGrossMonthlyAdRevenue */
function calcMonthlyRevenue(screens: number, cpmBenchmark: number, partnerPct: number): number {
  return calcGrossMonthlyAdRevenue(screens, cpmBenchmark) * (partnerPct / 100);
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
      {right && <div style={{ fontSize: 12, color: LABEL_GREY }}>{right}</div>}
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
      <span style={{ fontSize: 10, color: CAPTION_GREY }}>
        CONFIDENTIAL — {networkName} × GymGaze Strategic Media Partnership
      </span>
      <span style={{ fontSize: 10, color: LABEL_GREY }}>
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
      <div style={{ fontSize: 11, color: LABEL_GREY, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
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

  // Per-venue revenue projections — Option 1: rental base + rev share upside
  const venueRevenues = proposalVenues.map((pv) => {
    const screens = pv.screens_planned || 2;
    const grossAdRevenue = calcGrossMonthlyAdRevenue(screens, cpm);
    const partnerAdShare = grossAdRevenue * (partnerPct / 100);
    const gymgazeAdShare = grossAdRevenue * (gymgazePct / 100);
    const rentalFee = pv.venues?.rental_fee_monthly ?? 0;
    const totalToPartner = partnerAdShare + rentalFee;
    const netToGymgaze = gymgazeAdShare - rentalFee;
    return {
      ...pv,
      screens,
      grossAdRevenue,
      partnerAdShare,
      gymgazeAdShare,
      rentalFee,
      totalToPartner,
      netToGymgaze,
      monthly: pv.monthly_rental_projection ?? partnerAdShare,
    };
  });
  const totalGrossAdRevenue = venueRevenues.reduce((s, v) => s + v.grossAdRevenue, 0);
  const totalPartnerAdShare = venueRevenues.reduce((s, v) => s + v.partnerAdShare, 0);
  const totalRentalFees = venueRevenues.reduce((s, v) => s + v.rentalFee, 0);
  const totalToPartner = venueRevenues.reduce((s, v) => s + v.totalToPartner, 0);
  const totalNetToGymgaze = venueRevenues.reduce((s, v) => s + v.netToGymgaze, 0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalMonthlyRevenue = totalPartnerAdShare;

  const today = todayStr();
  const flightLabel = proposal.flight_start && proposal.flight_end
    ? `${proposal.flight_start} — ${proposal.flight_end}`
    : today;

  const TOTAL_PAGES = 13;
  const occupancyFloor = proposal.occupancy_floor_pct ?? 35;

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

        {/* ═══ PAGE 1 — COVER (BLACK) ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE, background: DARK }}>
          {/* Header band: dual-branded */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "28px 48px", borderBottom: `1px solid rgba(255,255,255,0.08)`, flexShrink: 0,
          }}>
            {/* Left: gym network */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {network?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/img?url=${encodeURIComponent(network.logo_url)}&w=120&q=80`}
                  alt={networkName}
                  style={{ height: 44, maxWidth: 140, objectFit: "contain", filter: "brightness(0) invert(1)" }}
                />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: 8,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>
                    {networkName.charAt(0)}
                  </span>
                </div>
              )}
              <span style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", fontFamily: "Inter Tight, sans-serif" }}>
                {networkName}
              </span>
            </div>

            {/* Divider — lime accent on dark cover */}
            <div style={{ width: 1, height: 40, background: LIME, opacity: 0.6 }} />

            {/* Right: GymGaze */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, background: LIME, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: DARK, lineHeight: 1 }}>G</span>
              </div>
              <span style={{
                fontSize: 18, fontWeight: 800, color: "#ffffff",
                letterSpacing: "-0.02em", fontFamily: "Inter Tight, sans-serif",
              }}>GymGaze</span>
            </div>
          </div>

          {/* Center: main content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 80px", gap: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(212,255,79,0.7)", marginBottom: 20 }}>
              Strategic Partnership Proposal
            </div>
            <div style={{
              fontSize: 58, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em",
              fontFamily: "Inter Tight, sans-serif", lineHeight: 1, textAlign: "center",
            }}>
              Strategic Media<br />Partnership
            </div>
            {/* Lime divider on dark */}
            <div style={{ height: 3, background: LIME, borderRadius: 2, width: 40, margin: "14px 0" }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginTop: 4, fontFamily: "Inter Tight, sans-serif" }}>
              {networkName} × GymGaze
            </div>
            <div style={{ fontSize: 13, color: "#999", marginTop: 10 }}>{flightLabel}</div>
          </div>

          {/* Footer strip */}
          <div style={{
            padding: "18px 48px", borderTop: `1px solid rgba(255,255,255,0.08)`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{
                background: LIME, color: DARK, fontSize: 10, fontWeight: 800,
                letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase",
              }}>Confidential</span>
              <span style={{
                border: `1px solid rgba(212,255,79,0.4)`, color: LIME, fontSize: 10, fontWeight: 600,
                padding: "4px 12px", borderRadius: 20,
              }}>v{proposal.version}</span>
            </div>
            <span style={{ fontSize: 11, color: "#666" }}>Generated {today}</span>
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
                Commercial terms are simple: <strong style={{ color: DARK }}>{partnerPct}% of net ad revenue to {networkName}</strong>, {gymgazePct}% retained by GymGaze. A <strong style={{ color: DARK }}>{gracePeriod}-month setup runway</strong> applies from installation completion — no rental owed during this window while GymGaze installs hardware, builds the advertiser pipeline, and commissions the system. Rental fees activate per venue once that venue reaches ≥{occupancyFloor}% slot occupancy.
              </p>
              <p style={{ fontSize: 13, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                In return, {networkName} provides: venue access for installation and maintenance, power outlets at screen locations, monthly Proof of Flight confirmation from venue managers, and a monthly member data feed to support audience verification and reporting. GymGaze handles internet/connectivity for all screens at its own cost. Each venue also retains <strong style={{ color: DARK }}>{dedicatedSlots} × {slotSeconds}-second dedicated slot</strong> per loop for your own brand content.
              </p>
            </div>

            {/* Right: key facts callout */}
            <div style={{ width: 280, padding: "28px 28px 28px 0", display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 }}>
              <LimeCallout>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: LABEL_GREY, marginBottom: 14 }}>
                  Key Facts
                </div>
                {[
                  { label: "Venues", value: `${venueCount}` },
                  { label: "Active Members", value: fmtFull(totalActiveMembers) },
                  { label: "Revenue Split", value: `${partnerPct}/${gymgazePct}` },
                  { label: "Setup Runway", value: `${gracePeriod} months` },
                  { label: "CPM Benchmark", value: `R${cpm}` },
                  { label: "Dedicated Slot", value: `${dedicatedSlots} × ${slotSeconds}s` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", padding: "7px 0",
                    borderBottom: `1px solid rgba(0,0,0,0.06)`, fontSize: 12,
                  }}>
                    <span style={{ color: LABEL_GREY }}>{label}</span>
                    <span style={{ fontWeight: 700, color: DARK }}>{value}</span>
                  </div>
                ))}
              </LimeCallout>

              {/* Province pills */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: LABEL_GREY, marginBottom: 10 }}>
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
                  accent: DARK,
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
                  <div style={{ fontSize: 11, color: LABEL_GREY, marginTop: 6, lineHeight: 1.5 }}>
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
                  <div style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, color: CAPTION_GREY, marginTop: "auto" }}>
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
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: LABEL_GREY, marginBottom: 12 }}>
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
                <div style={{ fontSize: 11, color: LABEL_GREY, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Total Venues</div>
                <div style={{ height: 1, background: BORDER_GREY, margin: "10px 0" }} />
                <div style={{ fontSize: 30, fontWeight: 900, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>{fmtFull(totalActiveMembers)}</div>
                <div style={{ fontSize: 11, color: LABEL_GREY, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Active Members</div>
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
                        color: LABEL_GREY, fontSize: 10, textTransform: "uppercase",
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
            <p style={{ fontSize: 10, color: CAPTION_GREY, margin: 0 }}>
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
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: LABEL_GREY, marginBottom: 12 }}>
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
                      <div style={{ fontSize: 11, color: LABEL_GREY, marginTop: 2 }}>{sub}</div>
                    </div>
                  </div>
                  {idx < 2 && (
                    <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                      <div style={{ fontSize: 18, color: LABEL_GREY }}>↓</div>
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
                  The {gymgazePct}/{partnerPct} Revenue Split
                </div>
                <LimeDivider />
              </div>

              {/* Visual split bar */}
              <div>
                <div style={{ display: "flex", height: 60, borderRadius: 8, overflow: "hidden", border: `1px solid ${BORDER_GREY}` }}>
                  <div style={{
                    width: `${gymgazePct}%`, background: DARK, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: LIME }}>{gymgazePct}%</span>
                  </div>
                  <div style={{
                    flex: 1, background: LIME, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: DARK }}>{partnerPct}%</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: LABEL_GREY }}>
                  <span>GymGaze</span>
                  <span>{networkName}</span>
                </div>
              </div>

              {/* Split breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* GymGaze block */}
                <div style={{
                  padding: "14px 16px", background: "#fafafa",
                  border: `1.5px solid ${BORDER_GREY}`, borderRadius: 10,
                }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>{gymgazePct}%</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: "3px 0" }}>to GymGaze</div>
                  <div style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.5 }}>
                    Covers ad sales, hardware, ops, content moderation, ad serving, platform, and monthly reporting.
                  </div>
                </div>
                {/* Partner block */}
                <div style={{
                  padding: "14px 16px", background: "rgba(212,255,79,0.06)",
                  border: `1.5px solid ${LIME}`, borderRadius: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>{partnerPct}%</div>
                    <div style={{ fontSize: 11, color: LABEL_GREY }}>+ guaranteed rental</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: "3px 0" }}>to {networkName}</div>
                  <div style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.6 }}>
                    <strong style={{ color: DARK }}>{partnerPct}%</strong> of digital ad revenue (monthly, net 30)<br />
                    + <strong style={{ color: DARK }}>Guaranteed monthly rental fee</strong> per venue (location lease)
                  </div>
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(212,255,79,0.1)", borderRadius: 6, fontSize: 10, color: DARK, fontWeight: 600 }}>
                    Total {networkName} upside = Guaranteed rental (floor) + {partnerPct}% rev share (upside)
                  </div>
                </div>
              </div>
            </div>

            {/* Right: model clarity + exclusions */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* How the model works */}
              <div style={{
                border: `1.5px solid ${BORDER_GREY}`, borderRadius: 10, padding: "14px 16px",
                background: "#fafafa",
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: LABEL_GREY, marginBottom: 10 }}>
                  How the model works
                </div>
                {[
                  { icon: "🏠", title: "Guaranteed Rental (floor)", desc: `${networkName} receives a guaranteed monthly rental fee per venue — regardless of ad revenue. This is the base commitment.` },
                  { icon: "📈", title: `${partnerPct}% Ad Revenue Share (upside)`, desc: `On top of the rental, ${networkName} earns ${partnerPct}% of all digital ad revenue at each venue. More bookings = more upside.` },
                  { icon: "💡", title: "Total to Edge = Rental + Revenue Share", desc: "GymGaze pays both. These are additive — not either/or." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER_GREY}` }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: DARK }}>{title}</div>
                      <div style={{ fontSize: 10, color: GREY_TEXT, lineHeight: 1.5, marginTop: 2 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sponsorship exclusion */}
              <div style={{
                border: `2px solid ${LIME}`, borderRadius: 10, padding: "12px 14px",
                background: "rgba(212,255,79,0.04)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: LABEL_GREY, marginBottom: 6 }}>
                  ⚠️ Important Exclusion
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 4 }}>
                  Widget Sponsorships Are Excluded
                </div>
                <p style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: DARK }}>Widget sponsorships</strong> (News ticker, Sports scores, Weather widget) are <strong style={{ color: DARK }}>excluded from the revenue split</strong>. These remain 100% GymGaze revenue.
                </p>
              </div>

              {/* What's included */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 8 }}>What the split covers</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Digital screen ads", included: proposal.digital_screens_included },
                    { label: "Static site rentals", included: proposal.static_sites_included },
                    { label: "Widget sponsorships", included: !proposal.sponsorships_excluded },
                    { label: "Dedicated slots (excl.)", included: false },
                  ].map(({ label, included }) => (
                    <div key={label} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", borderRadius: 8,
                      background: included ? "rgba(212,255,79,0.06)" : "#fafafa",
                      border: `1px solid ${included ? LIME : BORDER_GREY}`,
                    }}>
                      <span style={{ fontSize: 13 }}>{included ? "✅" : "❌"}</span>
                      <span style={{ fontSize: 11, color: included ? DARK : "#888", fontWeight: included ? 600 : 400 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "auto", fontSize: 9, color: CAPTION_GREY, lineHeight: 1.6 }}>
                * Revenue calculated net of agency commissions and VAT. All amounts in ZAR.<br />
                * {networkName} receives a guaranteed monthly rental fee + {partnerPct}% of digital ad revenue per venue, after agency commission and VAT.<br />
                * <strong style={{ color: LABEL_GREY }}>Guaranteed rental fees subject to {occupancyFloor}% occupancy floor — see Page 8 for full activation conditions.</strong>
              </div>
            </div>
          </div>

          <PageFooter page={6} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 7 — PER-VENUE REVENUE PROJECTION ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Per-Venue Revenue Projection" right={`R${cpm} CPM · 60% Sell-Through · Rental + ${partnerPct}% Rev Share`} />

          <div style={{ flex: 1, padding: "14px 24px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {[
                    { h: "Venue",                           align: "left"   as const },
                    { h: "Walk-Ins",                        align: "right"  as const },
                    { h: "Screens",                         align: "right"  as const },
                    { h: "Gross Ad Revenue",                align: "right"  as const },
                    { h: "Rental Potential",                align: "right"  as const },
                    { h: "Rental Owed",                     align: "right"  as const },
                    { h: `${partnerPct}% Rev Share`,        align: "right"  as const },
                    { h: "Total to Edge",                   align: "right"  as const },
                    { h: "Status",                          align: "center" as const },
                  ].map(({ h, align }) => (
                    <th key={h} style={{
                      padding: "6px 8px", textAlign: align, fontWeight: 700,
                      color: LABEL_GREY, fontSize: 9, textTransform: "uppercase",
                      letterSpacing: "0.04em", borderBottom: `2px solid ${BORDER_GREY}`,
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {venueRevenues.map((pv, idx) => {
                  const occupancy = pv.venues?.current_occupancy_pct ?? 0;
                  const isActive = occupancy >= occupancyFloor;
                  const rentalOwed = isActive ? pv.rentalFee : 0;
                  return (
                    <tr key={pv.id} style={{ borderBottom: `1px solid ${BORDER_GREY}`, background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "5px 8px", fontWeight: 600, color: DARK, fontSize: 10 }}>{pv.venues?.name ?? "—"}</td>
                      <td style={{ padding: "5px 8px", color: GREY_TEXT, textAlign: "right", fontSize: 9 }}>{pv.venues?.monthly_entries ? fmtNum(pv.venues.monthly_entries) : "—"}</td>
                      <td style={{ padding: "5px 8px", color: DARK, fontWeight: 600, textAlign: "right" }}>{pv.screens}</td>
                      <td style={{ padding: "5px 8px", color: GREY_TEXT, textAlign: "right" }}>{fmtR(Math.round(pv.grossAdRevenue))}</td>
                      <td style={{ padding: "5px 8px", color: GREY_TEXT, textAlign: "right" }}>{fmtR(pv.rentalFee)}</td>
                      <td style={{ padding: "5px 8px", color: isActive ? DARK : "#b91c1c", textAlign: "right", fontWeight: isActive ? 600 : 400 }}>{fmtR(rentalOwed)}</td>
                      <td style={{ padding: "5px 8px", color: GREY_TEXT, textAlign: "right" }}>{fmtR(Math.round(pv.partnerAdShare))}</td>
                      <td style={{ padding: "5px 8px", fontWeight: 700, color: DARK, textAlign: "right" }}>{fmtR(Math.round(pv.partnerAdShare + rentalOwed))}</td>
                      <td style={{ padding: "5px 8px", textAlign: "center" }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20,
                          background: isActive ? "rgba(212,255,79,0.15)" : "#f0f0f0",
                          color: isActive ? "#3a7d00" : "#888",
                          whiteSpace: "nowrap",
                        }}>
                          {isActive ? `Active ≥${occupancyFloor}%` : "Setup Phase"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                {(() => {
                  const totalRentalOwed = venueRevenues.reduce((s, pv) => {
                    const occ = pv.venues?.current_occupancy_pct ?? 0;
                    return s + (occ >= occupancyFloor ? pv.rentalFee : 0);
                  }, 0);
                  return (
                    <tr style={{ background: "rgba(212,255,79,0.08)", borderTop: `2px solid ${LIME}` }}>
                      <td colSpan={3} style={{ padding: "8px 8px", fontWeight: 800, color: DARK, fontSize: 11 }}>TOTAL</td>
                      <td style={{ padding: "8px 8px", fontWeight: 700, color: GREY_TEXT, textAlign: "right" }}>{fmtR(Math.round(totalGrossAdRevenue))}</td>
                      <td style={{ padding: "8px 8px", fontWeight: 700, color: GREY_TEXT, textAlign: "right" }}>{fmtR(Math.round(totalRentalFees))}</td>
                      <td style={{ padding: "8px 8px", fontWeight: 900, color: totalRentalOwed === 0 ? "#b91c1c" : DARK, textAlign: "right", fontSize: 11 }}>{fmtR(Math.round(totalRentalOwed))}</td>
                      <td style={{ padding: "8px 8px", fontWeight: 700, color: GREY_TEXT, textAlign: "right" }}>{fmtR(Math.round(totalPartnerAdShare))}</td>
                      <td style={{ padding: "8px 8px", fontWeight: 900, color: DARK, textAlign: "right", fontSize: 13, fontFamily: "Inter Tight, sans-serif" }}>{fmtR(Math.round(totalPartnerAdShare + totalRentalOwed))}</td>
                      <td />
                    </tr>
                  );
                })()}
              </tbody>
            </table>

            {/* Summary strip — dual totals */}
            {(() => {
              const totalRentalOwed = venueRevenues.reduce((s, pv) => {
                const occ = pv.venues?.current_occupancy_pct ?? 0;
                return s + (occ >= occupancyFloor ? pv.rentalFee : 0);
              }, 0);
              return (
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { label: "Gross Ad Revenue",           value: fmtR(Math.round(totalGrossAdRevenue)), sub: "All venues / month",            accent: DARK },
                    { label: "Rental Potential (at floor)", value: fmtR(Math.round(totalRentalFees)),    sub: `At ≥${occupancyFloor}% occupancy`, accent: DARK },
                    { label: "Rental Currently Owed",      value: fmtR(Math.round(totalRentalOwed)),     sub: "Setup Phase: R0",               accent: totalRentalOwed === 0 ? "#b91c1c" : DARK },
                    { label: `${partnerPct}% Rev Share`,   value: fmtR(Math.round(totalPartnerAdShare)), sub: "On top of rental",              accent: DARK },
                  ].map(({ label, value, sub, accent }) => (
                    <div key={label} style={{ background: "#fafafa", border: `1px solid ${BORDER_GREY}`, borderRadius: 8, padding: "9px 12px" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: accent, fontFamily: "Inter Tight, sans-serif" }}>{value}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: DARK, marginTop: 3 }}>{label}</div>
                      <div style={{ fontSize: 9, color: CAPTION_GREY, marginTop: 2 }}>{sub}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Dual rental totals callout */}
            <div style={{
              marginTop: 8, padding: "7px 12px",
              background: "rgba(212,255,79,0.04)", border: `1px solid ${LIME}`,
              borderRadius: 8, display: "flex", gap: 24, alignItems: "center",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: DARK }}>
                Total rental potential (at ≥{occupancyFloor}% occupancy floor): {fmtR(Math.round(totalRentalFees))}/mo
              </span>
              <span style={{ width: 1, height: 16, background: BORDER_GREY }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#b91c1c" }}>
                Total rental currently owed (Setup Phase): R\u00a00/mo
              </span>
            </div>

            <div style={{ marginTop: 8, fontSize: 9, color: CAPTION_GREY, lineHeight: 1.6 }}>
              * Projections only — not guaranteed. Calc: 16 slots × 1,487 plays/screen/week × 4.33 weeks × R{cpm} CPM × 60% sell-through.
              {" "}&#8220;Rental Owed&#8221; shows R0 during Setup Phase (pre-launch, 0% occupancy). Rental activates per venue at ≥{occupancyFloor}% slot occupancy.
            </div>
          </div>

          <PageFooter page={7} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 8 — SETUP RUNWAY & RENTAL ACTIVATION ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Setup Runway & Rental Activation" right="How the Commercial Clock Works" />

          <div style={{ flex: 1, padding: "28px 36px", display: "flex", gap: 0, overflow: "hidden" }}>

            {/* LEFT COLUMN — 60% */}
            <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: 14, paddingRight: 32, borderRight: `1px solid ${BORDER_GREY}` }}>
              {/* Big number */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 72, fontWeight: 900, color: LIME, fontFamily: "Inter Tight, sans-serif", lineHeight: 1 }}>{gracePeriod}</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>months</span>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                  Setup Runway — Not Free Rent
                </div>
                <LimeDivider />
              </div>

              <p style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                The {gracePeriod}-month setup runway is when GymGaze does the heavy lifting. During this period:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  `We install screens at each ${networkName} venue`,
                  "Our technical team commissions and tests the system",
                  "We onboard our advertiser sales team",
                  "We build the initial advertiser pipeline and book first-month inventory",
                  "We work with each gym manager to integrate Proof of Flight workflows",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, flexShrink: 0, marginTop: 5 }} />
                    <span style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{
                background: "#fafafa", border: `1.5px solid ${BORDER_GREY}`, borderRadius: 10,
                padding: "14px 16px", marginTop: 4,
              }}>
                <p style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                  Because no inventory has been sold yet, <strong style={{ color: DARK }}>no rental fees are owed during this window</strong>. This is not a free-rent concession to {networkName} — it&apos;s the necessary commercial reality of launching a new media network. Both parties invest: {networkName} contributes venue access; GymGaze contributes capital, hardware, sales infrastructure, and operational risk.
                </p>
              </div>

              {/* Timeline */}
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>Timeline from signing</div>
                {[
                  { label: "Weeks 1–2",    desc: "Site surveys at each venue",                          highlight: false },
                  { label: "Weeks 3–8",    desc: "Hardware procurement + installation",                 highlight: false },
                  { label: `Month 1–${gracePeriod}`, desc: `Setup runway — R0 rental owed to ${networkName}`, highlight: true },
                  { label: `Month ${gracePeriod + 1}+`, desc: "Rental activates per venue at ≥35% occupancy",  highlight: false },
                ].map(({ label, desc, highlight }) => (
                  <div key={label} style={{
                    display: "flex", gap: 12, alignItems: "center",
                    padding: "7px 0", borderBottom: `1px solid ${BORDER_GREY}`,
                  }}>
                    <div style={{
                      width: 80, fontSize: 10, fontWeight: 700,
                      background: highlight ? LIME : "#f5f5f5",
                      color: highlight ? DARK : "#888",
                      padding: "3px 8px", borderRadius: 20, textAlign: "center", flexShrink: 0,
                    }}>{label}</div>
                    <span style={{ fontSize: 11, color: GREY_TEXT }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN — 40% */}
            <div style={{ flex: 2, paddingLeft: 28, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                  Rental Activation — {occupancyFloor}% Occupancy Floor
                </div>
                <LimeDivider />
              </div>

              <p style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                Guaranteed monthly rental fees activate <strong style={{ color: DARK }}>per venue</strong> once that venue reaches <strong style={{ color: DARK }}>≥{occupancyFloor}% slot occupancy</strong> (sell-through rate).
              </p>
              <p style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                Below {occupancyFloor}%, no rental is owed for that month. This protects both parties: GymGaze isn&apos;t subsidising empty inventory, and {networkName} participates in the upside as soon as commercial momentum is real at each location.
              </p>

              {/* Occupancy bar visual */}
              <div style={{
                background: "#fafafa", border: `1.5px solid ${BORDER_GREY}`, borderRadius: 10, padding: "16px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 12 }}>Occupancy Threshold</div>
                {/* Bar */}
                <div style={{ position: "relative", height: 32, borderRadius: 8, overflow: "hidden", background: "#f0f0f0" }}>
                  {/* Below floor zone */}
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${occupancyFloor}%`,
                    background: "rgba(239,68,68,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#b91c1c" }}>R0 rental owed</span>
                  </div>
                  {/* Above floor zone */}
                  <div style={{
                    position: "absolute", left: `${occupancyFloor}%`, top: 0, bottom: 0, right: 0,
                    background: "rgba(212,255,79,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#3a7d00" }}>Full rental owed</span>
                  </div>
                  {/* Threshold line */}
                  <div style={{
                    position: "absolute", left: `${occupancyFloor}%`, top: 0, bottom: 0,
                    width: 2, background: DARK,
                  }} />
                </div>
                {/* Labels */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: LABEL_GREY }}>
                  <span>0%</span>
                  <span style={{ fontWeight: 700, color: DARK }}>← {occupancyFloor}% threshold →</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Activation mechanics */}
              <LimeCallout>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: LABEL_GREY, marginBottom: 10 }}>
                  Activation Mechanics
                </div>
                {[
                  { icon: "✅", text: `Occupancy ≥${occupancyFloor}%: Full rental fee owed that month` },
                  { icon: "❌", text: `Occupancy <${occupancyFloor}%: R0 rental owed that month` },
                  { icon: "📊", text: "Measured per venue — each gym is independent" },
                  { icon: "📅", text: "Calculated monthly — resets each billing period" },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", gap: 8, padding: "5px 0", fontSize: 11, color: GREY_TEXT }}>
                    <span style={{ flexShrink: 0 }}>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </LimeCallout>

              <div style={{ marginTop: "auto", fontSize: 10, color: CAPTION_GREY, lineHeight: 1.5 }}>
                See Page 9 for the Rental Pot Transparency tracker — how {networkName} can see what each venue would be earning at full occupancy.
              </div>
            </div>
          </div>

          <PageFooter page={8} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 9 — RENTAL POT TRANSPARENCY ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Rental Pot Transparency" right="What You'd Be Earning at Full Occupancy" />

          <div style={{ flex: 1, padding: "24px 36px", display: "flex", gap: 36, overflow: "hidden" }}>
            {/* Left: explanation */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>
                  The Rental Pot
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: LABEL_GREY, fontFamily: "Inter Tight, sans-serif", marginTop: 2 }}>
                  What you&apos;d be earning at full occupancy
                </div>
                <LimeDivider />
              </div>

              <p style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                Every month, we calculate what each {networkName} venue <strong style={{ color: DARK }}>WOULD</strong> be earning in guaranteed rental if it were at or above {occupancyFloor}% occupancy. When a venue is below the threshold and no rental is owed, the foregone rental is logged transparently in your <strong style={{ color: DARK }}>Rental Pot tracker</strong> — visible at any time in the GymGaze platform.
              </p>
              <p style={{ fontSize: 12, color: GREY_TEXT, lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: DARK }}>This isn&apos;t a deferred liability</strong> — {networkName} isn&apos;t paid out from the pot. It&apos;s a transparency tool: it shows the real opportunity cost of slow-selling inventory and motivates both teams to grow occupancy fast.
              </p>

              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 10 }}>You&apos;ll see for each venue:</div>
                {[
                  "Current month occupancy",
                  `Rental owed (if ≥${occupancyFloor}%) or R0 (if <${occupancyFloor}%)`,
                  "Pot accumulation (what you would have earned)",
                  "Quarterly pot summary",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "5px 0", borderBottom: `1px solid ${BORDER_GREY}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, flexShrink: 0, marginTop: 5 }} />
                    <span style={{ fontSize: 12, color: GREY_TEXT }}>{item}</span>
                  </div>
                ))}
              </div>

              <LimeCallout>
                <div style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 4 }}>Why this matters</div>
                <p style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.6, margin: 0 }}>
                  The pot creates accountability. When {networkName} sees that Walmer would have earned R2,500 this month but didn&apos;t because occupancy was at 28%, both parties have a shared incentive to drive that number above 35% next month. Transparency builds trust and aligns interests.
                </p>
              </LimeCallout>
            </div>

            {/* Right: sample tracker table */}
            <div style={{ flex: 1.1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Sample Rental Pot Tracker</div>

              <div style={{ border: `1.5px solid ${BORDER_GREY}`, borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      {["Venue", "Occupancy", "Threshold", "Rental Owed", "In Pot", "YTD Pot"].map((h) => (
                        <th key={h} style={{
                          padding: "8px 10px", textAlign: h === "Venue" ? "left" : "center",
                          fontWeight: 700, color: LABEL_GREY, fontSize: 9, textTransform: "uppercase",
                          letterSpacing: "0.06em", borderBottom: `2px solid ${BORDER_GREY}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { venue: "Sunnyside",  occ: 42, active: true,  rental: "R\u00a02,500", pot: "—",        ytd: "R\u00a05,000" },
                      { venue: "Walmer",     occ: 28, active: false, rental: "R\u00a00",     pot: "R\u00a02,500", ytd: "R\u00a07,500" },
                      { venue: "Spruitview", occ: 35, active: true,  rental: "R\u00a02,200", pot: "—",        ytd: "R\u00a04,400" },
                    ].map(({ venue, occ, active, rental, pot, ytd }, idx) => (
                      <tr key={venue} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa", borderBottom: `1px solid ${BORDER_GREY}` }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: DARK }}>{venue}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600, color: active ? "#3a7d00" : "#b91c1c" }}>{occ}%</td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                            background: active ? "rgba(212,255,79,0.15)" : "rgba(239,68,68,0.1)",
                            color: active ? "#3a7d00" : "#b91c1c",
                          }}>
                            {active ? "✓ Active" : "✗ Below"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: active ? DARK : "#b91c1c" }}>{rental}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: active ? "#aaa" : "#F59E0B", fontWeight: active ? 400 : 700 }}>{pot}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600, color: DARK }}>{ytd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "10px", background: "rgba(212,255,79,0.04)", borderTop: `1px solid ${BORDER_GREY}` }}>
                  <div style={{ fontSize: 10, color: LABEL_GREY, textAlign: "center" }}>
                    Sample data for illustration. Actual figures depend on real occupancy at each venue.
                  </div>
                </div>
              </div>

              {/* Pot mechanics */}
              <div style={{
                padding: "14px 16px", background: "#fafafa",
                border: `1.5px solid ${BORDER_GREY}`, borderRadius: 10,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 8 }}>How the pot is calculated</div>
                {[
                  { step: "1", label: "Each venue has a rental_fee_monthly (e.g. R2,500)" },
                  { step: "2", label: `If occupancy ≥${occupancyFloor}%: rental is owed — nothing enters the pot` },
                  { step: "3", label: `If occupancy <${occupancyFloor}%: R0 rental owed — rental_fee_monthly goes into the pot` },
                  { step: "4", label: "Pot is cumulative — grows until occupancy exceeds the floor" },
                ].map(({ step, label }) => (
                  <div key={step} style={{ display: "flex", gap: 10, padding: "5px 0", fontSize: 11, color: GREY_TEXT }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", background: LIME,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, color: DARK, flexShrink: 0,
                    }}>{step}</div>
                    <span style={{ lineHeight: 1.4 }}>{label}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 10, color: CAPTION_GREY, lineHeight: 1.5, marginTop: "auto" }}>
                Real-time tracking available in your {networkName} partner portal once the partnership goes live. Pot resets are never made — the YTD pot is a running total of foregone rental since partnership commencement.
              </div>
            </div>
          </div>

          {/* ── FAQ callout: does the pot pay out? (always visible) ── */}
          <div style={{ padding: "0 36px 20px" }}>
            <div style={{
              background: "#f5f5f5",
              borderRadius: 10,
              padding: "16px 20px",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: LIME, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 900, color: DARK,
              }}>?</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 6 }}>
                  Frequently Asked: Does the pot pay out?
                </div>
                <p style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.65, margin: 0 }}>
                  No. The pot is a transparency display only — it shows the foregone rental opportunity when a venue is below the {occupancyFloor}% occupancy floor. It is not a liability or a deferred balance and does not accumulate as a payout owed to {networkName}.
                </p>
                <p style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.65, margin: "6px 0 0" }}>
                  The pot exists so both teams see real-time the cost of under-performance and align on growing occupancy fast. Rental fees are only owed and paid for months at or above the {occupancyFloor}% floor. The pot resets quarterly as a fresh tracker.
                </p>
              </div>
            </div>

            {/* ── Pot-to-credit explainer: only when toggle is ON ── */}
            {proposal.pot_to_credit_enabled && (
              <div style={{
                marginTop: 12,
                border: `2px solid ${LIME}`,
                borderRadius: 10,
                background: "#ffffff",
                padding: "16px 20px",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: LIME, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 900, color: DARK,
                }}>→</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 6 }}>
                    Pot-to-Credit Conversion (Optional Programme)
                  </div>
                  <p style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.65, margin: 0 }}>
                    By mutual agreement, <strong style={{ color: DARK }}>{proposal.pot_to_credit_pct ?? 25}%</strong> of the unpaid pot balance can be converted into {networkName} promotional credits at quarter-end. These credits can be applied to:
                  </p>
                  <ul style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.65, margin: "6px 0 0", paddingLeft: 18 }}>
                    {(proposal.pot_credit_uses ?? []).includes("top_up_bonus") && (
                      <li>Top-up bonus in months {networkName} hits the {occupancyFloor}% floor (added to the regular rental payout)</li>
                    )}
                    {(proposal.pot_credit_uses ?? []).includes("cobranded_marketing") && (
                      <li>Co-branded marketing campaigns produced by GymGaze (creative for {networkName} member recruitment, class promos, brand campaigns)</li>
                    )}
                    {(proposal.pot_credit_uses ?? []).includes("extra_dedicated_slot") && (
                      <li>Expansion of dedicated slot allocation (additional 7-second slots reserved for {networkName} content)</li>
                    )}
                  </ul>
                  <p style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.65, margin: "6px 0 0" }}>
                    This programme rewards sustained occupancy growth and gives {networkName} visible value from the platform&apos;s transparency model. Credits expire 12 months after issue and are not redeemable for cash.
                  </p>
                </div>
              </div>
            )}
          </div>

          <PageFooter page={9} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 10 — OPERATIONAL OBLIGATIONS ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Operational Obligations" right="What Each Party Provides" />

          <div style={{ flex: 1, padding: "24px 36px", display: "flex", gap: 20, overflow: "hidden" }}>
            {[
              {
                title: `${networkName} Provides`,
                color: DARK,
                bg: "rgba(212,255,79,0.06)",
                border: LIME,
                items: [
                  "Venue access for site surveys, installation, and ongoing maintenance",
                  "Power outlets at agreed screen locations (standard wall socket per screen)",
                  "Monthly Proof of Flight upload via GymGaze portal (venue manager responsibility)",
                  "Monthly member data feed: active member count, demographic summary, footfall data",
                  "Advertiser exclusion list (industries / brands you will not accept)",
                  "Named venue manager contact per location",
                  "Reasonable access for hardware upgrades and technical visits",
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
                  "Internet / connectivity for all screens (LTE/5G data SIM or installed line — GymGaze cost)",
                  "Remote monitoring and technical support",
                  "Content moderation — no harmful, illegal, or off-brand ads",
                  "Ad sales team — actively booking advertisers",
                  "Monthly impressions + occupancy + rental pot reporting dashboard",
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

          <PageFooter page={10} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 11 — COMMERCIAL TERMS ═══ */}
        <div className="page-break" data-print-page="true" style={{ ...PAGE_STYLE }}>
          <PageHeader left="Commercial Terms" right="Key Contractual Provisions" />

          <div style={{ flex: 1, padding: "20px 36px", display: "flex", gap: 28, overflow: "hidden" }}>
            {/* Left column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Agreement structure */}
              <div style={{ fontSize: 15, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>Agreement Structure</div>
              <LimeDivider />
              {[
                { label: "Term Length",       value: "3 years (36 months) from setup runway completion, with option to renew for further 3-year terms by mutual agreement" },
                { label: "Reporting",         value: "Monthly impressions + occupancy + rental pot statement via GymGaze platform" },
                { label: "Termination",       value: "6 months written notice after initial 12 months. Early termination without cause incurs equipment removal costs" },
                { label: "Force Majeure",     value: "Standard provisions apply — neither party liable for delays beyond reasonable control" },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "grid", gridTemplateColumns: "140px 1fr", gap: 10,
                  padding: "6px 0", borderBottom: `1px solid ${BORDER_GREY}`, fontSize: 11,
                }}>
                  <span style={{ fontWeight: 700, color: DARK }}>{label}</span>
                  <span style={{ color: GREY_TEXT, lineHeight: 1.4 }}>{value}</span>
                </div>
              ))}

              {/* Agency payment flow */}
              <div style={{ fontSize: 15, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif", marginTop: 8 }}>Agency Payment Flow</div>
              <LimeDivider />
              <p style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.5, margin: 0 }}>
                Payment cycle: <strong style={{ color: DARK }}>45–60 days from invoice date</strong> (industry standard for OOH — driven by agency credit terms, not GymGaze).
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  "Agency issues confirmed Campaign Insertion Order (CI) to GymGaze",
                  "GymGaze books inventory + schedules campaign on Cuecast",
                  "Campaign goes live — impressions delivered + proof of play logged",
                  "GymGaze invoices agency after delivery",
                  "Agency settles within 45–60 days",
                  `${networkName} rental + ${partnerPct}% rev share paid out month following agency settlement`,
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: i === 5 ? LIME : "#f0f0f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 800, color: DARK, flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</div>
                    <span style={{ fontSize: 11, color: GREY_TEXT, lineHeight: 1.4 }}>{step}</span>
                  </div>
                ))}
              </div>

              {/* Edge payment cadence */}
              <div style={{
                background: "rgba(212,255,79,0.05)", border: `1px solid ${LIME}`,
                borderRadius: 8, padding: "10px 12px", marginTop: 4,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 6 }}>{networkName} Payment Cadence</div>
                {[
                  "Monthly statement: occupancy, rental owed, revenue share, total payable",
                  "Paid 7 days after agency settlement clears",
                  "All via EFT with detailed reporting in partner portal",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 6, fontSize: 10, color: GREY_TEXT, marginBottom: 3 }}>
                    <span style={{ color: LIME, flexShrink: 0 }}>→</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — IP & Data */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: DARK, fontFamily: "Inter Tight, sans-serif" }}>IP & Data</div>
              <LimeDivider />
              {[
                { label: "Platform IP",     value: "GymGaze retains all rights to platform software, ad-serving technology, and operational systems" },
                { label: "Brand IP",        value: `${networkName} retains all rights to its brand, venue identity, and member data` },
                { label: "Data Ownership",  value: "Member data remains property of the gym. GymGaze uses aggregated, anonymised data for performance optimisation and audience reporting only" },
                { label: "POPIA",           value: "Both parties process personal information in accordance with the Protection of Personal Information Act, 2013" },
                { label: "Advertiser Data", value: "Campaign performance data shared with advertisers is anonymised and aggregated — no individual member data disclosed" },
                { label: "Content Rights",  value: "Advertiser creative materials are property of the advertiser. GymGaze holds a licence to display approved content on the network" },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "grid", gridTemplateColumns: "120px 1fr", gap: 10,
                  padding: "6px 0", borderBottom: `1px solid ${BORDER_GREY}`, fontSize: 11,
                }}>
                  <span style={{ fontWeight: 700, color: DARK }}>{label}</span>
                  <span style={{ color: GREY_TEXT, lineHeight: 1.4 }}>{value}</span>
                </div>
              ))}

              <div style={{ marginTop: 8 }}>
                <LimeCallout>
                  <div style={{ fontSize: 10, color: GREY_TEXT, lineHeight: 1.6 }}>
                    <strong style={{ color: DARK }}>Note:</strong> This document is a commercial proposal and summary of intended terms. The binding agreement will be a formal Partnership Agreement drafted and signed by both parties. All terms subject to final negotiation and legal review.
                  </div>
                </LimeCallout>
              </div>
            </div>
          </div>

          <PageFooter page={11} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 12 — NEXT STEPS ═══ */}
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
                  desc: "GymGaze technical team visits each venue to assess screen placement, power outlet availability, and connectivity options (LTE/5G or installed line).",
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
                  title: "Setup Runway Begins",
                  desc: `${gracePeriod}-month setup runway commences from installation completion. GymGaze builds advertiser pipeline; no rental owed during this window.`,
                  timeline: `Months 1–${gracePeriod}`,
                },
                {
                  step: "05",
                  title: "Rental Activation + First Revenue",
                  desc: `Rental fees activate per venue at ≥${occupancyFloor}% occupancy. Revenue sharing commences concurrently. Monthly rental pot statements delivered via GymGaze platform.`,
                  timeline: `Month ${gracePeriod + 1}+`,
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
                      <div style={{ fontSize: 10, fontWeight: 600, color: LABEL_GREY, background: "#f5f5f5", padding: "2px 8px", borderRadius: 20 }}>{timeline}</div>
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
                  <div style={{ fontSize: 12, color: "#aaa" }}>
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

              <div style={{ marginTop: 16, fontSize: 10, color: CAPTION_GREY, lineHeight: 1.6 }}>
                This proposal is valid for 30 days from the date of issue. Please reach out with any questions before the expiry date.
              </div>
            </div>
          </div>

          <PageFooter page={12} total={TOTAL_PAGES} networkName={networkName} />
        </div>

        {/* ═══ PAGE 13 — SIGNATURES ═══ */}
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
                  <div style={{ fontSize: 12, color: LABEL_GREY }}>{role}</div>
                  <div style={{ height: 1, background: BORDER_GREY }} />

                  {/* Signature line */}
                  <div>
                    <div style={{ height: 60, borderBottom: `1.5px solid ${DARK}`, marginBottom: 6 }} />
                    <div style={{ fontSize: 11, color: CAPTION_GREY }}>Signature</div>
                  </div>

                  {/* Name */}
                  <div>
                    <div style={{ height: 36, borderBottom: `1px solid ${BORDER_GREY}`, marginBottom: 6 }} />
                    <div style={{ fontSize: 11, color: CAPTION_GREY }}>Full Name & Designation</div>
                  </div>

                  {/* Date */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                      <div style={{ height: 36, borderBottom: `1px solid ${BORDER_GREY}`, marginBottom: 6 }} />
                      <div style={{ fontSize: 11, color: CAPTION_GREY }}>Date</div>
                    </div>
                    <div>
                      <div style={{ height: 36, borderBottom: `1px solid ${BORDER_GREY}`, marginBottom: 6 }} />
                      <div style={{ fontSize: 11, color: CAPTION_GREY }}>Date of Witness</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div style={{ textAlign: "center", fontSize: 10, color: CAPTION_GREY }}>
              This proposal was generated on {today} · Proposal ID: {proposal.id} · v{proposal.version} · CONFIDENTIAL
            </div>
          </div>

          <PageFooter page={13} total={TOTAL_PAGES} networkName={networkName} />
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
