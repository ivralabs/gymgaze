import Link from "next/link";
import Image from "next/image";
import {
  Camera, BarChart2, Clock, CheckCircle2, AlertCircle, Monitor,
  Calendar, MapPin, TrendingUp, ImageIcon, Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Target photos per month per venue (baseline for progress bar)
const MONTHLY_PHOTO_TARGET = 10;

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function relativeDate(d: string | null) {
  if (!d) return "Never";
  const now = Date.now();
  const then = new Date(d).getTime();
  const diff = now - then;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function ManagerPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, venue_id")
    .eq("id", user.id)
    .single();

  const venueId = profile?.venue_id;
  const managerName = profile?.full_name?.split(" ")[0] ?? "Manager";

  // If no venue assigned
  if (!venueId) {
    return (
      <div className="py-20 text-center">
        <AlertCircle size={40} color="#F59E0B" strokeWidth={1.5} style={{ margin: "0 auto 16px" }} />
        <h1 className="text-xl font-bold mb-2" style={{ color: "#fff", fontFamily: "Inter Tight, sans-serif" }}>
          No venue assigned
        </h1>
        <p style={{ color: "#B0B0B0", fontSize: 14 }}>Please contact your administrator to link a venue to your account.</p>
      </div>
    );
  }

  // Fetch venue + brand + screens + recent photos in parallel
  const [venueRes, photosRes, screensRes] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name, city, region, province, address, cover_photo_url, active_members, daily_entries, weekly_entries, monthly_entries, operating_hours, updated_at, gym_brands(name, primary_color, logo_url)")
      .eq("id", venueId)
      .single(),
    supabase
      .from("venue_photos")
      .select("id, created_at, storage_path, area_tag, month, status")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("screens")
      .select("id, label, is_active, size_inches, orientation")
      .eq("venue_id", venueId)
      .order("label"),
  ]);

  const venue = venueRes.data as typeof venueRes.data & { gym_brands: { name: string; primary_color: string | null; logo_url: string | null } | { name: string; primary_color: string | null; logo_url: string | null }[] | null };
  const allPhotos = photosRes.data ?? [];
  const screens = screensRes.data ?? [];

  const brand = Array.isArray(venue?.gym_brands) ? venue.gym_brands[0] : venue?.gym_brands;

  // This month's uploaded photos count
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: photosThisMonth } = await supabase
    .from("venue_photos")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venueId)
    .gte("created_at", currentMonthStart);

  const photosMtd = photosThisMonth ?? 0;
  const photoProgress = Math.min(100, Math.round((photosMtd / MONTHLY_PHOTO_TARGET) * 100));
  const photoGoalMet = photosMtd >= MONTHLY_PHOTO_TARGET;

  const lastUpload = allPhotos[0]?.created_at ?? null;
  const lastStatsUpdate = venue?.updated_at ?? null;

  // Stats freshness
  const statsStale = !lastStatsUpdate || (Date.now() - new Date(lastStatsUpdate).getTime()) > 30 * 24 * 60 * 60 * 1000;

  const monthLabel = now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

  // Get Supabase storage public URL base
  const STORAGE_PUBLIC_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venue-photos/`;

  const tasks = [
    {
      id: "photos",
      type: "photo",
      label: photoGoalMet ? `${monthLabel} photos complete` : `Upload ${MONTHLY_PHOTO_TARGET - photosMtd} more photos`,
      sub: `${photosMtd}/${MONTHLY_PHOTO_TARGET} submitted this month`,
      done: photoGoalMet,
      href: "/portal/manager/upload",
    },
    {
      id: "stats",
      type: "stats",
      label: statsStale ? "Update member count & entries" : "Stats up to date",
      sub: lastStatsUpdate ? `Last updated ${relativeDate(lastStatsUpdate)}` : "Never updated",
      done: !statsStale,
      href: "/portal/manager/venue",
    },
  ];

  return (
    <div>
      {/* ─── Hero with venue banner ──────────────────────────────────── */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-6"
        style={{ borderRadius: 16 }}
      >
        {venue?.cover_photo_url && (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${venue.cover_photo_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.5) 100%)",
          }}
        />
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            {brand?.logo_url ? (
              <Image src={brand.logo_url} alt={brand.name} width={20} height={20} className="object-contain" />
            ) : null}
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: brand?.primary_color ?? "#D4FF4F" }}>
              {brand?.name ?? "GymGaze"}
            </p>
          </div>
          <h1
            style={{
              fontFamily: "Inter Tight, sans-serif", fontWeight: 800,
              fontSize: "clamp(1.6rem, 5vw, 2.5rem)", color: "#fff",
              letterSpacing: "-0.02em", marginBottom: 4,
            }}
          >
            {venue?.name ?? "Your Venue"}
          </h1>
          <p className="flex items-center gap-1.5 text-sm" style={{ color: "#B0B0B0" }}>
            <MapPin size={14} strokeWidth={2} />
            {[venue?.city, venue?.province].filter(Boolean).join(", ") || "—"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#888" }}>
            Welcome back, {managerName} · {monthLabel}
          </p>
        </div>
      </div>

      {/* ─── Monthly upload progress ─────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-5 md:p-6 mb-6" style={{ borderRadius: 16 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera size={16} color="#D4FF4F" strokeWidth={2} />
            <h2 className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
              {monthLabel} Photo Progress
            </h2>
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: photoGoalMet ? "#22c55e" : "#D4FF4F" }}>
            {photosMtd}/{MONTHLY_PHOTO_TARGET}
          </span>
        </div>
        <div className="rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)", height: 8 }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${photoProgress}%`,
              background: photoGoalMet
                ? "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)"
                : "linear-gradient(90deg, #D4FF4F 0%, #A3E635 100%)",
            }}
          />
        </div>
        <p className="text-xs" style={{ color: "#888" }}>
          {photoGoalMet
            ? `✓ You've hit your monthly target. Extra photos welcome.`
            : `${MONTHLY_PHOTO_TARGET - photosMtd} more needed to hit your monthly target.`}
        </p>
      </div>

      {/* ─── Stat pills row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Members", value: venue?.active_members?.toLocaleString("en-ZA") ?? "0", icon: TrendingUp, color: "#D4FF4F" },
          { label: "Monthly Entries", value: venue?.monthly_entries?.toLocaleString("en-ZA") ?? "0", icon: BarChart2, color: "#60a5fa" },
          { label: "Screens", value: screens.length.toString(), icon: Monitor, color: "#a78bfa" },
          { label: "Last Upload", value: relativeDate(lastUpload), icon: Clock, color: "#fb923c" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={11} color="#888" strokeWidth={2} />
              <p className="text-xs" style={{ color: "#888" }}>{label}</p>
            </div>
            <p className="text-xl font-bold mt-0.5 tabular-nums" style={{ color, fontFamily: "Inter Tight, sans-serif" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Quick actions ───────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-3">
          <Link
            href="/portal/manager/upload"
            className="glass-card flex items-center gap-4 p-5 rounded-2xl transition-all duration-150"
            style={{ borderRadius: 16 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
            >
              <Camera size={22} color="#D4FF4F" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                Upload Photos
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#B0B0B0" }}>Submit screen photos</p>
            </div>
          </Link>

          <Link
            href="/portal/manager/venue"
            className="glass-card flex items-center gap-4 p-5 rounded-2xl transition-all duration-150"
            style={{ borderRadius: 16 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(96,165,250,0.08)" }}
            >
              <BarChart2 size={22} color="#60a5fa" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                Update Stats
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#B0B0B0" }}>Members & entries</p>
            </div>
          </Link>

          <Link
            href="/portal/manager/photos"
            className="glass-card flex items-center gap-4 p-5 rounded-2xl transition-all duration-150"
            style={{ borderRadius: 16 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(167,139,250,0.08)" }}
            >
              <ImageIcon size={22} color="#a78bfa" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                Photo History
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#B0B0B0" }}>See all your uploads</p>
            </div>
          </Link>
        </div>

        {/* ─── Tasks + Recent uploads ─────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Tasks */}
          <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                Tasks
              </h2>
            </div>
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: task.done ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)" }}
                  >
                    {task.done
                      ? <CheckCircle2 size={16} color="#22c55e" strokeWidth={2} />
                      : <Clock size={16} color="#f59e0b" strokeWidth={2} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: task.done ? "#888" : "#fff" }}>
                      {task.label}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#666" }}>{task.sub}</p>
                  </div>
                </div>
                {!task.done && (
                  <Link
                    href={task.href}
                    className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ml-3"
                    style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
                  >
                    Do it
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Recent uploads */}
          <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
                Recent Uploads
              </h2>
              {allPhotos.length > 0 && (
                <Link href="/portal/manager/photos" className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#D4FF4F" }}>
                  View all <Eye size={12} strokeWidth={2} />
                </Link>
              )}
            </div>
            {allPhotos.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <ImageIcon size={32} color="#333" strokeWidth={1.5} style={{ margin: "0 auto 12px" }} />
                <p className="text-sm font-medium" style={{ color: "#888" }}>No uploads yet</p>
                <p className="text-xs mt-1" style={{ color: "#666" }}>Start by uploading your first photo</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3">
                {allPhotos.map((photo) => {
                  const src = photo.storage_path ? `${STORAGE_PUBLIC_URL}${photo.storage_path}` : null;
                  return (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden relative"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      {src ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={photo.area_tag ?? "photo"}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[10px] font-semibold uppercase"
                            style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                          >
                            {relativeDate(photo.created_at)}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={16} color="#444" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Screens row ─────────────────────────────────────────── */}
      {screens.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden mt-6" style={{ borderRadius: 16 }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
              Your Screens ({screens.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: screen.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}
                >
                  <Monitor size={16} color={screen.is_active ? "#22c55e" : "#ef4444"} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{screen.label}</p>
                  <p className="text-xs" style={{ color: "#888" }}>
                    {screen.size_inches ? `${screen.size_inches}"` : "—"} · {screen.orientation ?? "landscape"} · {screen.is_active ? "Active" : "Offline"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
