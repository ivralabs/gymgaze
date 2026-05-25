"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  Calendar,
  Repeat,
  ChevronDown,
  FileText,
} from "lucide-react";
import type { CampaignRow, SponsorshipRow, PaymentRow } from "./page";
import RecordPaymentModal from "./RecordPaymentModal";
import InvoicesTab from "./InvoicesTab";

// ─── Lazy chart ────────────────────────────────────────────────────────────────
const RevenueBarChart = dynamic(
  () => import("./RevenueBarChart"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
          fontSize: 13,
          background: "rgba(255,255,255,0.02)",
          borderRadius: 12,
        }}
      >
        Loading chart…
      </div>
    ),
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
  thisMonthRevenue: number;
  mrr: number;
}

interface Props {
  campaigns: CampaignRow[];
  sponsorships: SponsorshipRow[];
  payments: PaymentRow[];
  summary: Summary;
  campaignOptions: { id: string; client_name: string | null }[];
}

type Tab = "campaigns" | "sponsorships" | "invoices";
type StatusFilter = "all" | "active" | "completed" | "draft" | "paused" | "expired";
type DateFilter = "this-month" | "last-month" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtR = (n: number) =>
  "R " +
  Math.round(n).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusColor(status: string): { bg: string; color: string } {
  switch (status) {
    case "active":
      return { bg: "rgba(74,222,128,0.12)", color: "#4ADE80" };
    case "completed":
      return { bg: "rgba(96,165,250,0.12)", color: "#60A5FA" };
    case "paused":
      return { bg: "rgba(251,191,36,0.12)", color: "#FBBF24" };
    case "expired":
      return { bg: "rgba(156,163,175,0.12)", color: "#9CA3AF" };
    case "draft":
      return { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" };
    default:
      return { bg: "rgba(255,255,255,0.08)", color: "#A3A3A3" };
  }
}

function getWidgetColor(widget: string): { bg: string; color: string } {
  switch (widget) {
    case "news":
      return { bg: "rgba(96,165,250,0.12)", color: "#60A5FA" };
    case "sports":
      return { bg: "rgba(74,222,128,0.12)", color: "#4ADE80" };
    case "weather":
      return { bg: "rgba(251,191,36,0.12)", color: "#FBBF24" };
    case "bundle":
      return { bg: "rgba(212,255,79,0.12)", color: "#D4FF4F" };
    default:
      return { bg: "rgba(255,255,255,0.08)", color: "#A3A3A3" };
  }
}

function getFormatColor(format: string | null): { bg: string; color: string } {
  switch (format) {
    case "standard_7s":
      return { bg: "rgba(96,165,250,0.12)", color: "#60A5FA" };
    case "premium_15s":
      return { bg: "rgba(251,146,60,0.12)", color: "#FB923C" };
    case "prime_15s":
      return { bg: "rgba(212,255,79,0.12)", color: "#D4FF4F" };
    case "spotlight_30s":
      return { bg: "rgba(244,114,182,0.12)", color: "#F472B6" };
    default:
      return { bg: "rgba(255,255,255,0.08)", color: "#A3A3A3" };
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  highlight,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  valueColor?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: highlight
          ? "rgba(212,255,79,0.06)"
          : "rgba(255,255,255,0.03)",
        border: highlight
          ? "1px solid rgba(212,255,79,0.18)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: highlight
              ? "rgba(212,255,79,0.12)"
              : "rgba(255,255,255,0.06)",
          }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#777" }}
        >
          {label}
        </span>
      </div>
      <p
        className="text-2xl font-extrabold tabular-nums leading-none"
        style={{
          fontFamily: "Inter Tight, sans-serif",
          letterSpacing: "-0.02em",
          color: valueColor ?? (highlight ? "#D4FF4F" : "#FFFFFF"),
        }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1.5" style={{ color: "#555" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 6, background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "#4ADE80" : "#D4FF4F",
          }}
        />
      </div>
      <span
        className="text-xs font-medium tabular-nums"
        style={{ color: "#666", minWidth: "2.5rem", textAlign: "right" }}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RevenueClient({
  campaigns: initialCampaigns,
  sponsorships: initialSponsorships,
  payments: initialPayments,
  summary: initialSummary,
  campaignOptions,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("campaigns");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [sponsorships, setSponsorships] = useState(initialSponsorships);
  const [payments, setPayments] = useState(initialPayments);
  const [summary, setSummary] = useState(initialSummary);

  // Payment modal state
  const [modal, setModal] = useState<{
    sourceType: "campaign" | "sponsorship";
    sourceId: string;
    sourceName: string;
    outstanding: number;
  } | null>(null);

  // Filter helpers
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 10);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString()
    .slice(0, 10);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (dateFilter === "this-month") {
        if (
          !c.start_date ||
          !c.end_date ||
          c.start_date > thisMonthEnd ||
          c.end_date < thisMonthStart
        )
          return false;
      } else if (dateFilter === "last-month") {
        if (
          !c.start_date ||
          !c.end_date ||
          c.start_date > lastMonthEnd ||
          c.end_date < lastMonthStart
        )
          return false;
      }
      return true;
    });
  }, [campaigns, statusFilter, dateFilter, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd]);

  const filteredSponsorships = useMemo(() => {
    return sponsorships.filter((sp) => {
      if (statusFilter !== "all" && sp.status !== statusFilter) return false;
      if (dateFilter === "this-month") {
        const end = sp.end_date ?? "9999-12-31";
        if (sp.start_date > thisMonthEnd || end < thisMonthStart) return false;
      } else if (dateFilter === "last-month") {
        const end = sp.end_date ?? "9999-12-31";
        if (sp.start_date > lastMonthEnd || end < lastMonthStart) return false;
      }
      return true;
    });
  }, [sponsorships, statusFilter, dateFilter, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd]);

  // MRR for sponsorship sub-total
  const sponsorshipMrr = useMemo(() => {
    return filteredSponsorships
      .filter((sp) => sp.status === "active")
      .reduce(
        (s, sp) =>
          s + (sp.billing_period === "weekly" ? sp.rate * 4.33 : sp.rate),
        0
      );
  }, [filteredSponsorships]);

  // Chart data (last 6 months from campaigns + sponsorships)
  const chartData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    return months.map((m) => {
      const monthStart = m + "-01";
      const monthEnd = new Date(
        parseInt(m.slice(0, 4)),
        parseInt(m.slice(5, 7)),
        0
      )
        .toISOString()
        .slice(0, 10);

      const campaignRev = campaigns
        .filter(
          (c) =>
            c.start_date &&
            c.end_date &&
            c.start_date <= monthEnd &&
            c.end_date >= monthStart
        )
        .reduce((s, c) => s + (c.total_value ?? 0), 0);

      const sponsorshipRev = sponsorships
        .filter((sp) => {
          const end = sp.end_date ?? "9999-12-31";
          return sp.start_date <= monthEnd && end >= monthStart;
        })
        .reduce((s, sp) => s + (sp.rate ?? 0), 0);

      const label = new Date(
        parseInt(m.slice(0, 4)),
        parseInt(m.slice(5, 7)) - 1,
        1
      ).toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });

      return {
        month: label,
        campaigns: Math.round(campaignRev),
        sponsorships: Math.round(sponsorshipRev),
        total: Math.round(campaignRev + sponsorshipRev),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, sponsorships]);

  // Handle payment success — update local state
  function handlePaymentSuccess(
    sourceType: "campaign" | "sponsorship",
    sourceId: string,
    newCollected: number,
    paidAmount: number,
    sourceName: string,
    paymentDate: string,
    notes: string | null
  ) {
    if (sourceType === "campaign") {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === sourceId ? { ...c, amount_collected: newCollected } : c
        )
      );
    } else {
      setSponsorships((prev) =>
        prev.map((sp) =>
          sp.id === sourceId
            ? { ...sp, amount_collected: newCollected }
            : sp
        )
      );
    }

    // Update summary
    setSummary((prev) => ({
      ...prev,
      totalCollected: prev.totalCollected + paidAmount,
      outstanding: prev.outstanding - paidAmount,
    }));

    // Prepend to payments list
    setPayments((prev) => [
      {
        id: crypto.randomUUID(),
        source_type: sourceType,
        source_id: sourceId,
        source_name: sourceName,
        amount: paidAmount,
        payment_date: paymentDate,
        notes,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    setModal(null);
  }

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#666",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "13px 16px",
    fontSize: 13,
    color: "#D0D0D0",
    borderTop: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 md:p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h1
          style={{
            fontFamily: "Inter Tight, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.6rem, 5vw, 2.2rem)",
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Ad Revenue
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "#666" }}>
          Billing, collections, and financial overview across campaigns &amp;
          sponsorships
        </p>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={<TrendingUp size={16} color="#D4FF4F" strokeWidth={2} />}
          label="Total Billed"
          value={fmtR(summary.totalBilled)}
          sub="All time"
          highlight
        />
        <KpiCard
          icon={<DollarSign size={16} color="#4ADE80" strokeWidth={2} />}
          label="Total Collected"
          value={fmtR(summary.totalCollected)}
          sub="All time"
          valueColor="#4ADE80"
        />
        <KpiCard
          icon={<AlertCircle size={16} color="#FBBF24" strokeWidth={2} />}
          label="Outstanding"
          value={fmtR(summary.outstanding)}
          sub="Awaiting payment"
          valueColor={summary.outstanding > 0 ? "#FBBF24" : "#4ADE80"}
        />
        <KpiCard
          icon={<Calendar size={16} color="#FB923C" strokeWidth={2} />}
          label="This Month"
          value={fmtR(summary.thisMonthRevenue)}
          sub="Active revenue"
          valueColor="#FB923C"
        />
        <KpiCard
          icon={<Repeat size={16} color="#A78BFA" strokeWidth={2} />}
          label="MRR"
          value={fmtR(summary.mrr)}
          sub="Sponsorships only"
          valueColor="#A78BFA"
        />
      </div>

      {/* ── Monthly Chart ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 md:p-6"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-5"
          style={{ color: "#666" }}
        >
          Monthly Revenue — Last 6 Months
        </h2>
        <RevenueBarChart data={chartData} />
      </div>

      {/* ── Tabs + Filters ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Tab bar + filters */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 pt-5 pb-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Tabs */}
          <div className="flex gap-1">
            {(["campaigns", "sponsorships", "invoices"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setActiveTab(t);
                  setStatusFilter("all");
                  setDateFilter("all");
                }}
                className="px-5 py-2.5 text-sm font-semibold capitalize transition-all rounded-t-xl"
                style={{
                  color: activeTab === t ? "#D4FF4F" : "#666",
                  borderBottom:
                    activeTab === t
                      ? "2px solid #D4FF4F"
                      : "2px solid transparent",
                  background: "transparent",
                }}
              >
                {t === "invoices" ? (
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} />
                    Invoices
                  </span>
                ) : t}
              </button>
            ))}
          </div>

          {/* Filters — hidden on invoices tab */}
          <div className={`flex items-center gap-2 pb-3 sm:pb-4 flex-wrap${activeTab === "invoices" ? " hidden" : ""}`}>
            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="appearance-none text-xs font-medium pl-3 pr-7 py-1.5 rounded-xl cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#C0C0C0",
                  outline: "none",
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                color="#888"
              />
            </div>

            {/* Date range filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value as DateFilter)
                }
                className="appearance-none text-xs font-medium pl-3 pr-7 py-1.5 rounded-xl cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#C0C0C0",
                  outline: "none",
                }}
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                color="#888"
              />
            </div>
          </div>
        </div>

        {/* ── Campaigns Table ── */}
        {activeTab === "campaigns" && (
          <div className="overflow-x-auto">
            {filteredCampaigns.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-sm"
                style={{ color: "#555" }}
              >
                <TrendingUp size={32} strokeWidth={1} color="#333" />
                <p className="mt-3">No campaigns match these filters</p>
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ background: "rgba(255,255,255,0.02)" }}>
                  <tr>
                    {[
                      "Client",
                      "Format",
                      "Venues",
                      "Dates",
                      "Total Value",
                      "Collected",
                      "Outstanding",
                      "Status",
                      "",
                    ].map((h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c) => {
                    const outstanding = (c.total_value ?? 0) - (c.amount_collected ?? 0);
                    const statusColors = getStatusColor(c.status ?? "");
                    const formatColors = getFormatColor(c.format);
                    const venueCount = c.campaign_venues?.length ?? 0;
                    return (
                      <tr
                        key={c.id}
                        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <td style={tdStyle}>
                          <span className="font-medium text-white">
                            {c.client_name ?? "—"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {c.format ? (
                            <Badge
                              label={c.format.replace(/_/g, " ")}
                              bg={formatColors.bg}
                              color={formatColors.color}
                            />
                          ) : (
                            <span style={{ color: "#555" }}>—</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <span
                            className="text-xs font-bold tabular-nums"
                            style={{ color: "#D4FF4F" }}
                          >
                            {venueCount}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span className="text-xs whitespace-nowrap" style={{ color: "#888" }}>
                            {fmtDate(c.start_date)} – {fmtDate(c.end_date)}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: "monospace", color: "#fff" }}>
                          {fmtR(c.total_value ?? 0)}
                        </td>
                        <td style={{ ...tdStyle, minWidth: 140 }}>
                          <div className="text-xs font-medium text-white mb-1.5">
                            {fmtR(c.amount_collected ?? 0)}
                          </div>
                          <ProgressBar
                            value={c.amount_collected ?? 0}
                            max={c.total_value ?? 0}
                          />
                        </td>
                        <td style={tdStyle}>
                          <span
                            className="text-sm font-semibold tabular-nums"
                            style={{
                              color: outstanding > 0 ? "#FBBF24" : "#4ADE80",
                              fontFamily: "monospace",
                            }}
                          >
                            {outstanding > 0 ? fmtR(outstanding) : "Paid"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <Badge
                            label={c.status ?? "—"}
                            bg={statusColors.bg}
                            color={statusColors.color}
                          />
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <button
                            onClick={() =>
                              setModal({
                                sourceType: "campaign",
                                sourceId: c.id,
                                sourceName: c.client_name ?? "Campaign",
                                outstanding,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                            style={{
                              background: "rgba(212,255,79,0.1)",
                              color: "#D4FF4F",
                              border: "1px solid rgba(212,255,79,0.2)",
                            }}
                          >
                            Record Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Sponsorships Table ── */}
        {activeTab === "sponsorships" && (
          <div className="overflow-x-auto">
            {filteredSponsorships.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-sm"
                style={{ color: "#555" }}
              >
                <Repeat size={32} strokeWidth={1} color="#333" />
                <p className="mt-3">No sponsorships match these filters</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead style={{ background: "rgba(255,255,255,0.02)" }}>
                    <tr>
                      {[
                        "Brand",
                        "Widget",
                        "Coverage",
                        "Billing",
                        "Rate",
                        "Collected",
                        "Outstanding",
                        "Status",
                        "",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSponsorships.map((sp) => {
                      const outstanding =
                        (sp.rate ?? 0) - (sp.amount_collected ?? 0);
                      const statusColors = getStatusColor(sp.status ?? "");
                      const widgetColors = getWidgetColor(sp.widget_type ?? "");
                      return (
                        <tr
                          key={sp.id}
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <td style={tdStyle}>
                            <span className="font-medium text-white">
                              {sp.brand_name}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <Badge
                              label={sp.widget_type ?? "—"}
                              bg={widgetColors.bg}
                              color={widgetColors.color}
                            />
                          </td>
                          <td style={tdStyle}>
                            <span className="text-xs capitalize" style={{ color: "#A0A0A0" }}>
                              {sp.coverage === "city" && sp.city
                                ? sp.city
                                : "Network-wide"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span className="text-xs capitalize" style={{ color: "#A0A0A0" }}>
                              {sp.billing_period ?? "—"}
                            </span>
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              fontFamily: "monospace",
                              color: "#fff",
                            }}
                          >
                            {fmtR(sp.rate ?? 0)}
                          </td>
                          <td style={{ ...tdStyle, minWidth: 140 }}>
                            <div className="text-xs font-medium text-white mb-1.5">
                              {fmtR(sp.amount_collected ?? 0)}
                            </div>
                            <ProgressBar
                              value={sp.amount_collected ?? 0}
                              max={sp.rate ?? 0}
                            />
                          </td>
                          <td style={tdStyle}>
                            <span
                              className="text-sm font-semibold tabular-nums"
                              style={{
                                color:
                                  outstanding > 0 ? "#FBBF24" : "#4ADE80",
                                fontFamily: "monospace",
                              }}
                            >
                              {outstanding > 0 ? fmtR(outstanding) : "Paid"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <Badge
                              label={sp.status ?? "—"}
                              bg={statusColors.bg}
                              color={statusColors.color}
                            />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <button
                              onClick={() =>
                                setModal({
                                  sourceType: "sponsorship",
                                  sourceId: sp.id,
                                  sourceName: sp.brand_name,
                                  outstanding,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                              style={{
                                background: "rgba(212,255,79,0.1)",
                                color: "#D4FF4F",
                                border: "1px solid rgba(212,255,79,0.2)",
                              }}
                            >
                              Record Payment
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* MRR sub-total */}
                <div
                  className="flex items-center justify-end gap-4 px-5 py-4"
                  style={{ borderTop: "1px solid rgba(212,255,79,0.15)" }}
                >
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#666" }}>
                    MRR (active sponsorships)
                  </span>
                  <span
                    className="text-base font-extrabold tabular-nums"
                    style={{
                      color: "#A78BFA",
                      fontFamily: "Inter Tight, sans-serif",
                    }}
                  >
                    {fmtR(sponsorshipMrr)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Invoices Tab ── */}
        {activeTab === "invoices" && (
          <InvoicesTab campaigns={campaignOptions} />
        )}
      </div>

      {/* ── Payment History ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#666" }}
          >
            Payment History
          </h2>
        </div>

        {payments.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14 text-sm"
            style={{ color: "#555" }}
          >
            <DollarSign size={32} strokeWidth={1} color="#333" />
            <p className="mt-3">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "rgba(255,255,255,0.02)" }}>
                <tr>
                  {["Date", "Client / Brand", "Amount", "Type", "Notes"].map(
                    (h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {fmtDate(p.payment_date)}
                    </td>
                    <td style={tdStyle}>
                      <span className="font-medium text-white">
                        {p.source_name}
                      </span>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "monospace",
                        color: "#4ADE80",
                        fontWeight: 600,
                      }}
                    >
                      {fmtR(p.amount)}
                    </td>
                    <td style={tdStyle}>
                      <Badge
                        label={
                          p.source_type === "campaign"
                            ? "Campaign"
                            : "Sponsorship"
                        }
                        bg={
                          p.source_type === "campaign"
                            ? "rgba(96,165,250,0.12)"
                            : "rgba(212,255,79,0.12)"
                        }
                        color={
                          p.source_type === "campaign" ? "#60A5FA" : "#D4FF4F"
                        }
                      />
                    </td>
                    <td style={{ ...tdStyle, color: "#777", fontSize: 12 }}>
                      {p.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      {modal && (
        <RecordPaymentModal
          sourceType={modal.sourceType}
          sourceId={modal.sourceId}
          sourceName={modal.sourceName}
          maxAmount={modal.outstanding}
          onClose={() => setModal(null)}
          onSuccess={(newCollected: number) => {
            // We need the paid amount — find it from summary delta
            const paidAmount = newCollected -
              (modal.sourceType === "campaign"
                ? (campaigns.find((c) => c.id === modal.sourceId)?.amount_collected ?? 0)
                : (sponsorships.find((sp) => sp.id === modal.sourceId)?.amount_collected ?? 0));

            handlePaymentSuccess(
              modal.sourceType,
              modal.sourceId,
              newCollected,
              paidAmount,
              modal.sourceName,
              new Date().toISOString().slice(0, 10),
              null
            );
          }}
        />
      )}
    </div>
  );
}
