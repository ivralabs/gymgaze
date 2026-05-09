"use client";

import { useState } from "react";
import { X, DollarSign } from "lucide-react";

interface RecordPaymentModalProps {
  sourceType: "campaign" | "sponsorship";
  sourceId: string;
  sourceName: string;
  maxAmount?: number; // outstanding amount
  onSuccess: (newCollected: number) => void;
  onClose: () => void;
}

export default function RecordPaymentModal({
  sourceType,
  sourceId,
  sourceName,
  maxAmount,
  onSuccess,
  onClose,
}: RecordPaymentModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(today);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/revenue/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: sourceType,
          source_id: sourceId,
          amount: parsedAmount,
          payment_date: paymentDate,
          notes: notes.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { error?: string; newCollected?: number };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to record payment");
      }

      onSuccess(data.newCollected ?? parsedAmount);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    color: "#B0B0B0",
    marginBottom: 6,
    fontWeight: 500,
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(212,255,79,0.12)" }}
            >
              <DollarSign size={18} color="#D4FF4F" strokeWidth={2} />
            </div>
            <div>
              <h3
                className="text-base font-bold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif", lineHeight: 1.2 }}
              >
                Record Payment
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#666" }}>
                {sourceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {maxAmount !== undefined && maxAmount > 0 && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.2)",
              color: "#FBBF24",
            }}
          >
            Outstanding: R {maxAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(255,107,107,0.1)",
              border: "1px solid rgba(255,107,107,0.2)",
              color: "#FF6B6B",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label style={labelStyle}>Amount (ZAR) *</label>
            <div className="relative">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: "#888" }}
              >
                R
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "2rem" }}
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label style={labelStyle}>Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Reference number, bank transfer, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
              style={{
                backgroundColor: submitting ? "rgba(212,255,79,0.5)" : "#D4FF4F",
                color: "#0A0A0A",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Recording…" : "Record Payment"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#C8C8C8",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
