"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Monitor,
  Edit2,
  X,
  Wifi,
  WifiOff,
  Radio,
  Eye,
  EyeOff,
  Upload,
  Trash2,
} from "lucide-react";
import { timeAgo } from "@/lib/time";

interface VenueRow {
  id: string;
  name: string;
  city: string | null;
}

interface ScreenDetail {
  id: string;
  label: string;
  location_in_venue: string | null;
  size_inches: number | null;
  orientation: string | null;
  resolution: string | null;
  is_active: boolean | null;
  cuecast_status: string | null;
  cuecast_last_seen: string | null;
  cuecast_player_token: string | null;
  notes: string | null;
  created_at: string;
  venue_id: string | null;
  photo_url: string | null;
  venues: { id: string; name: string; city: string | null; province: string | null } | null;
}

interface Props {
  screen: ScreenDetail;
  venues: VenueRow[];
  defaultEdit?: boolean;
}

const LOCATION_LABELS: Record<string, string> = {
  lobby: "Lobby",
  gym_floor: "Gym Floor",
  cardio_area: "Cardio Area",
  change_rooms: "Change Rooms",
  reception: "Reception",
  other: "Other",
};

const LOCATION_OPTIONS = Object.entries(LOCATION_LABELS);

function maskToken(token: string) {
  if (token.length <= 8) return "••••••••";
  return token.slice(0, 4) + "•".repeat(token.length - 8) + token.slice(-4);
}

function CuecastStatusCard({
  status,
  lastSeen,
  token,
}: {
  status: string | null;
  lastSeen: string | null;
  token: string | null;
}) {
  const [showToken, setShowToken] = useState(false);
  const s = status ?? "unpaired";

  const statusConfig = {
    online: {
      icon: Wifi,
      label: "Online",
      color: "#4ADE80",
      bg: "rgba(74,222,128,0.10)",
      border: "rgba(74,222,128,0.20)",
    },
    offline: {
      icon: WifiOff,
      label: "Offline",
      color: "#F87171",
      bg: "rgba(248,113,113,0.10)",
      border: "rgba(248,113,113,0.20)",
    },
    unpaired: {
      icon: Radio,
      label: "Unpaired",
      color: "#A1A1AA",
      bg: "rgba(63,63,70,0.50)",
      border: "rgba(113,113,122,0.20)",
    },
  };

  const cfg = statusConfig[s as keyof typeof statusConfig] ?? statusConfig.unpaired;
  const StatusIcon = cfg.icon;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: "#888" }}
      >
        Cuecast Status
      </p>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <StatusIcon size={24} color={cfg.color} strokeWidth={1.8} />
        </div>
        <div>
          <p
            className="text-xl font-bold"
            style={{
              color: cfg.color,
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            {cfg.label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#888" }}>
            Last seen: {timeAgo(lastSeen)}
          </p>
        </div>
      </div>

      {/* Player token */}
      {token && (
        <div>
          <p
            className="text-xs font-medium mb-1.5"
            style={{ color: "#A1A1AA" }}
          >
            Player Token
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-xs rounded-xl px-3 py-2 font-mono overflow-x-auto"
              style={{
                background: "rgba(0,0,0,0.30)",
                color: showToken ? "#D4FF4F" : "#888",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {showToken ? token : maskToken(token)}
            </code>
            <button
              onClick={() => setShowToken((v) => !v)}
              className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
              title={showToken ? "Hide token" : "Show token"}
            >
              {showToken ? (
                <EyeOff size={14} color="#888" strokeWidth={2} />
              ) : (
                <Eye size={14} color="#888" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span className="text-sm" style={{ color: "#888" }}>
        {label}
      </span>
      <span className="text-sm text-white text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function ScreenDetailClient({
  screen: initialScreen,
  venues,
  defaultEdit = false,
}: Props) {
  const [screen, setScreen] = useState<ScreenDetail>(initialScreen);
  const [editOpen, setEditOpen] = useState(defaultEdit);
  const [editForm, setEditForm] = useState({
    label: screen.label,
    venue_id: screen.venue_id ?? "",
    location_in_venue: screen.location_in_venue ?? "",
    size_inches: screen.size_inches?.toString() ?? "",
    orientation: screen.orientation ?? "landscape",
    resolution: screen.resolution ?? "",
    notes: screen.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(screen.photo_url ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);

  function setField(key: string, value: string) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/screens/${screen.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editForm.label,
          venue_id: editForm.venue_id || null,
          location_in_venue: editForm.location_in_venue || null,
          size_inches: editForm.size_inches
            ? parseFloat(editForm.size_inches)
            : null,
          orientation: editForm.orientation,
          resolution: editForm.resolution || null,
          notes: editForm.notes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save");
      }
      const updated = await res.json() as ScreenDetail;
      // Upload new photo if selected
      if (editPhoto) {
        setPhotoUploading(true);
        const fd = new FormData();
        fd.append("file", editPhoto);
        const photoRes = await fetch(`/api/screens/${screen.id}/photo`, { method: "POST", body: fd });
        if (photoRes.ok) {
          const pd = await photoRes.json();
          updated.photo_url = pd.photo_url;
          setEditPhotoPreview(pd.photo_url);
        }
        setPhotoUploading(false);
      }
      setScreen((prev) => ({ ...prev, ...updated }));
      setEditOpen(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

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
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/screens"
          className="p-2 rounded-xl flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#C8C8C8",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs mb-1" style={{ color: "#888" }}>
            <Link
              href="/admin/screens"
              style={{ color: "#D4FF4F", textDecoration: "none" }}
            >
              Screen Inventory
            </Link>{" "}
            /
          </p>
          <h1
            className="text-2xl font-bold text-white truncate"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {screen.label}
          </h1>
          {screen.venues && (
            <p className="text-sm mt-0.5" style={{ color: "#888" }}>
              {screen.venues.name}
              {screen.venues.city ? ` · ${screen.venues.city}` : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
        >
          <Edit2 size={14} strokeWidth={2.5} />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Screen specs card */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center gap-2.5 mb-4">
              <Monitor size={18} color="#D4FF4F" strokeWidth={2} />
              <h2
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                Screen Specifications
              </h2>
            </div>
            <div>
              <SpecRow
                label="Venue"
                value={
                  screen.venues
                    ? `${screen.venues.name}${screen.venues.city ? ` · ${screen.venues.city}` : ""}`
                    : "—"
                }
              />
              <SpecRow
                label="Location in Venue"
                value={
                  screen.location_in_venue ? (
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(212,255,79,0.10)",
                        color: "#D4FF4F",
                        border: "1px solid rgba(212,255,79,0.15)",
                      }}
                    >
                      {LOCATION_LABELS[screen.location_in_venue] ??
                        screen.location_in_venue}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <SpecRow
                label="Size"
                value={
                  screen.size_inches ? `${screen.size_inches}"` : "—"
                }
              />
              <SpecRow
                label="Orientation"
                value={
                  screen.orientation
                    ? screen.orientation.charAt(0).toUpperCase() +
                      screen.orientation.slice(1)
                    : "—"
                }
              />
              <SpecRow
                label="Resolution"
                value={
                  screen.resolution ? (
                    <code className="font-mono text-xs">{screen.resolution}</code>
                  ) : (
                    "—"
                  )
                }
              />
              <SpecRow
                label="Status"
                value={
                  <span
                    className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: screen.is_active
                        ? "rgba(212,255,79,0.10)"
                        : "rgba(102,102,102,0.15)",
                      color: screen.is_active ? "#D4FF4F" : "#909090",
                    }}
                  >
                    {screen.is_active ? "Active" : "Inactive"}
                  </span>
                }
              />
              <SpecRow
                label="Added"
                value={new Date(screen.created_at).toLocaleDateString("en-ZA", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
            </div>
          </div>

          {/* Placement Photo */}
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Placement Photo</h2>
              <label
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: "rgba(212,255,79,0.10)", color: "#D4FF4F", border: "1px solid rgba(212,255,79,0.2)" }}
              >
                <Upload size={12} strokeWidth={2} />
                {editPhotoPreview ? "Change" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (!f) return;
                  setEditPhoto(f);
                  const preview = URL.createObjectURL(f);
                  setEditPhotoPreview(preview);
                  // Upload immediately
                  const fd = new FormData();
                  fd.append("file", f);
                  const res = await fetch(`/api/screens/${screen.id}/photo`, { method: "POST", body: fd });
                  if (res.ok) {
                    const pd = await res.json();
                    setEditPhotoPreview(pd.photo_url);
                    setScreen((prev) => ({ ...prev, photo_url: pd.photo_url }));
                  }
                }} />
              </label>
            </div>
            {editPhotoPreview ? (
              <div className="relative">
                <img src={editPhotoPreview} alt="Screen placement" className="w-full object-cover" style={{ maxHeight: 320 }} />
                <button
                  onClick={async () => {
                    await fetch(`/api/screens/${screen.id}/photo`, { method: "DELETE" });
                    setEditPhotoPreview(null);
                    setScreen((prev) => ({ ...prev, photo_url: null }));
                  }}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#F87171", backdropFilter: "blur(4px)" }}
                >
                  <Trash2 size={12} strokeWidth={2} /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-6">
                <Monitor size={28} color="#333" strokeWidth={1.5} className="mb-2" />
                <p className="text-sm" style={{ color: "#555" }}>No placement photo yet</p>
                <p className="text-xs mt-1" style={{ color: "#444" }}>Upload a photo to show where this screen is positioned in the venue</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2
              className="text-sm font-semibold text-white mb-3"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Notes
            </h2>
            {screen.notes ? (
              <p className="text-sm" style={{ color: "#C8C8C8", lineHeight: 1.6 }}>
                {screen.notes}
              </p>
            ) : (
              <p className="text-sm" style={{ color: "#666" }}>
                No notes added for this screen.
              </p>
            )}
          </div>
        </div>

        {/* Right: Cuecast status */}
        <div>
          <CuecastStatusCard
            status={screen.cuecast_status}
            lastSeen={screen.cuecast_last_seen}
            token={screen.cuecast_player_token}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.80)" }}
          onClick={() => setEditOpen(false)}
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
            <div className="flex items-center justify-between mb-5">
              <h3
                className="text-base font-bold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                Edit Screen
              </h3>
              <button
                onClick={() => setEditOpen(false)}
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

            {saveError && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm"
                style={{
                  backgroundColor: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.20)",
                  color: "#EF4444",
                }}
              >
                {saveError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Venue */}
              <div>
                <label style={labelStyle}>Venue *</label>
                <select
                  value={editForm.venue_id}
                  onChange={(e) => setField("venue_id", e.target.value)}
                  required
                  style={inputStyle}
                >
                  <option value="">Select a venue…</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.city ? ` · ${v.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Screen Label */}
              <div>
                <label style={labelStyle}>Screen Name *</label>
                <input
                  value={editForm.label}
                  onChange={(e) => setField("label", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              {/* Location */}
              <div>
                <label style={labelStyle}>Location in Venue</label>
                <select
                  value={editForm.location_in_venue}
                  onChange={(e) => setField("location_in_venue", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select location…</option>
                  {LOCATION_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size + Orientation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Size (inches)</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.size_inches}
                    onChange={(e) => setField("size_inches", e.target.value)}
                    placeholder="e.g. 55"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Orientation</label>
                  <div className="flex gap-2 mt-0.5">
                    {(["landscape", "portrait"] as const).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setField("orientation", o)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize"
                        style={{
                          background:
                            editForm.orientation === o
                              ? "rgba(212,255,79,0.15)"
                              : "rgba(255,255,255,0.05)",
                          border:
                            editForm.orientation === o
                              ? "1px solid rgba(212,255,79,0.35)"
                              : "1px solid rgba(255,255,255,0.10)",
                          color:
                            editForm.orientation === o ? "#D4FF4F" : "#909090",
                        }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label style={labelStyle}>Resolution</label>
                <input
                  value={editForm.resolution}
                  onChange={(e) => setField("resolution", e.target.value)}
                  placeholder="1920x1080"
                  style={inputStyle}
                />
              </div>

              {/* Screen Photo */}
              <div>
                <label style={labelStyle}>Screen Photo</label>
                {editPhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img src={editPhotoPreview} alt="screen" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <label className="p-1.5 rounded-lg cursor-pointer" style={{ background: "rgba(0,0,0,0.6)", color: "#D4FF4F" }} title="Change photo">
                        <Upload size={13} strokeWidth={2} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setEditPhoto(f);
                          if (f) setEditPhotoPreview(URL.createObjectURL(f));
                        }} />
                      </label>
                      <button type="button" onClick={async () => {
                        await fetch(`/api/screens/${screen.id}/photo`, { method: "DELETE" });
                        setEditPhoto(null); setEditPhotoPreview(null);
                      }} className="p-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.6)", color: "#F87171" }} title="Remove photo">
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", padding: "20px" }}>
                    <Upload size={18} color="#555" strokeWidth={2} />
                    <span className="text-xs" style={{ color: "#666" }}>Upload a photo showing where the screen is placed</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setEditPhoto(f);
                      if (f) setEditPhotoPreview(URL.createObjectURL(f));
                    }} />
                  </label>
                )}
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "80px",
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
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
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
