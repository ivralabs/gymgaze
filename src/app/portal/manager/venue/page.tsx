"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdateVenuePage() {
  const [venueId, setVenueId] = useState<string | null>(null);
  const [venueName, setVenueName] = useState("Your Venue");
  const [form, setForm] = useState({
    activeMembers: "",
    dailyEntries: "",
    weeklyEntries: "",
    monthlyEntries: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadVenue() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/login";
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("venue_id")
        .eq("id", user.id)
        .single();

      if (!profile?.venue_id) {
        setLoading(false);
        return;
      }

      setVenueId(profile.venue_id);

      const { data: venue } = await supabase
        .from("venues")
        .select("name, active_members, daily_entries, weekly_entries, monthly_entries")
        .eq("id", profile.venue_id)
        .single();

      if (venue) {
        setVenueName(venue.name ?? "Your Venue");
        setForm({
          activeMembers: String(venue.active_members ?? ""),
          dailyEntries: String(venue.daily_entries ?? ""),
          weeklyEntries: String(venue.weekly_entries ?? ""),
          monthlyEntries: String(venue.monthly_entries ?? ""),
        });
      }
      setLoading(false);
    }
    loadVenue();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active_members: form.activeMembers ? parseInt(form.activeMembers) : null,
          daily_entries: form.dailyEntries ? parseInt(form.dailyEntries) : null,
          weekly_entries: form.weeklyEntries ? parseInt(form.weeklyEntries) : null,
          monthly_entries: form.monthlyEntries ? parseInt(form.monthlyEntries) : null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save stats");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

  const inputStyle = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #D1D5DB",
    color: "#111827",
    outline: "none",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: "#9CA3AF" }}>Loading...</p>
      </div>
    );
  }

  if (!venueId) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          No venue assigned to your account. Please contact your administrator.
        </p>
      </div>
    );
  }

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
            {venueName} &middot; {monthLabel}
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

      {error && (
        <div
          className="px-4 py-3 rounded-lg mb-5 text-sm"
          style={{
            backgroundColor: "rgba(220,38,38,0.05)",
            border: "1px solid rgba(220,38,38,0.2)",
            color: "#DC2626",
          }}
        >
          {error}
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
            Membership &amp; Footfall
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
