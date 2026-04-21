import { Building2, MapPin, Megaphone, DollarSign, Clock, CheckCircle2, Plus, Zap, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PhotoApprovalButtons from "./photo-approval-buttons";

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA")}`;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get admin profile name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const adminName = profile?.full_name ?? "Mlungisi";

  // Total networks
  const { count: networksCount } = await supabase
    .from("gym_brands")
    .select("id", { count: "exact", head: true });

  // Total active venues
  const { count: venuesCount } = await supabase
    .from("venues")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  // Active campaigns
  const today = new Date().toISOString().slice(0, 10);
  const { count: campaignsCount } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .gte("end_date", today);

  // Revenue MTD
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data: revenueRows } = await supabase
    .from("revenue_entries")
    .select("rental_zar, revenue_share_zar")
    .gte("month", `${currentMonth}-01`);
  const revenueMTD = (revenueRows ?? []).reduce(
    (s, r) => s + (r.rental_zar ?? 0) + (r.revenue_share_zar ?? 0),
    0
  );

  // Pending photos — last 5
  const { data: pendingPhotos } = await supabase
    .from("venue_photos")
    .select("id, venue_id, month, created_at, uploaded_by, venues(name), profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: pendingCount } = await supabase
    .from("venue_photos")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const dateStr = now.toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statTiles = [
    {
      label: "TOTAL NETWORKS",
      value: String(networksCount ?? 0),
      sub: "Registered brands",
      icon: Building2,
    },
    {
      label: "ACTIVE VENUES",
      value: String(venuesCount ?? 0),
      sub: "Currently active",
      icon: MapPin,
    },
    {
      label: "ACTIVE CAMPAIGNS",
      value: String(campaignsCount ?? 0),
      sub: "Running now",
      icon: Megaphone,
    },
    {
      label: "REVENUE MTD",
      value: formatCurrency(revenueMTD),
      sub: now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" }),
      icon: DollarSign,
    },
  ];

  return (
    <div className="p-8">
      {/* Hero / Welcome section */}
      <div
        className="rounded-2xl p-8 mb-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #141414 0%, #1a1f12 100%)",
          border: "1px solid #2A2A2A",
        }}
      >
        {/* Subtle lime glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(212,255,79,0.06) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#666666" }}>
                {dateStr}
              </p>
              <h1
                className="text-4xl font-bold text-white mb-3"
                style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
              >
                Welcome back, {adminName}
              </h1>
              <p className="text-sm" style={{ color: "#A3A3A3" }}>
                Here&apos;s what&apos;s happening across your GymGaze platform today.
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#D4FF4F" }}
            >
              <Zap size={22} color="#0A0A0A" strokeWidth={2.5} />
            </div>
          </div>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/admin/campaigns/new"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
            >
              <Plus size={14} strokeWidth={2.5} />
              New Campaign
            </Link>
            <Link
              href="/admin/venues/new"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #3A3A3A",
                color: "#FFFFFF",
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Venue
            </Link>
            <Link
              href="/admin/revenue/new"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #3A3A3A",
                color: "#FFFFFF",
              }}
            >
              <TrendingUp size={14} strokeWidth={2} />
              Log Revenue
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className="rounded-2xl p-6"
              style={{
                backgroundColor: "#141414",
                border: "1px solid #2A2A2A",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-xs font-medium uppercase tracking-widest"
                  style={{ color: "#666666" }}
                >
                  {tile.label}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
                >
                  <Icon size={16} color="#D4FF4F" strokeWidth={2} />
                </div>
              </div>
              <div
                className="text-4xl font-bold text-white mb-1 tabular-nums"
                style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
              >
                {tile.value}
              </div>
              <div className="text-xs" style={{ color: "#666666" }}>
                {tile.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Photos */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid #2A2A2A" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: "#141414", borderBottom: "1px solid #2A2A2A" }}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} color="#D4FF4F" strokeWidth={2} />
            <h2
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Pending Photo Approvals
            </h2>
            {(pendingCount ?? 0) > 0 && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(212,255,79,0.12)", color: "#D4FF4F" }}
              >
                {pendingCount}
              </span>
            )}
          </div>
          <Link
            href="/admin/photos"
            className="text-xs font-medium transition-colors duration-150"
            style={{ color: "#D4FF4F" }}
          >
            View all →
          </Link>
        </div>

        <div style={{ backgroundColor: "#141414" }}>
          {!pendingPhotos || pendingPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 size={32} color="#D4FF4F" strokeWidth={1.5} className="mb-2" />
              <p className="text-sm text-white">All caught up!</p>
              <p className="text-xs mt-1" style={{ color: "#666666" }}>No photos pending approval</p>
            </div>
          ) : (
            pendingPhotos.map((photo, idx) => {
              const venue = photo.venues as { name?: string } | null;
              const uploader = photo.profiles as { full_name?: string } | null;
              const monthLabel = photo.month
                ? new Date(photo.month.slice(0, 7) + "-01").toLocaleDateString("en-ZA", {
                    month: "short",
                    year: "numeric",
                  })
                : "—";

              return (
                <div
                  key={photo.id}
                  className="flex items-center justify-between px-6 py-4"
                  style={{
                    borderBottom: idx < pendingPhotos.length - 1 ? "1px solid #2A2A2A" : "none",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{venue?.name ?? "Unknown Venue"}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#666666" }}>
                      {uploader?.full_name ?? "Unknown"} &middot; {monthLabel}
                    </p>
                  </div>
                  <PhotoApprovalButtons photoId={photo.id} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
