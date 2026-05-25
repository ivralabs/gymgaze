"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FileText, ExternalLink, ChevronDown } from "lucide-react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LineItem = {
  description: string;
  qty: number;
  unit_price: number;
  total: number;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  campaign_id: string | null;
  advertiser: string;
  advertiser_email: string | null;
  line_items: LineItem[];
  subtotal_zar: number;
  tax_zar: number;
  total_zar: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  campaigns?: { id: string; client_name: string | null } | null;
};

export type CampaignOption = {
  id: string;
  client_name: string | null;
};

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

function getInvoiceStatusStyle(status: string): { bg: string; color: string } {
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { bg, color } = getInvoiceStatusStyle(status);
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: bg, color }}
    >
      {status}
    </span>
  );
}

// ─── New Invoice Modal ─────────────────────────────────────────────────────────

interface NewInvoiceModalProps {
  campaigns: CampaignOption[];
  onClose: () => void;
  onCreated: (invoice: Invoice) => void;
}

function NewInvoiceModal({ campaigns, onClose, onCreated }: NewInvoiceModalProps) {
  const [advertiser, setAdvertiser] = useState("");
  const [advertiserEmail, setAdvertiserEmail] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [includeVat, setIncludeVat] = useState(true);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", qty: 1, unit_price: 0, total: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute totals
  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const tax = includeVat ? Math.round(subtotal * 0.15) : 0;
  const total = subtotal + tax;

  function updateLineItem(idx: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[idx] };
      if (field === "description") {
        item.description = value as string;
      } else {
        const num = Number(value) || 0;
        if (field === "qty") item.qty = num;
        if (field === "unit_price") item.unit_price = num;
        item.total = Math.round(item.qty * item.unit_price);
      }
      updated[idx] = item;
      return updated;
    });
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", qty: 1, unit_price: 0, total: 0 }]);
  }

  function removeLineItem(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(markSent: boolean) {
    if (!advertiser.trim()) { setError("Advertiser is required"); return; }
    if (!dueDate) { setError("Due date is required"); return; }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiser: advertiser.trim(),
          advertiser_email: advertiserEmail.trim() || null,
          campaign_id: campaignId || null,
          line_items: lineItems.filter((li) => li.description.trim()),
          subtotal_zar: subtotal,
          tax_zar: tax,
          total_zar: total,
          status: markSent ? "sent" : "draft",
          due_date: dueDate,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create invoice");
        return;
      }

      const invoice: Invoice = await res.json();
      onCreated(invoice);
      onClose();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#E0E0E0",
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#666",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">New Invoice</h2>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Advertiser */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Advertiser *</label>
              <input
                style={inputStyle}
                value={advertiser}
                onChange={(e) => setAdvertiser(e.target.value)}
                placeholder="e.g. Nike SA"
              />
            </div>
            <div>
              <label style={labelStyle}>Advertiser Email</label>
              <input
                style={inputStyle}
                type="email"
                value={advertiserEmail}
                onChange={(e) => setAdvertiserEmail(e.target.value)}
                placeholder="billing@example.com"
              />
            </div>
          </div>

          {/* Campaign + Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Link to Campaign (optional)</label>
              <div className="relative">
                <select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 28, cursor: "pointer" }}
                  className="appearance-none"
                >
                  <option value="">— No campaign —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.client_name ?? c.id}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  color="#666"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Due Date *</label>
              <input
                style={inputStyle}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <label style={labelStyle}>Line Items</label>
            <div className="space-y-2">
              {lineItems.map((li, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      style={inputStyle}
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      style={{ ...inputStyle, textAlign: "center" }}
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={li.qty || ""}
                      onChange={(e) => updateLineItem(idx, "qty", e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      style={inputStyle}
                      type="number"
                      min="0"
                      placeholder="Unit Price"
                      value={li.unit_price || ""}
                      onChange={(e) => updateLineItem(idx, "unit_price", e.target.value)}
                    />
                  </div>
                  <div
                    className="col-span-1 text-xs font-mono text-right"
                    style={{ color: "#D4FF4F" }}
                  >
                    {fmtR(li.total)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {lineItems.length > 1 && (
                      <button
                        onClick={() => removeLineItem(idx)}
                        className="text-xs w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addLineItem}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}
            >
              <Plus size={12} /> Add line item
            </button>
          </div>

          {/* VAT + Totals */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-400">Include 15% VAT</span>
              </label>
            </div>
            <div className="flex justify-between text-sm" style={{ color: "#888" }}>
              <span>Subtotal</span>
              <span className="font-mono">{fmtR(subtotal)}</span>
            </div>
            {includeVat && (
              <div className="flex justify-between text-sm" style={{ color: "#888" }}>
                <span>VAT (15%)</span>
                <span className="font-mono">{fmtR(tax)}</span>
              </div>
            )}
            <div
              className="flex justify-between text-base font-bold pt-2"
              style={{ color: "#D4FF4F", borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span>Total</span>
              <span className="font-mono">{fmtR(total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 64 }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, references, etc."
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => submit(false)}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.08)", color: "#E0E0E0" }}
            >
              {saving ? "Saving…" : "Create Invoice"}
            </button>
            <button
              onClick={() => submit(true)}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: "rgba(212,255,79,0.15)", color: "#D4FF4F", border: "1px solid rgba(212,255,79,0.25)" }}
            >
              {saving ? "Saving…" : "Create & Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invoices Tab ─────────────────────────────────────────────────────────────

interface InvoicesTabProps {
  campaigns: CampaignOption[];
}

export default function InvoicesTab({ campaigns }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  function handleCreated(invoice: Invoice) {
    setInvoices((prev) => [invoice, ...prev]);
  }

  async function updateStatus(id: string, status: Invoice["status"]) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated: Invoice = await res.json();
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
      }
    } finally {
      setUpdatingId(null);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm" style={{ color: "#555" }}>
        Loading invoices…
      </div>
    );
  }

  return (
    <>
      {/* Header row */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#666" }}>
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "rgba(212,255,79,0.12)",
            color: "#D4FF4F",
            border: "1px solid rgba(212,255,79,0.2)",
          }}
        >
          <Plus size={14} />
          New Invoice
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-sm" style={{ color: "#555" }}>
          <FileText size={36} strokeWidth={1} color="#333" />
          <p className="mt-3">No invoices yet — create your first one</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "rgba(255,255,255,0.02)" }}>
              <tr>
                {["Invoice #", "Advertiser", "Campaign", "Amount", "Status", "Due Date", "Actions"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isUpdating = updatingId === inv.id;
                return (
                  <tr key={inv.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={tdStyle}>
                      <Link
                        href={`/admin/revenue/invoices/${inv.id}`}
                        className="font-mono text-xs font-bold hover:underline"
                        style={{ color: "#D4FF4F" }}
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td style={tdStyle}>
                      <div className="font-medium text-white">{inv.advertiser}</div>
                      {inv.advertiser_email && (
                        <div className="text-xs mt-0.5" style={{ color: "#666" }}>{inv.advertiser_email}</div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span className="text-xs" style={{ color: "#888" }}>
                        {inv.campaigns?.client_name ?? "—"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", color: "#fff", fontWeight: 600 }}>
                      {fmtR(inv.total_zar)}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <span
                        className="text-xs"
                        style={{
                          color: inv.status === "overdue" ? "#EF4444" : "#888",
                          fontWeight: inv.status === "overdue" ? 600 : 400,
                        }}
                      >
                        {fmtDate(inv.due_date)}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/revenue/invoices/${inv.id}`}
                          className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                          title="View invoice"
                        >
                          <ExternalLink size={13} color="#888" />
                        </Link>

                        {inv.status === "draft" && (
                          <button
                            onClick={() => updateStatus(inv.id, "sent")}
                            disabled={isUpdating}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
                            style={{ background: "rgba(96,165,250,0.12)", color: "#60A5FA" }}
                          >
                            Mark Sent
                          </button>
                        )}
                        {inv.status === "sent" && (
                          <button
                            onClick={() => updateStatus(inv.id, "paid")}
                            disabled={isUpdating}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
                            style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}
                          >
                            Mark Paid
                          </button>
                        )}
                        {inv.status === "overdue" && (
                          <button
                            onClick={() => updateStatus(inv.id, "paid")}
                            disabled={isUpdating}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
                            style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}
                          >
                            Mark Paid
                          </button>
                        )}
                        {(inv.status === "draft" || inv.status === "sent") && (
                          <button
                            onClick={() => updateStatus(inv.id, "cancelled")}
                            disabled={isUpdating}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
                            style={{ background: "rgba(107,114,128,0.12)", color: "#6B7280" }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NewInvoiceModal
          campaigns={campaigns}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
