"use client";

import { useState } from "react";
import { X, Layers, Upload } from "lucide-react";

interface VenueRow {
  id: string;
  name: string;
  city: string | null;
}

export interface StaticSiteRow {
  id: string;
  venue_id: string;
  label: string;
  site_type: string | null;
  location_in_venue: string | null;
  width_cm: number | null;
  height_cm: number | null;
  is_active: boolean | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  venues: { id: string; name: string; city: string | null } | null;
}

interface Props {
  venues: VenueRow[];
  preselectedVenueId?: string;
  onClose: () => void;
  onAdded: (site: StaticSiteRow) => void;
}

export const SITE_TYPE_OPTIONS = [
  { value: "poster_frame", label: "Poster Frame" },
  { value: "banner", label: "Banner" },
  { value: "a_frame", label: "A-Frame" },
  { value: "standee", label: "Standee" },
  { value: "wall_mount", label: "Wall Mount" },
  { value: "window_vinyl", label: "Window Vinyl" },
  { value: "other", label: "Other" },
];

export const LOCATION_OPTIONS = [
  { value: "entrance", label: "Entrance" },
  { value: "gym_floor", label: "Gym Floor" },
  { value: "reception", label: "Reception" },
  { value: "changerooms", label: "Changerooms" },
  { value: "car_park", label: "Car Park" },
  { value: "corridor", label: "Corridor" },
  { value: "other", label: "Other" },
];

export const SITE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SITE_TYPE_OPTIONS.map(({ value, label }) => [value, label])
);

export const LOCATION_LABELS: Record<string, string> = Object.fromEntries(
  LOCATION_OPTIONS.map(({ value, label }) => [value, label])
);

export default function AddStaticSiteModal({
  venues,
  preselectedVenueId,
  onClose,
  onAdded,
}: Props) {
  const [form, setForm] = useState({
    venue_id: preselectedVenueId ?? "",
    label: "",
    site_type: "poster_frame",
    location_in_venue: "",
    width_cm: "",
    height_cm: "",
    notes: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.venue_id) { setError("Please select a venue."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/static-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: form.venue_id,
          label: form.label,
          site_type: form.site_type || "poster_frame",
          location_in_venue: form.location_in_venue || null,
          width_cm: form.width_cm ? parseInt(form.width_cm) : null,
          height_cm: form.height_cm ? parseInt(form.height_cm) : null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to add site");
      }
      const newSite = await res.json() as StaticSiteRow;
      if (photo) {
        const fd = new FormData();
        fd.append("file", photo);
        await fetch(`/api/static-sites/${newSite.id}/photo`, { method: "POST", body: fd });
      }
      onAdded(newSite);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error adding site");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#fff",
    outline: "none",
    borderRadius: "0.75rem",
    padding: "0.625rem 1rem",
    width: "100%",
    fontSize: "0.875rem",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#C8C8C8",
    marginBottom: "0.375rem",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.80)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
        style={{
          background: "rgba(18,18,18,0.99)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(212,255,79,0.12)" }}
            >
              <Layers size={16} color="#D4FF4F" strokeWidth={2} />
            </div>
            <h3
              className="text-base font-bold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Add Static Site
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 8,
              padding: "6px",
              cursor: "pointer",
            }}
          >
            <X size={14} color="#909090" strokeWidth={2} />
          </button>
        </div>

        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              backgroundColor: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.20)",
              color: "#EF4444",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Venue */}
          {!preselectedVenueId && (
            <div>
              <label style={labelStyle}>Venue *</label>
              <select
                value={form.venue_id}
                onChange={(e) => set("venue_id", e.target.value)}
                required
                style={inputStyle}
              >
                <option value="">Select a venue…</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}{v.city ? ` · ${v.city}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Label */}
          <div>
            <label style={labelStyle}>Label / Name *</label>
            <input
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="e.g. Entrance A-Frame Left"
              required
              style={inputStyle}
            />
          </div>

          {/* Site Type */}
          <div>
            <label style={labelStyle}>Site Type</label>
            <select
              value={form.site_type}
              onChange={(e) => set("site_type", e.target.value)}
              style={inputStyle}
            >
              {SITE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Location in venue */}
          <div>
            <label style={labelStyle}>Location in Venue</label>
            <select
              value={form.location_in_venue}
              onChange={(e) => set("location_in_venue", e.target.value)}
              style={inputStyle}
            >
              <option value="">Select location…</option>
              {LOCATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Width + Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Width (cm)</label>
              <input
                type="number"
                min={1}
                value={form.width_cm}
                onChange={(e) => set("width_cm", e.target.value)}
                placeholder="e.g. 60"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Height (cm)</label>
              <input
                type="number"
                min={1}
                value={form.height_cm}
                onChange={(e) => set("height_cm", e.target.value)}
                placeholder="e.g. 90"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label style={labelStyle}>Photo (optional)</label>
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center gap-2 w-full rounded-xl cursor-pointer"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", padding: "20px" }}
              >
                <Upload size={18} color="#555" strokeWidth={2} />
                <span className="text-xs" style={{ color: "#666" }}>Upload a photo of the placement</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setPhoto(f);
                    if (f) setPhotoPreview(URL.createObjectURL(f));
                  }}
                />
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional notes…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm"
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#C8C8C8",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: saving ? "#3a3a3a" : "#D4FF4F",
                color: saving ? "#888" : "#0A0A0A",
                border: "none",
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Add Site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
