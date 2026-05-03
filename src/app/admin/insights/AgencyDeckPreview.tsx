"use client";

// Renders the same deck the agency sees, embedded inside the admin Insights page.
// Reuses all logic from PublicInsightsClient — just without the PIN gate and root layout.

import { useState, useMemo } from "react";
import Link from "next/link";
import { Monitor, Users, TrendingUp, MapPin, Eye, Clock, ChevronDown } from "lucide-react";

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

const INDUSTRIES: Record<string, { label: string; emoji: string; headline: string; bullets: string[] }> = {
  general:    { label: "General", emoji: "📊", headline: "A captive, health-conscious audience with above-average disposable income.", bullets: ["Active gym members visit up to 5× per week", "60+ minutes average dwell time per session", "Zero ad-skipping — screens are part of the environment"] },
  banking:    { label: "Banking & Financial Services", emoji: "🏦", headline: "Reach LSM 7–10 professionals with financial decisions to make.", bullets: ["Gym membership signals disposable income — pre-qualified audience", "60+ min dwell time for complex financial messaging", "Professionals, decision-makers, and business owners"] },
  fmcg:       { label: "FMCG", emoji: "🛒", headline: "High-frequency impressions to health-conscious shoppers.", bullets: ["Members shop for nutrition, supplements, and lifestyle products", "Multiple weekly visits = high campaign frequency", "Post-workout mindset = receptive to health & food brands"] },
  telecoms:   { label: "Telecoms & Streaming", emoji: "📱", headline: "Young adults on their phones — even at the gym.", bullets: ["18–34 demographic dominates gym membership", "Long dwell time = time to absorb product features", "Ideal for data, streaming, and device upgrade campaigns"] },
  insurance:  { label: "Insurance & Healthcare", emoji: "🏥", headline: "The most health-conscious consumer segment, already self-selected.", bullets: ["Active gym members are ideal insurance risk profiles", "Health-first mindset aligns with wellness product messaging", "Consistent weekly touchpoints for trust-building campaigns"] },
  automotive: { label: "Automotive", emoji: "🚗", headline: "Aspirational lifestyle audience in a premium environment.", bullets: ["Gym culture = aspiration, performance, and achievement", "Income profile aligns with vehicle purchase decisions", "Long dwell time suits detailed product storytelling"] },
  events:     { label: "Events & Entertainment", emoji: "🎟️", headline: "High-frequency reach for time-sensitive campaigns.", bullets: ["Multiple visits per week = rapid awareness build", "Young, socially active audience primed for event discovery", "Ideal for countdowns, launches, and ticket promotions"] },
  fitness:    { label: "Fitness Brands", emoji: "💪", headline: "Speak to an audience that already lives your brand values.", bullets: ["100% fitness-engaged audience — zero wasted impressions", "In-gym context makes fitness product ads feel native", "Supplement, apparel, and equipment brands thrive here"] },
};

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

function IndustryPanel({ venues, screens }: { venues: Venue[]; screens: Screen[] }) {
  const [selected, setSelected] = useState("general");
  const [open, setOpen] = useState(false);
  const industry = INDUSTRIES[selected];
  const totalMembers = venues.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalMonthly = venues.reduce((s, v) => s + (v.monthly_entries ?? 0), 0);
  const ots = totalMonthly * screens.length;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>Tailor this deck for</p>
        <div className="relative">
          <button onClick={() => setOpen((p) => !p)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "rgba(212,255,79,0.08)", border: "1px solid rgba(212,255,79,0.2)" }}>
            <span>{industry.emoji} {industry.label}</span>
            <ChevronDown size={16} color="#D4FF4F" className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.12)" }}>
              {Object.entries(INDUSTRIES).map(([key, ind]) => (
                <button key={key} onClick={() => { setSelected(key); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm" style={{ background: selected === key ? "rgba(212,255,79,0.08)" : "transparent", color: selected === key ? "#D4FF4F" : "#A3A3A3" }}>
                  {ind.emoji} {ind.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="p-5">
        <p className="text-base font-bold text-white mb-4 leading-snug" style={{ fontFamily: "Inter Tight, sans-serif" }}>{industry.headline}</p>
        <ul className="space-y-2.5 mb-5">
          {industry.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#D4FF4F" }} />
              <span className="text-sm" style={{ color: "#C8C8C8" }}>{b}</span>
            </li>
          ))}
        </ul>
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

function MediaComparison() {
  const rows = [
    { format: "GymGaze Screen", dwell: "60+ min", skippable: false, captive: true, highlight: true },
    { format: "Roadside Billboard", dwell: "2 sec", skippable: true, captive: false, highlight: false },
    { format: "Social Media Ad", dwell: "1.5 sec", skippable: true, captive: false, highlight: false },
    { format: "Radio", dwell: "—", skippable: true, captive: false, highlight: false },
    { format: "Cinema", dwell: "30 sec", skippable: false, captive: true, highlight: false },
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
  const ots = totalMonthly * filteredScreens.length;
  const weeklyOts = Math.round(ots / 4.33);
  const avgDwell = networks.reduce((s, n) => s + (n.avg_dwell_minutes ?? 60), 0) / (networks.length || 1);

  const activeCampaigns = new Set(
    campaignVenues.filter((cv) => { const c = getCampaign(cv.campaigns); return filteredIds.has(cv.venue_id) && c?.end_date && new Date(c.end_date) >= new Date(); }).map((cv) => getCampaign(cv.campaigns)?.id)
  ).size;

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

      {/* Hero */}
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

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users,   label: "Total Reach",  value: fmt(totalMembers),           color: "#fff" },
          { icon: Eye,     label: "Weekly OTS",   value: fmt(weeklyOts),              color: "#D4FF4F" },
          { icon: Clock,   label: "Avg Dwell",    value: `${Math.round(avgDwell)} min`, color: "#A78BFA" },
          { icon: Monitor, label: "Screens",      value: filteredScreens.length.toString(), color: "#60A5FA" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={13} color="#555" strokeWidth={2} />
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#8A8A8A" }}>{label}</p>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color, fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Venue type breakdown */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#999" }}>Venue Types</p>
        <VenueTypeBar venues={filtered} />
      </div>

      {/* Industry tailoring */}
      <IndustryPanel venues={filtered} screens={filteredScreens} />

      {/* Media comparison */}
      <MediaComparison />

      {/* Audience demographics */}
      {networks.some((n) => n.audience_male_pct !== null) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#999" }}>Audience Profile</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Venue grid — collapsible */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
        {/* Header toggle */}
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

        {/* Collapsible content */}
        {venuesOpen && (
        <div className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {filtered.map((venue) => {
            const vScreens = screens.filter((s) => s.venue_id === venue.id).length;
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
                <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-1"><Users size={12} color="#555" strokeWidth={2} /><span className="text-xs tabular-nums font-semibold text-white">{fmt(venue.active_members ?? 0)}</span></div>
                  <div className="flex items-center gap-1"><Monitor size={12} color="#555" strokeWidth={2} /><span className="text-xs" style={{ color: "#C8C8C8" }}>{vScreens} screens</span></div>
                  <div className="flex items-center gap-1"><TrendingUp size={12} color="#555" strokeWidth={2} /><span className="text-xs" style={{ color: "#C8C8C8" }}>{fmt(venue.monthly_entries ?? 0)}/mo</span></div>
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
