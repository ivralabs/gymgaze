"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Filter, Calendar, Tag, X, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Photo = {
  id: string;
  created_at: string;
  storage_path: string | null;
  area_tag: string | null;
  month: string | null;
  status: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
};

const AREA_LABELS: Record<string, string> = {
  gym_floor:   "Gym Floor",
  reception:   "Reception",
  changerooms: "Changerooms",
  equipment:   "Equipment",
  outdoor:     "Outdoor",
  other:       "Other",
};

function formatBytes(b: number | null) {
  if (!b) return "—";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ManagerPhotoHistoryPage() {
  const supabase = createClient();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [venueName, setVenueName] = useState<string>("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("venue_id")
      .eq("id", user.id)
      .single();

    if (!profile?.venue_id) { setLoading(false); return; }

    const { data: venue } = await supabase.from("venues").select("name").eq("id", profile.venue_id).single();
    if (venue) setVenueName(venue.name);

    const { data } = await supabase
      .from("venue_photos")
      .select("id, created_at, storage_path, area_tag, month, status, file_name, file_size_bytes")
      .eq("venue_id", profile.venue_id)
      .order("created_at", { ascending: false });

    setPhotos(data ?? []);
    setLoading(false);
  }

  const STORAGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venue-photos/`;

  // Available months for filter
  const months = Array.from(new Set(photos.map((p) => p.month).filter(Boolean))).sort().reverse();

  const filtered = photos.filter((p) => {
    if (areaFilter !== "all" && p.area_tag !== areaFilter) return false;
    if (monthFilter !== "all" && p.month !== monthFilter) return false;
    return true;
  });

  // Group by month
  const grouped: Record<string, Photo[]> = {};
  filtered.forEach((p) => {
    const key = p.month ?? "Unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  const monthKeys = Object.keys(grouped).sort().reverse();

  const statusColors = {
    approved: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
    pending:  { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
    rejected: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
  };

  return (
    <div>
      {/* Header */}
      <div className="glass-panel relative overflow-hidden rounded-2xl mb-6" style={{ borderRadius: 16 }}>
        <div className="relative z-10 p-6 flex items-center gap-4">
          <Link
            href="/portal/manager"
            className="p-2 rounded-xl flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#C8C8C8" }}
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div>
            <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "#fff", letterSpacing: "-0.02em" }}>
              Photo History
            </h1>
            <p style={{ color: "#999", marginTop: 4, fontSize: 14 }}>
              {venueName} · {photos.length} total uploads
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Tag size={14} color="#888" />
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="bg-transparent text-sm text-white outline-none"
            style={{ colorScheme: "dark" }}
          >
            <option value="all">All areas</option>
            {Object.entries(AREA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Calendar size={14} color="#888" />
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-transparent text-sm text-white outline-none"
            style={{ colorScheme: "dark" }}
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m!}>
                {new Date(m + "-01").toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
        </div>

        {(areaFilter !== "all" || monthFilter !== "all") && (
          <button
            onClick={() => { setAreaFilter("all"); setMonthFilter("all"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.04)", color: "#999", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <X size={13} />
            Clear filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-1 text-xs" style={{ color: "#666" }}>
          <Filter size={12} />
          {filtered.length} of {photos.length} shown
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center" style={{ color: "#555" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center" style={{ borderRadius: 16 }}>
          <ImageIcon size={48} color="#333" strokeWidth={1.5} style={{ margin: "0 auto 16px" }} />
          <p className="text-lg font-semibold text-white mb-1" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            {photos.length === 0 ? "No photos yet" : "No photos match your filters"}
          </p>
          <p className="text-sm" style={{ color: "#888" }}>
            {photos.length === 0 ? "Upload your first photo to get started" : "Try adjusting your filters"}
          </p>
          {photos.length === 0 && (
            <Link href="/portal/manager/upload" className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "#D4FF4F", color: "#0A0A0A" }}>
              Upload Photos
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {monthKeys.map((monthKey) => {
            const monthPhotos = grouped[monthKey];
            const monthLabel = monthKey === "Unknown"
              ? "No month set"
              : new Date(monthKey + "-01").toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
            return (
              <div key={monthKey}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                    {monthLabel}
                  </h2>
                  <span className="text-xs" style={{ color: "#888" }}>{monthPhotos.length} photo{monthPhotos.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {monthPhotos.map((p) => {
                    const src = p.storage_path ? `${STORAGE}${p.storage_path}` : null;
                    const status = (p.status as keyof typeof statusColors) ?? "pending";
                    const sc = statusColors[status] ?? statusColors.pending;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setLightbox(p)}
                        className="aspect-square rounded-xl overflow-hidden relative group"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={24} color="#444" />
                          </div>
                        )}
                        {/* Status pill */}
                        <span
                          className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                          style={{ background: sc.bg, color: sc.color, backdropFilter: "blur(8px)" }}
                        >
                          {status}
                        </span>
                        {/* Area tag */}
                        {p.area_tag && (
                          <span
                            className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(0,0,0,0.7)", color: "#fff", backdropFilter: "blur(8px)" }}
                          >
                            {AREA_LABELS[p.area_tag] ?? p.area_tag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <X size={20} color="#fff" />
          </button>
          <div className="max-w-5xl max-h-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            {lightbox.storage_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${STORAGE}${lightbox.storage_path}`}
                alt=""
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
            <div className="flex items-center gap-3 text-sm text-white">
              <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "rgba(212,255,79,0.12)", color: "#D4FF4F" }}>
                {lightbox.area_tag ? AREA_LABELS[lightbox.area_tag] : "Other"}
              </span>
              <span style={{ color: "#B0B0B0" }}>{formatDate(lightbox.created_at)}</span>
              <span style={{ color: "#666" }}>·</span>
              <span style={{ color: "#B0B0B0" }}>{formatBytes(lightbox.file_size_bytes)}</span>
              {lightbox.storage_path && (
                <a
                  href={`${STORAGE}${lightbox.storage_path}`}
                  download
                  target="_blank"
                  rel="noopener"
                  className="ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: "#D4FF4F", color: "#0A0A0A" }}
                >
                  <Download size={13} strokeWidth={2.5} />
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
