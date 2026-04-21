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
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    outline: "none",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: "#909090" }}>Loading...</p>
      </div>
    );
  }

  if (!venueId) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm" style={{ color: "#909090" }}>
          No venue assigned to your account. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      {/* Hero Panel */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-6"
        style={{ borderRadius: 16 }}
      >

        <div className="relative z-10 p-6 flex items-center gap-4">
          <Link
            href="/portal/manager"
            className="p-2 rounded-xl flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#A3A3A3" }}
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div>
            <h1
              style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#fff", letterSpacing: "-0.02em" }}
            >
              Update Venue Stats
            </h1>
            <p style={{ color: "#666", marginTop: "0.25rem", fontSize: "0.875rem" }}>
              {venueName} &middot; {monthLabel}
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium"
          style={{
            backgroundColor: "rgba(212,255,79,0.08)",
            border: "1px solid rgba(212,255,79,0.2)",
            color: "#D4FF4F",
          }}
        >
          <CheckCircle2 size={16} strokeWidth={2} />
          Stats updated successfully
        </div>
      )}

      {error && (
        <div
          className="px-4 py-3 rounded-xl mb-5 text-sm"
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
          className="glass-card rounded-2xl p-6 space-y-5"
          style={{ borderRadius: 16 }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#909090", fontFamily: "Inter Tight, sans-serif" }}
          >
            Membership &amp; Footfall
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              Active Members
            </label>
            <input
              name="activeMembers"
              type="number"
              value={form.activeMembers}
              onChange={handleChange}
              min={0}
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: "#909090" }}>
              Current total active membership count
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              Daily Entries (avg)
            </label>
            <input
              name="dailyEntries"
              type="number"
              value={form.dailyEntries}
              onChange={handleChange}
              min={0}
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              Weekly Entries
            </label>
            <input
              name="weeklyEntries"
              type="number"
              value={form.weeklyEntries}
              onChange={handleChange}
              min={0}
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              Monthly Entries
            </label>
            <input
              name="monthlyEntries"
              type="number"
              value={form.monthlyEntries}
              onChange={handleChange}
              min={0}
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-5">
          <Link
            href="/portal/manager"
            className="px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: "1px solid #3A3A3A", color: "#A3A3A3" }}
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
            <Save size={16} strokeWidth={2} />
            {saving ? "Saving..." : "Save Stats"}
          </button>
        </div>
      </form>
    </div>
  );
}
