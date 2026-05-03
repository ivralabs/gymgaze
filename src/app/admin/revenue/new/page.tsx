"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

type Venue = { id: string; name: string; city: string };

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const label = d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

export default function NewRevenuePage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const monthOptions = getMonthOptions();

  const [form, setForm] = useState({
    venue_id: "",
    month: monthOptions[0].value,
    rental_zar: "",
    revenue_share_zar: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((data) => setVenues(Array.isArray(data) ? data : []));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: form.venue_id,
          month: form.month,
          rental_zar: form.rental_zar ? Number(form.rental_zar) : 0,
          revenue_share_zar: form.revenue_share_zar ? Number(form.revenue_share_zar) : 0,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to log revenue");
      }
      router.push("/admin/revenue");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    outline: "none",
    width: "100%",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px",
    color: "#C8C8C8",
  };

  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/revenue"
          className="p-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.10)", color: "#C8C8C8" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            Log Revenue
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#B0B0B0" }}>
            Record rental and revenue share for a venue
          </p>
        </div>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-xl mb-6 text-sm"
          style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#EF4444",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-2xl p-6 mb-5 space-y-5"
          style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            <label style={labelStyle}>Venue *</label>
            <select
              name="venue_id"
              value={form.venue_id}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">Select venue...</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Month *</label>
            <select
              name="month"
              value={form.month}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Rental (ZAR)</label>
              <input
                name="rental_zar"
                type="number"
                min="0"
                step="0.01"
                value={form.rental_zar}
                onChange={handleChange}
                placeholder="0.00"
                style={inputStyle}
                className="tabular-nums"
              />
            </div>
            <div>
              <label style={labelStyle}>Revenue Share (ZAR)</label>
              <input
                name="revenue_share_zar"
                type="number"
                min="0"
                step="0.01"
                value={form.revenue_share_zar}
                onChange={handleChange}
                placeholder="0.00"
                style={inputStyle}
                className="tabular-nums"
              />
            </div>
          </div>

          {(form.rental_zar || form.revenue_share_zar) && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ backgroundColor: "rgba(212,255,79,0.06)", border: "1px solid rgba(212,255,79,0.15)" }}
            >
              <span className="text-sm" style={{ color: "#C8C8C8" }}>Total</span>
              <span className="text-sm font-semibold tabular-nums font-mono" style={{ color: "#D4FF4F" }}>
                R {((Number(form.rental_zar) || 0) + (Number(form.revenue_share_zar) || 0)).toLocaleString("en-ZA")}
              </span>
            </div>
          )}

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any notes about this entry..."
              style={{ ...inputStyle, resize: "none" as const }}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            href="/admin/revenue"
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: "1px solid #3A3A3A", color: "#C8C8C8" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              backgroundColor: saving ? "#555" : "#D4FF4F",
              color: "#0A0A0A",
              height: "44px",
            }}
          >
            <TrendingUp size={16} strokeWidth={2} />
            {saving ? "Saving..." : "Log Revenue"}
          </button>
        </div>
      </form>
    </div>
  );
}
