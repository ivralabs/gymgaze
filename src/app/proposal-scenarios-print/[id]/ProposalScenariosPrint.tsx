"use client";

import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScenariosGymNetwork = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export type ScenariosVenueRow = {
  id: string;
  venue_id: string;
  screens_planned: number;
  venues: {
    id: string;
    name: string;
    city: string | null;
    province: string | null;
    rental_fee_monthly: number | null;
    active_members: number | null;
  } | null;
};

export type ScenariosProposal = {
  id: string;
  title: string;
  version: number;
  status: string;
  revenue_split_partner_pct: number;
  revenue_split_gymgaze_pct: number;
  cpm_benchmark: number;
  occupancy_floor_pct: number;
  created_at: string;
  gym_networks: ScenariosGymNetwork | null;
  partnership_proposal_venues: ScenariosVenueRow[];
};

export type StaticSiteRow = {
  id: string;
  venue_id: string;
  label: string;
  price_per_month: number | null;
};

interface Props {
  proposal: ScenariosProposal;
  staticSites: StaticSiteRow[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
// Duplicated from ProposalPrint.tsx — keep in sync
const LIME = "#D4FF4F";
const DARK = "#0a0a0a";
const BORDER_GREY = "#E5E7EB";
const LABEL_GREY = "#555";
const CAPTION_GREY = "#666";
const PLAYS_PER_SCREEN_PER_WEEK = 1487;
const SLOTS_PER_LOOP = 16;
const WEEKS_PER_MONTH = 4.33;
const CONTRACT_MONTHS = 36;

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

const SCENARIOS = [35, 50, 75, 100] as const;
type ScenarioPct = (typeof SCENARIOS)[number];

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtR(n: number): string {
  return `R\u00a0${Math.round(n).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

/**
 * Gross ad revenue for a venue at a given occupancy percentage.
 * screens × 16 slots × 1487 plays/screen/week × 4.33 weeks × occupancy% × CPM / 1000
 */
function calcGrossAdRevenue(
  screens: number,
  occupancyPct: number,
  cpm: number
): number {
  return (
    (screens * SLOTS_PER_LOOP * PLAYS_PER_SCREEN_PER_WEEK * WEEKS_PER_MONTH *
      (occupancyPct / 100) *
      cpm) /
    1000
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GymGazeLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const boxSize = size === "lg" ? 40 : size === "sm" ? 24 : 32;
  const fontSize = size === "lg" ? 24 : size === "sm" ? 14 : 18;
  const textSize = size === "lg" ? 24 : size === "sm" ? 14 : 18;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: boxSize,
          height: boxSize,
          background: LIME,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 900,
            color: DARK,
            lineHeight: 1,
          }}
        >
          G
        </span>
      </div>
      <span
        style={{
          fontSize: textSize,
          fontWeight: 800,
          color: DARK,
          letterSpacing: "-0.02em",
          fontFamily: "Inter Tight, sans-serif",
        }}
      >
        GymGaze
      </span>
    </div>
  );
}

function PageHeader({
  left,
  right,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 36px",
        flexShrink: 0,
        borderBottom: `2px solid ${LIME}`,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{left}</div>
      {right && (
        <div style={{ fontSize: 12, color: LABEL_GREY }}>{right}</div>
      )}
    </div>
  );
}

function PageFooter({
  page,
  total,
  networkName,
}: {
  page: number;
  total: number;
  networkName: string;
}) {
  return (
    <div
      style={{
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 36px",
        borderTop: `1px solid ${BORDER_GREY}`,
        background: "#fafafa",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 10, color: CAPTION_GREY }}>
        CONFIDENTIAL — {networkName} x GymGaze Occupancy Scenarios
      </span>
      <span style={{ fontSize: 10, color: LABEL_GREY }}>
        {page} / {total}
      </span>
    </div>
  );
}

function LimeDivider() {
  return (
    <div
      style={{
        height: 3,
        background: LIME,
        borderRadius: 2,
        width: 40,
        margin: "10px 0",
      }}
    />
  );
}

function StatBox({
  value,
  label,
  accent = DARK,
  sub,
}: {
  value: string;
  label: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        border: `1.5px solid ${BORDER_GREY}`,
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 34,
          fontWeight: 800,
          color: accent,
          fontFamily: "Inter Tight, sans-serif",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: CAPTION_GREY, marginTop: 2 }}>
          {sub}
        </div>
      )}
      <div
        style={{
          fontSize: 11,
          color: LABEL_GREY,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function LimeCallout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `2px solid ${LIME}`,
        borderRadius: 10,
        padding: "14px 18px",
        background: "rgba(212,255,79,0.06)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProposalScenariosPrint({
  proposal,
  staticSites,
}: Props) {
  const network = proposal.gym_networks;
  const networkName = network?.name ?? "Gym Network";
  const partnerPct = proposal.revenue_split_partner_pct;
  const cpm = proposal.cpm_benchmark;
  const occupancyFloor = proposal.occupancy_floor_pct ?? 35;

  const proposalVenues = proposal.partnership_proposal_venues ?? [];

  // Build static site lookup by venue_id
  const staticByVenue = new Map<string, number>();
  for (const site of staticSites) {
    if (site.price_per_month != null) {
      staticByVenue.set(
        site.venue_id,
        (staticByVenue.get(site.venue_id) ?? 0) + site.price_per_month
      );
    }
  }

  // Total screens
  const totalScreens = proposalVenues.reduce(
    (s, pv) => s + pv.screens_planned,
    0
  );

  // Total rental (all venues — always active for >= 35%)
  const totalRental = proposalVenues.reduce(
    (s, pv) => s + (pv.venues?.rental_fee_monthly ?? 0),
    0
  );

  // Total static income (Edge 30% share of full static pack, assumed sold)
  const totalStaticGross = proposalVenues.reduce((s, pv) => {
    return s + (staticByVenue.get(pv.venue_id) ?? 0);
  }, 0);
  const totalStaticEdgeShare = totalStaticGross * (partnerPct / 100);

  // Per-scenario calculations
  type ScenarioCalc = {
    pct: ScenarioPct;
    grossAdRevenue: number;
    edgeAdShare: number;
    edgeStatic: number;
    edgeRental: number;
    totalToEdge: number;
    annualToEdge: number;
    threeYrToEdge: number;
  };

  function calcScenario(pct: ScenarioPct): ScenarioCalc {
    const grossAdRevenue = proposalVenues.reduce((s, pv) => {
      return s + calcGrossAdRevenue(pv.screens_planned, pct, cpm);
    }, 0);
    const edgeAdShare = grossAdRevenue * (partnerPct / 100);
    const edgeStatic = totalStaticEdgeShare;
    // Rental active when pct >= occupancyFloor
    const edgeRental = pct >= occupancyFloor ? totalRental : 0;
    const totalToEdge = edgeAdShare + edgeStatic + edgeRental;
    return {
      pct,
      grossAdRevenue,
      edgeAdShare,
      edgeStatic,
      edgeRental,
      totalToEdge,
      annualToEdge: totalToEdge * 12,
      threeYrToEdge: totalToEdge * CONTRACT_MONTHS,
    };
  }

  const scenarios = SCENARIOS.map(calcScenario);
  const s35 = scenarios[0];
  const s50 = scenarios[1];
  const s75 = scenarios[2];
  const s100 = scenarios[3];

  // Ramp: Y1 @50%, Y2 @75%, Y3 @75% (steady state) — 2-year ramp, 3-year contract
  const rampY1 = s50.annualToEdge;
  const rampY2 = s75.annualToEdge;
  const rampY3 = s75.annualToEdge;
  const rampTotal = rampY1 + rampY2 + rampY3;

  // Per-venue data for table
  type VenueTableRow = {
    name: string;
    screens: number;
    rental: number;
    staticEdge: number;
    totals: Record<ScenarioPct, number>;
  };

  const venueRows: VenueTableRow[] = proposalVenues.map((pv) => {
    const venue = pv.venues;
    const rental = venue?.rental_fee_monthly ?? 0;
    const staticGross = staticByVenue.get(pv.venue_id) ?? 0;
    const staticEdge = staticGross * (partnerPct / 100);
    const totals = {} as Record<ScenarioPct, number>;
    for (const pct of SCENARIOS) {
      const gross = calcGrossAdRevenue(pv.screens_planned, pct, cpm);
      const adEdge = gross * (partnerPct / 100);
      const rentalActive = pct >= occupancyFloor ? rental : 0;
      totals[pct] = adEdge + staticEdge + rentalActive;
    }
    return {
      name: venue?.name ?? "Unknown Venue",
      screens: pv.screens_planned,
      rental,
      staticEdge,
      totals,
    };
  });

  // Bar chart max for normalisation
  const barMax = s100.totalToEdge;

  const TOTAL_PAGES = 5;

  return (
    <div
      id="scenarios-print-root"
      style={{
        background: "#f5f5f5",
        padding: 24,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ─── PAGE 1: COVER ─────────────────────────────────────────────────── */}
      <div data-print-page="true" style={PAGE_STYLE}>
        {/* Full-bleed dark top band */}
        <div
          style={{
            background: DARK,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            padding: "0 80px",
          }}
        >
          {/* Logos row */}
          <div
            style={{
              position: "absolute",
              top: 32,
              left: 40,
              right: 40,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <GymGazeLogo size="md" />
            {network?.name && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {network.name}
              </div>
            )}
          </div>

          {/* Center content */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: LIME,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Partnership Supplement
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#fff",
                fontFamily: "Inter Tight, sans-serif",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 16,
              }}
            >
              OCCUPANCY
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: LIME,
                fontFamily: "Inter Tight, sans-serif",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 32,
              }}
            >
              SCENARIOS
            </div>
            <div
              style={{
                fontSize: 17,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 400,
                maxWidth: 560,
                lineHeight: 1.5,
              }}
            >
              {networkName} x GymGaze — What You Earn at Each Occupancy Level
            </div>
          </div>

          {/* Lime accent line bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: LIME,
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 36px",
            background: "#fff",
            borderTop: `1px solid ${BORDER_GREY}`,
          }}
        >
          <span style={{ fontSize: 10, color: CAPTION_GREY }}>
            CONFIDENTIAL — This document is prepared exclusively for{" "}
            {networkName}. Not for distribution.
          </span>
          <span style={{ fontSize: 10, color: LABEL_GREY }}>{todayStr()}</span>
        </div>
      </div>

      {/* ─── PAGE 2: THE QUESTION ───────────────────────────────────────────── */}
      <div data-print-page="true" style={PAGE_STYLE}>
        <PageHeader
          left="OCCUPANCY SCENARIOS"
          right={`${networkName} x GymGaze`}
        />

        <div style={{ flex: 1, padding: "28px 40px", overflow: "hidden" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: LIME,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              The One Variable
            </div>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: DARK,
                fontFamily: "Inter Tight, sans-serif",
                letterSpacing: "-0.03em",
                margin: "0 0 8px",
                lineHeight: 1.1,
              }}
            >
              How Much Does {networkName} Earn As Occupancy Grows?
            </h2>
            <LimeDivider />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 28,
                marginTop: 20,
              }}
            >
              {/* Left: narrative */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p
                  style={{
                    fontSize: 13,
                    color: "#333",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  The commercial deal is fixed. GymGaze retains{" "}
                  {100 - partnerPct}% of digital ad revenue;{" "}
                  <strong>{networkName}</strong> receives{" "}
                  <strong>{partnerPct}%</strong>. Rental payments of{" "}
                  <strong>{fmtR(totalRental)}/month</strong> activate at the
                  35% occupancy floor. Static site income of up to{" "}
                  <strong>{fmtR(Math.round(totalStaticEdgeShare))}/month</strong>{" "}
                  (your {partnerPct}% share) is independent of digital fill.
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#333",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  The one variable that determines how much you earn from
                  digital advertising is <strong>occupancy</strong> — the
                  percentage of the 16 available slots per loop that are filled
                  with paid advertisers in any given month.
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#333",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  This document shows exactly what {networkName} earns at four
                  occupancy benchmarks — 35%, 50%, 75%, and 100% — expressed
                  as a monthly income, an annual income, and a full 3-year
                  cumulative total.
                </p>
              </div>

              {/* Right: assumptions callout */}
              <div>
                <LimeCallout>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: DARK,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    Key Assumptions
                  </div>
                  {[
                    [
                      `${totalScreens} screens`,
                      `across ${proposalVenues.length} venues`,
                    ],
                    [
                      `R\u00a0${cpm} CPM`,
                      "benchmark rate per 1,000 plays",
                    ],
                    [
                      `16 slots x 1,487 plays/screen/week`,
                      "at 100% loop occupancy",
                    ],
                    [
                      `${fmtR(Math.round(totalRental))}/month rental`,
                      "activates at >= 35% occupancy (the floor)",
                    ],
                    [
                      "Static pack assumed sold",
                      "independent of digital occupancy — see footnote",
                    ],
                    [
                      `3-year contract (2-year ramp)`,
                      `36 months — 50% target Y1, 75% target Y2, steady state Y3`,
                    ],
                  ].map(([bold, sub], i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: LIME,
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: DARK,
                          }}
                        >
                          {bold}
                        </span>
                        {sub && (
                          <span
                            style={{ fontSize: 11, color: LABEL_GREY }}
                          >
                            {" "}
                            — {sub}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </LimeCallout>
              </div>
            </div>
          </div>
        </div>

        <PageFooter page={2} total={TOTAL_PAGES} networkName={networkName} />
      </div>

      {/* ─── PAGE 3: NUMBERS AT A GLANCE ───────────────────────────────────── */}
      <div data-print-page="true" style={PAGE_STYLE}>
        <PageHeader
          left="NUMBERS AT A GLANCE"
          right="Monthly earnings by occupancy level"
        />

        <div
          style={{
            flex: 1,
            padding: "20px 36px 0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* 4 scenario columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 14,
            }}
          >
            {scenarios.map((sc) => (
              <div
                key={sc.pct}
                style={{
                  border: `1.5px solid ${sc.pct === 100 ? LIME : BORDER_GREY}`,
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  background: sc.pct === 100 ? "rgba(212,255,79,0.04)" : "#fff",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: LABEL_GREY,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 4,
                  }}
                >
                  {sc.pct}% Occupancy
                </div>
                {/* Big monthly total */}
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: DARK,
                    fontFamily: "Inter Tight, sans-serif",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    marginBottom: 12,
                  }}
                >
                  {fmtR(Math.round(sc.totalToEdge))}
                  <span
                    style={{ fontSize: 12, fontWeight: 500, color: LABEL_GREY }}
                  >
                    /mo
                  </span>
                </div>

                {/* Breakdown rows */}
                <div
                  style={{
                    borderTop: `1px solid ${BORDER_GREY}`,
                    paddingTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {[
                    {
                      label: `Ad share (${partnerPct}%)`,
                      value: fmtR(Math.round(sc.edgeAdShare)),
                    },
                    {
                      label: "Static sites",
                      value: fmtR(Math.round(sc.edgeStatic)),
                    },
                    {
                      label: "Screen rental",
                      value: fmtR(Math.round(sc.edgeRental)),
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 11, color: LABEL_GREY }}>
                        {row.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: DARK,
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Annual + 3yr */}
                <div
                  style={{
                    borderTop: `1px solid ${BORDER_GREY}`,
                    marginTop: 10,
                    paddingTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: LABEL_GREY,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Annual
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: DARK,
                      }}
                    >
                      {fmtR(Math.round(sc.annualToEdge))}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: LABEL_GREY,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      3-Year Total
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: sc.pct === 100 ? "#1a6600" : DARK,
                        fontFamily: "Inter Tight, sans-serif",
                      }}
                    >
                      {fmtR(Math.round(sc.threeYrToEdge))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart: What Drives The Difference */}
          <div
            style={{
              border: `1px solid ${BORDER_GREY}`,
              borderRadius: 12,
              padding: "14px 20px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: LABEL_GREY,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 10,
              }}
            >
              What Drives The Difference — Monthly Income to {networkName}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {scenarios.map((sc) => {
                const barPct =
                  barMax > 0 ? (sc.totalToEdge / barMax) * 100 : 0;
                return (
                  <div
                    key={sc.pct}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        fontSize: 11,
                        fontWeight: 700,
                        color: DARK,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {sc.pct}%
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 20,
                        background: "#f0f0f0",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${barPct}%`,
                          height: "100%",
                          background: LIME,
                          borderRadius: 4,
                          transition: "none",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: 100,
                        fontSize: 11,
                        fontWeight: 700,
                        color: DARK,
                        flexShrink: 0,
                      }}
                    >
                      {fmtR(Math.round(sc.totalToEdge))}/mo
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <PageFooter page={3} total={TOTAL_PAGES} networkName={networkName} />
      </div>

      {/* ─── PAGE 4: PER-VENUE BREAKDOWN TABLE ─────────────────────────────── */}
      <div data-print-page="true" style={PAGE_STYLE}>
        <PageHeader
          left="PER-VENUE BREAKDOWN"
          right="Monthly income to Edge at each occupancy level"
        />

        <div
          style={{
            flex: 1,
            padding: "16px 36px 0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Table */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead>
                <tr
                  style={{
                    borderBottom: `2px solid ${LIME}`,
                    background: "#fafafa",
                  }}
                >
                  {[
                    "Venue",
                    "Screens",
                    "Rental",
                    "Static*",
                    "@35%",
                    "@50%",
                    "@75%",
                    "@100%",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "6px 8px",
                        textAlign: h === "Venue" ? "left" : "right",
                        fontSize: 9,
                        fontWeight: 700,
                        color: LABEL_GREY,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {venueRows.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: `1px solid ${BORDER_GREY}`,
                      background: i % 2 === 1 ? "#fafafa" : "#fff",
                    }}
                  >
                    <td
                      style={{
                        padding: "5px 8px",
                        fontWeight: 600,
                        color: DARK,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.name}
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        textAlign: "right",
                        color: LABEL_GREY,
                      }}
                    >
                      {row.screens}
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        textAlign: "right",
                        color: LABEL_GREY,
                      }}
                    >
                      {fmtR(row.rental)}
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        textAlign: "right",
                        color: LABEL_GREY,
                      }}
                    >
                      {row.staticEdge > 0 ? fmtR(Math.round(row.staticEdge)) : "—"}
                    </td>
                    {SCENARIOS.map((pct) => (
                      <td
                        key={pct}
                        style={{
                          padding: "5px 8px",
                          textAlign: "right",
                          fontWeight: pct === 100 ? 700 : 500,
                          color: pct === 100 ? DARK : "#333",
                        }}
                      >
                        {fmtR(Math.round(row.totals[pct]))}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total row */}
                <tr
                  style={{
                    borderTop: `2px solid ${LIME}`,
                    background: "#fff",
                  }}
                >
                  <td
                    style={{
                      padding: "7px 8px",
                      fontWeight: 800,
                      color: DARK,
                      fontSize: 11,
                    }}
                  >
                    TOTAL ({proposalVenues.length} venues)
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: DARK,
                    }}
                  >
                    {totalScreens}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: DARK,
                    }}
                  >
                    {fmtR(totalRental)}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: DARK,
                    }}
                  >
                    {fmtR(Math.round(totalStaticEdgeShare))}
                  </td>
                  {scenarios.map((sc) => (
                    <td
                      key={sc.pct}
                      style={{
                        padding: "7px 8px",
                        textAlign: "right",
                        fontWeight: 800,
                        color: DARK,
                        fontFamily: "Inter Tight, sans-serif",
                      }}
                    >
                      {fmtR(Math.round(sc.totalToEdge))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footnote */}
          <div
            style={{
              borderTop: `1px solid ${BORDER_GREY}`,
              padding: "8px 0 12px",
              fontSize: 9.5,
              color: CAPTION_GREY,
              lineHeight: 1.5,
            }}
          >
            * Static income shown is {networkName}&apos;s {partnerPct}% share of the full static pack price, assumed sold to a single client per venue. Static revenue is{" "}
            <strong>independent of digital occupancy</strong> — it is all-or-nothing based on whether the static pack has been sold to an advertiser. Each scenario column shows the combined monthly total (ad share + static + rental) for that venue at that occupancy level.
          </div>
        </div>

        <PageFooter page={4} total={TOTAL_PAGES} networkName={networkName} />
      </div>

      {/* ─── PAGE 5: 3-YEAR OUTLOOK ─────────────────────────────────────────── */}
      <div data-print-page="true" style={PAGE_STYLE}>
        <PageHeader
          left="3-YEAR OUTLOOK"
          right="What this means for Edge Fitness"
        />

        <div
          style={{
            flex: 1,
            padding: "24px 40px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Ramp assumption note */}
          <div
            style={{
              fontSize: 12,
              color: LABEL_GREY,
              fontStyle: "italic",
            }}
          >
            2-year ramp: 50% occupancy by end of Year 1 — 75% by end of Year 2 — Year 3 steady state at 75%
          </div>

          {/* 3 stat boxes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
            }}
          >
            <StatBox
              value={fmtR(Math.round(rampY1))}
              label="Year 1 (at 50%)"
              sub="12 months x 50% occupancy scenario"
            />
            <StatBox
              value={fmtR(Math.round(rampY2))}
              label="Year 2 (at 75%)"
              sub="12 months x 75% occupancy scenario"
            />
            <StatBox
              value={fmtR(Math.round(rampY3))}
              label="Year 3 — Steady State (at 75%)"
              sub="12 months x 75% occupancy scenario"
              accent={DARK}
            />
          </div>

          {/* 3-year cumulative highlight */}
          <div
            style={{
              border: `2px solid ${LIME}`,
              borderRadius: 12,
              padding: "16px 24px",
              background: "rgba(212,255,79,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: LABEL_GREY,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 4,
                }}
              >
                3-Year Cumulative (ramp: 50% — 75% — 75%)
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: DARK,
                  fontFamily: "Inter Tight, sans-serif",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {fmtR(Math.round(rampTotal))}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: LABEL_GREY,
                  marginTop: 4,
                }}
              >
                Total income to {networkName} over the contract term
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 10,
                  color: LABEL_GREY,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 6,
                }}
              >
                Full occupancy upside
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1a6600",
                  fontFamily: "Inter Tight, sans-serif",
                }}
              >
                {fmtR(Math.round(s100.threeYrToEdge))}
              </div>
              <div style={{ fontSize: 10, color: CAPTION_GREY, marginTop: 2 }}>
                Maximum occupancy ceiling (100%)
              </div>
            </div>
          </div>

          {/* Narrative */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: DARK,
                  marginBottom: 8,
                }}
              >
                The Trajectory
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#333",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                Our model assumes {networkName} clears the 35% occupancy floor
                in Q1 of Year 1 and ramps to 50% steady state by month 6. By
                the end of Year 2, we&apos;re targeting 75% occupancy — the
                upper threshold where the network is operating at agency-grade
                density. Year 3 is the steady state, representing a{" "}
                <strong>
                  {fmtR(Math.round(rampTotal))} 3-year partnership outcome
                </strong>{" "}
                for {networkName}.
              </p>
            </div>
            <div>
              <LimeCallout>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: DARK,
                    marginBottom: 8,
                  }}
                >
                  Let&apos;s Walk Through These Numbers With Your Team
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#333",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Let&apos;s walk through these numbers with your team — what&apos;s
                  the right ramp velocity for Year 1?
                </p>
              </LimeCallout>
            </div>
          </div>
        </div>

        <PageFooter page={5} total={TOTAL_PAGES} networkName={networkName} />
      </div>
    </div>
  );
}
