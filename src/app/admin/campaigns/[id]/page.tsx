import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Megaphone,
  Calendar,
  Receipt,
  PlayCircle,
  Pencil,
  User,
  Phone,
  Mail,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtR(n: number | null | undefined): string {
  if (n == null) return "—";
  return `R ${Number(n).toLocaleString("en-ZA")}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

const FORMAT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  standard_7s:   { label: "Standard 7s",   bg: "rgba(113,113,122,0.18)", color: "#A1A1AA" },
  premium_15s:   { label: "Premium 15s",   bg: "rgba(255,107,53,0.18)",  color: "#FF6B35" },
  prime_15s:     { label: "Prime 15s",     bg: "rgba(212,255,79,0.14)",  color: "#D4FF4F" },
  spotlight_30s: { label: "Spotlight 30s", bg: "rgba(168,85,247,0.18)", color: "#C084FC" },
};

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "rgba(113,113,122,0.18)", color: "#A1A1AA" },
  active:    { bg: "rgba(74,222,128,0.15)",  color: "#4ADE80" },
  paused:    { bg: "rgba(251,191,36,0.15)",  color: "#FBBF24" },
  completed: { bg: "rgba(96,165,250,0.15)",  color: "#60A5FA" },
  cancelled: { bg: "rgba(239,68,68,0.15)",   color: "#F87171" },
};

// ─── Badge helpers ────────────────────────────────────────────────────────────

function FormatBadge({ format }: { format: string | null }) {
  const info = format ? FORMAT_MAP[format] : null;
  if (!info) return <span style={{ color: "#777", fontSize: 12 }}>—</span>;
  return (
    <span
      className="text-sm font-semibold px-3 py-1 rounded-full"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      {info.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
  const info = status ? STATUS_MAP[status] : null;
  if (!info) return <span style={{ color: "#777", fontSize: 12 }}>{label}</span>;
  return (
    <span
      className="text-sm font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      {label}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const canEdit = (profileData?.role ?? "viewer") === "admin";

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      `
      id,
      client_name,
      client_type,
      contact_name,
      contact_email,
      contact_phone,
      format,
      status,
      start_date,
      end_date,
      total_value,
      amount_collected,
      notes,
      created_at
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!campaign) notFound();

  const { data: campaignVenues } = await supabase
    .from("campaign_venues")
    .select("id, slot_count, venue_id, venues(id, name, city, status)")
    .eq("campaign_id", id);

  type VenueJoin = {
    id: string;
    slot_count: number;
    venue_id: string;
    venues: { id: string; name: string; city: string | null; status: string | null } | null;
  };

  const rows = (campaignVenues ?? []) as unknown as VenueJoin[];
  const venues = rows
    .map((r) => ({
      ...r.venues!,
      slot_count: r.slot_count,
    }))
    .filter((v) => v.id);

  const totalVal = Number(campaign.total_value) || 0;
  const collected = Number(campaign.amount_collected) || 0;
  const outstanding = totalVal - collected;
  const pct = totalVal > 0 ? Math.min(100, Math.round((collected / totalVal) * 100)) : 0;

  return (
    <div className="p-4 md:p-8">
      {/* Back + Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/admin/campaigns"
          className="p-2 rounded-xl flex-shrink-0 mt-1"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#C8C8C8",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
            >
              {campaign.client_name ?? "Unnamed Campaign"}
            </h1>
            <StatusBadge status={campaign.status} />
            <FormatBadge format={campaign.format} />
          </div>
          <p style={{ color: "#999", fontSize: 14 }}>
            {campaign.client_type === "agency" ? "Agency" : "Direct Brand"}
          </p>
        </div>
        {canEdit && (
          <Link
            href={`/admin/campaigns/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", color: "#C8C8C8", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <Pencil size={14} strokeWidth={2} />
            Edit
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Campaign Details card ── */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(212,255,79,0.08)" }}>
              <Megaphone size={15} color="#D4FF4F" strokeWidth={2} />
            </div>
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
              Campaign Details
            </h2>
          </div>

          <div className="space-y-4">
            {/* Dates */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: "#B0B0B0" }}>Flight Dates</p>
              <div className="flex items-center gap-2">
                <Calendar size={13} color="#A3A3A3" strokeWidth={2} />
                <p className="text-sm text-white tabular-nums">
                  {fmtDate(campaign.start_date)} → {fmtDate(campaign.end_date)}
                </p>
              </div>
            </div>

            {/* Format */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: "#B0B0B0" }}>Ad Format</p>
              <FormatBadge format={campaign.format} />
            </div>

            {/* Contact */}
            {(campaign.contact_name || campaign.contact_email || campaign.contact_phone) && (
              <div>
                <p className="text-xs mb-2" style={{ color: "#B0B0B0" }}>Client Contact</p>
                <div className="space-y-1.5">
                  {campaign.contact_name && (
                    <div className="flex items-center gap-2">
                      <User size={12} color="#A3A3A3" strokeWidth={2} />
                      <span className="text-sm text-white">{campaign.contact_name}</span>
                    </div>
                  )}
                  {campaign.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} color="#A3A3A3" strokeWidth={2} />
                      <a
                        href={`mailto:${campaign.contact_email}`}
                        className="text-sm hover:text-white transition-colors"
                        style={{ color: "#C8C8C8" }}
                      >
                        {campaign.contact_email}
                      </a>
                    </div>
                  )}
                  {campaign.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} color="#A3A3A3" strokeWidth={2} />
                      <span className="text-sm" style={{ color: "#C8C8C8" }}>{campaign.contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {campaign.notes && (
              <div>
                <p className="text-xs mb-1.5" style={{ color: "#B0B0B0" }}>Notes</p>
                <p className="text-sm" style={{ color: "#C8C8C8", lineHeight: 1.5 }}>
                  {campaign.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Card — hidden for non-admin */}
          {canEdit && <div className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(212,255,79,0.08)" }}>
                  <Receipt size={15} color="#D4FF4F" strokeWidth={2} />
                </div>
                <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                  Financials
                </h2>
              </div>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(212,255,79,0.1)", color: "#D4FF4F", border: "1px solid rgba(212,255,79,0.2)" }}
              >
                Record Payment
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs mb-1" style={{ color: "#B0B0B0" }}>Total Value</p>
                <p
                  className="text-xl font-bold text-white tabular-nums"
                  style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
                >
                  {fmtR(campaign.total_value)}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(212,255,79,0.04)", border: "1px solid rgba(212,255,79,0.08)" }}>
                <p className="text-xs mb-1" style={{ color: "#B0B0B0" }}>Collected</p>
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{
                    fontFamily: "Inter Tight, sans-serif",
                    letterSpacing: "-0.02em",
                    color: "#D4FF4F",
                  }}
                >
                  {fmtR(campaign.amount_collected)}
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
                  {fmtR(outstanding)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {totalVal > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs" style={{ color: "#999" }}>
                  <span>Collection progress</span>
                  <span style={{ color: pct >= 100 ? "#4ADE80" : "#C8C8C8" }}>{pct}%</span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 6, backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 100 ? "#4ADE80" : "#FF6B35",
                    }}
                  />
                </div>
              </div>
            )}
          </div>}

          {/* Venues section */}
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2">
                <MapPin size={15} color="#D4FF4F" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                  Venues ({venues.length})
                </h3>
              </div>
            </div>

            {venues.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm" style={{ color: "#B0B0B0" }}>
                No venues attached to this campaign.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Venue", "City", "Slots", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "#B0B0B0" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {venues.map((venue) => (
                    <tr key={venue.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/venues/${venue.id}`}
                          className="text-sm font-medium text-white hover:text-[#D4FF4F] transition-colors"
                        >
                          {venue.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "#C8C8C8" }}>
                        {venue.city ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-white tabular-nums">
                        {venue.slot_count}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            backgroundColor: venue.status === "active" ? "rgba(74,222,128,0.12)" : "rgba(113,113,122,0.15)",
                            color: venue.status === "active" ? "#4ADE80" : "#A1A1AA",
                          }}
                        >
                          {venue.status ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Proof of Play placeholder */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(113,113,122,0.15)" }}>
                <PlayCircle size={15} color="#A1A1AA" strokeWidth={2} />
              </div>
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                Proof of Play
              </h2>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
            >
              <p className="text-sm" style={{ color: "#B0B0B0" }}>
                Proof of play reports will appear here once the campaign is live.
              </p>
              <p className="text-xs mt-1" style={{ color: "#666" }}>
                Future Cuecast integration — coming soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
