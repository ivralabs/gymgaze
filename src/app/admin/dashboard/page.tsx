import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, TrendingUp, Clock, CheckCircle2, Footprints, Monitor } from "lucide-react";
import PhotoApprovalButtons from "./photo-approval-buttons";
import RadialProgress from "@/components/gymgaze/RadialProgress";
import CommissionCard from "./CommissionCard";

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
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const adminName = profile?.full_name ?? "Mlungisi";
  const userRole = profile?.role ?? "viewer";

  // Sales: fetch their MTD campaigns
  const SALES_MONTHLY_TARGET = 50000;
  let salesCampaignCount = 0;
  let salesRevenueMTD = 0;

  if (userRole === "sales") {
    const _salesNow = new Date();
    const _salesYear = _salesNow.getFullYear();
    const _salesMo = String(_salesNow.getMonth() + 1).padStart(2, "0");
    const _monthStart = `${_salesYear}-${_salesMo}-01`;
    const _nextMonth = new Date(_salesYear, _salesNow.getMonth() + 1, 1);
    const _monthEnd = _nextMonth.toISOString().slice(0, 10);

    const { data: salesCampaigns } = await supabase
      .from("campaigns")
      .select("id, total_value")
      .eq("created_by", user.id)
      .gte("created_at", _monthStart)
      .lt("created_at", _monthEnd);

    salesCampaignCount = (salesCampaigns ?? []).length;
    salesRevenueMTD = (salesCampaigns ?? []).reduce(
      (s, c) => s + (Number(c.total_value) || 0),
      0
    );
  }

  const { count: networksCount } = await supabase
    .from("gym_brands")
    .select("id", { count: "exact", head: true });

  const { count: venuesCount } = await supabase
    .from("venues")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  // Screen inventory by size
  const { data: screenSizeRows } = await supabase
    .from("screens")
    .select("size_inches")
    .eq("is_active", true);

  const screenBuckets = [
    { label: "Small", range: "≤32\"" , min: 0,  max: 32  },
    { label: "Medium", range: "43–55\"" , min: 33, max: 55  },
    { label: "Large", range: "65–75\"" , min: 56, max: 75  },
    { label: "XL",    range: "85\"+"     , min: 76, max: 9999 },
  ];

  const totalScreens = (screenSizeRows ?? []).length;
  const bucketCounts = screenBuckets.map((b) => ({
    ...b,
    count: (screenSizeRows ?? []).filter(
      (s) => (s.size_inches ?? 0) >= b.min && (s.size_inches ?? 0) <= b.max
    ).length,
  }));

  // Network footfall totals — sum across all venues
  const { data: footfallRows } = await supabase
    .from("venues")
    .select("daily_entries, weekly_entries, monthly_entries")
    .eq("status", "active");

  const footfallVenues = (footfallRows ?? []).filter(
    (v) => v.daily_entries != null || v.weekly_entries != null || v.monthly_entries != null
  );
  const totalDaily = footfallRows?.reduce((s, v) => s + (v.daily_entries ?? 0), 0) ?? 0;
  const totalWeekly = footfallRows?.reduce((s, v) => s + (v.weekly_entries ?? 0), 0) ?? 0;
  const totalMonthly = footfallRows?.reduce((s, v) => s + (v.monthly_entries ?? 0), 0) ?? 0;
  const venuesWithData = footfallVenues.length || 1;

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
    <div className="p-4 md:p-8">
      {/* Sales Commission Card — only for sales role */}
      {userRole === "sales" && (
        <CommissionCard
          campaignCount={salesCampaignCount}
          revenueMTD={salesRevenueMTD}
          target={SALES_MONTHLY_TARGET}
          month={now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
        />
      )}

      {/* Hero Panel */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-8"
        style={{ borderRadius: 16 }}
      >

        <div className="relative z-10 p-5 md:p-8">
          <h1
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back, {adminName}
          </h1>
          <p style={{ color: "#999", marginTop: "0.5rem" }}>
            Your GymGaze command centre
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link
              href="/admin/campaigns/new"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
            >
              <Plus size={14} strokeWidth={2.5} />
              New Campaign
            </Link>
            <Link
              href="/admin/venues/new"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150"
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150"
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
            style={{ color: "#B0B0B0" }}
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
            style={{ color: "#B0B0B0" }}
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
              style={{ color: "#B0B0B0" }}
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
            <p className="text-xs mt-1" style={{ color: "#B0B0B0" }}>
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
              style={{ color: "#B0B0B0" }}
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
            <p className="text-xs mt-1" style={{ color: "#B0B0B0" }}>
              {now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Screen Inventory */}
      <div className="glass-card rounded-2xl overflow-hidden mb-8" style={{ borderRadius: 16 }}>
        <div
          className="flex items-center gap-2 px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Monitor size={16} color="#D4FF4F" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            Screen Inventory
          </h2>
          <span className="text-xs ml-1" style={{ color: "#666" }}>
            {totalScreens} active screen{totalScreens !== 1 ? "s" : ""}
          </span>
        </div>
        {totalScreens === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Monitor size={28} color="#333" strokeWidth={1.5} className="mb-2" />
            <p className="text-sm" style={{ color: "#555" }}>No active screens yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {bucketCounts.map((b) => {
              const pct = totalScreens > 0 ? Math.round((b.count / totalScreens) * 100) : 0;
              return (
                <div key={b.label} className="px-6 py-5">
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#B0B0B0" }}>{b.label}</p>
                    <p className="text-xs" style={{ color: "#555" }}>{b.range}</p>
                  </div>
                  <div
                    className="tabular-nums text-white"
                    style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "2.4rem", letterSpacing: "-0.02em", lineHeight: 1 }}
                  >
                    {b.count}
                  </div>
                  <p className="text-xs mt-2 mb-3" style={{ color: "#666" }}>{pct}% of network</p>
                  {/* Fill bar */}
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 4, backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: pct > 0 ? "#D4FF4F" : "transparent" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Network Footfall */}
      <div className="glass-card rounded-2xl overflow-hidden mb-8" style={{ borderRadius: 16 }}>
        <div
          className="flex items-center gap-2 px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Footprints size={16} color="#D4FF4F" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>
            Network Footfall
          </h2>
          <span className="text-xs ml-1" style={{ color: "#666" }}>
            across {venuesCount ?? 0} active venues
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {[
            { label: "Daily Entries", value: totalDaily, avg: Math.round(totalDaily / venuesWithData) },
            { label: "Weekly Entries", value: totalWeekly, avg: Math.round(totalWeekly / venuesWithData) },
            { label: "Monthly Entries", value: totalMonthly, avg: Math.round(totalMonthly / venuesWithData) },
          ].map((stat) => (
            <div key={stat.label} className="px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#B0B0B0" }}>
                {stat.label}
              </p>
              <div
                className="tabular-nums text-white"
                style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "2.4rem", letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                {stat.value > 0 ? stat.value.toLocaleString("en-ZA") : <span style={{ color: "#444", fontSize: "1.4rem", fontWeight: 500 }}>No data</span>}
              </div>
              {stat.value > 0 && (
                <p className="text-xs mt-2" style={{ color: "#666" }}>
                  avg {stat.avg.toLocaleString("en-ZA")} / venue
                </p>
              )}
            </div>
          ))}
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
              <p className="text-xs mt-1" style={{ color: "#B0B0B0" }}>No photos pending approval</p>
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
                    <p className="text-xs mt-0.5" style={{ color: "#B0B0B0" }}>
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
