"use client";

import { useState } from "react";
import { Printer, ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle, Send } from "lucide-react";
import Link from "next/link";
import type { InvoiceDetail } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtR(n: number) {
  return (
    "R " +
    Math.round(n).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return <CheckCircle size={16} color="#4ADE80" />;
    case "sent":
      return <Send size={16} color="#60A5FA" />;
    case "overdue":
      return <AlertCircle size={16} color="#EF4444" />;
    case "cancelled":
      return <XCircle size={16} color="#6B7280" />;
    default:
      return <Clock size={16} color="#9CA3AF" />;
  }
}

function getStatusStyle(status: string): { bg: string; color: string } {
  switch (status) {
    case "draft":
      return { bg: "rgba(156,163,175,0.15)", color: "#9CA3AF" };
    case "sent":
      return { bg: "rgba(96,165,250,0.15)", color: "#60A5FA" };
    case "paid":
      return { bg: "rgba(74,222,128,0.15)", color: "#4ADE80" };
    case "overdue":
      return { bg: "rgba(239,68,68,0.15)", color: "#EF4444" };
    case "cancelled":
      return { bg: "rgba(107,114,128,0.12)", color: "#6B7280" };
    default:
      return { bg: "rgba(255,255,255,0.08)", color: "#A3A3A3" };
  }
}

// ─── Invoice Print View ───────────────────────────────────────────────────────

export default function InvoicePrintView({ invoice }: { invoice: InvoiceDetail }) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(invoice.status);
  const statusStyle = getStatusStyle(currentStatus);

  async function updateStatus(status: InvoiceDetail["status"]) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) setCurrentStatus(status);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      {/* ── Screen-only toolbar ─────────────────────────────────────────── */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: "#0A0A0A", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link
          href="/admin/revenue"
          className="flex items-center gap-2 text-sm font-medium transition-all hover:text-white"
          style={{ color: "#888" }}
        >
          <ArrowLeft size={16} />
          Back to Finance
        </Link>

        <div className="flex items-center gap-2">
          {/* Status actions */}
          {currentStatus === "draft" && (
            <button
              onClick={() => updateStatus("sent")}
              disabled={updating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50"
              style={{ background: "rgba(96,165,250,0.12)", color: "#60A5FA" }}
            >
              <Send size={12} /> Mark Sent
            </button>
          )}
          {(currentStatus === "sent" || currentStatus === "overdue") && (
            <button
              onClick={() => updateStatus("paid")}
              disabled={updating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}
            >
              <CheckCircle size={12} /> Mark Paid
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(212,255,79,0.12)",
              color: "#D4FF4F",
              border: "1px solid rgba(212,255,79,0.2)",
            }}
          >
            <Printer size={15} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Invoice Document ─────────────────────────────────────────────── */}
      {/* Screen: dark card. Print: white A4 */}
      <div className="min-h-screen print:min-h-0 py-8 print:py-0 px-4 print:px-0" style={{ background: "#0A0A0A" }}>
        <div
          className="mx-auto max-w-3xl rounded-2xl print:rounded-none print:shadow-none"
          style={{
            background: "#fff",
            color: "#111",
            padding: "48px 56px",
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              {/* Logo / Brand */}
              <div className="text-3xl font-black tracking-tight" style={{ color: "#111", letterSpacing: "-0.03em" }}>
                GymGaze
              </div>
              <div className="mt-1 text-sm" style={{ color: "#666" }}>
                hello@gymgaze.co.za
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#999" }}>
                GymGaze (Pty) Ltd
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#999" }}>
                Invoice
              </div>
              <div className="text-2xl font-black font-mono" style={{ color: "#111", letterSpacing: "-0.02em" }}>
                {invoice.invoice_number}
              </div>
              <div
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize"
                style={{ background: statusStyle.bg, color: statusStyle.color }}
              >
                <StatusIcon status={currentStatus} />
                {currentStatus}
              </div>
            </div>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-3 gap-6 mb-10 pb-8" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9CA3AF" }}>Issued</div>
              <div className="text-sm font-medium" style={{ color: "#111" }}>{fmtDate(invoice.issued_date)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9CA3AF" }}>Due</div>
              <div className="text-sm font-medium" style={{ color: currentStatus === "overdue" ? "#EF4444" : "#111" }}>
                {fmtDate(invoice.due_date)}
              </div>
            </div>
            {invoice.paid_date && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9CA3AF" }}>Paid</div>
                <div className="text-sm font-medium" style={{ color: "#4ADE80" }}>{fmtDate(invoice.paid_date)}</div>
              </div>
            )}
          </div>

          {/* Bill To */}
          <div className="mb-10">
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Bill To</div>
            <div className="text-base font-semibold" style={{ color: "#111" }}>{invoice.advertiser}</div>
            {invoice.advertiser_email && (
              <div className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{invoice.advertiser_email}</div>
            )}
            {invoice.campaigns?.client_name && (
              <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                Campaign: {invoice.campaigns.client_name}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #111" }}>
                  <th className="text-left pb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF", width: "50%" }}>Description</th>
                  <th className="text-center pb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF", width: "10%" }}>Qty</th>
                  <th className="text-right pb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF", width: "20%" }}>Unit Price</th>
                  <th className="text-right pb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF", width: "20%" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm" style={{ color: "#9CA3AF" }}>No line items</td>
                  </tr>
                ) : (
                  invoice.line_items.map((li, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td className="py-3 text-sm" style={{ color: "#111" }}>{li.description}</td>
                      <td className="py-3 text-sm text-center" style={{ color: "#6B7280" }}>{li.qty}</td>
                      <td className="py-3 text-sm text-right font-mono" style={{ color: "#6B7280" }}>{fmtR(li.unit_price)}</td>
                      <td className="py-3 text-sm text-right font-mono font-medium" style={{ color: "#111" }}>{fmtR(li.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm" style={{ color: "#6B7280" }}>
                <span>Subtotal</span>
                <span className="font-mono">{fmtR(invoice.subtotal_zar)}</span>
              </div>
              {invoice.tax_zar > 0 && (
                <div className="flex justify-between text-sm" style={{ color: "#6B7280" }}>
                  <span>VAT (15%)</span>
                  <span className="font-mono">{fmtR(invoice.tax_zar)}</span>
                </div>
              )}
              <div
                className="flex justify-between text-base font-bold pt-2 mt-2"
                style={{ color: "#111", borderTop: "2px solid #111" }}
              >
                <span>Total Due</span>
                <span className="font-mono">{fmtR(invoice.total_zar)}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div
            className="rounded-xl p-5 mb-8"
            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
          >
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Payment Instructions</div>
            <p className="text-sm" style={{ color: "#374151" }}>
              EFT to <strong>GymGaze (Pty) Ltd</strong> — include{" "}
              <strong>{invoice.invoice_number}</strong> as your payment reference.
            </p>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              For payment queries, contact{" "}
              <a href="mailto:hello@gymgaze.co.za" style={{ color: "#111" }}>
                hello@gymgaze.co.za
              </a>
            </p>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>Notes</div>
              <p className="text-sm" style={{ color: "#6B7280" }}>{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div
            className="text-center text-xs pt-6"
            style={{ color: "#D1D5DB", borderTop: "1px solid #F3F4F6" }}
          >
            GymGaze (Pty) Ltd · hello@gymgaze.co.za · gymgaze.co.za
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
