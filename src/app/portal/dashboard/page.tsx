import Link from "next/link";
import { MapPin, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#D4FF4F", bg: "rgba(212,255,79,0.1)" },
  inactive: { label: "Inactive", color: "#909090", bg: "rgba(102,102,102,0.15)" },
  coming_soon: { label: "Coming Soon", color: "#A3A3A3", bg: "rgba(163,163,163,0.15)" },
};

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA")}`;
}

export default async function PortalDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get profile + gym_brand_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, gym_brand_id")
    .eq("id", user.id)
    .single();

  if (!profile?.gym_brand_id) {
    return (
      <div className="p-8 text-center" style={{ color: "#909090" }}>
        No gym brand associated with your account. Please contact support.
      </div>
    );
  }

  // Fetch gym brand
  const { data: brand } = await supabase
    .from("gym_brands")
    .select("name, primary_color")
    .eq("id", profile.gym_brand_id)
    .single();

  // Fetch venues for this brand
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city, status, active_members")
    .eq("gym_brand_id", profile.gym_brand_id)
    .order("name");

  const venueIds = (venues ?? []).map((v) => v.id);

  // Fetch revenue entries for these venues
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: revenueEntries } = await supabase
    .from("revenue_entries")
    .select("venue_id, rental_zar, revenue_share_zar, month")
    .in("venue_id", venueIds.length > 0 ? venueIds : ["00000000-0000-0000-0000-000000000000"]);

  const entries = revenueEntries ?? [];

  // Calculate MTD and YTD
  const revenueMTD = entries
    .filter((e) => e.month?.slice(0, 7) === currentMonth)
    .reduce((sum, e) => sum + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0);

  const revenueYTD = entries
    .filter((e) => e.month?.slice(0, 4) === String(currentYear))
    .reduce((sum, e) => sum + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0);

  // Per-venue MTD revenue
  const venueMTDMap: Record<string, number> = {};
  entries
    .filter((e) => e.month?.slice(0, 7) === currentMonth)
    .forEach((e) => {
      venueMTDMap[e.venue_id] = (venueMTDMap[e.venue_id] ?? 0) + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0);
    });

  // Revenue trend: last 6 months
  const trendMonths: string[] = [];
  const trendLabels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trendMonths.push(key);
    trendLabels.push(d.toLocaleDateString("en-ZA", { month: "short" }));
  }

  const trendValues = trendMonths.map((m) =>
    entries
      .filter((e) => e.month?.slice(0, 7) === m)
      .reduce((sum, e) => sum + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0)
  );
  const maxTrend = Math.max(...trendValues, 1);

  const monthLabel = now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  const ytdLabel = `Jan–${now.toLocaleDateString("en-ZA", { month: "short" })} ${currentYear}`;

  const stats = [
    { label: "TOTAL VENUES", value: String(venues?.length ?? 0), sub: "Under your brand" },
    { label: "REVENUE MTD", value: formatCurrency(revenueMTD), sub: monthLabel },
    { label: "REVENUE YTD", value: formatCurrency(revenueYTD), sub: ytdLabel },
  ];

  return (
    <div>
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
          className="absolute right-0 top-0 h-full w-auto opacity-50 object-cover pointer-events-none select-none"
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
            {brand?.name ?? "Welcome"}
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Owner Dashboard &middot; {monthLabel}</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-6"
            style={{ borderRadius: 16 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#909090" }}>
              {stat.label}
            </p>
            <p
              className="text-3xl font-bold mb-1 tabular-nums"
              style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em", color: "#FFFFFF" }}
            >
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: "#909090" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend chart */}
      <div
        className="glass-card rounded-2xl p-6 mb-8"
        style={{ borderRadius: 16 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} color="#D4FF4F" strokeWidth={2} />
          <h2
            className="text-base font-semibold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Revenue Trend (Last 6 Months)
          </h2>
        </div>

        <svg viewBox="0 0 600 200" className="w-full">
          {trendValues.map((val, i) => {
            const barH = (val / maxTrend) * 160;
            const x = i * 100 + 20;
            const y = 180 - barH;
            const isLast = i === trendValues.length - 1;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={60}
                  height={barH || 4}
                  rx={6}
                  fill={isLast ? "#D4FF4F" : "rgba(212,255,79,0.25)"}
                />
                <text
                  x={x + 30}
                  y={195}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#909090"
                  fontFamily="Inter, sans-serif"
                >
                  {trendLabels[i]}
                </text>
                {val > 0 && (
                  <text
                    x={x + 30}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill={isLast ? "#D4FF4F" : "#909090"}
                    fontFamily="Inter, sans-serif"
                    fontWeight={isLast ? "600" : "400"}
                  >
                    R{(val / 1000).toFixed(0)}k
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Venue cards */}
      <div>
        <h2
          className="text-base font-semibold mb-4 text-white"
          style={{ fontFamily: "Inter Tight, sans-serif" }}
        >
          Your Venues
        </h2>
        {!venues || venues.length === 0 ? (
          <p className="text-sm" style={{ color: "#909090" }}>No venues found for your brand.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {venues.map((venue) => {
              const status = statusConfig[venue.status] ?? statusConfig.inactive;
              const venueMTD = venueMTDMap[venue.id] ?? 0;
              return (
                <Link
                  key={venue.id}
                  href={`/portal/venues/${venue.id}`}
                  className="glass-card block rounded-2xl p-5 transition-colors duration-150"
                  style={{ borderRadius: 16 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
                    >
                      <MapPin size={16} color="#D4FF4F" strokeWidth={2} />
                    </div>
                    <span
                      className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <h3
                    className="text-sm font-semibold mb-0.5 text-white"
                    style={{ fontFamily: "Inter Tight, sans-serif" }}
                  >
                    {venue.name}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: "#909090" }}>
                    {venue.city}
                  </p>
                  <div className="pt-3" style={{ borderTop: "1px solid #2A2A2A" }}>
                    <p className="text-xs" style={{ color: "#909090" }}>Revenue this month</p>
                    <p
                      className="text-base font-bold mt-0.5 tabular-nums"
                      style={{ fontFamily: "Inter Tight, sans-serif", color: "#FFFFFF" }}
                    >
                      {formatCurrency(venueMTD)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
