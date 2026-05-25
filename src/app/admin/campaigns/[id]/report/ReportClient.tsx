"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer, Share2, MapPin, Play, Users, Monitor, TrendingUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CampaignData {
  id: string;
  client_name: string | null;
  client_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  format: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  total_value: number | null;
}

interface Metrics {
  totalScreens: number;
  totalVenues: number;
  weeks: number;
  totalPlays: number;
  totalImpressions: number;
  totalMembersReached: number;
  frequency: number;
}

interface VenueRow {
  venue_id: string;
  name: string;
  city: string | null;
  screens: number;
  plays: number;
  members_reached: number;
}

interface PhotoItem {
  id: string;
  venue_id: string;
  url: string;
  area_tag: string | null;
  month: string | null;
}

interface Props {
  campaign: CampaignData;
  metrics: Metrics;
  venueRows: VenueRow[];
  photos: PhotoItem[];
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateShort(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function fmtR(n: number | null | undefined): string {
  if (n == null) return "—";
  return `R ${Number(n).toLocaleString("en-ZA")}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-ZA");
}

const FORMAT_LABELS: Record<string, string> = {
  standard_7s: "Standard 7s",
  premium_15s: "Premium 15s",
  prime_15s: "Prime 15s",
  spotlight_30s: "Spotlight 30s",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#A1A1AA",
  active: "#4ADE80",
  paused: "#FBBF24",
  completed: "#60A5FA",
  cancelled: "#F87171",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportClient({ campaign, metrics, venueRows, photos, generatedAt }: Props) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Report link copied to clipboard!");
    });
  }, []);

  const statusColor = STATUS_COLORS[campaign.status ?? ""] ?? "#A1A1AA";
  const statusLabel = STATUS_LABELS[campaign.status ?? ""] ?? (campaign.status ?? "—");
  const formatLabel = FORMAT_LABELS[campaign.format ?? ""] ?? campaign.format ?? "—";

  // Build a map from venue_id → name for photo captions
  const venueNameMap: Record<string, string> = {};
  venueRows.forEach((v) => { venueNameMap[v.venue_id] = v.name; });

  return (
    <>
      {/* ── Print-only hide styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; }
          .report-wrapper {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .report-page {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      {/* ── Screen: top nav bar ── */}
      <div className="no-print" style={{
        background: "rgba(10,10,10,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <Link
          href={`/admin/campaigns/${campaign.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#C8C8C8",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Back to Campaign
        </Link>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#C8C8C8",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Share2 size={14} strokeWidth={2} />
            Share Report
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              background: "#D4FF4F",
              border: "none",
              color: "#0A0A0A",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Printer size={14} strokeWidth={2.5} />
            Print / PDF
          </button>
        </div>
      </div>

      {/* ── Report body ── */}
      <div className="report-wrapper" style={{
        background: "#F9F9F9",
        minHeight: "100vh",
        padding: "32px 16px 64px",
      }}>
        <div className="report-page" style={{
          maxWidth: 860,
          margin: "0 auto",
          background: "#FFFFFF",
          borderRadius: 16,
          boxShadow: "0 4px 40px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}>

          {/* ── 1. Header ── */}
          <div style={{
            background: "#0A0A0A",
            padding: "36px 40px 32px",
            borderBottom: "3px solid #D4FF4F",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              {/* Logo + title */}
              <div>
                <div style={{ marginBottom: 16 }}>
                  <span style={{
                    fontFamily: "Inter Tight, Inter, sans-serif",
                    fontWeight: 900,
                    fontSize: 26,
                    letterSpacing: "-0.04em",
                    color: "#FFFFFF",
                  }}>
                    Gym<span style={{ color: "#D4FF4F" }}>Gaze</span>
                  </span>
                </div>
                <p style={{ color: "#999", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                  Campaign Delivery Report
                </p>
                <h1 style={{
                  color: "#FFFFFF",
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: "Inter Tight, Inter, sans-serif",
                  letterSpacing: "-0.02em",
                  marginBottom: 4,
                }}>
                  {campaign.client_name ?? "Unnamed Campaign"}
                </h1>
                {campaign.contact_name && (
                  <p style={{ color: "#B0B0B0", fontSize: 13 }}>
                    Advertiser: {campaign.contact_name}{campaign.contact_email ? ` · ${campaign.contact_email}` : ""}
                  </p>
                )}
              </div>
              {/* Date range */}
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#999", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  Flight Period
                </p>
                <p style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>
                  {fmtDateShort(campaign.start_date)}
                  <br />
                  <span style={{ color: "#999" }}>to</span>
                  <br />
                  {fmtDateShort(campaign.end_date)}
                </p>
                <div style={{
                  marginTop: 10,
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: `${statusColor}22`,
                  border: `1px solid ${statusColor}44`,
                  color: statusColor,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>
                  {statusLabel}
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Campaign Summary ── */}
          <div style={{ padding: "32px 40px", borderBottom: "1px solid #F0F0F0" }}>
            <SectionTitle>Campaign Summary</SectionTitle>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 16,
              marginTop: 16,
            }}>
              <SummaryCard icon={<Monitor size={18} color="#D4FF4F" strokeWidth={2} />} label="Total Screens" value={fmtNum(metrics.totalScreens)} />
              <SummaryCard icon={<MapPin size={18} color="#D4FF4F" strokeWidth={2} />} label="Total Venues" value={fmtNum(metrics.totalVenues)} />
              <SummaryCard icon={<Play size={18} color="#D4FF4F" strokeWidth={2} />} label="Ad Format" value={formatLabel} />
              <SummaryCard icon={<TrendingUp size={18} color="#D4FF4F" strokeWidth={2} />} label="Total Spend" value={fmtR(campaign.total_value)} />
            </div>
          </div>

          {/* ── 3. Delivery Metrics ── */}
          <div style={{ padding: "32px 40px", borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
            <SectionTitle>Delivery Metrics</SectionTitle>
            <p style={{ fontSize: 12, color: "#999", marginTop: 4, marginBottom: 20 }}>
              Based on {metrics.weeks} week{metrics.weeks !== 1 ? "s" : ""} · {fmtNum(1596)} plays/screen/week · {4} eyeballs/play · {65}% active member rate
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
            }}>
              <MetricCard
                label="Total Plays"
                value={fmtNum(metrics.totalPlays)}
                sub="ad plays across all screens"
                accent="#D4FF4F"
              />
              <MetricCard
                label="Est. Impressions"
                value={fmtNum(metrics.totalImpressions)}
                sub="individual ad views"
                accent="#FF6B35"
              />
              <MetricCard
                label="Unique Reach"
                value={fmtNum(metrics.totalMembersReached)}
                sub="active gym members"
                accent="#60A5FA"
              />
              <MetricCard
                label="Avg. Frequency"
                value={`${fmtNum(metrics.frequency)}×`}
                sub="avg. ad views per person"
                accent="#C084FC"
              />
            </div>
          </div>

          {/* ── 4. Venue Coverage ── */}
          {venueRows.length > 0 && (
            <div style={{ padding: "32px 40px", borderBottom: "1px solid #F0F0F0" }}>
              <SectionTitle>Venue Coverage</SectionTitle>
              <div style={{ marginTop: 16, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F4F4F5" }}>
                      {["Venue", "City", "Screens", "Plays", "Members Reached"].map((h) => (
                        <th key={h} style={{
                          textAlign: "left",
                          padding: "10px 14px",
                          color: "#6B7280",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          borderBottom: "2px solid #E5E7EB",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {venueRows.map((v, i) => (
                      <tr key={v.venue_id} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}>
                        <td style={{ padding: "11px 14px", fontWeight: 600, color: "#111" }}>{v.name}</td>
                        <td style={{ padding: "11px 14px", color: "#6B7280" }}>{v.city ?? "—"}</td>
                        <td style={{ padding: "11px 14px", color: "#374151", fontVariantNumeric: "tabular-nums" }}>{v.screens}</td>
                        <td style={{ padding: "11px 14px", color: "#374151", fontVariantNumeric: "tabular-nums" }}>{fmtNum(v.plays)}</td>
                        <td style={{ padding: "11px 14px", color: "#374151", fontVariantNumeric: "tabular-nums" }}>{fmtNum(v.members_reached)}</td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ background: "#F0F9E8", borderTop: "2px solid #D4FF4F" }}>
                      <td colSpan={2} style={{ padding: "11px 14px", fontWeight: 700, color: "#111" }}>TOTAL</td>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{metrics.totalScreens}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{fmtNum(metrics.totalPlays)}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{fmtNum(metrics.totalMembersReached)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 5. Proof of Flight ── */}
          {photos.length > 0 && (
            <div style={{ padding: "32px 40px", borderBottom: "1px solid #F0F0F0" }}>
              <SectionTitle>Proof of Flight</SectionTitle>
              <p style={{ fontSize: 12, color: "#999", marginTop: 4, marginBottom: 20 }}>
                Approved on-site photos from participating venues
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
              }}>
                {photos.map((photo) => (
                  <div key={photo.id} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #E5E7EB" }}>
                    <div style={{ position: "relative", width: "100%", paddingBottom: "66%", background: "#F3F4F6" }}>
                      <Image
                        src={photo.url}
                        alt={`Proof of flight — ${venueNameMap[photo.venue_id] ?? "venue"}`}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 860px) 50vw, 220px"
                        unoptimized
                      />
                    </div>
                    <div style={{ padding: "8px 12px", background: "#FAFAFA" }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#111", margin: 0 }}>
                        {venueNameMap[photo.venue_id] ?? "Venue"}
                      </p>
                      {(photo.area_tag || photo.month) && (
                        <p style={{ fontSize: 11, color: "#999", margin: "2px 0 0" }}>
                          {[photo.area_tag, photo.month ? new Date(photo.month).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }) : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── No photos notice ── */}
          {photos.length === 0 && (
            <div style={{ padding: "32px 40px", borderBottom: "1px solid #F0F0F0" }}>
              <SectionTitle>Proof of Flight</SectionTitle>
              <div style={{
                marginTop: 16,
                padding: "24px",
                borderRadius: 10,
                background: "#F9FAFB",
                border: "1px dashed #D1D5DB",
                textAlign: "center",
                color: "#9CA3AF",
                fontSize: 13,
              }}>
                No approved venue photos on file yet. Photos are added via the Venue Manager portal.
              </div>
            </div>
          )}

          {/* ── 6. Footer ── */}
          <div style={{
            padding: "24px 40px",
            background: "#0A0A0A",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}>
            <div>
              <span style={{
                fontFamily: "Inter Tight, Inter, sans-serif",
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "-0.03em",
                color: "#FFFFFF",
              }}>
                Gym<span style={{ color: "#D4FF4F" }}>Gaze</span>
              </span>
              <span style={{ color: "#555", fontSize: 12, marginLeft: 8 }}>
                — Gym Screen Advertising Network
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#666", fontSize: 11, margin: 0 }}>
                Generated {fmtDate(generatedAt)} · CONFIDENTIAL
              </p>
              <p style={{ color: "#444", fontSize: 11, margin: "2px 0 0" }}>
                This report is prepared exclusively for {campaign.client_name ?? "the advertiser"}.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 14,
      fontWeight: 700,
      color: "#111",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      paddingBottom: 8,
      borderBottom: "2px solid #D4FF4F",
      display: "inline-block",
    }}>
      {children}
    </h2>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: "16px 18px",
      borderRadius: 12,
      background: "#F4F4F5",
      border: "1px solid #E5E7EB",
    }}>
      <div style={{ marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{value}</p>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{
      padding: "20px 18px",
      borderRadius: 12,
      background: "#FFFFFF",
      border: `1px solid ${accent}44`,
      borderTop: `3px solid ${accent}`,
    }}>
      <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 800, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{sub}</p>
    </div>
  );
}
