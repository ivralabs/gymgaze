import { MapPin, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total Venues", value: "8", sub: "Under your brand" },
  { label: "Revenue MTD", value: "R 42,800", sub: "April 2026" },
  { label: "Revenue YTD", value: "R 183,500", sub: "Jan–Apr 2026" },
];

const venues = [
  { id: "1", name: "FitZone Sandton", city: "Sandton", revenueMTD: 7800, status: "active" },
  { id: "2", name: "FitZone Rosebank", city: "Rosebank", revenueMTD: 6200, status: "active" },
  { id: "3", name: "FitZone Midrand", city: "Midrand", revenueMTD: 5400, status: "active" },
  { id: "4", name: "FitZone Fourways", city: "Fourways", revenueMTD: 5900, status: "active" },
  { id: "5", name: "FitZone Pretoria", city: "Pretoria", revenueMTD: 4800, status: "active" },
  { id: "6", name: "FitZone Centurion", city: "Centurion", revenueMTD: 5200, status: "active" },
  { id: "7", name: "FitZone Lynnwood", city: "Lynnwood", revenueMTD: 4300, status: "inactive" },
  { id: "8", name: "FitZone Morningside", city: "Morningside", revenueMTD: 3200, status: "active" },
];

// Last 6 months revenue trend (static placeholder)
const trendMonths = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
const trendValues = [28000, 31500, 35200, 38900, 40100, 42800];
const maxTrend = Math.max(...trendValues);

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "rgba(5,150,105,0.1)" },
  inactive: { label: "Inactive", color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" },
};

export default function PortalDashboard() {
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
          FitZone Group &middot; April 2026
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
          <TrendingUp size={18} color="#FF6B35" strokeWidth={2} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
          >
            Revenue Trend (Last 6 Months)
          </h2>
        </div>

        {/* SVG bar chart */}
        <svg viewBox="0 0 600 200" className="w-full">
          {trendValues.map((val, i) => {
            const barH = (val / maxTrend) * 160;
            const x = i * 100 + 20;
            const y = 180 - barH;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={60}
                  height={barH}
                  rx={6}
                  fill={i === trendValues.length - 1 ? "#FF6B35" : "#FFE4D6"}
                />
                <text
                  x={x + 30}
                  y={190}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#9CA3AF"
                  fontFamily="Inter, sans-serif"
                >
                  {trendMonths[i]}
                </text>
                <text
                  x={x + 30}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill={i === trendValues.length - 1 ? "#FF6B35" : "#9CA3AF"}
                  fontFamily="Inter, sans-serif"
                  fontWeight={i === trendValues.length - 1 ? "600" : "400"}
                >
                  R{(val / 1000).toFixed(0)}k
                </text>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {venues.map((venue) => {
            const status = statusConfig[venue.status] || statusConfig.inactive;
            return (
              <div
                key={venue.id}
                className="rounded-xl p-5"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(255,107,53,0.1)" }}
                  >
                    <MapPin size={16} color="#FF6B35" strokeWidth={2} />
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
                    R {venue.revenueMTD.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
