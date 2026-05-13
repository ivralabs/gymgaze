"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Monitor,
  FileText,
  Image,
  DollarSign,
  BarChart2,
  Plus,
  MapPin,
  Building2,
  Clock,
  Download,
  Archive,
  Filter,
  X,
  GalleryHorizontal,
  Trash2,
  Upload,
  Layers,
} from "lucide-react";
import EditVenueButton from "./EditVenueButton";
import { useRole } from "@/lib/useRole";

type Tab = "overview" | "screens" | "contract" | "photos" | "gallery" | "static" | "revenue";

interface GymBrand {
  name: string;
  logo_url: string | null;
}

interface Venue {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  province: string | null;
  status: string | null;
  active_members: number | null;
  daily_entries: number | null;
  weekly_entries: number | null;
  monthly_entries: number | null;
  capacity: number | null;
  manager_name: string | null;
  manager_phone: string | null;
  operating_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  gym_brands: GymBrand | null;
  cover_image_url: string | null;
  cover_position: number | null;
}

interface Screen {
  id: string;
  label: string;
  location_in_venue: string | null;
  size_inches: number | null;
  resolution: string | null;
  orientation: string | null;
  is_active: boolean | null;
  photo_url: string | null;
  created_at: string;
}

interface Contract {
  id: string;
  start_date: string | null;
  end_date: string | null;
  monthly_rental_zar: number | null;
  revenue_share_percent: number | null;
  notes: string | null;
}

interface RevenueEntry {
  id: string;
  month: string;
  rental_zar: number | null;
  revenue_share_zar: number | null;
  notes: string | null;
}

type AreaTag = "gym_floor" | "reception" | "changerooms" | "equipment" | "outdoor" | "other";

const AREA_LABELS: Record<string, string> = {
  gym_floor: "Gym Floor",
  reception: "Reception",
  changerooms: "Changerooms",
  equipment: "Equipment Area",
  outdoor: "Outdoor",
  other: "Other",
};

interface Photo {
  id: string;
  month: string | null;
  status: string | null;
  rejection_reason: string | null;
  created_at: string;
  storage_path: string;
  file_name: string | null;
  file_size_bytes: number | null;
  area_tag: AreaTag | null;
  signedUrl: string | null;
}

interface Props {
  venue: Venue;
  screens: Screen[];
  contract: Contract | null;
  revenue: RevenueEntry[];
  photos: Photo[];
  venueId: string;
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "screens", label: "Screens", icon: Monitor },
  { id: "contract", label: "Contract", icon: FileText },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontal },
  { id: "static", label: "Static Sites", icon: Layers },
  { id: "photos", label: "Proof Of Flight", icon: Image },
  { id: "revenue", label: "Revenue", icon: DollarSign },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonth(monthStr: string) {
  // monthStr is "YYYY-MM-DD" or "YYYY-MM"
  const d = new Date(monthStr.slice(0, 7) + "-01");
  return d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

function formatZAR(val: number | null) {
  if (val == null) return "—";
  return "R " + val.toLocaleString("en-ZA");
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Screen Card ───────────────────────────────────────────────────────────────
function ScreenCard({
  screen,
  canEdit,
  onPhotoUpdate,
}: {
  screen: Screen;
  canEdit: boolean;
  onPhotoUpdate: (url: string | null) => void;
}) {
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(screen.photo_url ?? null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/screens/${screen.id}/photo`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        setPhotoUrl(data.photo_url);
        onPhotoUpdate(data.photo_url);
      }
    };
    xhr.onerror = () => setUploading(false);
    xhr.send(fd);
  }

  async function handleRemove() {
    setUploading(true);
    await fetch(`/api/screens/${screen.id}/photo`, { method: "DELETE" });
    setPhotoUrl(null);
    onPhotoUpdate(null);
    setUploading(false);
  }

  const cardBg = { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)" };

  return (
    <div className="rounded-2xl overflow-hidden" style={cardBg}>
      {/* Photo area */}
      <div
        className="relative aspect-video flex items-center justify-center overflow-hidden group"
        style={{ background: "rgba(0,0,0,0.3)", minHeight: 160 }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={screen.label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Monitor size={28} color="#333" strokeWidth={1.5} />
            <p className="text-xs" style={{ color: "#555" }}>No photo</p>
          </div>
        )}

        {/* Upload overlay on hover */}
        {canEdit && !uploading && (
          <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="flex flex-col items-center gap-1.5">
              <Upload size={20} color="#D4FF4F" strokeWidth={2} />
              <span className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>{photoUrl ? "Change Photo" : "Add Photo"}</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0] ?? null)} />
          </label>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
            <p className="text-xs mb-2 font-semibold" style={{ color: "#D4FF4F" }}>{progress}%</p>
            <div className="w-24 rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.15)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "#D4FF4F" }} />
            </div>
          </div>
        )}

        {/* Status badge */}
        <span
          className="absolute top-2 right-2 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: screen.is_active ? "rgba(212,255,79,0.15)" : "rgba(102,102,102,0.25)",
            color: screen.is_active ? "#D4FF4F" : "#909090",
            backdropFilter: "blur(4px)",
          }}
        >
          {screen.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "Inter Tight, sans-serif" }}>{screen.label}</p>
            {screen.location_in_venue && (
              <p className="text-xs mt-0.5 truncate" style={{ color: "#888" }}>{screen.location_in_venue}</p>
            )}
          </div>
          {canEdit && photoUrl && (
            <button onClick={handleRemove} disabled={uploading} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: "#555" }} title="Remove photo">
              <Trash2 size={13} strokeWidth={2} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          {screen.size_inches && (
            <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}>{screen.size_inches}"</span>
          )}
          {screen.resolution && (
            <span className="text-xs px-2 py-0.5 rounded-lg font-mono" style={{ background: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}>{screen.resolution}</span>
          )}
          {screen.orientation && (
            <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}>{screen.orientation}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VenueDetailTabs({
  venue,
  screens,
  contract,
  revenue,
  photos,
  venueId,
}: Props) {
  const { canEdit, canCreate } = useRole();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [coverUrl, setCoverUrl] = useState<string | null>(venue.cover_image_url ?? null);
  const [coverPosition, setCoverPosition] = useState<number>(venue.cover_position ?? 50);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function handlePositionChange(val: number) {
    setCoverPosition(val);
    // Debounce save — persist 600ms after user stops dragging
    if (coverSaveTimer.current) clearTimeout(coverSaveTimer.current);
    coverSaveTimer.current = setTimeout(async () => {
      await fetch(`/api/venues/${venueId}/cover-position`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_position: val }),
      });
    }, 600);
  }

  async function handleCoverUpload(file: File | null) {
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/venues/${venueId}/cover`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setCoverUrl(data.cover_image_url + "?t=" + Date.now());
      }
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleCoverRemove() {
    setCoverUploading(true);
    try {
      await fetch(`/api/venues/${venueId}/cover`, { method: "DELETE" });
      setCoverUrl(null);
    } finally {
      setCoverUploading(false);
    }
  }
  const [photoFilter, setPhotoFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [exportingZip, setExportingZip] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  // Gallery state
  type GalleryPhoto = { id: string; storage_path: string; file_name: string | null; file_size_bytes: number | null; area_tag: string | null; created_at: string; signedUrl: string | null };
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0); // 0-100
  const [galleryCurrentFile, setGalleryCurrentFile] = useState("");
  const [galleryLightbox, setGalleryLightbox] = useState<GalleryPhoto | null>(null);
  const [galleryDeleting, setGalleryDeleting] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  async function loadGallery() {
    if (galleryLoaded) return;
    const res = await fetch(`/api/venues/${venueId}/gallery`);
    if (res.ok) {
      const data = await res.json();
      setGalleryPhotos(data);
    }
    setGalleryLoaded(true);
  }

  function uploadFileWithProgress(file: File): Promise<GalleryPhoto> {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/venues/${venueId}/gallery`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setGalleryProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error("Invalid response")); }
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.error ?? `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(fd);
    });
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    setGalleryError(null);
    setGalleryProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setGalleryCurrentFile(`${file.name} (${i + 1}/${files.length})`);
        setGalleryProgress(0);
        const newPhoto = await uploadFileWithProgress(file);
        setGalleryPhotos((prev) => [newPhoto, ...prev]);
      }
      setGalleryProgress(100);
    } catch (err: unknown) {
      setGalleryError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setGalleryUploading(false);
      setGalleryCurrentFile("");
    }
  }

  async function handleGalleryDelete(photoId: string) {
    setGalleryDeleting(photoId);
    try {
      const res = await fetch(`/api/venues/${venueId}/gallery?photo_id=${photoId}`, { method: "DELETE" });
      if (res.ok) setGalleryPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } finally {
      setGalleryDeleting(null);
    }
  }

  // Static Sites state
  type StaticSite = { id: string; label: string; site_type: string | null; location_in_venue: string | null; width_cm: number | null; height_cm: number | null; is_active: boolean | null; photo_url: string | null; created_at: string };
  const [staticSites, setStaticSites] = useState<StaticSite[]>([]);
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [staticSort, setStaticSort] = useState<"name" | "numeric" | "date" | "location" | "type">("name");
  const [showAddStatic, setShowAddStatic] = useState(false);
  const [staticForm, setStaticForm] = useState({ label: "", site_type: "poster_frame", location_in_venue: "", width_cm: "", height_cm: "", notes: "" });
  const [staticPhoto, setStaticPhoto] = useState<File | null>(null);
  const [staticPhotoPreview, setStaticPhotoPreview] = useState<string | null>(null);
  const [staticSaving, setStaticSaving] = useState(false);
  const [staticError, setStaticError] = useState<string | null>(null);

  const STATIC_TYPE_LABELS: Record<string, string> = { poster_frame: "Poster Frame", banner: "Banner", a_frame: "A-Frame", standee: "Standee", wall_mount: "Wall Mount", window_vinyl: "Window Vinyl", other: "Other" };
  const STATIC_LOCATION_OPTIONS = ["entrance", "gym_floor", "reception", "changerooms", "car_park", "corridor", "other"];
  const STATIC_LOCATION_LABELS: Record<string, string> = { entrance: "Entrance", gym_floor: "Gym Floor", reception: "Reception", changerooms: "Changerooms", car_park: "Car Park", corridor: "Corridor", other: "Other" };

  async function loadStaticSites() {
    if (staticLoaded) return;
    const res = await fetch(`/api/static-sites?venue_id=${venueId}`);
    if (res.ok) setStaticSites(await res.json());
    setStaticLoaded(true);
  }

  async function handleAddStaticSite(e: React.FormEvent) {
    e.preventDefault(); setStaticSaving(true); setStaticError(null);
    try {
      const res = await fetch("/api/static-sites", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venue_id: venueId, label: staticForm.label, site_type: staticForm.site_type, location_in_venue: staticForm.location_in_venue || null, width_cm: staticForm.width_cm ? parseInt(staticForm.width_cm) : null, height_cm: staticForm.height_cm ? parseInt(staticForm.height_cm) : null, notes: staticForm.notes || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const newSite = await res.json();
      if (staticPhoto) {
        const fd = new FormData(); fd.append("file", staticPhoto);
        const pr = await fetch(`/api/static-sites/${newSite.id}/photo`, { method: "POST", body: fd });
        if (pr.ok) { const pd = await pr.json(); newSite.photo_url = pd.photo_url; }
      }
      setStaticSites((prev) => [newSite, ...prev]);
      setShowAddStatic(false);
      setStaticForm({ label: "", site_type: "poster_frame", location_in_venue: "", width_cm: "", height_cm: "", notes: "" });
      setStaticPhoto(null); setStaticPhotoPreview(null);
    } catch (err) { setStaticError(err instanceof Error ? err.message : "Error"); }
    finally { setStaticSaving(false); }
  }

  // Add Screen modal state
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [screenForm, setScreenForm] = useState({ label: "", location_in_venue: "", size_inches: "", resolution: "", orientation: "landscape", notes: "" });
  const [screenPhoto, setScreenPhoto] = useState<File | null>(null);
  const [screenPhotoPreview, setScreenPhotoPreview] = useState<string | null>(null);
  const [screenSaving, setScreenSaving] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [localScreens, setLocalScreens] = useState<Screen[]>(screens);
  const [screenSort, setScreenSort] = useState<"name" | "numeric" | "date" | "location" | "status">("name");

  async function handleAddScreen(e: React.FormEvent) {
    e.preventDefault();
    setScreenSaving(true);
    setScreenError(null);
    try {
      const res = await fetch("/api/screens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: venueId,
          label: screenForm.label,
          location_in_venue: screenForm.location_in_venue || null,
          size_inches: screenForm.size_inches || null,
          resolution: screenForm.resolution || null,
          orientation: screenForm.orientation,
          notes: screenForm.notes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to add screen");
      }
      const newScreen = await res.json();

      // Upload photo if selected
      let photoUrl: string | null = null;
      if (screenPhoto) {
        const fd = new FormData();
        fd.append("file", screenPhoto);
        const photoRes = await fetch(`/api/screens/${newScreen.id}/photo`, { method: "POST", body: fd });
        if (photoRes.ok) {
          const photoData = await photoRes.json();
          photoUrl = photoData.photo_url;
        }
      }

      setLocalScreens((prev) => [...prev, { ...newScreen, photo_url: photoUrl }]);
      setShowAddScreen(false);
      setScreenForm({ label: "", location_in_venue: "", size_inches: "", resolution: "", orientation: "landscape", notes: "" });
      setScreenPhoto(null);
      setScreenPhotoPreview(null);
    } catch (err: unknown) {
      setScreenError(err instanceof Error ? err.message : "Error");
    } finally {
      setScreenSaving(false);
    }
  }

  async function downloadPhoto(photo: Photo) {
    setDownloading(photo.id);
    try {
      const res = await fetch(`/api/photos/${photo.id}/download`);
      const { url, file_name } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = file_name ?? "photo.jpg";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(null);
    }
  }

  async function exportAllZip() {
    setExportingZip(true);
    try {
      const res = await fetch(`/api/photos/export?venue_id=${venueId}&status=all`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${venue.name.replace(/ /g, "_")}-photos.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExportingZip(false);
    }
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const brandName = venue.gym_brands?.name ?? null;

  return (
    <div className="p-4 md:p-8">
      {/* Hero header — cover image or gradient */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6"
        style={{
          minHeight: coverUrl ? 200 : 100,
          background: coverUrl ? "#000" : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Cover image as <img> — reliable, respects object-position for repositioning */}
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", objectPosition: `center ${coverPosition}%`, display: "block" }}
            loading="eager"
          />
        )}
        {/* Strong gradient overlay */}
        {coverUrl && <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)" }} />}

        <div className="relative z-10 flex items-end justify-between p-5 md:p-6" style={{ minHeight: coverUrl ? 200 : 100 }}>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/venues"
              className="p-2 rounded-xl flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>
            <div>
              <h1
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", textShadow: coverUrl ? "0 2px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.8)" : "none" }}
              >
                {venue.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.75)", textShadow: coverUrl ? "0 1px 4px rgba(0,0,0,0.9)" : "none" }}>
                {brandName ? `${brandName} · ` : ""}{venue.city ?? ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit && (
              <>
                <label
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", color: coverUploading ? "#888" : "#fff", border: "1px solid rgba(255,255,255,0.15)", pointerEvents: coverUploading ? "none" : "auto" }}
                >
                  <Upload size={13} strokeWidth={2} />
                  {coverUploading ? "Uploading..." : coverUrl ? "Change" : "Set Cover"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverUpload(e.target.files?.[0] ?? null)} />
                </label>
                {coverUrl && (
                  <button onClick={handleCoverRemove} disabled={coverUploading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <Trash2 size={13} strokeWidth={2} />
                    Remove
                  </button>
                )}
                <EditVenueButton venue={venue} />
              </>
            )}
          </div>
        </div>

        {/* Position slider — only visible when cover is set + admin */}
        {coverUrl && canEdit && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>↕</span>
              <input
                type="range"
                min={0}
                max={100}
                value={coverPosition}
                onChange={(e) => handlePositionChange(Number(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#D4FF4F", opacity: 0.7 }}
                title="Drag to reposition cover image"
              />
              <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)", minWidth: 28 }}>{coverPosition}%</span>
            </div>
          </div>
        )}
      </div>


      {/* Tabs — scrollable on mobile */}
      <div
        className="flex gap-1 mb-6 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", scrollbarWidth: "none" }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); if (id === "gallery") loadGallery(); if (id === "static") loadStaticSites(); }}
            className="flex items-center gap-2 px-3 md:px-4 py-3 text-sm font-medium transition-colors duration-150 flex-shrink-0"
            style={{
              color: activeTab === id ? "#D4FF4F" : "#909090",
              borderBottom:
                activeTab === id ? "2px solid #D4FF4F" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            <Icon size={16} strokeWidth={2} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              label: "ACTIVE MEMBERS",
              value: venue.active_members?.toLocaleString() ?? "—",
            },
            {
              label: "DAILY ENTRIES",
              value: venue.daily_entries?.toLocaleString() ?? "—",
            },
            {
              label: "WEEKLY ENTRIES",
              value: venue.weekly_entries?.toLocaleString() ?? "—",
            },
            {
              label: "MONTHLY ENTRIES",
              value: venue.monthly_entries?.toLocaleString() ?? "—",
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl p-6" style={cardStyle}>
              <p
                className="text-xs font-medium uppercase tracking-widest mb-3"
                style={{ color: "#B0B0B0" }}
              >
                {stat.label}
              </p>
              <p
                className="text-4xl font-bold text-white tabular-nums"
                style={{
                  fontFamily: "Inter Tight, sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}

          {/* Venue info card */}
          <div
            className="col-span-2 lg:col-span-4 rounded-2xl p-6"
            style={cardStyle}
          >
            <h3
              className="text-sm font-semibold text-white mb-4"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Venue Information
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={14} color="#909090" strokeWidth={2} className="mt-0.5 shrink-0" />
                <div>
                  <p style={{ color: "#B0B0B0" }}>Address</p>
                  <p className="text-white mt-0.5">{venue.address ?? "—"}</p>
                </div>
              </div>
              <div>
                <p style={{ color: "#B0B0B0" }}>Area Tag</p>
                <p className="text-white mt-0.5">{venue.region ?? "—"}</p>
              </div>
              <div>
                <p style={{ color: "#B0B0B0" }}>City</p>
                <p className="text-white mt-0.5">{venue.city ?? "—"}</p>
              </div>
              <div className="flex items-start gap-2">
                <Building2 size={14} color="#909090" strokeWidth={2} className="mt-0.5 shrink-0" />
                <div>
                  <p style={{ color: "#B0B0B0" }}>Brand</p>
                  <p className="text-white mt-0.5">{brandName ?? "Independent"}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs" style={{ color: "#B0B0B0" }}>Status</p>
              <span
                className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor:
                    venue.status === "active"
                      ? "rgba(212,255,79,0.10)"
                      : "rgba(102,102,102,0.15)",
                  color: venue.status === "active" ? "#D4FF4F" : "#909090",
                }}
              >
                {venue.status ?? "unknown"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Screens Tab */}
      {activeTab === "screens" && (
        <div>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <Filter size={13} color="#666" strokeWidth={2} />
              <select
                value={screenSort}
                onChange={(e) => setScreenSort(e.target.value as typeof screenSort)}
                className="rounded-xl px-3 py-2 text-xs"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#C8C8C8", outline: "none" }}
              >
                <option value="name">Name A–Z</option>
                <option value="numeric">Numerical</option>
                <option value="date">Date Added</option>
                <option value="location">Location</option>
                <option value="status">Status</option>
              </select>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowAddScreen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Add Screen
              </button>
            )}
          </div>

          {localScreens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={cardStyle}>
              <Monitor size={32} strokeWidth={1.5} color="#444" className="mb-3" />
              <p className="text-sm" style={{ color: "#B0B0B0" }}>No screens configured for this venue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...localScreens]
                .sort((a, b) => {
                  if (screenSort === "name") return (a.label ?? "").localeCompare(b.label ?? "", undefined, { sensitivity: "base" });
                  if (screenSort === "numeric") return (a.label ?? "").localeCompare(b.label ?? "", undefined, { numeric: true, sensitivity: "base" });
                  if (screenSort === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  if (screenSort === "location") return (a.location_in_venue ?? "zzz").localeCompare(b.location_in_venue ?? "zzz", undefined, { numeric: true });
                  if (screenSort === "status") return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
                  return 0;
                })
                .map((screen) => (
                  <ScreenCard
                    key={screen.id}
                    screen={screen}
                    canEdit={canEdit}
                    onPhotoUpdate={(photoUrl) => {
                      setLocalScreens((prev) =>
                        prev.map((s) => s.id === screen.id ? { ...s, photo_url: photoUrl } : s)
                      );
                    }}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Contract Tab */}
      {activeTab === "contract" && (
        <div>
          {contract === null ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center justify-center max-w-sm mx-auto"
              style={cardStyle}
            >
              <FileText size={32} color="#444" strokeWidth={1.5} className="mb-3" />
              <p
                className="text-sm font-medium text-white mb-1"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                No contract on file
              </p>
              <p className="text-xs text-center" style={{ color: "#999" }}>
                No contract has been recorded for this venue yet.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl p-6 max-w-lg" style={cardStyle}>
              <h3
                className="text-sm font-semibold text-white mb-4"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                Contract Details
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#B0B0B0" }}>Start Date</span>
                  <span className="text-white tabular-nums">
                    {formatDate(contract.start_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#B0B0B0" }}>End Date</span>
                  <span className="text-white tabular-nums">
                    {formatDate(contract.end_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#B0B0B0" }}>Monthly Rental</span>
                  <span className="text-white font-mono">
                    {formatZAR(contract.monthly_rental_zar)}
                  </span>
                </div>
                {contract.revenue_share_percent != null && (
                  <div className="flex justify-between">
                    <span style={{ color: "#B0B0B0" }}>Revenue Share</span>
                    <span className="text-white font-mono">
                      {contract.revenue_share_percent}%
                    </span>
                  </div>
                )}
                {contract.notes && (
                  <div>
                    <p style={{ color: "#B0B0B0" }} className="mb-1">Notes</p>
                    <p style={{ color: "#C8C8C8" }}>{contract.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#C8C8C8" }}
                >
                  Contract Document
                </label>
                <div
                  className="flex items-center justify-center rounded-xl p-6"
                  style={{ border: "2px dashed rgba(255,255,255,0.12)" }}
                >
                  <div className="text-center">
                    <FileText
                      size={28}
                      color="#444444"
                      strokeWidth={1.5}
                      className="mx-auto mb-2"
                    />
                    <p className="text-sm" style={{ color: "#B0B0B0" }}>
                      Upload contract PDF
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      id="contract-upload"
                    />
                    <label
                      htmlFor="contract-upload"
                      className="mt-3 inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        color: "#C8C8C8",
                      }}
                    >
                      Choose file
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gallery Tab */}
      {activeTab === "gallery" && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#D4FF4F", fontWeight: 700 }}>Venue Gallery</p>
              <p className="text-xs" style={{ color: "#666" }}>Showcase images for sales decks and media kit. Admin upload only.</p>
            </div>
            {canEdit && (
              <label
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                style={{
                  backgroundColor: galleryUploading ? "rgba(255,255,255,0.04)" : "rgba(212,255,79,0.10)",
                  color: galleryUploading ? "#666" : "#D4FF4F",
                  border: "1px solid rgba(212,255,79,0.2)",
                  pointerEvents: galleryUploading ? "none" : "auto",
                }}
              >
                <Upload size={14} strokeWidth={2} />
                {galleryUploading ? "Uploading..." : "Upload Photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleGalleryUpload(e.target.files)}
                />
              </label>
            )}
          </div>

          {/* Upload progress bar */}
          {galleryUploading && (
            <div className="mb-4 rounded-xl p-4" style={{ background: "rgba(212,255,79,0.06)", border: "1px solid rgba(212,255,79,0.15)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: "#D4FF4F" }}>Uploading {galleryCurrentFile}</p>
                <p className="text-xs tabular-nums" style={{ color: "#D4FF4F" }}>{galleryProgress}%</p>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${galleryProgress}%`, backgroundColor: "#D4FF4F" }}
                />
              </div>
            </div>
          )}

          {galleryError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.10)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
              {galleryError}
            </div>
          )}

          {!galleryLoaded ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
          ) : galleryPhotos.length === 0 ? (
            <div className="rounded-2xl p-12 flex flex-col items-center justify-center" style={cardStyle}>
              <GalleryHorizontal size={36} color="#333" strokeWidth={1.5} className="mb-3" />
              <p className="text-sm font-medium text-white mb-1">No showcase photos yet</p>
              <p className="text-xs mb-4" style={{ color: "#666" }}>Upload mockups or photos of this gym's screens.</p>
              {canEdit && (
                <label
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
                >
                  <Upload size={15} strokeWidth={2.5} />
                  Upload First Photo
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGalleryUpload(e.target.files)} />
                </label>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryPhotos.map((photo) => (
                <div key={photo.id} className="rounded-2xl overflow-hidden flex flex-col group" style={cardStyle}>
                  {/* Thumbnail */}
                  <div
                    className="aspect-video flex items-center justify-center overflow-hidden cursor-pointer relative"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                    onClick={() => setGalleryLightbox(photo)}
                  >
                    {photo.signedUrl ? (
                      <img src={photo.signedUrl} alt={photo.file_name ?? "photo"} className="w-full h-full object-cover" />
                    ) : (
                      <GalleryHorizontal size={24} color="#444" strokeWidth={1.5} />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs text-white font-medium">View</span>
                    </div>
                  </div>
                  {/* Info row */}
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <p className="text-xs truncate" style={{ color: "#999" }}>{photo.file_name ?? "photo"}</p>
                    {canEdit && (
                      <button
                        onClick={() => handleGalleryDelete(photo.id)}
                        disabled={galleryDeleting === photo.id}
                        className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                        style={{ color: galleryDeleting === photo.id ? "#444" : "#666" }}
                        title="Delete"
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gallery Lightbox */}
          {galleryLightbox && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
              onClick={() => setGalleryLightbox(null)}
            >
              <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setGalleryLightbox(null)}
                  className="absolute -top-10 right-0 p-2 rounded-xl"
                  style={{ color: "#999", background: "rgba(255,255,255,0.06)" }}
                >
                  <X size={18} strokeWidth={2} />
                </button>
                {galleryLightbox.signedUrl && (
                  <img
                    src={galleryLightbox.signedUrl}
                    alt={galleryLightbox.file_name ?? "photo"}
                    className="max-h-[85vh] max-w-full rounded-2xl object-contain"
                    style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
                  />
                )}
                <p className="absolute -bottom-8 left-0 right-0 text-center text-xs" style={{ color: "#555" }}>
                  {galleryLightbox.file_name}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Static Sites Tab */}
      {activeTab === "static" && (
        <div>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={13} color="#666" strokeWidth={2} />
              <select value={staticSort} onChange={(e) => setStaticSort(e.target.value as typeof staticSort)} className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#C8C8C8", outline: "none" }}>
                <option value="name">Name A–Z</option>
                <option value="numeric">Numerical</option>
                <option value="date">Date Added</option>
                <option value="location">Location</option>
                <option value="type">Type</option>
              </select>
            </div>
            {canCreate && (
              <button onClick={() => setShowAddStatic(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}>
                <Plus size={16} strokeWidth={2.5} /> Add Static Site
              </button>
            )}
          </div>

          {!staticLoaded ? (
            <div className="flex items-center justify-center py-20"><div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>
          ) : staticSites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={cardStyle}>
              <Layers size={32} strokeWidth={1.5} color="#444" className="mb-3" />
              <p className="text-sm mb-4" style={{ color: "#B0B0B0" }}>No static sites added yet.</p>
              {canCreate && <button onClick={() => setShowAddStatic(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}><Plus size={15} strokeWidth={2.5} />Add Static Site</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...staticSites].sort((a, b) => {
                if (staticSort === "name") return (a.label ?? "").localeCompare(b.label ?? "", undefined, { sensitivity: "base" });
                if (staticSort === "numeric") return (a.label ?? "").localeCompare(b.label ?? "", undefined, { numeric: true, sensitivity: "base" });
                if (staticSort === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                if (staticSort === "location") return (a.location_in_venue ?? "zzz").localeCompare(b.location_in_venue ?? "zzz", undefined, { numeric: true });
                if (staticSort === "type") return (a.site_type ?? "").localeCompare(b.site_type ?? "");
                return 0;
              }).map((site) => (
                <div key={site.id} className="rounded-2xl overflow-hidden group" style={cardStyle}>
                  <div className="relative aspect-video flex items-center justify-center overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
                    {site.photo_url ? <img src={site.photo_url} alt={site.label} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1"><Layers size={24} color="#333" strokeWidth={1.5} /><p className="text-xs" style={{ color: "#444" }}>No photo</p></div>}
                    {canEdit && (
                      <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.6)" }}>
                        <div className="flex flex-col items-center gap-1.5"><Upload size={18} color="#D4FF4F" strokeWidth={2} /><span className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>{site.photo_url ? "Change" : "Add Photo"}</span></div>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const fd = new FormData(); fd.append("file", f);
                          const res = await fetch(`/api/static-sites/${site.id}/photo`, { method: "POST", body: fd });
                          if (res.ok) { const pd = await res.json(); setStaticSites((prev) => prev.map((s) => s.id === site.id ? { ...s, photo_url: pd.photo_url } : s)); }
                        }} />
                      </label>
                    )}
                    <span className="absolute top-2 right-2 text-xs font-semibold uppercase px-2 py-0.5 rounded-full" style={{ background: site.is_active ? "rgba(212,255,79,0.15)" : "rgba(102,102,102,0.25)", color: site.is_active ? "#D4FF4F" : "#909090", backdropFilter: "blur(4px)" }}>{site.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "Inter Tight, sans-serif" }}>{site.label}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#888" }}>{site.location_in_venue ? STATIC_LOCATION_LABELS[site.location_in_venue] ?? site.location_in_venue : ""}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(212,255,79,0.08)", color: "#D4FF4F" }}>{STATIC_TYPE_LABELS[site.site_type ?? ""] ?? site.site_type}</span>
                      {(site.width_cm || site.height_cm) && <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#A3A3A3" }}>{site.width_cm}×{site.height_cm}cm</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Static Site Modal */}
          {showAddStatic && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.80)" }} onClick={() => setShowAddStatic(false)}>
              <div className="w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "rgba(20,20,20,0.98)", border: "1px solid rgba(255,255,255,0.10)" }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Add Static Site</h3>
                  <button onClick={() => setShowAddStatic(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, padding: "6px", cursor: "pointer" }}><X size={14} color="#909090" strokeWidth={2} /></button>
                </div>
                {staticError && <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#EF4444" }}>{staticError}</div>}
                <form onSubmit={handleAddStaticSite} className="space-y-4">
                  <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Name *</label><input value={staticForm.label} onChange={(e) => setStaticForm((p) => ({ ...p, label: e.target.value }))} required placeholder="e.g. Entrance Poster" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }} /></div>
                  <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Type</label>
                    <select value={staticForm.site_type} onChange={(e) => setStaticForm((p) => ({ ...p, site_type: e.target.value }))} className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }}>
                      {Object.entries(STATIC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Location</label>
                    <select value={staticForm.location_in_venue} onChange={(e) => setStaticForm((p) => ({ ...p, location_in_venue: e.target.value }))} className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }}>
                      <option value="">Select location…</option>
                      {STATIC_LOCATION_OPTIONS.map((v) => <option key={v} value={v}>{STATIC_LOCATION_LABELS[v]}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Width (cm)</label><input type="number" min={1} value={staticForm.width_cm} onChange={(e) => setStaticForm((p) => ({ ...p, width_cm: e.target.value }))} placeholder="e.g. 60" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }} /></div>
                    <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Height (cm)</label><input type="number" min={1} value={staticForm.height_cm} onChange={(e) => setStaticForm((p) => ({ ...p, height_cm: e.target.value }))} placeholder="e.g. 90" className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }} /></div>
                  </div>
                  <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Photo (optional)</label>
                    {staticPhotoPreview ? (
                      <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                        <img src={staticPhotoPreview} alt="preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setStaticPhoto(null); setStaticPhotoPreview(null); }} className="absolute top-2 right-2 p-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}><X size={13} strokeWidth={2} /></button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", padding: "20px" }}>
                        <Upload size={18} color="#555" strokeWidth={2} />
                        <span className="text-xs" style={{ color: "#666" }}>Upload a placement photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setStaticPhoto(f); setStaticPhotoPreview(URL.createObjectURL(f)); } }} />
                      </label>
                    )}
                  </div>
                  <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Notes</label><textarea value={staticForm.notes} onChange={(e) => setStaticForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none", resize: "vertical" }} /></div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddStatic(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid rgba(255,255,255,0.10)", color: "#C8C8C8", background: "transparent", cursor: "pointer" }}>Cancel</button>
                    <button type="submit" disabled={staticSaving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: staticSaving ? "#555" : "#D4FF4F", color: "#0A0A0A", border: "none", cursor: staticSaving ? "wait" : "pointer" }}>{staticSaving ? "Saving…" : "Add Site"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === "photos" && (
        <div>
          {photos.length === 0 ? (
            <div className="rounded-2xl p-10 flex flex-col items-center justify-center" style={cardStyle}>
              <Image size={32} color="#444" strokeWidth={1.5} className="mb-3" />
              <p className="text-sm font-medium text-white mb-1">No photos uploaded</p>
              <p className="text-xs" style={{ color: "#999" }}>Photos submitted by this venue will appear here.</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status filter */}
                  <div className="flex items-center gap-1.5">
                    <Filter size={13} color="#666" strokeWidth={2} />
                    <select
                      value={photoFilter}
                      onChange={(e) => setPhotoFilter(e.target.value as typeof photoFilter)}
                      className="rounded-xl px-3 py-2 text-xs"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#C8C8C8", outline: "none" }}
                    >
                      <option value="all">All status</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  {/* Area filter */}
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="rounded-xl px-3 py-2 text-xs"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#C8C8C8", outline: "none" }}
                  >
                    <option value="all">All areas</option>
                    {Object.entries(AREA_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Export zip */}
                <button
                  onClick={exportAllZip}
                  disabled={exportingZip}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    backgroundColor: exportingZip ? "#1E1E1E" : "rgba(212,255,79,0.12)",
                    color: exportingZip ? "#666" : "#D4FF4F",
                    border: "1px solid rgba(212,255,79,0.2)",
                  }}
                >
                  <Archive size={14} strokeWidth={2} />
                  {exportingZip ? "Preparing zip..." : "Download All"}
                </button>
              </div>

              {/* Grid */}
              {(() => {
                const filtered = photos.filter((p) => {
                  if (photoFilter !== "all" && p.status !== photoFilter) return false;
                  if (areaFilter !== "all" && p.area_tag !== areaFilter) return false;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="rounded-2xl p-10 flex flex-col items-center" style={cardStyle}>
                      <p className="text-sm" style={{ color: "#999" }}>No photos match the current filters.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map((photo) => (
                      <div key={photo.id} className="rounded-2xl overflow-hidden flex flex-col" style={cardStyle}>
                        {/* Thumbnail */}
                        <div
                          className="aspect-video flex items-center justify-center overflow-hidden cursor-pointer relative group"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                          onClick={() => setLightbox(photo)}
                        >
                          {photo.signedUrl ? (
                            <img src={photo.signedUrl} alt={photo.file_name ?? "photo"} className="w-full h-full object-cover" />
                          ) : (
                            <Image size={24} color="#444" strokeWidth={1.5} />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-xs text-white font-medium">View</span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="px-3 py-2 flex-1 flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs text-white font-medium truncate">
                              {photo.month ? formatMonth(photo.month) : "—"}
                            </p>
                            <span
                              className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: photo.status === "approved" ? "rgba(212,255,79,0.12)" : photo.status === "rejected" ? "rgba(255,107,107,0.12)" : "rgba(251,191,36,0.12)",
                                color: photo.status === "approved" ? "#D4FF4F" : photo.status === "rejected" ? "#FF6B6B" : "#FBBF24",
                              }}
                            >
                              {photo.status ?? "pending"}
                            </span>
                          </div>

                          {photo.area_tag && (
                            <p className="text-xs" style={{ color: "#999" }}>
                              {AREA_LABELS[photo.area_tag] ?? photo.area_tag}
                            </p>
                          )}

                          <div className="flex items-center gap-1" style={{ color: "#8A8A8A" }}>
                            <Clock size={10} strokeWidth={2} />
                            <p className="text-xs">{new Date(photo.created_at).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            {photo.file_size_bytes && (
                              <span className="text-xs ml-auto" style={{ color: "#777" }}>{formatBytes(photo.file_size_bytes)}</span>
                            )}
                          </div>

                          {photo.rejection_reason && (
                            <p className="text-xs truncate" style={{ color: "#FF6B6B" }}>{photo.rejection_reason}</p>
                          )}
                        </div>

                        {/* Download button */}
                        <div className="px-3 pb-3">
                          <button
                            onClick={() => downloadPhoto(photo)}
                            disabled={downloading === photo.id}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: downloading === photo.id ? "#555" : "#A3A3A3",
                            }}
                          >
                            <Download size={12} strokeWidth={2} />
                            {downloading === photo.id ? "..." : "Download"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}

          {/* Lightbox */}
          {lightbox && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
              onClick={() => setLightbox(null)}
            >
              <div className="relative max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
                {lightbox.signedUrl && (
                  <img
                    src={lightbox.signedUrl}
                    alt={lightbox.file_name ?? "photo"}
                    className="w-full max-h-[80vh] object-contain rounded-2xl"
                  />
                )}
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-sm text-white font-medium">{lightbox.file_name ?? "Photo"}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                      {lightbox.area_tag ? AREA_LABELS[lightbox.area_tag] : ""}
                      {lightbox.month ? ` · ${formatMonth(lightbox.month)}` : ""}
                      {lightbox.file_size_bytes ? ` · ${formatBytes(lightbox.file_size_bytes)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadPhoto(lightbox)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
                    >
                      <Download size={14} strokeWidth={2} />
                      Download
                    </button>
                    <button
                      onClick={() => setLightbox(null)}
                      className="px-4 py-2 rounded-xl text-sm"
                      style={{ background: "rgba(255,255,255,0.08)", color: "#C8C8C8" }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === "revenue" && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {revenue.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16"
              style={{ color: "#B0B0B0" }}
            >
              <DollarSign size={32} strokeWidth={1.5} color="#444" className="mb-3" />
              <p className="text-sm">No revenue entries recorded for this venue.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                  }}
                >
                  {["Month", "Rental (ZAR)", "Revenue Share (ZAR)", "Total"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{
                          color: "#B0B0B0",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {revenue.map((row, idx) => {
                  const total =
                    (row.rental_zar ?? 0) + (row.revenue_share_zar ?? 0);
                  return (
                    <tr
                      key={row.id}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        borderTop:
                          idx > 0
                            ? "1px solid rgba(255,255,255,0.08)"
                            : "none",
                      }}
                    >
                      <td className="px-6 py-4 text-sm text-white">
                        {formatMonth(row.month)}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-mono tabular-nums"
                        style={{ color: "#C8C8C8" }}
                      >
                        {formatZAR(row.rental_zar)}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-mono tabular-nums"
                        style={{ color: "#C8C8C8" }}
                      >
                        {formatZAR(row.revenue_share_zar)}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-mono font-semibold tabular-nums"
                        style={{ color: "#D4FF4F" }}
                      >
                        {formatZAR(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    {/* Add Screen Modal */}
      {showAddScreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowAddScreen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "rgba(20,20,20,0.98)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Add Screen</h3>
              <button onClick={() => setShowAddScreen(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, padding: "6px", cursor: "pointer" }}>
                <X size={14} color="#909090" strokeWidth={2} />
              </button>
            </div>

            {screenError && (
              <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
                {screenError}
              </div>
            )}

            <form onSubmit={handleAddScreen} className="space-y-4">
              {/* Screen Label */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Screen Name *</label>
                <input
                  value={screenForm.label}
                  onChange={(e) => setScreenForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Main Floor Screen"
                  required
                  className="w-full rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }}
                />
              </div>

              {/* Location in venue */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Location in Venue</label>
                <select
                  value={screenForm.location_in_venue}
                  onChange={(e) => setScreenForm((prev) => ({ ...prev, location_in_venue: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }}
                >
                  <option value="">Select location…</option>
                  <option value="lobby">Lobby</option>
                  <option value="gym_floor">Gym Floor</option>
                  <option value="cardio_area">Cardio Area</option>
                  <option value="change_rooms">Change Rooms</option>
                  <option value="reception">Reception</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Size + Orientation row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Size (inches)</label>
                  <input
                    type="number"
                    min={1}
                    value={screenForm.size_inches}
                    onChange={(e) => setScreenForm((prev) => ({ ...prev, size_inches: e.target.value }))}
                    placeholder="e.g. 55"
                    className="w-full rounded-xl px-4 py-2.5 text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Orientation</label>
                  <div className="flex gap-2 mt-0.5">
                    {(["landscape", "portrait"] as const).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setScreenForm((prev) => ({ ...prev, orientation: o }))}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize"
                        style={{
                          background: screenForm.orientation === o ? "rgba(212,255,79,0.15)" : "rgba(255,255,255,0.05)",
                          border: screenForm.orientation === o ? "1px solid rgba(212,255,79,0.35)" : "1px solid rgba(255,255,255,0.10)",
                          color: screenForm.orientation === o ? "#D4FF4F" : "#909090",
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
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Resolution</label>
                <input
                  value={screenForm.resolution}
                  onChange={(e) => setScreenForm((prev) => ({ ...prev, resolution: e.target.value }))}
                  placeholder="1920x1080"
                  className="w-full rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }}
                />
              </div>

              {/* Screen Photo */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Screen Photo (optional)</label>
                {screenPhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img src={screenPhotoPreview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setScreenPhoto(null); setScreenPhotoPreview(null); }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center gap-2 w-full rounded-xl cursor-pointer transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", padding: "20px", minHeight: 80 }}
                  >
                    <Upload size={18} color="#555" strokeWidth={2} />
                    <span className="text-xs" style={{ color: "#666" }}>Click to upload a photo of where the screen is placed</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setScreenPhoto(file);
                        if (file) setScreenPhotoPreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#C8C8C8" }}>Notes (optional)</label>
                <textarea
                  value={screenForm.notes}
                  onChange={(e) => setScreenForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes…"
                  rows={2}
                  className="w-full rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none", resize: "vertical" }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddScreen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.10)", color: "#C8C8C8", background: "transparent", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={screenSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: screenSaving ? "#555" : "#D4FF4F", color: "#0A0A0A", border: "none", cursor: screenSaving ? "wait" : "pointer" }}
                >
                  {screenSaving ? "Saving..." : "Add Screen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
