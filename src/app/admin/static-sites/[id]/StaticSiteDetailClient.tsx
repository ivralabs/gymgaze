"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Edit2, X, Upload, Trash2, MapPin } from "lucide-react";
import { useRole } from "@/lib/useRole";

const SITE_TYPE_LABELS: Record<string, string> = {
  poster_frame: "Poster Frame", banner: "Banner", a_frame: "A-Frame",
  standee: "Standee", wall_mount: "Wall Mount", window_vinyl: "Window Vinyl", other: "Other",
};
const LOCATION_LABELS: Record<string, string> = {
  entrance: "Entrance", gym_floor: "Gym Floor", reception: "Reception",
  changerooms: "Changerooms", car_park: "Car Park", corridor: "Corridor", other: "Other",
};
const SITE_TYPES = Object.entries(SITE_TYPE_LABELS);
const LOCATIONS = Object.entries(LOCATION_LABELS);

interface Venue { id: string; name: string; city: string | null; }
interface Site {
  id: string; venue_id: string; label: string; site_type: string | null;
  location_in_venue: string | null; width_cm: number | null; height_cm: number | null;
  is_active: boolean | null; photo_url: string | null; notes: string | null;
  created_at: string; venues: { id: string; name: string; city: string | null; province: string | null } | null;
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
};
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff", outline: "none", borderRadius: "0.75rem", padding: "0.625rem 1rem",
  width: "100%", fontSize: "0.875rem",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.75rem", fontWeight: 500, color: "#C8C8C8", marginBottom: "0.375rem" };

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span className="text-xs" style={{ color: "#888", minWidth: 120 }}>{label}</span>
      <span className="text-sm text-right" style={{ color: "#D0D0D0" }}>{value ?? "—"}</span>
    </div>
  );
}

export default function StaticSiteDetailClient({ site: initialSite, venues }: { site: Site; venues: Venue[] }) {
  const { canEdit } = useRole();
  const [site, setSite] = useState(initialSite);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    label: site.label, venue_id: site.venue_id, site_type: site.site_type ?? "poster_frame",
    location_in_venue: site.location_in_venue ?? "", width_cm: site.width_cm?.toString() ?? "",
    height_cm: site.height_cm?.toString() ?? "", notes: site.notes ?? "", is_active: site.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(site.photo_url ?? null);

  function setField(key: string, value: string | boolean) { setEditForm((p) => ({ ...p, [key]: value })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/static-sites/${site.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, width_cm: editForm.width_cm ? parseInt(editForm.width_cm) : null, height_cm: editForm.height_cm ? parseInt(editForm.height_cm) : null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const updated = await res.json();
      if (editPhoto) {
        const fd = new FormData(); fd.append("file", editPhoto);
        const pr = await fetch(`/api/static-sites/${site.id}/photo`, { method: "POST", body: fd });
        if (pr.ok) { const pd = await pr.json(); updated.photo_url = pd.photo_url; setEditPhotoPreview(pd.photo_url); }
      }
      setSite((p) => ({ ...p, ...updated })); setEditOpen(false);
    } catch (err) { setSaveError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/static-sites" className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#C8C8C8" }}>
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs mb-1" style={{ color: "#888" }}>
            <Link href="/admin/static-sites" style={{ color: "#D4FF4F", textDecoration: "none" }}>Static Sites</Link> /
          </p>
          <h1 className="text-2xl font-bold text-white truncate" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}>{site.label}</h1>
          {site.venues && <p className="text-sm mt-0.5" style={{ color: "#888" }}>{site.venues.name}{site.venues.city ? ` · ${site.venues.city}` : ""}</p>}
        </div>
        {canEdit && (
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}>
            <Edit2 size={14} strokeWidth={2.5} /> Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Specs */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center gap-2.5 mb-4">
              <Layers size={18} color="#D4FF4F" strokeWidth={2} />
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Site Specifications</h2>
            </div>
            <SpecRow label="Venue" value={site.venues ? `${site.venues.name}${site.venues.city ? ` · ${site.venues.city}` : ""}` : "—"} />
            <SpecRow label="Type" value={<span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,255,79,0.10)", color: "#D4FF4F" }}>{SITE_TYPE_LABELS[site.site_type ?? ""] ?? site.site_type ?? "—"}</span>} />
            <SpecRow label="Location" value={site.location_in_venue ? <span className="flex items-center gap-1"><MapPin size={11} strokeWidth={2} />{LOCATION_LABELS[site.location_in_venue] ?? site.location_in_venue}</span> : "—"} />
            <SpecRow label="Dimensions" value={site.width_cm && site.height_cm ? `${site.width_cm}cm × ${site.height_cm}cm` : site.width_cm ? `${site.width_cm}cm wide` : site.height_cm ? `${site.height_cm}cm tall` : "—"} />
            <SpecRow label="Status" value={<span className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase" style={{ background: site.is_active ? "rgba(212,255,79,0.10)" : "rgba(102,102,102,0.15)", color: site.is_active ? "#D4FF4F" : "#909090" }}>{site.is_active ? "Active" : "Inactive"}</span>} />
            <SpecRow label="Added" value={new Date(site.created_at).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })} />
          </div>

          {/* Placement Photo */}
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Placement Photo</h2>
              {canEdit && (
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer" style={{ background: "rgba(212,255,79,0.10)", color: "#D4FF4F", border: "1px solid rgba(212,255,79,0.2)" }}>
                  <Upload size={12} strokeWidth={2} />{editPhotoPreview ? "Change" : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    setEditPhotoPreview(URL.createObjectURL(f));
                    const fd = new FormData(); fd.append("file", f);
                    const res = await fetch(`/api/static-sites/${site.id}/photo`, { method: "POST", body: fd });
                    if (res.ok) { const pd = await res.json(); setEditPhotoPreview(pd.photo_url); setSite((p) => ({ ...p, photo_url: pd.photo_url })); }
                  }} />
                </label>
              )}
            </div>
            {editPhotoPreview ? (
              <div className="relative">
                <img src={editPhotoPreview} alt="Placement" className="w-full object-cover" style={{ maxHeight: 320 }} />
                {canEdit && (
                  <button onClick={async () => { await fetch(`/api/static-sites/${site.id}/photo`, { method: "DELETE" }); setEditPhotoPreview(null); setSite((p) => ({ ...p, photo_url: null })); }}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(0,0,0,0.6)", color: "#F87171", backdropFilter: "blur(4px)" }}>
                    <Trash2 size={12} strokeWidth={2} /> Remove
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-6">
                <Layers size={28} color="#333" strokeWidth={1.5} className="mb-2" />
                <p className="text-sm" style={{ color: "#555" }}>No placement photo yet</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "Inter Tight, sans-serif" }}>Notes</h2>
            {site.notes ? <p className="text-sm" style={{ color: "#C8C8C8", lineHeight: 1.6 }}>{site.notes}</p>
              : <p className="text-sm" style={{ color: "#666" }}>No notes added.</p>}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.80)" }} onClick={() => setEditOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "rgba(18,18,18,0.99)", border: "1px solid rgba(255,255,255,0.10)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Edit Static Site</h3>
              <button onClick={() => setEditOpen(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, padding: "6px", cursor: "pointer" }}>
                <X size={14} color="#909090" strokeWidth={2} />
              </button>
            </div>
            {saveError && <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#EF4444" }}>{saveError}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div><label style={labelStyle}>Name *</label><input value={editForm.label} onChange={(e) => setField("label", e.target.value)} required style={inputStyle} /></div>
              <div><label style={labelStyle}>Site Type</label>
                <select value={editForm.site_type} onChange={(e) => setField("site_type", e.target.value)} style={inputStyle}>
                  {SITE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Location</label>
                <select value={editForm.location_in_venue} onChange={(e) => setField("location_in_venue", e.target.value)} style={inputStyle}>
                  <option value="">Select…</option>
                  {LOCATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={labelStyle}>Width (cm)</label><input type="number" min={1} value={editForm.width_cm} onChange={(e) => setField("width_cm", e.target.value)} placeholder="e.g. 60" style={inputStyle} /></div>
                <div><label style={labelStyle}>Height (cm)</label><input type="number" min={1} value={editForm.height_cm} onChange={(e) => setField("height_cm", e.target.value)} placeholder="e.g. 90" style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Photo</label>
                {editPhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img src={editPhotoPreview} alt="preview" className="w-full h-full object-cover" />
                    <label className="absolute top-2 right-2 p-1.5 rounded-lg cursor-pointer" style={{ background: "rgba(0,0,0,0.6)", color: "#D4FF4F" }}>
                      <Upload size={13} strokeWidth={2} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditPhoto(f); setEditPhotoPreview(URL.createObjectURL(f)); } }} />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", padding: "20px" }}>
                    <Upload size={18} color="#555" strokeWidth={2} />
                    <span className="text-xs" style={{ color: "#666" }}>Upload placement photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditPhoto(f); setEditPhotoPreview(URL.createObjectURL(f)); } }} />
                  </label>
                )}
              </div>
              <div><label style={labelStyle}>Notes</label><textarea value={editForm.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.is_active} onChange={(e) => setField("is_active", e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm" style={{ color: "#C8C8C8" }}>Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid rgba(255,255,255,0.10)", color: "#C8C8C8", background: "transparent", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: saving ? "#3a3a3a" : "#D4FF4F", color: saving ? "#888" : "#0A0A0A", border: "none", cursor: saving ? "wait" : "pointer" }}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
