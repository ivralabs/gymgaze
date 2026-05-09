"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, X } from "lucide-react";

// ─── Record Payment Button + Modal ───────────────────────────────────────────

interface Props {
  sponsorshipId: string;
  currentCollected: number;
}

export default function SponsorshipDetailClient({ sponsorshipId, currentCollected }: Props) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setShowPaymentModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(212,255,79,0.1)", color: "#D4FF4F", border: "1px solid rgba(212,255,79,0.2)" }}
      >
        <DollarSign size={13} strokeWidth={2} />
        Record Payment
      </button>

      {showPaymentModal && (
        <RecordPaymentModal
          sponsorshipId={sponsorshipId}
          currentCollected={currentCollected}
          onClose={() => setShowPaymentModal(false)}
          onRecorded={() => {
            setShowPaymentModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function RecordPaymentModal({
  sponsorshipId,
  currentCollected,
  onClose,
  onRecorded,
}: {
  sponsorshipId: string;
  currentCollected: number;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0) { setError("Enter a valid payment amount"); return; }

    setSaving(true);
    setError(null);

    try {
      const newTotal = currentCollected + amount;
      const res = await fetch(`/api/sponsorships/${sponsorshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_collected: newTotal }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Failed to record payment");
      }
      onRecorded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error recording payment");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            Record Payment
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <X size={14} strokeWidth={2} color="#A3A3A3" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div
              className="text-sm px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
            >
              {error}
            </div>
          )}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "#C8C8C8" }}
            >
              Payment Amount
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: "#D4FF4F" }}
              >
                R
              </span>
              <input
                type="number"
                min={1}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#FFFFFF",
                  outline: "none",
                  borderRadius: "10px",
                  padding: "10px 14px 10px 28px",
                  fontSize: "14px",
                }}
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: "#888" }}>
              Previously collected: R{currentCollected.toLocaleString("en-ZA")}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", fontFamily: "Inter Tight, sans-serif" }}
            >
              {saving ? "Saving…" : "Record →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
