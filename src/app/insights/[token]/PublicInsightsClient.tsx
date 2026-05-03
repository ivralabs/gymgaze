"use client";

import { useState } from "react";
import { Monitor, Users, TrendingUp, Building2, Lock, Eye, BarChart3, MapPin } from "lucide-react";

type Network = {
  id: string; name: string; logo_url: string | null; primary_color: string | null;
  audience_male_pct: number | null; audience_female_pct: number | null;
  audience_age_18_24: number | null; audience_age_25_34: number | null;
  audience_age_35_44: number | null; audience_age_45_plus: number | null;
  avg_dwell_minutes: number | null;
};
type Venue = { id: string; name: string; city: string | null; province: string | null; region: string | null; gym_brand_id: string | null; active_members: number | null; monthly_entries: number | null };
type Screen = { id: string; venue_id: string; is_active: boolean | null };
type Photo = { venue_id: string; status: string | null };
type CampaignRaw = { id: string; name: string; advertiser: string | null; end_date: string | null };
type CampaignVenue = { venue_id: string; campaigns: CampaignRaw | CampaignRaw[] | null };
function getCampaign(raw: CampaignRaw | CampaignRaw[] | null): CampaignRaw | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

interface InsightData {
  networks: Network[]; venues: Venue[]; screens: Screen[];
  photos: Photo[]; campaignVenues: CampaignVenue[];
}

interface Props {
  token: string;
  title: string;
  pinProtected: boolean;
  initialData: InsightData | null;
}

function fmt(n: number) { return n.toLocaleString("en-ZA"); }

function GymGazeLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#D4FF4F" }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#0A0A0A", fontFamily: "Inter Tight, sans-serif" }}>GG</span>
      </div>
      <span className="font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif", fontSize: 15 }}>GymGaze</span>
    </div>
  );
}

// PIN Gate
function PinGate({ token, onUnlock }: { token: string; onUnlock: (data: InsightData) => void }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  async function submit(digits: string[]) {
    const code = digits.join("");
    if (code.length < 4) return;
    setLoading(true); setErr(false);
    const res = await fetch("/api/insights/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, pin: code }),
    });
    const { ok } = await res.json();
    if (ok) {
      const dataRes = await fetch(`/api/insights/data?token=${token}`);
      const data = await dataRes.json();
      onUnlock(data);
    } else {
      setErr(true); setLoading(false);
      setPin(["", "", "", ""]);
      setTimeout(() => document.getElementById("pin-0")?.focus(), 50);
    }
  }

  function handleDigit(i: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[i] = digit;
    setPin(next);
    if (digit && i < 3) {
      document.getElementById(`pin-${i + 1}`)?.focus();
    }
    if (next.every((d) => d !== "")) submit(next);
  }

  function handleKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[i] && i > 0) {
      document.getElementById(`pin-${i - 1}`)?.focus();
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
      <div className="mb-8"><GymGazeLogo /></div>
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(212,255,79,0.08)", border: "1px solid rgba(212,255,79,0.2)" }}>
          <Lock size={24} color="#D4FF4F" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Inter Tight, sans-serif" }}>Enter PIN</h1>
        <p className="text-sm mb-8" style={{ color: "#555" }}>This insights link is PIN-protected</p>

        <div className="flex items-center justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              id={`pin-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={pin[i]}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              className="w-14 h-14 text-center text-2xl font-bold rounded-xl transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `2px solid ${err ? "#EF4444" : pin[i] ? "#D4FF4F" : "rgba(255,255,255,0.10)"}`,
                color: "#fff",
                outline: "none",
                fontFamily: "Inter Tight, sans-serif",
              }}
            />
          ))}
        </div>

        {err && <p className="text-sm" style={{ color: "#EF4444" }}>Incorrect PIN. Try again.</p>}
        {loading && <p className="text-sm" style={{ color: "#555" }}>Verifying…</p>}
      </div>
    </div>
  );
}

// Main public deck
function InsightsDeck({ title, data }: { title: string; data: InsightData }) {
  const { networks, venues, screens, photos, campaignVenues } = data;
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);

  const filtered = activeNetwork ? venues.filter((v) => v.gym_brand_id === activeNetwork) : venues;
  const filteredIds = new Set(filtered.map((v) => v.id));
  const filteredScreens = screens.filter((s) => filteredIds.has(s.venue_id));
  const filteredPhotos = photos.filter((p) => filteredIds.has(p.venue_id));

  const totalMembers = filtered.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalMonthly = filtered.reduce((s, v) => s + (v.monthly_entries ?? 0), 0);
  const ots = totalMonthly * filteredScreens.length;
  const approved = filteredPhotos.filter((p) => p.status === "approved").length;
  const compliance = filteredPhotos.length > 0 ? Math.round((approved / filteredPhotos.length) * 100) : 0;
  const activeCampaigns = new Set(
    campaignVenues
      .filter((cv) => { const c = getCampaign(cv.campaigns); return filteredIds.has(cv.venue_id) && c?.end_date && new Date(c.end_date) >= new Date(); })
      .map((cv) => getCampaign(cv.campaigns)?.id)
  ).size;

  const compColor = compliance >= 80 ? "#D4FF4F" : compliance >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A", color: "#fff" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <GymGazeLogo />
          <p className="text-sm font-semibold text-white truncate ml-4" style={{ fontFamily: "Inter Tight, sans-serif" }}>{title}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,5vw,2.8rem)", letterSpacing: "-0.02em", color: "#fff" }}>
            {title}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#555" }}>
            {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} · {networks.length} network{networks.length !== 1 ? "s" : ""} · {venues.length} venue{venues.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Network filter (if multiple networks) */}
        {networks.length > 1 && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setActiveNetwork(null)}
              className="px-4 py-2 rounded-full text-sm font-semibold flex-shrink-0 transition-all"
              style={{ background: !activeNetwork ? "#D4FF4F" : "rgba(255,255,255,0.05)", color: !activeNetwork ? "#0A0A0A" : "#A3A3A3", border: !activeNetwork ? "none" : "1px solid rgba(255,255,255,0.08)" }}
            >
              All Networks
            </button>
            {networks.map((n) => (
              <button
                key={n.id}
                onClick={() => setActiveNetwork(n.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold flex-shrink-0 transition-all"
                style={{ background: activeNetwork === n.id ? "#D4FF4F" : "rgba(255,255,255,0.05)", color: activeNetwork === n.id ? "#0A0A0A" : "#A3A3A3", border: activeNetwork === n.id ? "none" : "1px solid rgba(255,255,255,0.08)" }}
              >
                {n.name}
              </button>
            ))}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[
            { icon: Users,   label: "Total Reach",     value: fmt(totalMembers),    sub: "active members", color: "#fff" },
            { icon: Eye,     label: "Monthly OTS",     value: fmt(ots),             sub: "opp. to see",    color: "#A78BFA" },
            { icon: Monitor, label: "Screens",         value: filteredScreens.length.toString(), sub: "digital screens", color: "#60A5FA" },
            { icon: BarChart3,label:"Active Campaigns", value: activeCampaigns.toString(), sub: "running now", color: "#34D399" },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="rounded-2xl p-4 md:p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={13} color="#555" strokeWidth={2} />
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#555" }}>{label}</p>
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color, fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: "#444" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Photo compliance banner */}
        {filteredPhotos.length > 0 && (
          <div className="rounded-2xl p-5 mb-8 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${compColor}15` }}>
              <span className="text-lg font-bold" style={{ color: compColor, fontFamily: "Inter Tight, sans-serif" }}>{compliance}%</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white mb-1">Photo Compliance</p>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                <div style={{ width: `${compliance}%`, height: 6, background: compColor, borderRadius: 99, transition: "width 0.6s" }} />
              </div>
            </div>
            <p className="text-xs flex-shrink-0" style={{ color: "#555" }}>{approved}/{filteredPhotos.length} approved</p>
          </div>
        )}

        {/* Audience demographics (per network) */}
        {networks.filter((n) => !activeNetwork || n.id === activeNetwork).some((n) => n.audience_male_pct !== null) && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "Inter Tight, sans-serif" }}>Audience Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {networks.filter((n) => !activeNetwork || n.id === activeNetwork).filter((n) => n.audience_male_pct !== null || n.audience_age_18_24 !== null).map((n) => (
                <div key={n.id} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
                  <p className="text-sm font-semibold text-white mb-4">{n.name}</p>
                  {(n.audience_male_pct !== null || n.audience_female_pct !== null) && (
                    <div className="mb-4">
                      <p className="text-xs mb-2" style={{ color: "#555" }}>Gender Split</p>
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
                  {[
                    { label: "18–24", val: n.audience_age_18_24 },
                    { label: "25–34", val: n.audience_age_25_34 },
                    { label: "35–44", val: n.audience_age_35_44 },
                    { label: "45+",   val: n.audience_age_45_plus },
                  ].filter((a) => a.val !== null).map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-3 mb-1.5">
                      <span className="text-xs w-10 flex-shrink-0" style={{ color: "#555" }}>{label}</span>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                        <div style={{ width: `${val}%`, height: 4, background: "#D4FF4F", borderRadius: 99 }} />
                      </div>
                      <span className="text-xs w-8 text-right tabular-nums" style={{ color: "#A3A3A3" }}>{val}%</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venue list */}
        <div>
          <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            Venue Breakdown
            <span className="ml-2 text-sm font-normal" style={{ color: "#555" }}>{filtered.length} location{filtered.length !== 1 ? "s" : ""}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((venue) => {
              const vScreens = screens.filter((s) => s.venue_id === venue.id).length;
              const vNet = networks.find((n) => n.id === venue.gym_brand_id);
              const brandColor = vNet?.primary_color ?? "#D4FF4F";
              return (
                <div key={venue.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${brandColor}20`, border: `1px solid ${brandColor}33` }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: brandColor, fontFamily: "Inter Tight, sans-serif" }}>{venue.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{venue.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} color="#555" strokeWidth={2} />
                        <p className="text-xs" style={{ color: "#555" }}>{[venue.city, venue.province].filter(Boolean).join(", ")}</p>
                      </div>
                      {vNet && networks.length > 1 && <p className="text-xs mt-0.5" style={{ color: "#444" }}>{vNet.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-1">
                      <Users size={12} color="#555" strokeWidth={2} />
                      <span className="text-xs tabular-nums" style={{ color: "#A3A3A3" }}>{fmt(venue.active_members ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Monitor size={12} color="#555" strokeWidth={2} />
                      <span className="text-xs tabular-nums" style={{ color: "#A3A3A3" }}>{vScreens}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={12} color="#555" strokeWidth={2} />
                      <span className="text-xs tabular-nums" style={{ color: "#A3A3A3" }}>{fmt(venue.monthly_entries ?? 0)}/mo</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <GymGazeLogo />
          <p className="text-xs mt-2" style={{ color: "#333" }}>Powered by GymGaze · Confidential</p>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PublicInsightsClient({ token, title, pinProtected, initialData }: Props) {
  const [data, setData] = useState<InsightData | null>(initialData);

  if (pinProtected && !data) {
    return <PinGate token={token} onUnlock={setData} />;
  }

  if (!data) return null;

  return <InsightsDeck title={title} data={data} />;
}
