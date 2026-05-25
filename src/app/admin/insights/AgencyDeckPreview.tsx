"use client";

// Renders the same deck the agency sees, embedded inside the admin Insights page.
// Reuses all logic from PublicInsightsClient — just without the PIN gate and root layout.

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Monitor, Users, TrendingUp, MapPin, Eye, Clock, ChevronDown,
  Zap, Target, BarChart3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Network = {
  id: string; name: string; logo_url: string | null; primary_color: string | null;
  audience_male_pct: number | null; audience_female_pct: number | null;
  audience_age_18_24: number | null; audience_age_25_34: number | null;
  audience_age_35_44: number | null; audience_age_45_plus: number | null;
  avg_dwell_minutes: number | null; audience_notes?: string | null;
};
type Venue = {
  id: string; name: string; city: string | null; province: string | null;
  region: string | null; gym_brand_id: string | null;
  active_members: number | null; monthly_entries: number | null;
  daily_entries?: number | null; weekly_entries?: number | null;
};
type Screen = { id: string; venue_id: string; is_active: boolean | null };
type Photo = { venue_id: string; status: string | null };
type CampaignRaw = { id: string; name: string; advertiser: string | null; end_date: string | null; start_date?: string | null; amount_charged_zar?: number | null };
type CampaignVenue = { venue_id: string; campaigns: CampaignRaw | CampaignRaw[] | null };

function getCampaign(raw: CampaignRaw | CampaignRaw[] | null): CampaignRaw | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

interface Props {
  networks: Network[]; venues: Venue[]; screens: Screen[];
  photos: Photo[]; campaignVenues: CampaignVenue[];
}

// ─── Media model constants (mirrored from RateCardClient.tsx) ─────────────────

const PLAYS_PER_SCREEN_PER_WEEK = 1596;
const ACTIVE_RATE = 0.65;
const AVG_VISITS_PER_MEMBER_PER_WEEK = 3.5;
const ATTENTION_QUALITY_SCORE = 8.5;

function calcMetrics(
  venue: Venue,
  filteredScreens: Screen[],
  weeks = 4
) {
  const screenCount = filteredScreens.filter((s) => s.venue_id === venue.id && s.is_active).length;
  const activeMembers = venue.active_members ?? 0;
  const monthlyEntries = venue.monthly_entries ?? 0;
  const activeThisMonth = Math.round(activeMembers * ACTIVE_RATE);
  const ots = Math.round(monthlyEntries * (weeks / 4.3));
  const reachUncapped = Math.round(activeThisMonth * Math.min(weeks / 4.3, 1.5));
  const reach = Math.min(reachUncapped, activeMembers);
  const frequency = reach > 0 ? Math.round((ots / reach) * 10) / 10 : 0;
  const impact = Math.round(reach * ACTIVE_RATE);
  return { screens: screenCount, ots, reach, frequency, impact, activeMembers, activeThisMonth };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("en-ZA"); }
function unique<T>(arr: (T | null | undefined)[]): T[] {
  return Array.from(new Set(arr.filter((x): x is T => x != null)));
}

const VENUE_TYPE_COLORS: Record<string, string> = {
  "Shopping Mall":      "#A78BFA",
  "Shopping Centre":    "#60A5FA",
  "Free Standing":      "#34D399",
  "Office Park":        "#F59E0B",
  "Residential Estate": "#F472B6",
  "Industrial Park":    "#FB923C",
  "CBD":                "#38BDF8",
  "Other":              "#9CA3AF",
};

const IconGeneral = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="9" width="3" height="6" rx="0.5" stroke="#D4FF4F" strokeWidth="1.5"/>
    <rect x="6" y="5" width="3" height="10" rx="0.5" stroke="#D4FF4F" strokeWidth="1.5"/>
    <rect x="11" y="1" width="3" height="14" rx="0.5" stroke="#D4FF4F" strokeWidth="1.5"/>
  </svg>
);
const IconBanking = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="14" height="9" rx="1.5" stroke="#D4FF4F" strokeWidth="1.5"/>
    <line x1="1" y1="7" x2="15" y2="7" stroke="#D4FF4F" strokeWidth="1.5"/>
    <line x1="4" y1="10.5" x2="6" y2="10.5" stroke="#D4FF4F" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconFMCG = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3h1.5l1.5 6h6l1.5-5H5" stroke="#D4FF4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="13" r="1" stroke="#D4FF4F" strokeWidth="1.5"/>
    <circle cx="11" cy="13" r="1" stroke="#D4FF4F" strokeWidth="1.5"/>
  </svg>
);
const IconTelecoms = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 8c1.9-3.5 5.1-5 7-5s5.1 1.5 7 5" stroke="#D4FF4F" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3.5 8c1.3-2 2.7-3 4.5-3s3.2 1 4.5 3" stroke="#D4FF4F" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="11" r="1.5" stroke="#D4FF4F" strokeWidth="1.5"/>
  </svg>
);
const IconInsurance = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2L3 4v4c0 3 2.5 5 5 6 2.5-1 5-3 5-6V4L8 2z" stroke="#D4FF4F" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M6 8.5l1.5 1.5 3-3" stroke="#D4FF4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconAutomotive = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 10h12M4 10l1.5-4h5L12 10" stroke="#D4FF4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="5" cy="12" r="1.5" stroke="#D4FF4F" strokeWidth="1.5"/>
    <circle cx="11" cy="12" r="1.5" stroke="#D4FF4F" strokeWidth="1.5"/>
  </svg>
);
const IconEvents = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2l1.5 3.5 3.5.5-2.5 2.5.6 3.5L8 10.5 4.9 12l.6-3.5L3 6l3.5-.5L8 2z" stroke="#D4FF4F" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);
const IconFitness = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8h2M12 8h2M4 8h8M4 6v4M12 6v4" stroke="#D4FF4F" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="2.5" cy="8" r="1" stroke="#D4FF4F" strokeWidth="1"/>
    <circle cx="13.5" cy="8" r="1" stroke="#D4FF4F" strokeWidth="1"/>
  </svg>
);

type IndustryEntry = {
  label: string;
  icon: React.ReactElement;
  headline: string;
  bullets: string[];
  keyMessage: string;
  bestFormats: string[];
};

const INDUSTRIES: Record<string, IndustryEntry> = {
  general: {
    label: "General",
    icon: <IconGeneral />,
    headline: "A captive, health-conscious audience with above-average disposable income.",
    bullets: [
      "Active gym members visit up to 5× per week — unmatched natural frequency",
      "60+ minutes average dwell time per session, with no scroll-away or skip button",
      "LSM 7–10 skew: gym membership self-selects for spending power",
      "Zero ad-skipping — screens are an organic part of the gym environment",
      "Attention Quality Score of 8.5/10 vs 2.1 for roadside formats",
    ],
    keyMessage: "GymGaze delivers premium eyeballs in a premium environment — with the dwell time to actually land your message.",
    bestFormats: ["Prime 15s for brand awareness", "Standard 7s for frequency & recall", "Takeover for launches"],
  },
  banking: {
    label: "Banking & Financial Services",
    icon: <IconBanking />,
    headline: "Reach LSM 7–10 professionals with financial decisions on their minds.",
    bullets: [
      "Gym membership is a proven proxy for disposable income — a pre-qualified financial audience",
      "60+ min dwell time gives complex financial messaging room to breathe",
      "Professionals, business owners, and decision-makers dominate the membership base",
      "Multiple weekly touchpoints build the trust required for high-consideration products",
      "Post-workout endorphin state increases receptiveness and positive brand association",
    ],
    keyMessage: "You can't buy a more financially qualified captive audience than the one already paying R1 000+/month to be there.",
    bestFormats: ["Prime 15s for product education", "Standard 30s for trust-building sequences", "Contextual 7s for rate/offer recall"],
  },
  fmcg: {
    label: "FMCG",
    icon: <IconFMCG />,
    headline: "High-frequency impressions to health-conscious shoppers who act fast.",
    bullets: [
      "Members actively shop for nutrition, supplements, and lifestyle products weekly",
      "3–5 visits per week = campaign frequency that rivals any digital channel",
      "Post-workout mindset primes receptiveness to health, food, and beverage brands",
      "Nutritional awareness is high — on-screen product claims land with credibility",
      "Female membership growth (45%+ in many networks) expands FMCG reach further",
    ],
    keyMessage: "Catch health-driven consumers in the exact mindset where your product is most relevant — and hit them 5× a week.",
    bestFormats: ["Standard 7s for maximum frequency", "Prime 15s for new product launches", "Seasonal takeovers for promotion windows"],
  },
  telecoms: {
    label: "Telecoms & Streaming",
    icon: <IconTelecoms />,
    headline: "Young, digitally native adults — even when they're offline, they're thinking about their phone.",
    bullets: [
      "18–34 demographic is the dominant gym membership cohort in South Africa",
      "60+ min dwell time gives data, streaming, and device campaigns space to convert",
      "No phone in hand = undivided visual attention on your screen message",
      "Ideal for upgrade cycles, SIM-only plan switches, and streaming service trials",
      "App-first audience: QR + screen combos drive measurable digital conversion",
    ],
    keyMessage: "The audience that lives on their phone is staring at your screen for an hour — there's no better moment to steal the upgrade.",
    bestFormats: ["Prime 15s with QR for direct response", "Standard 7s for plan awareness", "Contextual 15s for device launches"],
  },
  insurance: {
    label: "Insurance & Healthcare",
    icon: <IconInsurance />,
    headline: "The most health-conscious consumer segment in SA, already self-selected.",
    bullets: [
      "Active gym members represent the lowest-risk, highest-value insurance cohort",
      "Health-first mindset makes wellness, gap cover, and life product messaging highly resonant",
      "Discovery Vitality, Momentum Multiply — gym culture and health insurance are already linked",
      "3–5 weekly visits provide consistent touchpoints to build trust for considered purchases",
      "Older membership segments (35–55) are peak life and disability insurance buyers",
    ],
    keyMessage: "Your ideal policyholder is already paying to stay healthy — meet them where they prove it every day.",
    bestFormats: ["Prime 30s for policy education", "Standard 15s for brand recall", "Sequential 7s to build the consideration journey"],
  },
  automotive: {
    label: "Automotive",
    icon: <IconAutomotive />,
    headline: "Aspirational lifestyle audience in a premium, performance-driven environment.",
    bullets: [
      "Gym culture is built on aspiration, performance, and achievement — the same values auto brands own",
      "Income profile (LSM 8–10 skew) aligns directly with new vehicle purchase decisions",
      "60+ min dwell time is unmatched for detailed product storytelling and spec communication",
      "Test drive and finance CTAs perform well in environments that reward action-takers",
      "Seasonal campaign windows (Q4, model year-end) can own gym screens for high-impact launches",
    ],
    keyMessage: "The person who wakes up at 5 AM to train is the same person who researches their next car at 9 PM — reach them in both modes.",
    bestFormats: ["Prime 30s for model storytelling", "Standard 15s for offer/finance recall", "Takeover for new model launches"],
  },
  events: {
    label: "Events & Entertainment",
    icon: <IconEvents />,
    headline: "High-frequency reach for time-sensitive campaigns that need to move fast.",
    bullets: [
      "3–5 visits per week means a 4-week campaign reaches the same person 12–20 times",
      "Young, socially active 18–34 audience is the primary events and entertainment consumer",
      "Countdown mechanics work powerfully on gym screens — urgency drives ticket sales",
      "Music, sport, and lifestyle events all align with the gym audience's identity",
      "Screen format supports dynamic creative — update messaging as the event approaches",
    ],
    keyMessage: "No media channel builds event buzz faster than a screen your audience sees every single day of the week.",
    bestFormats: ["Countdown 15s for urgency-driven campaigns", "Standard 7s for awareness at scale", "Prime 30s for festival/major event storytelling"],
  },
  fitness: {
    label: "Fitness Brands",
    icon: <IconFitness />,
    headline: "Speak directly to an audience that already lives your brand values — every day.",
    bullets: [
      "100% fitness-engaged audience — zero demographic waste, zero contextual mismatch",
      "In-gym placement makes supplement, apparel, and equipment ads feel native and credible",
      "Members are in active purchase consideration: gear, nutrition, apparel, recovery",
      "Peer influence is high in gym settings — seeing a brand repeatedly creates social proof",
      "New year, summer, and sporting season windows drive predictable purchase spikes",
    ],
    keyMessage: "There is no more natural or credible environment for a fitness brand than the gym floor — your ad belongs here.",
    bestFormats: ["Standard 7s for product recall", "Prime 15s for product education & differentiation", "Seasonal takeovers for launch windows"],
  },
};

// ─── Venue Type Bar ───────────────────────────────────────────────────────────

function VenueTypeBar({ venues }: { venues: Venue[] }) {
  const counts: Record<string, number> = {};
  for (const v of venues) { const k = v.region ?? "Other"; counts[k] = (counts[k] ?? 0) + 1; }
  const total = venues.length;
  if (total === 0) return null;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
        {entries.map(([type, count]) => (
          <div key={type} style={{ width: `${(count / total) * 100}%`, background: VENUE_TYPE_COLORS[type] ?? "#9CA3AF", minWidth: 4 }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {entries.map(([type, count]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: VENUE_TYPE_COLORS[type] ?? "#9CA3AF" }} />
            <span className="text-xs" style={{ color: "#C8C8C8" }}>{type}</span>
            <span className="text-xs font-bold text-white">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Media Metrics Strip ──────────────────────────────────────────────────────

function MediaMetricsStrip({
  venues,
  filteredScreens,
}: {
  venues: Venue[];
  filteredScreens: Screen[];
}) {
  const totalReach = venues.reduce((s, v) => s + (v.active_members ?? 0), 0);

  // Aggregate calcMetrics across all venues for 4-week flight
  let totalOts = 0;
  let totalUniqueReach = 0;
  let totalFreqNumer = 0;

  for (const v of venues) {
    const m = calcMetrics(v, filteredScreens, 4);
    totalOts += m.ots;
    totalUniqueReach += m.reach;
    totalFreqNumer += m.ots;
  }

  const avgFrequency =
    totalUniqueReach > 0
      ? Math.round((totalFreqNumer / totalUniqueReach) * 10) / 10
      : 0;

  const tiles = [
    {
      label: "Total Reach",
      value: fmt(totalReach),
      sub: "active gym members",
      color: "#FFFFFF",
      icon: Users,
      tooltip: undefined,
    },
    {
      label: "Monthly OTS",
      value: fmt(totalOts),
      sub: "4-week flight",
      color: "#D4FF4F",
      icon: Eye,
      tooltip: "Opportunities To See — total ad impressions across your flight",
    },
    {
      label: "Avg Frequency",
      value: `${avgFrequency}×`,
      sub: "per person",
      color: "#A78BFA",
      icon: Zap,
      tooltip: "How many times each person sees your ad in a 4-week flight",
    },
    {
      label: "Unique Reach",
      value: fmt(totalUniqueReach),
      sub: "individuals reached",
      color: "#60A5FA",
      icon: Target,
      tooltip: "Active members who visit at least once during your flight",
    },
    {
      label: "Avg Dwell",
      value: "60 min",
      sub: "per gym session",
      color: "#FF6B35",
      icon: Clock,
      tooltip: "Average time a member spends in the gym per visit",
    },
    {
      label: "Attention Quality",
      value: `${ATTENTION_QUALITY_SCORE}/10`,
      sub: "composite score",
      color: "#D4FF4F",
      icon: BarChart3,
      tooltip:
        "Composite score: dwell time, captive audience, audience quality. 10 = perfect recall environment",
    },
  ];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#999" }}>
        Media Metrics · 4-week flight
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiles.map(({ label, value, sub, color, icon: Icon, tooltip }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            title={tooltip}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={12} strokeWidth={2} style={{ color: "#555" }} />
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#8A8A8A" }}>
                {label}
              </p>
              {tooltip && (
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: "#555", cursor: "help" }}
                  title={tooltip}
                >
                  ⓘ
                </span>
              )}
            </div>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color, fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
            >
              {value}
            </p>
            <p className="text-xs mt-1" style={{ color: "#777" }}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── eCPM Explainer ───────────────────────────────────────────────────────────

function ECPMExplainer() {
  const rows = [
    { format: "Digital Display",     cpm: "R15",  attention: "2%",  ecpm: "R750",  highlight: false },
    { format: "Roadside OOH",        cpm: "R45",  attention: "5%",  ecpm: "R900",  highlight: false },
    { format: "Radio",               cpm: "R120", attention: "40%", ecpm: "R300",  highlight: false },
    { format: "TV Prime",            cpm: "R280", attention: "40%", ecpm: "R700",  highlight: false },
    { format: "GymGaze",             cpm: "R85",  attention: "65%", ecpm: "R131",  highlight: true  },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="p-5 md:p-6">
        {/* Heading */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(212,255,79,0.10)", border: "1px solid rgba(212,255,79,0.2)" }}
          >
            <BarChart3 size={18} color="#D4FF4F" strokeWidth={2} />
          </div>
          <div>
            <h2
              className="text-lg font-bold text-white leading-snug"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              What is eCPM — and why does it matter?
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#8A8A8A" }}>
              The metric that separates cheap reach from effective reach.
            </p>
          </div>
        </div>

        {/* Body copy */}
        <div className="space-y-3 mb-6">
          <p className="text-sm leading-relaxed" style={{ color: "#C8C8C8" }}>
            <span className="font-semibold text-white">CPM</span> (Cost Per 1,000 Impressions) is the standard pricing metric
            used across all media — from digital banners to TV spots. It tells you how much you pay to reach 1,000 people.
            But CPM alone doesn&apos;t tell you if those people actually saw — let alone absorbed — your message.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#C8C8C8" }}>
            <span className="font-semibold text-white">eCPM</span> (Effective CPM) corrects for this. It divides CPM by the
            format&apos;s attention rate — the percentage of the audience that genuinely engages with the ad. A lower eCPM means
            more real impressions per rand spent.
          </p>

          {/* Worked examples */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#EF4444" }}>
                Digital Display
              </p>
              <p className="text-sm" style={{ color: "#C8C8C8" }}>
                CPM: <span className="font-bold text-white">R15</span> &nbsp;·&nbsp; Attention: <span className="font-bold text-white">2%</span>
              </p>
              <p className="text-xl font-bold mt-1" style={{ color: "#EF4444", fontFamily: "Inter Tight, sans-serif" }}>
                eCPM = R750
              </p>
              <p className="text-xs mt-1" style={{ color: "#777" }}>You&apos;re paying for 1,000 impressions but only ~20 register.</p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(212,255,79,0.04)", border: "1px solid rgba(212,255,79,0.15)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#D4FF4F" }}>
                GymGaze
              </p>
              <p className="text-sm" style={{ color: "#C8C8C8" }}>
                CPM: <span className="font-bold text-white">R85</span> &nbsp;·&nbsp; Attention: <span className="font-bold text-white">65%</span>
              </p>
              <p className="text-xl font-bold mt-1" style={{ color: "#D4FF4F", fontFamily: "Inter Tight, sans-serif" }}>
                eCPM = R131
              </p>
              <p className="text-xs mt-1" style={{ color: "#777" }}>Captive, dwell-rich audience. 650 of every 1,000 actually register.</p>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          <table className="w-full min-w-[480px]">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Format", "CPM", "Attention Rate", "eCPM"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#8A8A8A" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.format}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: row.highlight ? "rgba(212,255,79,0.05)" : "transparent",
                  }}
                >
                  <td className="px-4 py-3">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: row.highlight ? "#D4FF4F" : "#A3A3A3" }}
                    >
                      {row.format}
                    </span>
                    {row.highlight && (
                      <span
                        className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(212,255,79,0.12)", color: "#D4FF4F", border: "1px solid rgba(212,255,79,0.3)" }}
                      >
                        Best value
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono" style={{ color: row.highlight ? "#fff" : "#888" }}>
                      {row.cpm}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: row.highlight ? "#D4FF4F" : "#888" }}
                    >
                      {row.attention}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        color: row.highlight ? "#D4FF4F" : "#888",
                        fontFamily: "Inter Tight, sans-serif",
                      }}
                    >
                      {row.ecpm}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <p className="text-xs mt-3" style={{ color: "#555" }}>
          eCPM source: industry benchmarks. GymGaze attention rate based on 60+ min captive dwell time vs avg 5s roadside glance.
        </p>
      </div>
    </div>
  );
}

// ─── Industry Panel ───────────────────────────────────────────────────────────

function IndustryPanel({ venues, screens }: { venues: Venue[]; screens: Screen[] }) {
  const [selected, setSelected] = useState("general");
  const [open, setOpen] = useState(false);
  const industry = INDUSTRIES[selected];
  const totalMembers = venues.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalMonthly = venues.reduce((s, v) => s + (v.monthly_entries ?? 0), 0);
  const ots = Math.round(totalMonthly * (4 / 4.3));

  function handleSelect(key: string) {
    setSelected(key);
    setOpen(false);
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>Tailor this deck for</p>
        <div className="relative">
          <button
            onClick={() => setOpen((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: "rgba(212,255,79,0.08)",
              border: "1px solid rgba(212,255,79,0.2)",
              boxShadow: open ? "0 0 0 2px rgba(212,255,79,0.25)" : "0 0 8px rgba(212,255,79,0.12)",
            }}
          >
            <span className="flex items-center gap-2">{industry.icon} {industry.label}</span>
            <ChevronDown size={16} color="#D4FF4F" className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.12)", zIndex: 50 }}
            >
              {Object.entries(INDUSTRIES).map(([key, ind]) => (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(key); }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2"
                  style={{ background: selected === key ? "rgba(212,255,79,0.08)" : "transparent", color: selected === key ? "#D4FF4F" : "#A3A3A3" }}
                >
                  {ind.icon} {ind.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div
        className="p-5 transition-opacity duration-200"
        style={{ borderLeft: "3px solid rgba(212,255,79,0.35)" }}
      >
        <p className="text-base font-bold text-white mb-4 leading-snug" style={{ fontFamily: "Inter Tight, sans-serif" }}>{industry.headline}</p>
        <ul className="space-y-2.5 mb-5">
          {industry.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#D4FF4F" }} />
              <span className="text-sm" style={{ color: "#C8C8C8" }}>{b}</span>
            </li>
          ))}
        </ul>

        {/* Key Message */}
        <div className="mb-4 pl-3" style={{ borderLeft: "2px solid #D4FF4F" }}>
          <p className="text-sm italic leading-relaxed" style={{ color: "#E8E8E8", fontSize: "0.9rem" }}>
            &ldquo;{industry.keyMessage}&rdquo;
          </p>
        </div>

        {/* Best Ad Formats */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#666" }}>Best Ad Formats</p>
          <div className="flex flex-wrap gap-2">
            {industry.bestFormats.map((f) => (
              <span
                key={f}
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: "rgba(212,255,79,0.08)", border: "1px solid rgba(212,255,79,0.3)", color: "#D4FF4F" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[{ label: "Reach", value: fmt(totalMembers) }, { label: "Monthly OTS", value: fmt(ots) }, { label: "Avg Dwell", value: "60+ min" }].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-base font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8A8A8A" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Media Comparison ─────────────────────────────────────────────────────────

function MediaComparison() {
  const rows = [
    { format: "GymGaze Screen",     dwell: "60+ min", skippable: false, captive: true,  highlight: true  },
    { format: "Roadside Billboard", dwell: "2 sec",   skippable: true,  captive: false, highlight: false },
    { format: "Social Media Ad",    dwell: "1.5 sec", skippable: true,  captive: false, highlight: false },
    { format: "Radio",              dwell: "—",       skippable: true,  captive: false, highlight: false },
    { format: "Cinema",             dwell: "30 sec",  skippable: false, captive: true,  highlight: false },
  ];
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#999" }}>Why Gym Media</p>
        <p className="text-sm" style={{ color: "#8A8A8A" }}>Compare the formats your budget could run on</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
              {["Format", "Dwell Time", "Skippable?", "Captive?"].map((h) => (
                <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#8A8A8A" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.format} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: row.highlight ? "rgba(212,255,79,0.04)" : "transparent" }}>
                <td className="px-5 py-3">
                  <span className="text-sm font-semibold" style={{ color: row.highlight ? "#D4FF4F" : "#A3A3A3" }}>{row.format}</span>
                  {row.highlight && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(212,255,79,0.15)", color: "#D4FF4F" }}>You are here</span>}
                </td>
                <td className="px-5 py-3"><span className="text-sm font-bold" style={{ color: row.highlight ? "#fff" : "#666", fontFamily: "Inter Tight, sans-serif" }}>{row.dwell}</span></td>
                <td className="px-5 py-3"><span className="text-sm" style={{ color: row.skippable ? "#EF4444" : "#D4FF4F" }}>{row.skippable ? "Yes" : "No"}</span></td>
                <td className="px-5 py-3"><span className="text-sm" style={{ color: row.captive ? "#D4FF4F" : "#EF4444" }}>{row.captive ? "Yes" : "No"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Why This Audience ────────────────────────────────────────────────────────

function WhyThisAudience() {
  const points = [
    { label: "LSM 7–10 dominant",             icon: "💳", sub: "Above-average disposable income, brand-conscious consumers" },
    { label: "65% visit 3+ times per week",   icon: "📅", sub: "High repeat exposure — your campaign compounds over time" },
    { label: "Average session: 55–65 minutes", icon: "⏱️", sub: "Among the longest dwell times of any out-of-home format" },
    { label: "Zero ad-skipping environment",  icon: "🚫", sub: "No remote, no scroll, no skip button — screens are ambient" },
  ];

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(212,255,79,0.04)", border: "1px solid rgba(212,255,79,0.12)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#D4FF4F" }}>
        Why this audience
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {points.map(({ label, icon, sub }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-sm font-semibold text-white leading-snug">{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8A8A8A" }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AgencyDeckPreview({ networks, venues, screens, photos, campaignVenues }: Props) {
  const provinces = unique(venues.map((v) => v.province)).sort();
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [venuesOpen, setVenuesOpen] = useState(false);

  const cities = unique(venues.filter((v) => !activeProvince || v.province === activeProvince).map((v) => v.city)).sort();

  function selectProvince(p: string | null) { setActiveProvince(p); setActiveCity(null); }

  const filtered = useMemo(() => venues.filter((v) => {
    if (activeProvince && v.province !== activeProvince) return false;
    if (activeCity && v.city !== activeCity) return false;
    return true;
  }), [venues, activeProvince, activeCity]);

  const filteredIds = new Set(filtered.map((v) => v.id));
  const filteredScreens = screens.filter((s) => filteredIds.has(s.venue_id));

  const totalMembers = filtered.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalMonthly = filtered.reduce((s, v) => s + (v.monthly_entries ?? 0), 0);
  const ots = Math.round(totalMonthly * (4 / 4.3));
  const weeklyOts = Math.round(ots / 4.33);
  const avgDwell = networks.reduce((s, n) => s + (n.avg_dwell_minutes ?? 60), 0) / (networks.length || 1);

  // Suppress unused variable warnings — used for consistency with PublicInsightsClient
  void photos;
  void campaignVenues;
  void AVG_VISITS_PER_MEMBER_PER_WEEK;
  void PLAYS_PER_SCREEN_PER_WEEK;

  const geoLabel = activeCity ?? activeProvince ?? "South Africa";

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
    background: active ? "#D4FF4F" : "rgba(255,255,255,0.05)",
    color: active ? "#0A0A0A" : "#666",
    border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
    transition: "all 0.15s", whiteSpace: "nowrap" as const, flexShrink: 0,
  });

  return (
    <div className="space-y-6">
      {/* Preview banner */}
      <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(212,255,79,0.06)", border: "1px solid rgba(212,255,79,0.15)" }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#D4FF4F" }} />
        <p className="text-sm" style={{ color: "#C8C8C8" }}>
          This is exactly what your agency clients see when you share a link.
        </p>
      </div>

      {/* 1. Hero */}
      <div>
        <h2 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem,4vw,2.2rem)", letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff" }}>
          <span style={{ color: "#D4FF4F" }}>{fmt(totalMembers)}</span> active gym members
          <br />across <span style={{ color: "#D4FF4F" }}>{filtered.length}</span> venue{filtered.length !== 1 ? "s" : ""} in {geoLabel}
        </h2>
        <p className="mt-3 text-base" style={{ color: "#8A8A8A" }}>
          {fmt(weeklyOts)} weekly opportunities to see · {Math.round(avgDwell)} min avg dwell · {filteredScreens.length} screens
        </p>
      </div>

      {/* Province filter */}
      {provinces.length > 1 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8A8A" }}>Province</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button style={pillStyle(!activeProvince)} onClick={() => selectProvince(null)}>All Provinces</button>
            {provinces.map((p) => <button key={p} style={pillStyle(activeProvince === p)} onClick={() => selectProvince(p)}>{p}</button>)}
          </div>
        </div>
      )}

      {/* City filter */}
      {cities.length > 1 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8A8A" }}>City</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button style={pillStyle(!activeCity)} onClick={() => setActiveCity(null)}>All Cities</button>
            {cities.map((c) => <button key={c} style={pillStyle(activeCity === c)} onClick={() => setActiveCity(c)}>{c}</button>)}
          </div>
        </div>
      )}

      {/* 2. Venue type breakdown */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#999" }}>Venue Types</p>
        <VenueTypeBar venues={filtered} />
      </div>

      {/* 3. Media Metrics Strip */}
      <MediaMetricsStrip venues={filtered} filteredScreens={filteredScreens} />

      {/* 4. eCPM Explainer */}
      <ECPMExplainer />

      {/* 5. Industry tailoring */}
      <IndustryPanel venues={filtered} screens={filteredScreens} />

      {/* 6. Media comparison */}
      <MediaComparison />

      {/* 7. Audience demographics */}
      {networks.some((n) => n.audience_male_pct !== null) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#999" }}>Audience Profile</p>

          {/* Why This Audience summary card */}
          <WhyThisAudience />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {networks.filter((n) => n.audience_male_pct !== null || n.audience_age_18_24 !== null).map((n) => (
              <div key={n.id} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
                <p className="text-sm font-semibold text-white mb-4">{n.name}</p>
                {(n.audience_male_pct !== null || n.audience_female_pct !== null) && (
                  <div className="mb-4">
                    <p className="text-xs mb-2" style={{ color: "#8A8A8A" }}>Gender Split</p>
                    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                      <div style={{ width: `${n.audience_male_pct ?? 50}%`, background: "#60A5FA", borderRadius: "99px 0 0 99px" }} />
                      <div style={{ width: `${n.audience_female_pct ?? 50}%`, background: "#F472B6", borderRadius: "0 99px 99px 0" }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs" style={{ color: "#60A5FA" }}>Male {n.audience_male_pct ?? "—"}%</span>
                      <span className="text-xs" style={{ color: "#F472B6" }}>Female {n.audience_female_pct ?? "—"}%</span>
                    </div>
                  </div>
                )}
                {[{ label: "18–24", val: n.audience_age_18_24 }, { label: "25–34", val: n.audience_age_25_34 }, { label: "35–44", val: n.audience_age_35_44 }, { label: "45+", val: n.audience_age_45_plus }]
                  .filter((a) => a.val !== null).map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-3 mb-1.5">
                      <span className="text-xs w-10 flex-shrink-0" style={{ color: "#8A8A8A" }}>{label}</span>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                        <div style={{ width: `${val}%`, height: 4, background: "#D4FF4F", borderRadius: 99 }} />
                      </div>
                      <span className="text-xs w-8 text-right tabular-nums" style={{ color: "#C8C8C8" }}>{val}%</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Venue grid — collapsible */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
        <button
          onClick={() => setVenuesOpen((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-4 transition-all"
          style={{ background: venuesOpen ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)" }}
        >
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Venue Breakdown</p>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(212,255,79,0.10)", color: "#D4FF4F" }}>
              {filtered.length} location{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <ChevronDown
            size={16} color="#777"
            style={{ transform: venuesOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          />
        </button>

        {venuesOpen && (
          <div className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {filtered.map((venue) => {
                const vScreens = screens.filter((s) => s.venue_id === venue.id);
                const vActiveScreens = vScreens.filter((s) => s.is_active).length;
                const vMetrics = calcMetrics(venue, screens, 4);
                const vNet = networks.find((n) => n.id === venue.gym_brand_id);
                const brandColor = vNet?.primary_color ?? "#D4FF4F";
                const typeColor = VENUE_TYPE_COLORS[venue.region ?? ""] ?? "#9CA3AF";
                return (
                  <Link key={venue.id} href={`/admin/venues/${venue.id}`} className="rounded-2xl p-4 block transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, textDecoration: "none" }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${brandColor}20`, border: `1px solid ${brandColor}33` }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: brandColor, fontFamily: "Inter Tight, sans-serif" }}>{venue.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{venue.name}</p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <MapPin size={10} color="#555" strokeWidth={2} />
                          <p className="text-xs" style={{ color: "#8A8A8A" }}>{[venue.city, venue.province].filter(Boolean).join(", ")}</p>
                          {venue.region && <span className="text-xs px-1.5 py-0.5 rounded-full ml-1" style={{ background: `${typeColor}18`, color: typeColor }}>{venue.region}</span>}
                        </div>
                      </div>
                    </div>
                    <div
                      className="grid grid-cols-3 gap-2 mt-3 pt-3"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="text-center">
                        <p className="text-xs tabular-nums font-bold text-white">{fmt(venue.active_members ?? 0)}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#777" }}>members</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs tabular-nums font-bold text-white">{fmt(vMetrics.ots)}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#777" }}>monthly OTS</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs tabular-nums font-bold text-white">{vActiveScreens}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#777" }}>screens</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
