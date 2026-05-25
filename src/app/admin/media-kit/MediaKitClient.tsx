"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  Users,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaKitSettings {
  id?: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  tagline?: string | null;
}

interface Enquiry {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  interest: string | null;
  budget_range: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

interface PricingTier {
  id: string;
  name: string;
  duration_sec: number;
  cpm_zar: number;
  min_spend: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  settings: MediaKitSettings | null;
  enquiries: Enquiry[];
  pricingTiers: PricingTier[];
  avgMalePct: number;
  avgFemalePct: number;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const WHY_GYMGAZE = [
  {
    icon: <Zap size={20} color="#D4FF4F" />,
    title: "Captive Audience",
    body: "60+ min average dwell time. Zero skip, zero scroll. Gym-goers stay focused.",
  },
  {
    icon: <Target size={20} color="#60A5FA" />,
    title: "Premium Demographic",
    body: "LSM 7–10. Disposable income. Health-conscious, brand-receptive consumers.",
  },
  {
    icon: <TrendingUp size={20} color="#4ADE80" />,
    title: "High Frequency",
    body: "Members visit 3–5 times per week. Repeated brand exposure builds recall.",
  },
  {
    icon: <Shield size={20} color="#FB923C" />,
    title: "Proven eCPM",
    body: "R131 effective CPM vs R750+ for digital display. Exceptional value per impression.",
  },
  {
    icon: <Check size={20} color="#A78BFA" />,
    title: "Measurable",
    body: "Proof-of-play logs, photo verification, impression reports per campaign.",
  },
  {
    icon: <Globe size={20} color="#F472B6" />,
    title: "SA-Wide Network",
    body: "Multiple provinces and growing. Scaled reach across the country's top gym brands.",
  },
];

const AD_FORMATS = [
  {
    name: "Standard",
    duration: "7s",
    cpm: "R65",
    bestUse: "Brand awareness & frequency",
    industries: "Retail, FMCG, Insurance",
    color: "#60A5FA",
  },
  {
    name: "Premium",
    duration: "15s",
    cpm: "R85",
    bestUse: "Product launches & promotions",
    industries: "Automotive, Finance, Tech",
    color: "#D4FF4F",
  },
  {
    name: "Prime",
    duration: "15s",
    cpm: "R120",
    bestUse: "High-impact peak-hour slots",
    industries: "Luxury, Health, Lifestyle",
    color: "#FB923C",
  },
  {
    name: "Spotlight",
    duration: "30s",
    cpm: "R160",
    bestUse: "Full storytelling & demo",
    industries: "Entertainment, Events, B2B",
    color: "#4ADE80",
  },
];

const AGE_BANDS = [
  { label: "18–24", pct: 22 },
  { label: "25–34", pct: 38 },
  { label: "35–44", pct: 28 },
  { label: "45+", pct: 12 },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: "rgba(96,165,250,0.15)", text: "#60A5FA" },
  contacted: { bg: "rgba(251,146,60,0.15)", text: "#FB923C" },
  converted: { bg: "rgba(74,222,128,0.15)", text: "#4ADE80" },
  closed: { bg: "rgba(100,100,100,0.15)", text: "#888" },
};

const STATIC_AD_FORMATS_FALLBACK = AD_FORMATS;

const PUBLIC_URL = "https://gymgaze.vercel.app/advertise";

// ─── Component ────────────────────────────────────────────────────────────────

export default function MediaKitClient({
  settings,
  enquiries: initialEnquiries,
  pricingTiers,
  avgMalePct,
  avgFemalePct,
}: Props) {
  const [tab, setTab] = useState<"overview" | "rates" | "audience" | "formats" | "enquiries">(
    "overview"
  );
  const [copied, setCopied] = useState(false);
  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Settings form state
  const [contactName, setContactName] = useState(settings?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(settings?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(settings?.contact_phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(PUBLIC_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveSettings() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/media-kit/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveMsg("Saved!");
    } catch {
      setSaveMsg("Error saving.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2500);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch("/api/media-kit/enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    }
  }

  const newCount = enquiries.filter((e) => e.status === "new").length;

  const TABS = [
    { key: "overview", label: "Why GymGaze" },
    { key: "rates", label: "Rate Card" },
    { key: "audience", label: "Audience" },
    { key: "formats", label: "Ad Formats" },
    {
      key: "enquiries",
      label: "Enquiries",
      badge: newCount > 0 ? newCount : null,
    },
  ] as const;

  // Use live pricing tiers if available, else fallback static
  const liveTiers = pricingTiers.length > 0;

  return (
    <div className="space-y-5">
      {/* ── CTA Bar ── */}
      <div
        className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
        style={{ borderRadius: 16, border: "1px solid rgba(212,255,79,0.12)" }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <code
            className="flex-1 text-sm px-4 py-2 rounded-xl font-mono min-w-0 truncate"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "#D4FF4F",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {PUBLIC_URL}
          </code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
            style={{
              background: "rgba(212,255,79,0.12)",
              color: "#D4FF4F",
              border: "1px solid rgba(212,255,79,0.2)",
            }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={PUBLIC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{
              background: "rgba(96,165,250,0.12)",
              color: "#60A5FA",
              border: "1px solid rgba(96,165,250,0.2)",
            }}
          >
            <ExternalLink size={15} />
            View
          </a>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: "#D4FF4F", color: "#0A0A0A" }}
          >
            <Download size={15} />
            Download PDF
          </button>
          <Link
            href="/admin/campaigns/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: "transparent",
              color: "#D4FF4F",
              border: "1px solid rgba(212,255,79,0.35)",
            }}
          >
            <Calendar size={15} />
            Book Campaign
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex gap-1 flex-wrap"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 0 }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors relative flex items-center gap-2"
            style={{
              color: tab === t.key ? "#D4FF4F" : "#888",
              background: tab === t.key ? "rgba(212,255,79,0.08)" : "transparent",
              borderBottom: tab === t.key ? "2px solid #D4FF4F" : "2px solid transparent",
            }}
          >
            {t.label}
            {"badge" in t && t.badge != null && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "#D4FF4F", color: "#0A0A0A" }}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: WHY GYMGAZE
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Why GymGaze — 3-col grid */}
          <div>
            <h2
              className="text-base font-bold text-white mb-4"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Why Advertise on GymGaze?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {WHY_GYMGAZE.map((item) => (
                <div
                  key={item.title}
                  className="glass-card rounded-2xl p-5"
                  style={{ borderRadius: 16 }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-sm" style={{ color: "#888", lineHeight: 1.6 }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key benchmark */}
          <div
            className="glass-card rounded-2xl p-5 md:p-6"
            style={{
              borderRadius: 16,
              border: "1px solid rgba(212,255,79,0.12)",
              background:
                "linear-gradient(135deg, rgba(212,255,79,0.05) 0%, rgba(0,0,0,0) 100%)",
            }}
          >
            <p
              className="text-xs uppercase tracking-widest font-semibold mb-4"
              style={{ color: "#D4FF4F" }}
            >
              eCPM Benchmark
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "GymGaze eCPM", value: "R131", color: "#D4FF4F", sub: "Effective cost per mille" },
                { label: "Digital Display", value: "R750+", color: "#F87171", sub: "Industry average" },
                {
                  label: "Avg Dwell Time",
                  value: "60+ min",
                  color: "#60A5FA",
                  sub: "Per visit",
                },
                {
                  label: "Visit Frequency",
                  value: "3–5×/wk",
                  color: "#4ADE80",
                  sub: "Per member",
                },
              ].map((kpi) => (
                <div key={kpi.label}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#666" }}>
                    {kpi.label}
                  </p>
                  <p
                    className="text-2xl font-bold tabular-nums"
                    style={{
                      fontFamily: "Inter Tight, sans-serif",
                      color: kpi.color,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {kpi.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#555" }}>
                    {kpi.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <h2
              className="text-base font-bold text-white mb-1"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Sales Contact Settings
            </h2>
            <p className="text-sm mb-5" style={{ color: "#999" }}>
              Displayed on the public /advertise page under the enquiry form.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                {
                  label: "Contact Name",
                  value: contactName,
                  setter: setContactName,
                  placeholder: "e.g. Thabo Nkosi",
                },
                {
                  label: "Contact Email",
                  value: contactEmail,
                  setter: setContactEmail,
                  placeholder: "sales@gymgaze.co.za",
                },
                {
                  label: "Contact Phone",
                  value: contactPhone,
                  setter: setContactPhone,
                  placeholder: "+27 71 234 5678",
                },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{
                      color: "#888",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {label}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-neutral-600"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      outline: "none",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity"
                style={{ background: "#D4FF4F", color: "#0A0A0A", opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Saving…" : "Save Settings"}
              </button>
              {saveMsg && (
                <span
                  className="text-sm"
                  style={{ color: saveMsg === "Saved!" ? "#4ADE80" : "#F87171" }}
                >
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: RATE CARD
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "rates" && (
        <div className="space-y-5">
          {/* Live pricing tiers */}
          {liveTiers && (
            <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
              <div className="flex items-center gap-2 mb-4">
                <h2
                  className="text-base font-bold text-white"
                  style={{ fontFamily: "Inter Tight, sans-serif" }}
                >
                  Pricing Tiers
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}
                >
                  Live from DB
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {["Tier", "Duration", "CPM (ZAR)", "Min Spend", "Description"].map((h) => (
                        <th
                          key={h}
                          className="text-left pb-3 pr-6 font-semibold"
                          style={{
                            color: "#666",
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pricingTiers.map((tier) => (
                      <tr
                        key={tier.id}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <td className="py-3 pr-6 font-semibold text-white">{tier.name}</td>
                        <td className="py-3 pr-6" style={{ color: "#999" }}>
                          {tier.duration_sec}s
                        </td>
                        <td
                          className="py-3 pr-6 font-mono font-bold"
                          style={{ color: "#D4FF4F" }}
                        >
                          R{tier.cpm_zar.toLocaleString("en-ZA")}
                        </td>
                        <td className="py-3 pr-6 font-mono" style={{ color: "#60A5FA" }}>
                          R{tier.min_spend.toLocaleString("en-ZA")}
                        </td>
                        <td className="py-3" style={{ color: "#888" }}>
                          {tier.description ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Static Ad Slot Rates */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <h2
              className="text-base font-bold text-white mb-4"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Ad Slot Rates
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Format", "Duration", "CPM", "Min. Weekly Rate"].map((h) => (
                      <th
                        key={h}
                        className="text-left pb-3 pr-6 font-semibold"
                        style={{
                          color: "#666",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STATIC_AD_FORMATS_FALLBACK.map((row) => (
                    <tr
                      key={row.name}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="py-3 pr-6 font-semibold" style={{ color: row.color }}>
                        {row.name}
                      </td>
                      <td className="py-3 pr-6" style={{ color: "#999" }}>
                        {row.duration}
                      </td>
                      <td
                        className="py-3 pr-6 font-mono font-bold"
                        style={{ color: "#D4FF4F" }}
                      >
                        {row.cpm}
                      </td>
                      <td className="py-3 font-mono" style={{ color: "#60A5FA" }}>
                        —
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Widget Sponsorships */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <h2
              className="text-base font-bold text-white mb-4"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Widget Sponsorship Rates
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Widget", "Duration", "Monthly", "Weekly"].map((h) => (
                      <th
                        key={h}
                        className="text-left pb-3 pr-6 font-semibold"
                        style={{
                          color: "#666",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { widget: "📰 News", duration: "30s", monthly: "R12,000", weekly: "R3,500" },
                    { widget: "⚽ Sports", duration: "30s", monthly: "R15,000", weekly: "R4,500" },
                    { widget: "🌤️ Weather", duration: "15s", monthly: "R8,500", weekly: "R2,500" },
                    {
                      widget: "🎯 All 3 Bundle",
                      duration: "75s",
                      monthly: "R30,000",
                      weekly: "—",
                    },
                  ].map((row) => (
                    <tr
                      key={row.widget}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="py-3 pr-6 font-semibold text-white">{row.widget}</td>
                      <td className="py-3 pr-6" style={{ color: "#999" }}>
                        {row.duration}
                      </td>
                      <td
                        className="py-3 pr-6 font-mono font-bold"
                        style={{ color: "#D4FF4F" }}
                      >
                        {row.monthly}
                      </td>
                      <td className="py-3 font-mono" style={{ color: "#60A5FA" }}>
                        {row.weekly}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: AUDIENCE PROFILE
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "audience" && (
        <div className="space-y-5">
          {/* Gender Split */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <h2
              className="text-base font-bold text-white mb-5"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Gender Split
            </h2>
            <div className="space-y-4">
              {[
                { label: "Male", pct: avgMalePct, color: "#60A5FA" },
                { label: "Female", pct: avgFemalePct, color: "#F472B6" },
              ].map((g) => (
                <div key={g.label} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-semibold" style={{ color: "#ccc" }}>
                    {g.label}
                  </div>
                  <div
                    className="flex-1 rounded-full overflow-hidden"
                    style={{ height: 10, background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${g.pct}%`, background: g.color }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-bold tabular-nums" style={{ color: g.color }}>
                    {g.pct}%
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-4" style={{ color: "#555" }}>
              Aggregated from gym brand audience data across the network.
            </p>
          </div>

          {/* Age Breakdown */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <h2
              className="text-base font-bold text-white mb-5"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Age Breakdown
            </h2>
            <div className="space-y-4">
              {AGE_BANDS.map((band) => (
                <div key={band.label} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-semibold" style={{ color: "#ccc" }}>
                    {band.label}
                  </div>
                  <div
                    className="flex-1 rounded-full overflow-hidden"
                    style={{ height: 10, background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${band.pct}%`, background: "#D4FF4F" }}
                    />
                  </div>
                  <div
                    className="w-12 text-right text-sm font-bold tabular-nums"
                    style={{ color: "#D4FF4F" }}
                  >
                    {band.pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LSM / Income Profile */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <h2
              className="text-base font-bold text-white mb-4"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Socioeconomic Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "LSM Range",
                  value: "7–10",
                  sub: "Living Standards Measure",
                  color: "#D4FF4F",
                },
                {
                  label: "Avg HH Income",
                  value: "R25k+",
                  sub: "Monthly household income",
                  color: "#60A5FA",
                },
                {
                  label: "Education",
                  value: "Tertiary",
                  sub: "Post-matric education",
                  color: "#4ADE80",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#666" }}>
                    {item.label}
                  </p>
                  <p
                    className="text-2xl font-bold tabular-nums"
                    style={{
                      fontFamily: "Inter Tight, sans-serif",
                      color: item.color,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {item.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#555" }}>
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: AD FORMATS GUIDE
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "formats" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AD_FORMATS.map((fmt) => (
              <div
                key={fmt.name}
                className="glass-card rounded-2xl p-5"
                style={{
                  borderRadius: 16,
                  borderLeft: `3px solid ${fmt.color}`,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-2xl font-black tabular-nums"
                      style={{
                        fontFamily: "Inter Tight, sans-serif",
                        color: fmt.color,
                        letterSpacing: "-0.04em",
                      }}
                    >
                      {fmt.duration}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{fmt.name}</p>
                      <p className="text-xs" style={{ color: "#666" }}>
                        Ad format
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-lg font-bold tabular-nums font-mono"
                      style={{ color: "#D4FF4F" }}
                    >
                      {fmt.cpm}
                    </p>
                    <p className="text-xs" style={{ color: "#666" }}>
                      per mille
                    </p>
                  </div>
                </div>

                <div
                  className="h-px w-full mb-3"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />

                <div className="space-y-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#555" }}>
                      Best use case
                    </p>
                    <p className="text-sm font-medium text-white">{fmt.bestUse}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#555" }}>
                      Recommended industries
                    </p>
                    <p className="text-sm" style={{ color: "#888" }}>
                      {fmt.industries}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div
            className="glass-card rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
            style={{
              borderRadius: 16,
              border: "1px solid rgba(212,255,79,0.15)",
              background:
                "linear-gradient(135deg, rgba(212,255,79,0.05) 0%, rgba(0,0,0,0) 100%)",
            }}
          >
            <div>
              <p className="text-sm font-bold text-white mb-1">
                Ready to advertise on the GymGaze network?
              </p>
              <p className="text-sm" style={{ color: "#888" }}>
                Book a campaign or download the full media kit PDF.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "#D4FF4F", color: "#0A0A0A" }}
              >
                <Download size={15} />
                Download PDF
              </button>
              <a
                href="mailto:hello@gymgaze.co.za"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{
                  background: "transparent",
                  color: "#D4FF4F",
                  border: "1px solid rgba(212,255,79,0.35)",
                }}
              >
                <Users size={15} />
                Enquire Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ENQUIRIES
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "enquiries" && (
        <div
          className="glass-card rounded-2xl overflow-hidden"
          style={{ borderRadius: 16 }}
        >
          {enquiries.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-semibold text-white mb-1">No enquiries yet</p>
              <p className="text-sm" style={{ color: "#666" }}>
                When brands submit the form on /advertise, they&apos;ll appear here.
              </p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div
                className="hidden md:grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
                style={{
                  gridTemplateColumns: "1fr 1fr 1fr 100px 120px 120px 140px",
                  color: "#666",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  letterSpacing: "0.06em",
                }}
              >
                <span>Name</span>
                <span>Company</span>
                <span>Email</span>
                <span>Interest</span>
                <span>Budget</span>
                <span>Date</span>
                <span>Status</span>
              </div>

              {enquiries.map((e) => {
                const isExpanded = expandedId === e.id;
                const sc = STATUS_COLORS[e.status] ?? STATUS_COLORS.new;
                const date = new Date(e.created_at).toLocaleDateString("en-ZA", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div
                    key={e.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="flex md:grid items-start md:items-center gap-3 px-4 md:px-5 py-4 cursor-pointer transition-colors"
                      style={{
                        gridTemplateColumns: "1fr 1fr 1fr 100px 120px 120px 140px",
                        background: isExpanded ? "rgba(255,255,255,0.03)" : "transparent",
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : e.id)}
                    >
                      <span className="text-sm font-semibold text-white truncate">{e.name}</span>
                      <span
                        className="text-sm truncate hidden md:block"
                        style={{ color: "#999" }}
                      >
                        {e.company ?? "—"}
                      </span>
                      <span
                        className="text-sm truncate hidden md:block"
                        style={{ color: "#60A5FA" }}
                      >
                        {e.email}
                      </span>
                      <span
                        className="text-xs hidden md:block capitalize"
                        style={{ color: "#ccc" }}
                      >
                        {e.interest?.replace("_", " ") ?? "—"}
                      </span>
                      <span className="text-xs hidden md:block" style={{ color: "#ccc" }}>
                        {e.budget_range ?? "—"}
                      </span>
                      <span className="text-xs hidden md:block" style={{ color: "#666" }}>
                        {date}
                      </span>

                      <div className="flex items-center gap-2 md:justify-start ml-auto md:ml-0">
                        <select
                          value={e.status}
                          onClick={(ev) => ev.stopPropagation()}
                          onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer"
                          style={{
                            background: sc.bg,
                            color: sc.text,
                            border: "none",
                            outline: "none",
                          }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="closed">Closed</option>
                        </select>
                        {isExpanded ? (
                          <ChevronUp size={14} color="#666" />
                        ) : (
                          <ChevronDown size={14} color="#666" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {[
                            { label: "Email", value: e.email },
                            { label: "Phone", value: e.phone ?? "Not provided" },
                            { label: "Interest", value: e.interest?.replace("_", " ") ?? "—" },
                            { label: "Budget", value: e.budget_range ?? "—" },
                            { label: "Company", value: e.company ?? "—" },
                            { label: "Submitted", value: date },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p
                                className="text-xs font-semibold uppercase tracking-wider mb-1"
                                style={{ color: "#555" }}
                              >
                                {label}
                              </p>
                              <p className="text-sm" style={{ color: "#ccc" }}>
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                        {e.message && (
                          <div>
                            <p
                              className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                              style={{ color: "#555" }}
                            >
                              Message
                            </p>
                            <p
                              className="text-sm p-4 rounded-xl whitespace-pre-wrap"
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                color: "#ccc",
                                border: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              {e.message}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
