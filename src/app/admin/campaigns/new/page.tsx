"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type Venue = { id: string; name: string; city: string };

export default function NewCampaignPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    advertiser: "",
    start_date: "",
    end_date: "",
    amount_charged_zar: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((data) => setVenues(Array.isArray(data) ? data : []));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleVenue(id: string) {
    setSelectedVenues((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          advertiser: form.advertiser || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          amount_charged_zar: form.amount_charged_zar ? Number(form.amount_charged_zar) : null,
          notes: form.notes || null,
          venue_ids: selectedVenues,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create campaign");
      }
      router.push("/admin/campaigns");
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

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px",
    color: "#A3A3A3",
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/campaigns"
          className="p-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.10)", color: "#A3A3A3" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            New Campaign
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#909090" }}>
            Set up a new advertising campaign
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
          style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h2
            className="text-sm font-semibold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Campaign Details
          </h2>

          <div>
            <label style={labelStyle}>Campaign Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Summer Protein Campaign"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Advertiser</label>
            <input
              name="advertiser"
              value={form.advertiser}
              onChange={handleChange}
              placeholder="e.g. Evox Nutrition"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Amount Charged (ZAR)</label>
            <input
              name="amount_charged_zar"
              type="number"
              min="0"
              step="0.01"
              value={form.amount_charged_zar}
              onChange={handleChange}
              placeholder="e.g. 25000"
              style={inputStyle}
              className="tabular-nums"
            />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes..."
              style={{
                ...inputStyle,
                resize: "none",
              }}
            />
          </div>
        </div>

        {/* Venue selection */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h2
            className="text-sm font-semibold text-white mb-4"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Select Venues ({selectedVenues.length} selected)
          </h2>

          {venues.length === 0 ? (
            <p className="text-sm" style={{ color: "#909090" }}>Loading venues...</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto dark-scroll">
              {venues.map((venue) => {
                const checked = selectedVenues.includes(venue.id);
                return (
                  <label
                    key={venue.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors"
                    style={{
                      background: checked ? "rgba(212,255,79,0.06)" : "rgba(255,255,255,0.03)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: `1px solid ${checked ? "rgba(212,255,79,0.2)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: checked ? "#D4FF4F" : "transparent",
                        border: `1.5px solid ${checked ? "#D4FF4F" : "rgba(255,255,255,0.15)"}`,
                      }}
                    >
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() => toggleVenue(venue.id)}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{venue.name}</p>
                      <p className="text-xs" style={{ color: "#909090" }}>{venue.city}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            href="/admin/campaigns"
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
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
            <Plus size={16} strokeWidth={2.5} />
            {saving ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}
