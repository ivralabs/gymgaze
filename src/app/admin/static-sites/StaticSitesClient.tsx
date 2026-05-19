"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Plus, X, Filter, Upload, ExternalLink } from "lucide-react";
import AddStaticSiteModal, {
  type StaticSiteRow,
  SITE_TYPE_LABELS,
  LOCATION_LABELS,
} from "./AddStaticSiteModal";
import { useRole } from "@/lib/useRole";

interface VenueRow {
  id: string;
  name: string;
  city: string | null;
}

interface Props {
  sites: StaticSiteRow[];
  venues: VenueRow[];
}

function SiteTypeBadge({ type }: { type: string | null }) {
  if (!type) return <span style={{ color: "#666" }}>—</span>;
  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: "rgba(212,255,79,0.10)",
        color: "#D4FF4F",
        border: "1px solid rgba(212,255,79,0.15)",
      }}
    >
      {SITE_TYPE_LABELS[type] ?? type}
    </span>
  );
}

function SiteCard({
  site,
  canEdit,
  onPhotoUpdate,
}: {
  site: StaticSiteRow;
  canEdit: boolean;
  onPhotoUpdate: (url: string | null) => void;
}) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(site.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/static-sites/${site.id}/photo`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
      setPhotoUrl(data.photo_url);
      onPhotoUpdate(data.photo_url);
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const cardBg = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={cardBg}>
      {/* Photo area */}
      <div
        className="relative aspect-video flex items-center justify-center overflow-hidden group"
        style={{ background: "rgba(0,0,0,0.3)", minHeight: 140 }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={site.label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Layers size={28} color="#333" strokeWidth={1.5} />
            <p className="text-xs" style={{ color: "#555" }}>No photo</p>
          </div>
        )}

        {canEdit && !uploading && (
          <label
            className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <Upload size={20} color="#D4FF4F" strokeWidth={2} />
              <span className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>
                {photoUrl ? "Change Photo" : "Add Photo"}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        {uploading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(0,0,0,0.7)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>Uploading…</p>
          </div>
        )}

        {uploadError && (
          <button
            onClick={() => setUploadError(null)}
            className="absolute inset-x-0 bottom-0 px-3 py-2 text-xs text-center cursor-pointer flex items-center justify-center gap-2"
            style={{ background: "rgba(239,68,68,0.85)", color: "#fff", border: 0, width: "100%" }}
            title="Click to dismiss"
          >
            {uploadError}
            <X size={11} strokeWidth={2.5} />
          </button>
        )}

        <span
          className="absolute top-2 right-2 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: site.is_active ? "rgba(212,255,79,0.15)" : "rgba(102,102,102,0.25)",
            color: site.is_active ? "#D4FF4F" : "#909090",
            backdropFilter: "blur(4px)",
          }}
        >
          {site.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "Inter Tight, sans-serif" }}>
              {site.label}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "#888" }}>
              {site.venues?.name ?? "—"}
            </p>
          </div>
          <SiteTypeBadge type={site.site_type} />
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-2">
          {site.location_in_venue && (
            <span
              className="text-xs px-2 py-0.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}
            >
              {LOCATION_LABELS[site.location_in_venue] ?? site.location_in_venue}
            </span>
          )}
          {(site.width_cm || site.height_cm) && (
            <span
              className="text-xs px-2 py-0.5 rounded-lg font-mono"
              style={{ background: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}
            >
              {site.width_cm ?? "?"}×{site.height_cm ?? "?"} cm
            </span>
          )}
        </div>

        <div className="mt-3">
          <Link
            href={`/admin/static-sites/${site.id}`}
            className="flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-xl w-full justify-center"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#C8C8C8",
            }}
          >
            <ExternalLink size={12} strokeWidth={2} />
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StaticSitesClient({ sites, venues }: Props) {
  const { canCreate } = useRole();
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [localSites, setLocalSites] = useState<StaticSiteRow[]>(sites);

  const filtered = localSites.filter((s) => {
    if (venueFilter !== "all" && s.venue_id !== venueFilter) return false;
    if (typeFilter !== "all" && s.site_type !== typeFilter) return false;
    if (statusFilter === "active" && s.is_active === false) return false;
    if (statusFilter === "inactive" && s.is_active !== false) return false;
    return true;
  });

  function handleSiteAdded(site: StaticSiteRow) {
    setLocalSites((prev) => [site, ...prev]);
    setShowAddModal(false);
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#C8C8C8",
    outline: "none",
  } as React.CSSProperties;

  const siteTypeOptions = [
    { value: "poster_frame", label: "Poster Frame" },
    { value: "banner", label: "Banner" },
    { value: "a_frame", label: "A-Frame" },
    { value: "standee", label: "Standee" },
    { value: "wall_mount", label: "Wall Mount" },
    { value: "window_vinyl", label: "Window Vinyl" },
    { value: "other", label: "Other" },
  ];

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} color="#666" strokeWidth={2} />
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs"
            style={inputStyle}
          >
            <option value="all">All venues</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}{v.city ? ` · ${v.city}` : ""}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs"
            style={inputStyle}
          >
            <option value="all">All types</option>
            {siteTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs"
            style={inputStyle}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(venueFilter !== "all" || typeFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => { setVenueFilter("all"); setTypeFilter("all"); setStatusFilter("all"); }}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs"
              style={{ background: "rgba(255,255,255,0.05)", color: "#A1A1AA" }}
            >
              <X size={12} strokeWidth={2} />
              Clear
            </button>
          )}
        </div>

        {canCreate && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", height: "44px" }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Static Site
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#B0B0B0" }}
        >
          <Layers size={40} strokeWidth={1.2} color="#333" className="mb-4" />
          <p className="text-base font-medium text-white mb-1">No static sites yet.</p>
          <p className="text-sm mb-5" style={{ color: "#888" }}>
            Add your first physical installation to get started.
          </p>
          {canCreate && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Static Site
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              canEdit={canCreate}
              onPhotoUpdate={(url) => {
                setLocalSites((prev) =>
                  prev.map((s) => s.id === site.id ? { ...s, photo_url: url } : s)
                );
              }}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddStaticSiteModal
          venues={venues}
          onClose={() => setShowAddModal(false)}
          onAdded={handleSiteAdded}
        />
      )}
    </>
  );
}
