"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users, Monitor, TrendingUp, Building2, Share2, Copy, Trash2,
  Plus, Lock, Unlock, Eye, Calendar, ChevronDown, ChevronUp,
  BarChart3, Percent, Clock, X, Check, Presentation, Calculator, Zap, Trophy
} from "lucide-react";
import AgencyDeckPreview from "./AgencyDeckPreview";
import { FootTrafficHeatmap, CampaignImpactEstimator, NetworkGrowthTimeline } from "./InsightsFeatures";

// ─── Types ───────────────────────────────────────────────────────────────────

type Network = {
  id: string; name: string; logo_url: string | null; primary_color: string | null;
  audience_male_pct: number | null; audience_female_pct: number | null;
  audience_age_18_24: number | null; audience_age_25_34: number | null;
  audience_age_35_44: number | null; audience_age_45_plus: number | null;
  avg_dwell_minutes: number | null; audience_notes: string | null;
};
type Venue = {
  id: string; name: string; city: string | null; province: string | null;
  region: string | null; gym_brand_id: string | null;
  active_members: number | null; daily_entries: number | null;
  weekly_entries: number | null; monthly_entries: number | null;
};
type Screen = { id: string; venue_id: string; is_active: boolean | null };
type RevenueEntry = { venue_id: string; month: string; rental_zar: number | null; revenue_share_zar: number | null };
type Campaign = { id: string; name: string; advertiser: string | null; start_date: string | null; end_date: string | null; amount_charged_zar: number | null };
type CampaignVenue = { venue_id: string; campaigns: Campaign | Campaign[] | null };
function getCampaign(raw: Campaign | Campaign[] | null): Campaign | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}
type Photo = { venue_id: string; status: string | null };
type InsightLink = {
  id: string; token: string; title: string; network_ids: string[] | null;
  pin_hash: string | null; expires_at: string | null;
  created_at: string; last_viewed_at: string | null; view_count: number;
};

interface Props {
  networks: Network[]; venues: Venue[]; screens: Screen[];
  revenue: RevenueEntry[]; campaignVenues: CampaignVenue[];
  photos: Photo[]; links: InsightLink[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("en-ZA"); }
function fmtR(n: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);
}

function statCard(label: string, value: string, sub: string, color = "#D4FF4F") {
  return (
    <div className="glass-card rounded-2xl p-4 md:p-5" style={{ borderRadius: 16 }}>
      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#666", fontWeight: 600 }}>{label}</p>
      <p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color, fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</p>
      <p className="text-xs mt-1.5" style={{ color: "#555" }}>{sub}</p>
    </div>
  );
}

function ComplianceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#D4FF4F" : pct >= 50 ? "#F59E0B" : pct > 0 ? "#EF4444" : "#333";
  return (
    <div className="flex items-center gap-2">
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: 4, background: color, borderRadius: 99, transition: "width 0.4s" }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ─── New Link Modal ───────────────────────────────────────────────────────────

function NewLinkModal({ networks, onClose, onCreated }: {
  networks: Network[];
  onClose: () => void;
  onCreated: (link: InsightLink) => void;
}) {
  const [title, setTitle] = useState("GymGaze Network Insights");
  const [selectedNets, setSelectedNets] = useState<string[]>([]);
  const [pin, setPin] = useState("");
  const [expiresDays, setExpiresDays] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const toggle = (id: string) =>
    setSelectedNets((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  async function submit() {
    if (pin && !/^\d{4}$/.test(pin)) { setErr("PIN must be exactly 4 digits"); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/insights/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        network_ids: selectedNets.length > 0 ? selectedNets : null,
        pin: pin || null,
        expires_days: expiresDays ? parseInt(expiresDays) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Failed"); setSaving(false); return; }
    onCreated(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-card rounded-2xl w-full max-w-md p-6" style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg" style={{ fontFamily: "Inter Tight, sans-serif" }}>Create Insight Link</h3>
          <button onClick={onClose}><X size={18} color="#666" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#666" }}>Link Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", outline: "none" }} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#666" }}>Networks (leave blank = all)</label>
            <div className="space-y-1.5">
              {networks.map((n) => (
                <button key={n.id} onClick={() => toggle(n.id)} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all" style={{ background: selectedNets.includes(n.id) ? "rgba(212,255,79,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${selectedNets.includes(n.id) ? "#D4FF4F44" : "rgba(255,255,255,0.08)"}`, color: selectedNets.includes(n.id) ? "#D4FF4F" : "#A3A3A3" }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ border: `1.5px solid ${selectedNets.includes(n.id) ? "#D4FF4F" : "#444"}`, background: selectedNets.includes(n.id) ? "#D4FF4F" : "transparent" }}>
                    {selectedNets.includes(n.id) && <Check size={10} color="#0A0A0A" strokeWidth={3} />}
                  </div>
                  {n.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#666" }}>PIN (optional)</label>
              <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="4 digits" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", outline: "none" }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#666" }}>Expires in days</label>
              <input value={expiresDays} onChange={(e) => setExpiresDays(e.target.value.replace(/\D/g, ""))} placeholder="Never" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", outline: "none" }} />
            </div>
          </div>

          {err && <p className="text-xs" style={{ color: "#EF4444" }}>{err}</p>}

          <button onClick={submit} disabled={saving} className="w-full py-3 rounded-xl font-bold text-sm transition-all" style={{ background: saving ? "#555" : "#D4FF4F", color: "#0A0A0A" }}>
            {saving ? "Creating…" : "Create Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Network Row (expandable) ─────────────────────────────────────────────────

function NetworkRow({ network, venues, screens, revenue, photos, campaignVenues }: {
  network: Network; venues: Venue[]; screens: Screen[];
  revenue: RevenueEntry[]; photos: Photo[]; campaignVenues: CampaignVenue[];
}) {
  const [open, setOpen] = useState(false);
  const netVenues = venues.filter((v) => v.gym_brand_id === network.id);
  const venueIds = new Set(netVenues.map((v) => v.id));
  const netScreens = screens.filter((s) => venueIds.has(s.venue_id));
  const netPhotos = photos.filter((p) => venueIds.has(p.venue_id));
  const approvedPhotos = netPhotos.filter((p) => p.status === "approved").length;
  const compliance = netPhotos.length > 0 ? Math.round((approvedPhotos / netPhotos.length) * 100) : 0;
  const totalMembers = netVenues.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalMonthly = netVenues.reduce((s, v) => s + (v.monthly_entries ?? 0), 0);
  const totalRevenue = revenue.filter((r) => venueIds.has(r.venue_id)).reduce((s, r) => s + (r.rental_zar ?? 0) + (r.revenue_share_zar ?? 0), 0);
  const activeCampaigns = new Set(campaignVenues.filter((cv) => { const c = getCampaign(cv.campaigns); return venueIds.has(cv.venue_id) && c?.end_date && new Date(c.end_date) >= new Date(); }).map((cv) => getCampaign(cv.campaigns)?.id)).size;
  const brandColor = network.primary_color ?? "#D4FF4F";

  // OTS estimate: monthly entries × screens
  const ots = totalMonthly * netScreens.length;

  return (
    <div className="glass-card rounded-2xl overflow-hidden mb-3" style={{ borderRadius: 16 }}>
      {/* Header row */}
      <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setOpen((p) => !p)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${brandColor}22`, border: `1.5px solid ${brandColor}44` }}>
          {network.logo_url
            ? <img src={network.logo_url} alt={network.name} className="w-6 h-6 object-contain" />
            : <span style={{ fontSize: 12, fontWeight: 800, color: brandColor, fontFamily: "Inter Tight, sans-serif" }}>{network.name.slice(0, 2).toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>{network.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#555" }}>{netVenues.length} venue{netVenues.length !== 1 ? "s" : ""} · {fmt(totalMembers)} members · {netScreens.length} screens</p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-6 mr-2">
            <div className="text-right">
              <p className="text-xs font-bold text-white tabular-nums">{fmt(ots)}</p>
              <p className="text-xs" style={{ color: "#555" }}>OTS</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white tabular-nums">{activeCampaigns}</p>
              <p className="text-xs" style={{ color: "#555" }}>Campaigns</p>
            </div>
            <div className="w-20">
              <ComplianceBar pct={compliance} />
              <p className="text-xs mt-0.5" style={{ color: "#555" }}>Compliance</p>
            </div>
          </div>
          {open ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 pb-0">
            {[
              { label: "Active Members", value: fmt(totalMembers), icon: Users },
              { label: "Monthly Entries", value: fmt(totalMonthly), icon: TrendingUp },
              { label: "Total Screens", value: netScreens.length.toString(), icon: Monitor },
              { label: "Total Revenue", value: fmtR(totalRevenue), icon: BarChart3 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} color="#555" strokeWidth={2} />
                  <p className="text-xs" style={{ color: "#555" }}>{label}</p>
                </div>
                <p className="text-lg font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Audience demographics */}
          <div className="p-5">
            <AudienceSection network={network} />
          </div>

          {/* Venue breakdown */}
          <div className="px-5 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#666" }}>Venue Breakdown</p>
            <div className="space-y-2">
              {netVenues.map((venue) => {
                const vScreens = screens.filter((s) => s.venue_id === venue.id).length;
                const vPhotos = photos.filter((p) => p.venue_id === venue.id);
                const vCompliance = vPhotos.length > 0 ? Math.round((vPhotos.filter((p) => p.status === "approved").length / vPhotos.length) * 100) : 0;
                return (
                  <div key={venue.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex-1 min-w-0">
                      <Link href={`/admin/venues/${venue.id}`} className="text-sm font-medium text-white hover:text-[#D4FF4F] transition-colors truncate block">
                        {venue.name}
                      </Link>
                      <p className="text-xs" style={{ color: "#555" }}>{[venue.city, venue.province].filter(Boolean).join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs" style={{ color: "#A3A3A3" }}>
                      <span>{fmt(venue.active_members ?? 0)} mbrs</span>
                      <span>{vScreens} screens</span>
                      <div className="w-16 hidden sm:block">
                        <ComplianceBar pct={vCompliance} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audience Section (editable) ─────────────────────────────────────────────

function AudienceSection({ network }: { network: Network }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    audience_male_pct: network.audience_male_pct ?? "",
    audience_female_pct: network.audience_female_pct ?? "",
    audience_age_18_24: network.audience_age_18_24 ?? "",
    audience_age_25_34: network.audience_age_25_34 ?? "",
    audience_age_35_44: network.audience_age_35_44 ?? "",
    audience_age_45_plus: network.audience_age_45_plus ?? "",
    avg_dwell_minutes: network.avg_dwell_minutes ?? 60,
    audience_notes: network.audience_notes ?? "",
  });

  const hasData = network.audience_male_pct !== null || network.audience_age_18_24 !== null;

  async function save() {
    setSaving(true);
    await fetch("/api/insights/audience", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network_id: network.id, ...form }),
    });
    setSaving(false);
    setEditing(false);
  }

  const fieldStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
    color: "#fff", borderRadius: 10, padding: "6px 10px", fontSize: 13, outline: "none", width: "100%",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#666" }}>Audience Demographics</p>
        <button onClick={() => setEditing((p) => !p)} className="text-xs font-medium" style={{ color: editing ? "#EF4444" : "#D4FF4F" }}>
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {!hasData && !editing && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,255,255,0.03)", color: "#555" }}>
          No demographics set — click Edit to add audience data for this network.
        </div>
      )}

      {(hasData || editing) && !editing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Male", value: network.audience_male_pct, suffix: "%" },
            { label: "Female", value: network.audience_female_pct, suffix: "%" },
            { label: "Avg Dwell", value: network.avg_dwell_minutes, suffix: " min" },
            { label: "18–24", value: network.audience_age_18_24, suffix: "%" },
            { label: "25–34", value: network.audience_age_25_34, suffix: "%" },
            { label: "35–44", value: network.audience_age_35_44, suffix: "%" },
            { label: "45+", value: network.audience_age_45_plus, suffix: "%" },
          ].filter((f) => f.value !== null).map(({ label, value, suffix }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-lg font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif" }}>{value}{suffix}</p>
              <p className="text-xs mt-0.5" style={{ color: "#555" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: "audience_male_pct", label: "Male %" },
              { key: "audience_female_pct", label: "Female %" },
              { key: "avg_dwell_minutes", label: "Avg Dwell (min)" },
              { key: "audience_age_18_24", label: "Age 18–24 %" },
              { key: "audience_age_25_34", label: "Age 25–34 %" },
              { key: "audience_age_35_44", label: "Age 35–44 %" },
              { key: "audience_age_45_plus", label: "Age 45+ %" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs mb-1 block" style={{ color: "#666" }}>{label}</label>
                <input type="number" value={form[key as keyof typeof form] as string | number} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} style={fieldStyle} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#666" }}>Notes</label>
            <textarea value={form.audience_notes} onChange={(e) => setForm((p) => ({ ...p, audience_notes: e.target.value }))} rows={2} style={{ ...fieldStyle, resize: "none" }} />
          </div>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-bold transition-all" style={{ background: saving ? "#555" : "#D4FF4F", color: "#0A0A0A" }}>
            {saving ? "Saving…" : "Save Demographics"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Links Manager ────────────────────────────────────────────────────────────

function LinksManager({ links: initial, networks }: { links: InsightLink[]; networks: Network[] }) {
  const [links, setLinks] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${baseUrl}/insights/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  async function deleteLink(id: string) {
    await fetch("/api/insights/links", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setLinks((p) => p.filter((l) => l.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Shareable Links</h2>
          <p className="text-xs mt-0.5" style={{ color: "#555" }}>Share insights with agencies and clients — no login required</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all" style={{ background: "#D4FF4F", color: "#0A0A0A" }}>
          <Plus size={14} strokeWidth={2.5} />
          New Link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="glass-card rounded-2xl py-10 text-center" style={{ borderRadius: 16 }}>
          <Share2 size={28} color="#333" strokeWidth={1.5} className="mx-auto mb-3" />
          <p className="text-sm text-white font-medium mb-1">No links yet</p>
          <p className="text-xs" style={{ color: "#555" }}>Create a link to share insights with an agency or client</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const netNames = link.network_ids
              ? networks.filter((n) => link.network_ids!.includes(n.id)).map((n) => n.name).join(", ")
              : "All Networks";
            const expired = link.expires_at && new Date(link.expires_at) < new Date();
            return (
              <div key={link.id} className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3" style={{ borderRadius: 16, opacity: expired ? 0.5 : 1 }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{link.title}</p>
                    {link.pin_hash ? <Lock size={12} color="#F59E0B" /> : <Unlock size={12} color="#555" />}
                    {expired && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>Expired</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs" style={{ color: "#555" }}>{netNames}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#555" }}>
                      <Eye size={10} /> {link.view_count} view{link.view_count !== 1 ? "s" : ""}
                    </span>
                    {link.expires_at && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#555" }}>
                        <Calendar size={10} /> Expires {new Date(link.expires_at).toLocaleDateString("en-ZA")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 font-mono truncate" style={{ color: "#444" }}>
                    {baseUrl}/insights/{link.token}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => copyLink(link.token)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: copied === link.token ? "rgba(212,255,79,0.12)" : "rgba(255,255,255,0.05)", color: copied === link.token ? "#D4FF4F" : "#A3A3A3", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {copied === link.token ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                  <button onClick={() => deleteLink(link.id)} className="p-1.5 rounded-lg transition-all hover:bg-red-500/10" style={{ color: "#555" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <NewLinkModal
          networks={networks}
          onClose={() => setShowModal(false)}
          onCreated={(link) => setLinks((p) => [link, ...p])}
        />
      )}
    </div>
  );
}

// ─── CPM Calculator ──────────────────────────────────────────────────────────

function CpmCalculator({ totalMembers, totalMonthly, totalScreens }: { totalMembers: number; totalMonthly: number; totalScreens: number }) {
  const [mode, setMode] = useState<"budget" | "impressions">("budget");
  const [budget, setBudget] = useState("");
  const [targetImpressions, setTargetImpressions] = useState("");
  const monthlyOts = totalMonthly * totalScreens;
  const weeklyOts = Math.round(monthlyOts / 4.33);

  // Assumed CPM: R85 (mid-market SA gym DOOH)
  const CPM = 85;

  const budgetNum = parseFloat(budget.replace(/[^0-9.]/g, "")) || 0;
  const impressionsNum = parseFloat(targetImpressions.replace(/[^0-9.]/g, "")) || 0;

  const fromBudget = {
    impressions: Math.round((budgetNum / CPM) * 1000),
    reach: Math.min(totalMembers, Math.round((budgetNum / CPM) * 1000 / 4)),
    weeks: monthlyOts > 0 ? Math.round(((budgetNum / CPM) * 1000) / weeklyOts) : 0,
    cpm: CPM,
  };

  const fromImpressions = {
    budget: Math.round((impressionsNum / 1000) * CPM),
    reach: Math.min(totalMembers, Math.round(impressionsNum / 4)),
    weeks: weeklyOts > 0 ? Math.round(impressionsNum / weeklyOts) : 0,
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={16} color="#D4FF4F" strokeWidth={2} />
          <p className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>CPM Calculator</p>
        </div>
        <p className="text-xs" style={{ color: "#555" }}>Estimate campaign value — based on R{CPM} CPM benchmark</p>
      </div>

      {/* Mode toggle */}
      <div className="px-5 pt-4 pb-0">
        <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "inline-flex" }}>
          {(["budget", "impressions"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: mode === m ? "rgba(255,255,255,0.10)" : "transparent", color: mode === m ? "#fff" : "#555" }}>
              {m === "budget" ? "I have a budget" : "I want X impressions"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5">
        {mode === "budget" ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#666" }}>Campaign Budget (ZAR)</label>
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#555" }}>R</span>
              <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="50 000" className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", outline: "none" }} />
            </div>
            {budgetNum > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Impressions", value: fmt(fromBudget.impressions), color: "#D4FF4F" },
                  { label: "Est. Reach", value: fmt(fromBudget.reach), color: "#fff" },
                  { label: "Campaign Duration", value: `${fromBudget.weeks} weeks`, color: "#A78BFA" },
                  { label: "CPM", value: `R${CPM}`, color: "#34D399" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs mb-1" style={{ color: "#555" }}>{label}</p>
                    <p className="text-lg font-bold tabular-nums" style={{ color, fontFamily: "Inter Tight, sans-serif" }}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#666" }}>Target Impressions</label>
            <input value={targetImpressions} onChange={(e) => setTargetImpressions(e.target.value)} placeholder="500 000" className="w-full px-4 py-2.5 rounded-xl text-sm text-white mb-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", outline: "none" }} />
            {impressionsNum > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Budget Required", value: `R${fmt(fromImpressions.budget)}`, color: "#D4FF4F" },
                  { label: "Est. Reach", value: fmt(fromImpressions.reach), color: "#fff" },
                  { label: "Duration", value: `${fromImpressions.weeks} weeks`, color: "#A78BFA" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs mb-1" style={{ color: "#555" }}>{label}</p>
                    <p className="text-lg font-bold tabular-nums" style={{ color, fontFamily: "Inter Tight, sans-serif" }}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Campaign Availability ────────────────────────────────────────────────────

function CampaignAvailability({ venues, screens, campaignVenues }: {
  venues: Venue[]; screens: Screen[]; campaignVenues: CampaignVenue[];
}) {
  const now = new Date();

  const venueStatus = venues.map((v) => {
    const vScreens = screens.filter((s) => s.venue_id === v.id);
    const activeScreenCount = vScreens.filter((s) => s.is_active).length;
    const activeCampaignIds = new Set(
      campaignVenues
        .filter((cv) => cv.venue_id === v.id)
        .map((cv) => getCampaign(cv.campaigns))
        .filter((c) => c?.end_date && new Date(c.end_date) >= now)
        .map((c) => c!.id)
    );
    const hasAvailability = activeScreenCount > 0 && activeCampaignIds.size < activeScreenCount;
    return { venue: v, activeScreenCount, activeCampaigns: activeCampaignIds.size, hasAvailability };
  });

  const available = venueStatus.filter((v) => v.hasAvailability);
  const booked = venueStatus.filter((v) => !v.hasAvailability && v.activeScreenCount > 0);
  const noScreens = venueStatus.filter((v) => v.activeScreenCount === 0);

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} color="#D4FF4F" strokeWidth={2} />
          <p className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Campaign Availability</p>
        </div>
        <p className="text-xs" style={{ color: "#555" }}>Screen slots open for new campaigns right now</p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 px-5 pt-4 pb-3 flex-wrap">
        {[
          { label: "Available", count: available.length, color: "#D4FF4F", bg: "rgba(212,255,79,0.08)" },
          { label: "Fully Booked", count: booked.length, color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
          { label: "No Screens", count: noScreens.length, color: "#555", bg: "rgba(255,255,255,0.04)" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: bg, border: `1px solid ${color}22` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-xs font-semibold" style={{ color }}>{count} {label}</span>
          </div>
        ))}
      </div>

      {/* Available venues list */}
      {available.length > 0 && (
        <div className="px-5 pb-5">
          <div className="space-y-2">
            {available.map(({ venue, activeScreenCount, activeCampaigns }) => (
              <div key={venue.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(212,255,79,0.04)", border: "1px solid rgba(212,255,79,0.10)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#D4FF4F" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{venue.name}</p>
                  <p className="text-xs" style={{ color: "#555" }}>{venue.city} · {venue.province}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>{activeScreenCount - activeCampaigns} slot{activeScreenCount - activeCampaigns !== 1 ? "s" : ""} open</p>
                  <p className="text-xs" style={{ color: "#555" }}>{activeScreenCount} screens</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {available.length === 0 && (
        <div className="px-5 pb-5 pt-2">
          <p className="text-sm" style={{ color: "#555" }}>All screens are currently booked. Great news for occupancy!</p>
        </div>
      )}
    </div>
  );
}

// ─── Competitive Positioning ──────────────────────────────────────────────────

function CompetitivePositioning({ venues, networks, screens }: {
  venues: Venue[]; networks: Network[]; screens: Screen[];
}) {
  // Province breakdown
  const provinces = Array.from(new Set(venues.map((v) => v.province).filter(Boolean))) as string[];
  const totalMembers = venues.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalMonthly = venues.reduce((s, v) => s + (v.monthly_entries ?? 0), 0);
  const weeklyOts = Math.round((totalMonthly * screens.length) / 4.33);

  // SA gym market estimates (public data approximations)
  const SA_GYM_MEMBERS = 1_200_000;
  const marketShare = totalMembers > 0 ? ((totalMembers / SA_GYM_MEMBERS) * 100).toFixed(1) : "—";

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} color="#D4FF4F" strokeWidth={2} />
          <p className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Market Position</p>
        </div>
        <p className="text-xs" style={{ color: "#555" }}>How GymGaze stacks up in the SA gym advertising market</p>
      </div>
      <div className="p-5 space-y-4">
        {/* Headline claim */}
        <div className="rounded-xl p-4" style={{ background: "rgba(212,255,79,0.05)", border: "1px solid rgba(212,255,79,0.12)" }}>
          <p className="text-base font-bold text-white leading-snug" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            Reaching <span style={{ color: "#D4FF4F" }}>{marketShare}%</span> of SA&apos;s gym-going population across <span style={{ color: "#D4FF4F" }}>{provinces.length}</span> province{provinces.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs mt-1" style={{ color: "#555" }}>Based on ~1.2M active gym members nationally</p>
        </div>

        {/* Province presence */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#666" }}>Provincial Presence</p>
          <div className="space-y-2">
            {provinces.map((prov) => {
              const provVenues = venues.filter((v) => v.province === prov);
              const provMembers = provVenues.reduce((s, v) => s + (v.active_members ?? 0), 0);
              const provScreens = screens.filter((s) => provVenues.some((v) => v.id === s.venue_id)).length;
              return (
                <div key={prov} className="flex items-center gap-3">
                  <p className="text-sm font-medium text-white w-36 flex-shrink-0">{prov}</p>
                  <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                    <div style={{ width: `${(provMembers / totalMembers) * 100}%`, height: 4, background: "#D4FF4F", borderRadius: 99 }} />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-white tabular-nums">{fmt(provMembers)}</p>
                    <p className="text-xs" style={{ color: "#555" }}>{provVenues.length} venues · {provScreens} screens</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key differentiators */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#666" }}>Key Differentiators</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { icon: "🎯", label: "Zero-waste audience", sub: "100% gym-engaged members" },
              { icon: "⏱️", label: "60+ min dwell", sub: "vs 2 sec for billboards" },
              { icon: "🔁", label: "5× weekly frequency", sub: "built-in repeat exposure" },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-lg mb-1">{icon}</p>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#555" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function InsightsClient({ networks, venues, screens, revenue, campaignVenues, photos, links }: Props) {
  const [tab, setTab] = useState<"overview" | "links" | "preview">("overview");

  // Platform-wide stats
  const totalMembers = venues.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalMonthly = venues.reduce((s, v) => s + (v.monthly_entries ?? 0), 0);
  const totalScreens = screens.length;
  const activeScreens = screens.filter((s) => s.is_active).length;
  const totalRevenue = revenue.reduce((s, r) => s + (r.rental_zar ?? 0) + (r.revenue_share_zar ?? 0), 0);
  const approvedPhotos = photos.filter((p) => p.status === "approved").length;
  const overallCompliance = photos.length > 0 ? Math.round((approvedPhotos / photos.length) * 100) : 0;
  const ots = totalMonthly * totalScreens;
  const avgDwell = networks.reduce((s, n) => s + (n.avg_dwell_minutes ?? 60), 0) / (networks.length || 1);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
    background: active ? "rgba(255,255,255,0.10)" : "transparent",
    color: active ? "#fff" : "#555",
    border: "none", transition: "all 0.15s",
  });

  return (
    <div className="p-4 md:p-8">
      {/* Hero */}
      <div className="glass-panel relative overflow-hidden rounded-2xl mb-6 md:mb-8" style={{ borderRadius: 16 }}>
        <div className="relative z-10 p-5 md:p-8">
          <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,5vw,2.5rem)", color: "#fff", letterSpacing: "-0.02em" }}>
            Insights
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Network-wide performance, audience data, and shareable media decks</p>
        </div>
      </div>

      {/* Platform summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {statCard("Total Reach", fmt(totalMembers), "active members")}
        {statCard("Monthly Impressions", fmt(ots), `${totalScreens} screens × entries`, "#A78BFA")}
        {statCard("Photo Compliance", `${overallCompliance}%`, `${approvedPhotos} of ${photos.length} approved`, overallCompliance >= 80 ? "#D4FF4F" : overallCompliance >= 50 ? "#F59E0B" : "#EF4444")}
      </div>

      {/* Reach & Frequency bar */}
      <div className="glass-card rounded-2xl p-5 mb-6 md:mb-8" style={{ borderRadius: 16 }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#666" }}>Reach & Frequency Estimates</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reach", value: fmt(totalMembers), sub: "unique members" },
            { label: "Monthly OTS", value: fmt(ots), sub: "opportunities to see" },
            { label: "Avg Dwell Time", value: `${Math.round(avgDwell)} min`, sub: "per visit" },
            { label: "Active Screens", value: `${activeScreens}/${totalScreens}`, sub: "screens online" },
          ].map(({ label, value, sub }) => (
            <div key={label}>
              <p className="text-xs mb-1" style={{ color: "#555" }}>{label}</p>
              <p className="text-xl font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#444" }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl mb-6 self-start inline-flex" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <button style={tabStyle(tab === "overview")} onClick={() => setTab("overview")}>Network Overview</button>
        <button style={tabStyle(tab === "links")} onClick={() => setTab("links")}>
          <span className="flex items-center gap-1.5">
            <Share2 size={13} strokeWidth={2} />
            Shareable Links
            {links.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full ml-0.5" style={{ background: "rgba(212,255,79,0.15)", color: "#D4FF4F" }}>{links.length}</span>}
          </span>
        </button>
        <button style={tabStyle(tab === "preview")} onClick={() => setTab("preview")}>
          <span className="flex items-center gap-1.5">
            <Presentation size={13} strokeWidth={2} />
            Agency Preview
          </span>
        </button>
      </div>

      {/* Network Overview tab */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* CPM Calculator */}
          <CpmCalculator totalMembers={totalMembers} totalMonthly={totalMonthly} totalScreens={totalScreens} />

          {/* Campaign Impact Estimator */}
          <CampaignImpactEstimator totalMembers={totalMembers} totalMonthly={totalMonthly} totalScreens={totalScreens} />

          {/* Campaign Availability */}
          <CampaignAvailability venues={venues} screens={screens} campaignVenues={campaignVenues} />

          {/* Foot Traffic Heatmap */}
          <FootTrafficHeatmap venues={venues as unknown as Parameters<typeof FootTrafficHeatmap>[0]['venues']} />

          {/* Network Growth Timeline */}
          <NetworkGrowthTimeline venues={venues as unknown as Parameters<typeof NetworkGrowthTimeline>[0]['venues']} screens={screens} />

          {/* Competitive Positioning */}
          <CompetitivePositioning venues={venues} networks={networks} screens={screens} />

          {/* Network rows */}
          {networks.length === 0 ? (
            <div className="glass-card rounded-2xl py-16 text-center" style={{ borderRadius: 16 }}>
              <Building2 size={32} color="#333" strokeWidth={1.5} className="mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No active networks</p>
              <p className="text-sm" style={{ color: "#555" }}>Add networks to see insights here</p>
            </div>
          ) : (
            networks.map((network) => (
              <NetworkRow
                key={network.id}
                network={network}
                venues={venues}
                screens={screens}
                revenue={revenue}
                photos={photos}
                campaignVenues={campaignVenues}
              />
            ))
          )}
        </div>
      )}

      {/* Links tab */}
      {tab === "links" && (
        <LinksManager links={links} networks={networks} />
      )}

      {/* Agency Preview tab */}
      {tab === "preview" && (
        <AgencyDeckPreview
          networks={networks}
          venues={venues}
          screens={screens}
          photos={photos}
          campaignVenues={campaignVenues}
        />
      )}
    </div>
  );
}
