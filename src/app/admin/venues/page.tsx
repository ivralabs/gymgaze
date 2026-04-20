import Link from "next/link";
import { Plus, Monitor, Image } from "lucide-react";

const mockVenues = [
  { id: "1", name: "FitZone Sandton", brand: "FitZone Group", city: "Sandton", status: "active", screensCount: 4, lastPhoto: "2026-04-18" },
  { id: "2", name: "PowerGym Rosebank", brand: "PowerGym SA", city: "Rosebank", status: "active", screensCount: 3, lastPhoto: "2026-04-17" },
  { id: "3", name: "IronHouse Cape Town", brand: "IronHouse Fitness", city: "Cape Town", status: "active", screensCount: 2, lastPhoto: "2026-04-16" },
  { id: "4", name: "Peak Durban North", brand: "Peak Performance", city: "Durban", status: "inactive", screensCount: 1, lastPhoto: "2026-03-31" },
  { id: "5", name: "SweatBox Pretoria", brand: "SweatBox Studios", city: "Pretoria", status: "active", screensCount: 3, lastPhoto: "2026-04-15" },
  { id: "6", name: "FitZone Fourways", brand: "FitZone Group", city: "Fourways", status: "coming_soon", screensCount: 0, lastPhoto: null },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  inactive: { label: "Inactive", color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  coming_soon: { label: "Coming Soon", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
};

export default function VenuesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Venues
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666666" }}>
            {mockVenues.length} venues registered
          </p>
        </div>
        <Link
          href="/admin/venues/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "#FF6B35" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Venue
        </Link>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #333333" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#2A2A2A" }}>
              {["Venue", "Network", "City", "Status", "Screens", "Last Photo", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#666666" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockVenues.map((venue, idx) => {
              const status = statusConfig[venue.status] || statusConfig.inactive;
              return (
                <tr
                  key={venue.id}
                  style={{
                    backgroundColor: "#1E1E1E",
                    borderTop: idx > 0 ? "1px solid #2A2A2A" : "none",
                  }}
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/venues/${venue.id}`}
                      className="text-sm font-medium text-white hover:text-orange-400 transition-colors"
                    >
                      {venue.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#B3B3B3" }}>
                    {venue.brand}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#B3B3B3" }}>
                    {venue.city}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Monitor size={14} color="#666666" strokeWidth={2} />
                      <span className="text-sm" style={{ color: "#B3B3B3" }}>
                        {venue.screensCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Image size={14} color="#666666" strokeWidth={2} />
                      <span className="text-sm" style={{ color: venue.lastPhoto ? "#B3B3B3" : "#444444" }}>
                        {venue.lastPhoto || "Never"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/venues/${venue.id}`}
                      className="text-xs font-medium"
                      style={{ color: "#FF6B35" }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
