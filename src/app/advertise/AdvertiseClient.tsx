"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NetworkStats {
  totalVenues: number;
  totalScreens: number;
  weeklyImpressions: number;
  activeCampaigns: number;
}

interface Settings {
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tagline: string | null;
}

interface Props {
  stats: NetworkStats;
  settings: Settings;
}

// ─── Rate Data ────────────────────────────────────────────────────────────────

const AD_FORMATS = [
  {
    name: "Standard",
    duration: "7s",
    cpm: "R65",
    desc: "Best for brand recall and repeated exposure. Fits easily into any rotation.",
    color: "#FF6B35",
    loopPos: "1/4",
  },
  {
    name: "Premium",
    duration: "15s",
    cpm: "R85",
    desc: "Tell a story. Ideal for product launches and service explanations.",
    color: "#FF6B35",
    loopPos: "2/4",
  },
  {
    name: "Prime",
    duration: "15s",
    cpm: "R120",
    desc: "Priority placement in the loop. Higher share of voice, peak-time visibility.",
    color: "#e55a2a",
    loopPos: "3/4",
  },
  {
    name: "Spotlight",
    duration: "30s",
    cpm: "R160",
    desc: "Maximum impact. Full narrative, premium placement. Our most powerful ad format.",
    color: "#cc4f22",
    loopPos: "4/4",
  },
];

const WIDGETS = [
  {
    emoji: "📰",
    name: "News",
    duration: "30s",
    monthly: "R12,000",
    weekly: "R3,500",
    desc: "Your brand next to breaking headlines. Exclusive top-of-screen news widget sponsorship.",
  },
  {
    emoji: "⚽",
    name: "Sports",
    duration: "30s",
    monthly: "R15,000",
    weekly: "R4,500",
    desc: "Live scores, match previews — your brand on every sports update.",
  },
  {
    emoji: "🌤️",
    name: "Weather",
    duration: "15s",
    monthly: "R8,500",
    weekly: "R2,500",
    desc: "Daily weather check with your logo. Simple, sticky, effective.",
  },
];

const BENEFITS = [
  { emoji: "🎯", title: "Captive audience", desc: "Gym-goers are focused, motivated, and in a positive mindset — the ideal ad environment." },
  { emoji: "✅", title: "Verified proof of play", desc: "Every ad play is logged and timestamped. You see exactly when and where your brand ran." },
  { emoji: "📊", title: "CPM-based pricing", desc: "Transparent, performance-linked pricing. No guessing — you pay for real impressions." },
  { emoji: "🤝", title: "Sales-led onboarding", desc: "Our team guides you through campaign setup, creatives, and optimisation. Full service." },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvertiseClient({ stats, settings }: Props) {
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    interest: "",
    budget_range: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/media-kit/enquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#1a1a1a", background: "#fff" }}>
      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #f0f0f0" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FF6B35" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ letterSpacing: "-0.01em" }}>GymGaze</span>
        </div>
        <button
          onClick={scrollToForm}
          className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "#FF6B35" }}
        >
          Get Started
        </button>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative px-6 md:px-12 pt-20 pb-24 text-center overflow-hidden"
        style={{ background: "linear-gradient(180deg, #fff9f7 0%, #fff 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,107,53,0.06) 0%, transparent 70%)" }} />
        <div className="relative max-w-4xl mx-auto">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
            style={{ background: "rgba(255,107,53,0.1)", color: "#FF6B35" }}
          >
            Advertise With GymGaze
          </span>
          <h1
            className="text-4xl md:text-6xl font-extrabold leading-tight mb-6"
            style={{ letterSpacing: "-0.03em", lineHeight: 1.05 }}
          >
            Reach South Africa&apos;s
            <br />
            <span style={{ color: "#FF6B35" }}>Most Engaged</span> Gym Audience
          </h1>
          <p className="text-lg md:text-xl mb-4" style={{ color: "#555" }}>
            Advertise across{" "}
            <strong style={{ color: "#1a1a1a" }}>{stats.totalVenues} gyms</strong>,{" "}
            <strong style={{ color: "#1a1a1a" }}>{stats.totalScreens} screens</strong>,
            <br className="hidden md:block" />
            reaching <strong style={{ color: "#1a1a1a" }}>{stats.weeklyImpressions.toLocaleString("en-ZA")} impressions</strong> weekly.
          </p>
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition-transform hover:scale-105"
            style={{ background: "#FF6B35", boxShadow: "0 8px 32px rgba(255,107,53,0.3)" }}
          >
            Get the Rate Card →
          </button>
        </div>
      </section>

      {/* ── Why GymGaze ── */}
      <section className="px-6 md:px-12 py-20" style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4" style={{ letterSpacing: "-0.02em" }}>
            Why Advertise on GymGaze?
          </h2>
          <p className="text-center mb-12" style={{ color: "#666" }}>
            Premium digital out-of-home in South Africa&apos;s fastest-growing fitness network
          </p>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { label: "Screens", value: stats.totalScreens.toString(), sub: "across all venues" },
              { label: "Weekly Impressions", value: stats.weeklyImpressions.toLocaleString("en-ZA"), sub: "estimated views per week" },
              { label: "Active Campaigns", value: stats.activeCampaigns.toString(), sub: "brands running right now" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-6 text-center"
                style={{ background: "#fff", border: "1px solid #ebebeb", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
              >
                <p className="text-4xl md:text-5xl font-extrabold mb-2" style={{ color: "#FF6B35", letterSpacing: "-0.03em" }}>
                  {s.value}
                </p>
                <p className="font-bold text-sm mb-1">{s.label}</p>
                <p className="text-xs" style={{ color: "#999" }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Benefit points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="flex gap-4 p-5 rounded-2xl"
                style={{ background: "#fff", border: "1px solid #ebebeb" }}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{b.emoji}</span>
                <div>
                  <p className="font-bold mb-1">{b.title}</p>
                  <p className="text-sm" style={{ color: "#666", lineHeight: 1.6 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ad Formats ── */}
      <section className="px-6 md:px-12 py-20" style={{ borderTop: "1px solid #f0f0f0" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4" style={{ letterSpacing: "-0.02em" }}>
            Ad Formats
          </h2>
          <p className="text-center mb-12" style={{ color: "#666" }}>
            Choose the format that fits your message and budget
          </p>

          {/* Loop diagram */}
          <div
            className="flex items-center justify-center gap-1 mb-12 p-4 rounded-2xl overflow-x-auto"
            style={{ background: "#f7f7f7", border: "1px solid #ebebeb" }}
          >
            <span className="text-xs font-semibold mr-2 flex-shrink-0" style={{ color: "#999" }}>LOOP →</span>
            {AD_FORMATS.map((f, i) => (
              <div key={f.name} className="flex items-center gap-1 flex-shrink-0">
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: f.color, opacity: 0.7 + i * 0.08 }}
                >
                  {f.name} <span style={{ opacity: 0.8 }}>{f.duration}</span>
                </div>
                {i < AD_FORMATS.length - 1 && (
                  <span style={{ color: "#ccc", fontSize: 16 }}>›</span>
                )}
              </div>
            ))}
            <span className="text-xs font-semibold ml-2 flex-shrink-0" style={{ color: "#999" }}>↺</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {AD_FORMATS.map((f) => (
              <div
                key={f.name}
                className="rounded-2xl p-6 flex flex-col"
                style={{ background: "#fff", border: "1px solid #ebebeb", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                    style={{ background: "rgba(255,107,53,0.1)", color: "#FF6B35" }}
                  >
                    {f.duration}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "#999" }}>Slot {f.loopPos}</span>
                </div>
                <h3 className="text-xl font-extrabold mb-2" style={{ letterSpacing: "-0.02em" }}>{f.name}</h3>
                <p className="text-sm flex-1 mb-4" style={{ color: "#666", lineHeight: 1.6 }}>{f.desc}</p>
                <div
                  className="pt-4 flex items-baseline gap-1"
                  style={{ borderTop: "1px solid #f0f0f0" }}
                >
                  <span className="text-2xl font-extrabold" style={{ color: "#FF6B35" }}>{f.cpm}</span>
                  <span className="text-xs" style={{ color: "#999" }}>CPM</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Widget Sponsorships ── */}
      <section className="px-6 md:px-12 py-20" style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4" style={{ letterSpacing: "-0.02em" }}>
            Widget Sponsorships
          </h2>
          <p className="text-center mb-4" style={{ color: "#666" }}>
            Exclusive brand ownership of a content widget across the entire GymGaze network
          </p>
          <p className="text-center text-sm mb-12" style={{ color: "#999" }}>
            Widget sponsorships place your brand logo and tagline on high-frequency content blocks (news, sports, weather).
            Your brand is the sole sponsor — no competition in view.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {WIDGETS.map((w) => (
              <div
                key={w.name}
                className="rounded-2xl p-6 relative"
                style={{ background: "#fff", border: "1.5px solid #ebebeb", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
              >
                <span
                  className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                  style={{ background: "rgba(255,107,53,0.1)", color: "#FF6B35" }}
                >
                  Exclusive
                </span>
                <div className="text-3xl mb-3">{w.emoji}</div>
                <h3 className="text-xl font-extrabold mb-1" style={{ letterSpacing: "-0.02em" }}>{w.name}</h3>
                <p className="text-xs mb-3" style={{ color: "#999" }}>{w.duration} per appearance</p>
                <p className="text-sm mb-5" style={{ color: "#666", lineHeight: 1.6 }}>{w.desc}</p>
                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                  <div className="flex justify-between items-baseline">
                    <span>
                      <span className="text-2xl font-extrabold" style={{ color: "#FF6B35" }}>{w.monthly}</span>
                      <span className="text-xs ml-1" style={{ color: "#999" }}>/mo</span>
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "#888" }}>{w.weekly}/wk</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bundle callout */}
          <div
            className="rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4"
            style={{ background: "linear-gradient(135deg, #FF6B35 0%, #e55a2a 100%)", color: "#fff" }}
          >
            <div>
              <p className="font-extrabold text-xl mb-1">🎯 All 3 Bundle</p>
              <p className="text-sm opacity-90">Own all three widgets. Maximum brand presence across every content type.</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold">R30,000</p>
              <p className="text-sm opacity-80">per month</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Enquiry Form ── */}
      <section
        ref={formRef}
        id="enquiry"
        className="px-6 md:px-12 py-20"
        style={{ borderTop: "1px solid #f0f0f0" }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4" style={{ letterSpacing: "-0.02em" }}>
            Get the Rate Card
          </h2>
          <p className="text-center mb-12" style={{ color: "#666" }}>
            Fill in below and our team will send you a full rate card and availability for your campaign.
          </p>

          {submitted ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: "#f0fff4", border: "1.5px solid #bbf7d0" }}
            >
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-extrabold mb-2" style={{ color: "#15803d" }}>Enquiry Received!</h3>
              <p style={{ color: "#166534" }}>
                Thanks, <strong>{formData.name}</strong>! Our team will be in touch at{" "}
                <strong>{formData.email}</strong> shortly.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 md:p-8 space-y-5"
              style={{ background: "#fff", border: "1px solid #ebebeb", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#555" }}>
                    Full Name <span style={{ color: "#FF6B35" }}>*</span>
                  </label>
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                    style={{ borderColor: "#e0e0e0", background: "#fafafa" }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#FF6B35"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#555" }}>
                    Company / Agency
                  </label>
                  <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                    style={{ borderColor: "#e0e0e0", background: "#fafafa" }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#FF6B35"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"; }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#555" }}>
                    Email <span style={{ color: "#FF6B35" }}>*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.co.za"
                    className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
                    style={{ borderColor: "#e0e0e0", background: "#fafafa" }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#FF6B35"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#555" }}>
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+27 71 234 5678"
                    className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
                    style={{ borderColor: "#e0e0e0", background: "#fafafa" }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#FF6B35"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"; }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#555" }}>
                  I&apos;m interested in
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: "ad_slots", label: "Ad Slots" },
                    { value: "sponsorship", label: "Widget Sponsorship" },
                    { value: "both", label: "Both" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, interest: opt.value }))}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
                      style={{
                        background: formData.interest === opt.value ? "#FF6B35" : "#fafafa",
                        color: formData.interest === opt.value ? "#fff" : "#555",
                        borderColor: formData.interest === opt.value ? "#FF6B35" : "#e0e0e0",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#555" }}>
                  Estimated Monthly Budget
                </label>
                <select
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl text-sm border outline-none cursor-pointer"
                  style={{ borderColor: "#e0e0e0", background: "#fafafa", color: formData.budget_range ? "#1a1a1a" : "#999" }}
                >
                  <option value="">Select range...</option>
                  <option value="R2,500–R5,000">R2,500–R5,000</option>
                  <option value="R5,000–R15,000">R5,000–R15,000</option>
                  <option value="R15,000–R30,000">R15,000–R30,000</option>
                  <option value="R30,000+">R30,000+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#555" }}>
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your brand, target audience, or campaign goals..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none"
                  style={{ borderColor: "#e0e0e0", background: "#fafafa" }}
                  onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#FF6B35"; }}
                  onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#e0e0e0"; }}
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#fff5f5", color: "#dc2626", border: "1px solid #fecaca" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !formData.name || !formData.email}
                className="w-full py-4 rounded-2xl font-bold text-base text-white transition-opacity"
                style={{
                  background: "#FF6B35",
                  opacity: submitting || !formData.name || !formData.email ? 0.6 : 1,
                  boxShadow: "0 4px 16px rgba(255,107,53,0.25)",
                }}
              >
                {submitting ? "Sending…" : "Submit Enquiry →"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-6 md:px-12 py-10"
        style={{ background: "#f7f7f7", borderTop: "1px solid #ebebeb" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#FF6B35" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className="font-bold text-sm">GymGaze</span>
            </div>
            <p className="text-sm" style={{ color: "#888" }}>
              {settings.tagline ?? "Reach South Africa's most engaged gym audience."}
            </p>
          </div>

          <div className="text-sm" style={{ color: "#666" }}>
            {(settings.contact_name || settings.contact_email || settings.contact_phone) ? (
              <div className="space-y-1">
                <p className="font-semibold" style={{ color: "#333" }}>Sales Team</p>
                {settings.contact_name && <p>{settings.contact_name}</p>}
                {settings.contact_email && (
                  <a href={`mailto:${settings.contact_email}`} style={{ color: "#FF6B35" }}>
                    {settings.contact_email}
                  </a>
                )}
                {settings.contact_phone && <p>{settings.contact_phone}</p>}
              </div>
            ) : (
              <p>Contact us at <a href="https://gymgaze.vercel.app" style={{ color: "#FF6B35" }}>gymgaze.vercel.app</a></p>
            )}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6" style={{ borderTop: "1px solid #e8e8e8" }}>
          <p className="text-xs text-center" style={{ color: "#aaa" }}>
            © {new Date().getFullYear()} GymGaze. All rights reserved.{" "}
            <a href="https://gymgaze.vercel.app" className="hover:underline" style={{ color: "#FF6B35" }}>
              gymgaze.vercel.app
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
