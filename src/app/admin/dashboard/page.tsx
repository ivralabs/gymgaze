import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import PhotoApprovalButtons from "./photo-approval-buttons";
import RadialProgress from "@/components/gymgaze/RadialProgress";

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA")}`;
}

const MONTHLY_TARGET = 100000;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const adminName = profile?.full_name ?? "Mlungisi";

  const { count: networksCount } = await supabase
    .from("gym_brands")
    .select("id", { count: "exact", head: true });

  const { count: venuesCount } = await supabase
    .from("venues")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const today = new Date().toISOString().slice(0, 10);
  const { count: activeCampaignsCount } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .gte("end_date", today);

  const { count: totalCampaignsCount } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true });

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

  const campaignPct =
    (totalCampaignsCount ?? 0) > 0
      ? Math.round(((activeCampaignsCount ?? 0) / (totalCampaignsCount ?? 1)) * 100)
      : 0;
  const revenuePct = Math.min(100, Math.round((revenueMTD / MONTHLY_TARGET) * 100));

  return (
    <div className="p-8">
      {/* Hero Panel */}
      <div
        className="relative overflow-hidden rounded-2xl mb-8"
        style={{
          background: "linear-gradient(135deg, #141414 0%, #0F0F0F 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <img
          src="/hero-object.png"
          alt=""
          className="absolute right-0 top-0 h-full w-auto opacity-30 object-cover pointer-events-none select-none"
        />
        <div className="relative z-10 p-8">
          <h1
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "2.5rem",
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back, {adminName}
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            Your GymGaze command centre
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link
              href="/admin/campaigns/new"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150"
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
                border: "1px solid rgba(255,255,255,0.12)",
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
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#FFFFFF",
              }}
            >
              <TrendingUp size={14} strokeWidth={2} />
              Log Revenue
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Tiles — Orion style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Plain: Networks */}
        <div
          className="glass-card rounded-2xl p-6"
          style={{ borderRadius: 16 }}
        >
          <p
            className="text-xs font-medium uppercase tracking-widest mb-3"
            style={{ color: "#666666" }}
          >
            Total Networks
          </p>
          <div
            className="tabular-nums text-white"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "3.5rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {networksCount ?? 0}
          </div>
          <div
            className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: "rgba(212,255,79,0.08)", color: "#D4FF4F" }}
          >
            +12% this month
          </div>
        </div>

        {/* Plain: Venues */}
        <div
          className="glass-card rounded-2xl p-6"
          style={{ borderRadius: 16 }}
        >
          <p
            className="text-xs font-medium uppercase tracking-widest mb-3"
            style={{ color: "#666666" }}
          >
            Active Venues
          </p>
          <div
            className="tabular-nums text-white"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "3.5rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {venuesCount ?? 0}
          </div>
          <div
            className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: "rgba(212,255,79,0.08)", color: "#D4FF4F" }}
          >
            Currently active
          </div>
        </div>

        {/* Radial: Campaigns */}
        <div
          className="glass-card rounded-2xl p-6 flex items-center gap-4"
          style={{ borderRadius: 16 }}
        >
          <RadialProgress
            value={campaignPct}
            size={80}
            label="active"
            sublabel="of total"
          />
          <div>
            <p
              className="text-xs font-medium uppercase tracking-widest mb-2"
              style={{ color: "#666666" }}
            >
              Active Campaigns
            </p>
            <div
              className="tabular-nums text-white"
              style={{
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 800,
                fontSize: "2rem",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {activeCampaignsCount ?? 0}
            </div>
            <p className="text-xs mt-1" style={{ color: "#666666" }}>
              of {totalCampaignsCount ?? 0} total
            </p>
          </div>
        </div>

        {/* Radial: Revenue MTD */}
        <div
          className="glass-card rounded-2xl p-6 flex items-center gap-4"
          style={{ borderRadius: 16 }}
        >
          <RadialProgress
            value={revenuePct}
            size={80}
            label="target"
            sublabel="vs 100k"
          />
          <div>
            <p
              className="text-xs font-medium uppercase tracking-widest mb-2"
              style={{ color: "#666666" }}
            >
              Revenue MTD
            </p>
            <div
              className="tabular-nums text-white"
              style={{
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 800,
                fontSize: "1.4rem",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {formatCurrency(revenueMTD)}
            </div>
            <p className="text-xs mt-1" style={{ color: "#666666" }}>
              {now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Photos */}
      <div
        className="glass-card rounded-2xl overflow-hidden"
        style={{ borderRadius: 16 }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
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

        <div>
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
                    borderBottom: idx < pendingPhotos.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
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
