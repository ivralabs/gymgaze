"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

interface Venue {
  id: string;
  name: string;
  city: string | null;
}

interface RevenuePageClientProps {
  venues: Venue[];
}

export default function RevenuePageClient({ venues }: RevenuePageClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    venue_id: "",
    month: "",
    rental_zar: "",
    revenue_share_zar: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save entry");
      }

      setShowForm(false);
      setFormData({
        venue_id: "",
        month: "",
        rental_zar: "",
        revenue_share_zar: "",
        notes: "",
      });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  } as React.CSSProperties;

  const labelStyle = {
    display: "block",
    fontSize: 12,
    color: "#B0B0B0",
    marginBottom: 6,
    fontWeight: 500,
  } as React.CSSProperties;

  return (
    <div>
      {/* Add Entry Button */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
        style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
      >
        {showForm ? (
          <>
            <X size={14} strokeWidth={2.5} />
            Cancel
          </>
        ) : (
          <>
            <Plus size={14} strokeWidth={2.5} />
            Add Entry
          </>
        )}
      </button>

      {/* Inline Form Panel */}
      {showForm && (
        <div
          className="mt-4 rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <h3
            className="text-sm font-semibold text-white mb-5"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Add Revenue Entry
          </h3>

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

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Venue */}
              <div className="lg:col-span-2">
                <label style={labelStyle}>Venue</label>
                <select
                  required
                  value={formData.venue_id}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, venue_id: e.target.value }))
                  }
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    WebkitAppearance: "none",
                  }}
                >
                  <option value="" style={{ background: "#1a1a1a" }}>
                    Select a venue…
                  </option>
                  {venues.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                      style={{ background: "#1a1a1a" }}
                    >
                      {v.name}{v.city ? ` — ${v.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label style={labelStyle}>Month</label>
                <input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, month: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>

              {/* Rental ZAR */}
              <div>
                <label style={labelStyle}>Rental (ZAR)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.rental_zar}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, rental_zar: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>

              {/* Revenue Share ZAR */}
              <div>
                <label style={labelStyle}>Revenue Share (ZAR)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.revenue_share_zar}
                  onChange={(e) =>
                    setFormData((d) => ({
                      ...d,
                      revenue_share_zar: e.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              {/* Notes */}
              <div className="lg:col-span-3">
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any notes about this entry…"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, notes: e.target.value }))
                  }
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: submitting ? "rgba(212,255,79,0.5)" : "#D4FF4F",
                  color: "#0A0A0A",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Saving…" : "Save Entry"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
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
      )}
    </div>
  );
}
