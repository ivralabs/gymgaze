"use client";

import { useState } from "react";
import { Copy, ExternalLink, Check, ChevronDown, ChevronUp } from "lucide-react";

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

interface Props {
  settings: MediaKitSettings | null;
  enquiries: Enquiry[];
}

// ─── Static rate data ─────────────────────────────────────────────────────────

const AD_FORMATS = [
  { format: "Standard", duration: "7s", cpm: "R65", minWeekly: "R500" },
  { format: "Premium", duration: "15s", cpm: "R85", minWeekly: "R1,000" },
  { format: "Prime", duration: "15s", cpm: "R120", minWeekly: "R1,800" },
  { format: "Spotlight", duration: "30s", cpm: "R160", minWeekly: "R3,000" },
];

const WIDGET_SPONSORSHIPS = [
  { widget: "📰 News", duration: "30s", monthly: "R12,000", weekly: "R3,500" },
  { widget: "⚽ Sports", duration: "30s", monthly: "R15,000", weekly: "R4,500" },
  { widget: "🌤️ Weather", duration: "15s", monthly: "R8,500", weekly: "R2,500" },
  { widget: "🎯 All 3 Bundle", duration: "75s", monthly: "R30,000", weekly: "—" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: "rgba(96,165,250,0.15)", text: "#60A5FA" },
  contacted: { bg: "rgba(251,146,60,0.15)", text: "#FB923C" },
  converted: { bg: "rgba(74,222,128,0.15)", text: "#4ADE80" },
  closed: { bg: "rgba(100,100,100,0.15)", text: "#888" },
};

const PUBLIC_URL = "https://gymgaze.vercel.app/advertise";

// ─── Component ────────────────────────────────────────────────────────────────

export default function MediaKitClient({ settings, enquiries: initialEnquiries }: Props) {
  const [tab, setTab] = useState<"rates" | "enquiries">("rates");
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
        body: JSON.stringify({ contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone }),
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

  return (
    <div className="space-y-6">
      {/* ── Tabs ── */}
      <div className="flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 0 }}>
        {(["rates", "enquiries"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors relative"
            style={{
              color: tab === t ? "#D4FF4F" : "#888",
              background: tab === t ? "rgba(212,255,79,0.08)" : "transparent",
              borderBottom: tab === t ? "2px solid #D4FF4F" : "2px solid transparent",
            }}
          >
            {t === "rates" ? "Rate Card" : (
              <span className="flex items-center gap-2">
                Enquiries
                {newCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#D4FF4F", color: "#0A0A0A" }}>
                    {newCount}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Rate Card Tab ── */}
      {tab === "rates" && (
        <div className="space-y-6">
          {/* Public Link */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <p className="text-xs uppercase tracking-wider mb-3 font-semibold" style={{ color: "#999" }}>
              Public Media Kit URL
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <code
                className="flex-1 text-sm px-4 py-2.5 rounded-xl font-mono min-w-0 truncate"
                style={{ background: "rgba(255,255,255,0.06)", color: "#D4FF4F", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {PUBLIC_URL}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
                style={{ background: "rgba(212,255,79,0.12)", color: "#D4FF4F", border: "1px solid rgba(212,255,79,0.2)" }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <a
                href={PUBLIC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
                style={{ background: "rgba(96,165,250,0.12)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.2)" }}
              >
                <ExternalLink size={16} />
                View Public Page
              </a>
            </div>
          </div>

          {/* Ad Slots Rate Card */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "Inter Tight, sans-serif" }}>
              Ad Slot Rates
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Format", "Duration", "CPM", "Min. Weekly Rate"].map((h) => (
                      <th key={h} className="text-left pb-3 pr-6 font-semibold" style={{ color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AD_FORMATS.map((row) => (
                    <tr key={row.format} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="py-3 pr-6 font-semibold text-white">{row.format}</td>
                      <td className="py-3 pr-6" style={{ color: "#999" }}>{row.duration}</td>
                      <td className="py-3 pr-6 font-mono font-bold" style={{ color: "#D4FF4F" }}>{row.cpm}</td>
                      <td className="py-3 font-mono" style={{ color: "#60A5FA" }}>{row.minWeekly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Widget Sponsorships Rate Card */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "Inter Tight, sans-serif" }}>
              Widget Sponsorship Rates
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Widget", "Duration", "Monthly", "Weekly"].map((h) => (
                      <th key={h} className="text-left pb-3 pr-6 font-semibold" style={{ color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WIDGET_SPONSORSHIPS.map((row) => (
                    <tr key={row.widget} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="py-3 pr-6 font-semibold text-white">{row.widget}</td>
                      <td className="py-3 pr-6" style={{ color: "#999" }}>{row.duration}</td>
                      <td className="py-3 pr-6 font-mono font-bold" style={{ color: "#D4FF4F" }}>{row.monthly}</td>
                      <td className="py-3 font-mono" style={{ color: "#60A5FA" }}>{row.weekly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enquiry Settings */}
          <div className="glass-card rounded-2xl p-5 md:p-6" style={{ borderRadius: 16 }}>
            <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "Inter Tight, sans-serif" }}>
              Sales Contact Settings
            </h2>
            <p className="text-sm mb-5" style={{ color: "#999" }}>
              Displayed on the public /advertise page under the enquiry form.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Contact Name", value: contactName, setter: setContactName, placeholder: "e.g. Thabo Nkosi" },
                { label: "Contact Email", value: contactEmail, setter: setContactEmail, placeholder: "sales@gymgaze.co.za" },
                { label: "Contact Phone", value: contactPhone, setter: setContactPhone, placeholder: "+27 71 234 5678" },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-neutral-600"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
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
                <span className="text-sm" style={{ color: saveMsg === "Saved!" ? "#4ADE80" : "#F87171" }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Enquiries Tab ── */}
      {tab === "enquiries" && (
        <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
          {enquiries.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-semibold text-white mb-1">No enquiries yet</p>
              <p className="text-sm" style={{ color: "#666" }}>
                When brands submit the form on /advertise, they'll appear here.
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
                const date = new Date(e.created_at).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
                return (
                  <div key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {/* Row */}
                    <div
                      className="flex md:grid items-start md:items-center gap-3 px-4 md:px-5 py-4 cursor-pointer transition-colors"
                      style={{
                        gridTemplateColumns: "1fr 1fr 1fr 100px 120px 120px 140px",
                        background: isExpanded ? "rgba(255,255,255,0.03)" : "transparent",
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : e.id)}
                    >
                      <span className="text-sm font-semibold text-white truncate">{e.name}</span>
                      <span className="text-sm truncate hidden md:block" style={{ color: "#999" }}>{e.company ?? "—"}</span>
                      <span className="text-sm truncate hidden md:block" style={{ color: "#60A5FA" }}>{e.email}</span>
                      <span className="text-xs hidden md:block capitalize" style={{ color: "#ccc" }}>{e.interest?.replace("_", " ") ?? "—"}</span>
                      <span className="text-xs hidden md:block" style={{ color: "#ccc" }}>{e.budget_range ?? "—"}</span>
                      <span className="text-xs hidden md:block" style={{ color: "#666" }}>{date}</span>

                      {/* Status selector */}
                      <div className="flex items-center gap-2 md:justify-start ml-auto md:ml-0">
                        <select
                          value={e.status}
                          onClick={(ev) => ev.stopPropagation()}
                          onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer"
                          style={{ background: sc.bg, color: sc.text, border: "none", outline: "none" }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="closed">Closed</option>
                        </select>
                        {isExpanded ? <ChevronUp size={14} color="#666" /> : <ChevronDown size={14} color="#666" />}
                      </div>
                    </div>

                    {/* Expanded message */}
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
                              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#555" }}>{label}</p>
                              <p className="text-sm" style={{ color: "#ccc" }}>{value}</p>
                            </div>
                          ))}
                        </div>
                        {e.message && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#555" }}>Message</p>
                            <p
                              className="text-sm p-4 rounded-xl whitespace-pre-wrap"
                              style={{ background: "rgba(255,255,255,0.04)", color: "#ccc", border: "1px solid rgba(255,255,255,0.06)" }}
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
