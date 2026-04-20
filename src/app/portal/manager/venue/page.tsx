"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";

export default function UpdateVenuePage() {
  const [form, setForm] = useState({
    activeMembers: "3420",
    dailyEntries: "285",
    weeklyEntries: "1890",
    monthlyEntries: "7340",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // TODO: PATCH /api/venues/[id]
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputStyle = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #D1D5DB",
    color: "#111827",
    outline: "none",
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/portal/manager"
          className="p-2 rounded-lg"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", color: "#6B7280" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
          >
            Update Venue Stats
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            FitZone Sandton &middot; April 2026
          </p>
        </div>
      </div>

      {saved && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg mb-5 text-sm font-medium"
          style={{
            backgroundColor: "rgba(5,150,105,0.1)",
            border: "1px solid rgba(5,150,105,0.2)",
            color: "#059669",
          }}
        >
          <CheckCircle2 size={16} strokeWidth={2} />
          Stats updated successfully
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl p-6 space-y-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#9CA3AF", fontFamily: "Inter Tight, sans-serif" }}
          >
            Membership & Footfall
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
              Active Members
            </label>
            <input
              name="activeMembers"
              type="number"
              value={form.activeMembers}
              onChange={handleChange}
              min={0}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
              Current total active membership count
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
              Daily Entries (avg)
            </label>
            <input
              name="dailyEntries"
              type="number"
              value={form.dailyEntries}
              onChange={handleChange}
              min={0}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
              Weekly Entries
            </label>
            <input
              name="weeklyEntries"
              type="number"
              value={form.weeklyEntries}
              onChange={handleChange}
              min={0}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
              Monthly Entries
            </label>
            <input
              name="monthlyEntries"
              type="number"
              value={form.monthlyEntries}
              onChange={handleChange}
              min={0}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-5">
          <Link
            href="/portal/manager"
            className="px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ border: "1px solid #E5E7EB", color: "#6B7280" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: saving ? "#9CA3AF" : "#FF6B35" }}
          >
            <Save size={16} strokeWidth={2} />
            {saving ? "Saving..." : "Save Stats"}
          </button>
        </div>
      </form>
    </div>
  );
}
