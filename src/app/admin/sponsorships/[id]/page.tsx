export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Receipt,
  User,
  Phone,
  Mail,
  Newspaper,
  Trophy,
  Cloud,
  Sparkles,
  MapPin,
} from "lucide-react";
import SponsorshipDetailClient from "./SponsorshipDetailClient";
import SponsorshipActionButtons from "./SponsorshipActionButtons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtR(n: number | null | undefined): string {
  if (n == null) return "—";
  return `R ${Number(n).toLocaleString("en-ZA")}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "Open-ended";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

const WIDGET_META: Record<string, {
  label: string;
  duration: string;
  icon: React.ReactNode;
  tintBg: string;
  tintBorder: string;
  tintText: string;
}> = {
  news: {
    label: "News Widget",
    duration: "30 seconds",
    icon: <Newspaper size={20} strokeWidth={1.5} />,
    tintBg: "rgba(96,165,250,0.06)",
    tintBorder: "rgba(96,165,250,0.2)",
    tintText: "#60A5FA",
  },
  sports: {
    label: "Sports Widget",
    duration: "30 seconds",
    icon: <Trophy size={20} strokeWidth={1.5} />,
    tintBg: "rgba(74,222,128,0.06)",
    tintBorder: "rgba(74,222,128,0.2)",
    tintText: "#4ADE80",
  },
  weather: {
    label: "Weather Widget",
    duration: "15 seconds",
    icon: <Cloud size={20} strokeWidth={1.5} />,
    tintBg: "rgba(34,211,238,0.06)",
    tintBorder: "rgba(34,211,238,0.2)",
    tintText: "#22D3EE",
  },
  bundle: {
    label: "All 3 Widgets Bundle",
    duration: "News 30s · Sports 30s · Weather 15s",
    icon: <Sparkles size={20} strokeWidth={1.5} />,
    tintBg: "rgba(212,255,79,0.06)",
    tintBorder: "rgba(212,255,79,0.2)",
    tintText: "#D4FF4F",
  },
};

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  active:  { bg: "rgba(74,222,128,0.15)",  color: "#4ADE80" },
  paused:  { bg: "rgba(251,191,36,0.15)",  color: "#FBBF24" },
  expired: { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
  draft:   { bg: "rgba(113,113,122,0.18)", color: "#A1A1AA" },
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
};

function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const info = STATUS_MAP[status] ?? STATUS_MAP.draft;
  return (
    <span
      className="text-sm font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SponsorshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: sponsorship } = await supabase
    .from("sponsorships")
    .select(`
      id, brand_name, contact_name, contact_email, contact_phone,
      widget_type, coverage, city, billing_period, rate, status,
      start_date, end_date, logo_url, brand_colour, tagline,
      amount_collected, notes, created_at, updated_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (!sponsorship) notFound();

  const meta = WIDGET_META[sponsorship.widget_type] ?? WIDGET_META.bundle;
  const rate = Number(sponsorship.rate) || 0;
  const collected = Number(sponsorship.amount_collected) || 0;
  const outstanding = rate - collected;
  const brandColour = sponsorship.brand_colour ?? "#FF6B35";

  return (
    <div className="p-4 md:p-8">
      {/* Back + Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/admin/sponsorships"
          className="p-2 rounded-xl flex-shrink-0 mt-1"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#C8C8C8",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>

        {/* Brand header */}
        <div
          className="flex-1 min-w-0 rounded-2xl p-5 md:p-6"
          style={{
            background: meta.tintBg,
            border: `1px solid ${meta.tintBorder}`,
            borderLeft: `4px solid ${brandColour}`,
            borderRadius: 16,
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            {sponsorship.logo_url ? (
              <img
                src={sponsorship.logo_url}
                alt={sponsorship.brand_name}
                className="w-12 h-12 rounded-xl object-contain flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold text-white"
                style={{ backgroundColor: brandColour }}
              >
                {sponsorship.brand_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
                >
                  {sponsorship.brand_name}
                </h1>
                <StatusBadge status={sponsorship.status} />
              </div>
              <div className="flex items-center gap-2" style={{ color: meta.tintText }}>
                {meta.icon}
                <span className="text-sm font-medium">{meta.label}</span>
                <span className="text-xs" style={{ color: "#888" }}>· {meta.duration}</span>
              </div>
              {sponsorship.tagline && (
                <p className="text-sm mt-1" style={{ color: "#B0B0B0", fontStyle: "italic" }}>
                  &ldquo;{sponsorship.tagline}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Details card ── */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <h2 className="text-sm font-semibold text-white mb-5" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            Sponsorship Details
          </h2>

          <div className="space-y-4">
            {/* Widget + Coverage */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: "#B0B0B0" }}>Widget</p>
              <div className="flex items-center gap-2" style={{ color: meta.tintText }}>
                {meta.icon}
                <span className="text-sm font-semibold">{meta.label}</span>
              </div>
            </div>

            <div>
              <p className="text-xs mb-1.5" style={{ color: "#B0B0B0" }}>Coverage</p>
              <div className="flex items-center gap-2 text-sm text-white">
                <MapPin size={13} color="#A3A3A3" strokeWidth={2} />
                <span>
                  {sponsorship.coverage === "city"
                    ? `${sponsorship.city ?? "City"} only`
                    : "Full Network"}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: "#B0B0B0" }}>Flight Dates</p>
              <div className="flex items-center gap-2">
                <Calendar size={13} color="#A3A3A3" strokeWidth={2} />
                <p className="text-sm text-white tabular-nums">
                  {fmtDate(sponsorship.start_date)} → {fmtDate(sponsorship.end_date)}
                </p>
              </div>
            </div>

            {/* Billing */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: "#B0B0B0" }}>Billing</p>
              <p className="text-sm text-white capitalize">
                {sponsorship.billing_period}
              </p>
            </div>

            {/* Contact */}
            {(sponsorship.contact_name || sponsorship.contact_email || sponsorship.contact_phone) && (
              <div>
                <p className="text-xs mb-2" style={{ color: "#B0B0B0" }}>Contact</p>
                <div className="space-y-1.5">
                  {sponsorship.contact_name && (
                    <div className="flex items-center gap-2">
                      <User size={12} color="#A3A3A3" strokeWidth={2} />
                      <span className="text-sm text-white">{sponsorship.contact_name}</span>
                    </div>
                  )}
                  {sponsorship.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} color="#A3A3A3" strokeWidth={2} />
                      <a
                        href={`mailto:${sponsorship.contact_email}`}
                        className="text-sm hover:text-white transition-colors"
                        style={{ color: "#C8C8C8" }}
                      >
                        {sponsorship.contact_email}
                      </a>
                    </div>
                  )}
                  {sponsorship.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} color="#A3A3A3" strokeWidth={2} />
                      <span className="text-sm" style={{ color: "#C8C8C8" }}>
                        {sponsorship.contact_phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {sponsorship.notes && (
              <div>
                <p className="text-xs mb-1.5" style={{ color: "#B0B0B0" }}>Notes</p>
                <p className="text-sm" style={{ color: "#C8C8C8", lineHeight: 1.5 }}>
                  {sponsorship.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financials */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(212,255,79,0.08)" }}>
                  <Receipt size={15} color="#D4FF4F" strokeWidth={2} />
                </div>
                <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                  Financials
                </h2>
              </div>
              {/* Record Payment — handled client-side */}
              <SponsorshipDetailClient sponsorshipId={id} currentCollected={collected} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs mb-1" style={{ color: "#B0B0B0" }}>
                  Rate /{sponsorship.billing_period === "weekly" ? "wk" : "mo"}
                </p>
                <p
                  className="text-xl font-bold text-white tabular-nums"
                  style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
                >
                  {fmtR(rate)}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(212,255,79,0.04)", border: "1px solid rgba(212,255,79,0.08)" }}>
                <p className="text-xs mb-1" style={{ color: "#B0B0B0" }}>Collected</p>
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", color: "#D4FF4F" }}
                >
                  {fmtR(collected)}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ background: outstanding > 0 ? "rgba(251,146,60,0.05)" : "rgba(74,222,128,0.04)" }}>
                <p className="text-xs mb-1" style={{ color: "#B0B0B0" }}>Outstanding</p>
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{
                    fontFamily: "Inter Tight, sans-serif",
                    letterSpacing: "-0.02em",
                    color: outstanding > 0 ? "#FB923C" : "#4ADE80",
                  }}
                >
                  {fmtR(Math.max(0, outstanding))}
                </p>
              </div>
            </div>
          </div>

          {/* Widget Preview mockup */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-sm font-semibold text-white mb-5" style={{ fontFamily: "Inter Tight, sans-serif" }}>
              Widget Preview
            </h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
                aspectRatio: "16/4",
                minHeight: 100,
              }}
            >
              <div className="h-full flex items-center px-6 gap-6">
                {/* Mock widget content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.tintText }}>
                      {meta.label.replace(" Widget", "")}
                    </span>
                    <span className="text-xs" style={{ color: "#555" }}>LIVE</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {[0.7, 0.5, 0.4].map((w, i) => (
                      <div key={i} className="h-2 rounded-full" style={{ width: `${w * 100}%`, background: "rgba(255,255,255,0.1)" }} />
                    ))}
                  </div>
                </div>

                {/* Sponsor badge */}
                <div
                  className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{
                    border: `1px solid ${brandColour}40`,
                    background: `${brandColour}12`,
                  }}
                >
                  {sponsorship.logo_url ? (
                    <img
                      src={sponsorship.logo_url}
                      alt=""
                      className="w-8 h-8 object-contain rounded"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: brandColour }}
                    >
                      {sponsorship.brand_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-white leading-none mb-0.5">
                      {sponsorship.brand_name}
                    </p>
                    <p className="text-xs leading-none" style={{ color: brandColour }}>
                      {sponsorship.tagline || `Brought to you by ${sponsorship.brand_name}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: "#666" }}>
              Static preview — not live output
            </p>
          </div>

          {/* Actions */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "Inter Tight, sans-serif" }}>
              Actions
            </h2>
            <SponsorshipActionButtons
              sponsorshipId={id}
              currentStatus={sponsorship.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
