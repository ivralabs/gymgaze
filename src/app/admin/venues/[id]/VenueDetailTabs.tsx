"use client";

import { useState } from "react";
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
} from "lucide-react";

type Tab = "overview" | "screens" | "contract" | "photos" | "revenue";

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
  status: string | null;
  active_members: number | null;
  daily_entries: number | null;
  weekly_entries: number | null;
  monthly_entries: number | null;
  gym_brands: GymBrand | null;
}

interface Screen {
  id: string;
  label: string;
  size_inches: number | null;
  resolution: string | null;
  orientation: string | null;
  is_active: boolean | null;
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
  { id: "photos", label: "Photos", icon: Image },
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

export default function VenueDetailTabs({
  venue,
  screens,
  contract,
  revenue,
  photos,
  venueId,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [photoFilter, setPhotoFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [exportingZip, setExportingZip] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  // Add Screen modal state
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [screenForm, setScreenForm] = useState({ label: "", size_inches: "", resolution: "", orientation: "landscape" });
  const [screenSaving, setScreenSaving] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [localScreens, setLocalScreens] = useState<Screen[]>(screens);

  async function handleAddScreen(e: React.FormEvent) {
    e.preventDefault();
    setScreenSaving(true);
    setScreenError(null);
    try {
      const res = await fetch("/api/screens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venue_id: venueId, ...screenForm }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to add screen");
      }
      const newScreen = await res.json();
      setLocalScreens((prev) => [...prev, newScreen]);
      setShowAddScreen(false);
      setScreenForm({ label: "", size_inches: "", resolution: "", orientation: "landscape" });
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/venues"
          className="p-2 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#A3A3A3",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {venue.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#909090" }}>
            {brandName ? `${brandName} \u00b7 ` : ""}{venue.city ?? ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150"
            style={{
              color: activeTab === id ? "#D4FF4F" : "#909090",
              borderBottom:
                activeTab === id ? "2px solid #D4FF4F" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
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
                style={{ color: "#909090" }}
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
                  <p style={{ color: "#909090" }}>Address</p>
                  <p className="text-white mt-0.5">{venue.address ?? "—"}</p>
                </div>
              </div>
              <div>
                <p style={{ color: "#909090" }}>Region</p>
                <p className="text-white mt-0.5">{venue.region ?? "—"}</p>
              </div>
              <div>
                <p style={{ color: "#909090" }}>City</p>
                <p className="text-white mt-0.5">{venue.city ?? "—"}</p>
              </div>
              <div className="flex items-start gap-2">
                <Building2 size={14} color="#909090" strokeWidth={2} className="mt-0.5 shrink-0" />
                <div>
                  <p style={{ color: "#909090" }}>Brand</p>
                  <p className="text-white mt-0.5">{brandName ?? "Independent"}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs" style={{ color: "#909090" }}>Status</p>
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
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAddScreen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", height: "44px" }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Screen
            </button>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {localScreens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16" style={{ color: "#909090" }}>
                <Monitor size={32} strokeWidth={1.5} color="#444" className="mb-3" />
                <p className="text-sm">No screens configured for this venue.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {["Label", "Size", "Resolution", "Orientation", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "#909090", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localScreens.map((screen, idx) => (
                    <tr
                      key={screen.id}
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
                        {screen.label}
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ color: "#A3A3A3" }}
                      >
                        {screen.size_inches != null
                          ? `${screen.size_inches}"`
                          : "—"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-mono"
                        style={{ color: "#A3A3A3" }}
                      >
                        {screen.resolution ?? "—"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ color: "#A3A3A3" }}
                      >
                        {screen.orientation ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: screen.is_active
                              ? "rgba(212,255,79,0.1)"
                              : "rgba(102,102,102,0.15)",
                            color: screen.is_active ? "#D4FF4F" : "#909090",
                          }}
                        >
                          {screen.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
              <p className="text-xs text-center" style={{ color: "#666" }}>
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
                  <span style={{ color: "#909090" }}>Start Date</span>
                  <span className="text-white tabular-nums">
                    {formatDate(contract.start_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#909090" }}>End Date</span>
                  <span className="text-white tabular-nums">
                    {formatDate(contract.end_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#909090" }}>Monthly Rental</span>
                  <span className="text-white font-mono">
                    {formatZAR(contract.monthly_rental_zar)}
                  </span>
                </div>
                {contract.revenue_share_percent != null && (
                  <div className="flex justify-between">
                    <span style={{ color: "#909090" }}>Revenue Share</span>
                    <span className="text-white font-mono">
                      {contract.revenue_share_percent}%
                    </span>
                  </div>
                )}
                {contract.notes && (
                  <div>
                    <p style={{ color: "#909090" }} className="mb-1">Notes</p>
                    <p style={{ color: "#A3A3A3" }}>{contract.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#A3A3A3" }}
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
                    <p className="text-sm" style={{ color: "#909090" }}>
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
                        color: "#A3A3A3",
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

      {/* Photos Tab */}
      {activeTab === "photos" && (
        <div>
          {photos.length === 0 ? (
            <div className="rounded-2xl p-10 flex flex-col items-center justify-center" style={cardStyle}>
              <Image size={32} color="#444" strokeWidth={1.5} className="mb-3" />
              <p className="text-sm font-medium text-white mb-1">No photos uploaded</p>
              <p className="text-xs" style={{ color: "#666" }}>Photos submitted by this venue will appear here.</p>
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
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#A3A3A3", outline: "none" }}
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
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#A3A3A3", outline: "none" }}
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
                      <p className="text-sm" style={{ color: "#666" }}>No photos match the current filters.</p>
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
                            <p className="text-xs" style={{ color: "#666" }}>
                              {AREA_LABELS[photo.area_tag] ?? photo.area_tag}
                            </p>
                          )}

                          <div className="flex items-center gap-1" style={{ color: "#555" }}>
                            <Clock size={10} strokeWidth={2} />
                            <p className="text-xs">{new Date(photo.created_at).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            {photo.file_size_bytes && (
                              <span className="text-xs ml-auto" style={{ color: "#444" }}>{formatBytes(photo.file_size_bytes)}</span>
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
                    <p className="text-xs mt-0.5" style={{ color: "#666" }}>
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
                      style={{ background: "rgba(255,255,255,0.08)", color: "#A3A3A3" }}
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
              style={{ color: "#909090" }}
            >
              <DollarSign size={32} strokeWidth={1.5} color="#444" className="mb-3" />
              <p className="text-sm">No revenue entries recorded for this venue.</p>
            </div>
          ) : (
            <table className="w-full">
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
                          color: "#909090",
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
                        style={{ color: "#A3A3A3" }}
                      >
                        {formatZAR(row.rental_zar)}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-mono tabular-nums"
                        style={{ color: "#A3A3A3" }}
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
              {([
                { label: "Screen Label *", key: "label", placeholder: "e.g. Main Floor Screen", required: true },
                { label: "Size (inches)", key: "size_inches", placeholder: "e.g. 55", required: false },
                { label: "Resolution", key: "resolution", placeholder: "e.g. 1920x1080", required: false },
              ] as { label: string; key: string; placeholder: string; required: boolean }[]).map(({ label, key, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#A3A3A3" }}>{label}</label>
                  <input
                    value={screenForm[key as keyof typeof screenForm]}
                    onChange={(e) => setScreenForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    required={required}
                    className="w-full rounded-xl px-4 py-2.5 text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#A3A3A3" }}>Orientation</label>
                <select
                  value={screenForm.orientation}
                  onChange={(e) => setScreenForm((prev) => ({ ...prev, orientation: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", outline: "none" }}
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddScreen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.10)", color: "#A3A3A3", background: "transparent", cursor: "pointer" }}
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
