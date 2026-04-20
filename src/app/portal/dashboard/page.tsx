import Link from "next/link";
import { MapPin, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "rgba(5,150,105,0.1)" },
  inactive: { label: "Inactive", color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" },
  coming_soon: { label: "Coming Soon", color: "#D97706", bg: "rgba(217,119,6,0.1)" },
};

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA")}`;
}

function getMonthLabel(monthStr: string) {
  // monthStr = "2026-04-01" or "2026-04"
  const d = new Date(monthStr + (monthStr.length === 7 ? "-01" : ""));
  return d.toLocaleDateString("en-ZA", { month: "short" });
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
      <div className="p-8 text-center" style={{ color: "#6B7280" }}>
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
    .select("venue_id, amount, month")
    .in("venue_id", venueIds.length > 0 ? venueIds : ["00000000-0000-0000-0000-000000000000"]);

  const entries = revenueEntries ?? [];

  // Calculate MTD and YTD
  const revenueMTD = entries
    .filter((e) => e.month?.slice(0, 7) === currentMonth)
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const revenueYTD = entries
    .filter((e) => e.month?.slice(0, 4) === String(currentYear))
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);

  // Per-venue MTD revenue
  const venueMTDMap: Record<string, number> = {};
  entries
    .filter((e) => e.month?.slice(0, 7) === currentMonth)
    .forEach((e) => {
      venueMTDMap[e.venue_id] = (venueMTDMap[e.venue_id] ?? 0) + (e.amount ?? 0);
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
      .reduce((sum, e) => sum + (e.amount ?? 0), 0)
  );
  const maxTrend = Math.max(...trendValues, 1);

  const monthLabel = now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  const ytdLabel = `Jan–${now.toLocaleDateString("en-ZA", { month: "short" })} ${currentYear}`;

  const stats = [
    { label: "Total Venues", value: String(venues?.length ?? 0), sub: "Under your brand" },
    { label: "Revenue MTD", value: formatCurrency(revenueMTD), sub: monthLabel },
    { label: "Revenue YTD", value: formatCurrency(revenueYTD), sub: ytdLabel },
  ];

  const primaryColor = brand?.primary_color ?? "#FF6B35";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
        >
          Owner Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          {brand?.name ?? "Your Brand"} &middot; {monthLabel}
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-6"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>
              {stat.label}
            </p>
            <p
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
            >
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend chart */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} color={primaryColor} strokeWidth={2} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
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
                  height={barH}
                  rx={6}
                  fill={isLast ? primaryColor : `${primaryColor}40`}
                />
                <text
                  x={x + 30}
                  y={195}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#9CA3AF"
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
                    fill={isLast ? primaryColor : "#9CA3AF"}
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
          className="text-base font-semibold mb-4"
          style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
        >
          Your Venues
        </h2>
        {!venues || venues.length === 0 ? (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>No venues found for your brand.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {venues.map((venue) => {
              const status = statusConfig[venue.status] ?? statusConfig.inactive;
              const venueMTD = venueMTDMap[venue.id] ?? 0;
              return (
                <Link
                  key={venue.id}
                  href={`/portal/venues/${venue.id}`}
                  className="block rounded-xl p-5 transition-shadow duration-150 hover:shadow-md"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${primaryColor}1A` }}
                    >
                      <MapPin size={16} color={primaryColor} strokeWidth={2} />
                    </div>
                    <span
                      className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <h3
                    className="text-sm font-semibold mb-0.5"
                    style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
                  >
                    {venue.name}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
                    {venue.city}
                  </p>
                  <div className="pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Revenue this month</p>
                    <p
                      className="text-base font-bold mt-0.5"
                      style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
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
