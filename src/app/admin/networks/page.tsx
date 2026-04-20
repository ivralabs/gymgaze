import Link from "next/link";
import { Plus, Building2 } from "lucide-react";

const mockNetworks = [
  { id: "1", name: "FitZone Group", venueCount: 12, isActive: true, primaryColor: "#FF6B35" },
  { id: "2", name: "PowerGym SA", venueCount: 8, isActive: true, primaryColor: "#3B82F6" },
  { id: "3", name: "IronHouse Fitness", venueCount: 5, isActive: true, primaryColor: "#10B981" },
  { id: "4", name: "Peak Performance", venueCount: 3, isActive: false, primaryColor: "#8B5CF6" },
  { id: "5", name: "SweatBox Studios", venueCount: 7, isActive: true, primaryColor: "#F59E0B" },
  { id: "6", name: "CrossFit Hub", venueCount: 4, isActive: true, primaryColor: "#EF4444" },
];

export default function NetworksPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Gym Networks
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666666" }}>
            {mockNetworks.length} networks registered
          </p>
        </div>
        <Link
          href="/admin/networks/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors duration-150"
          style={{ backgroundColor: "#FF6B35" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Network
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {mockNetworks.map((network) => (
          <Link
            key={network.id}
            href={`/admin/networks/${network.id}`}
            className="block rounded-xl p-6 transition-colors duration-150 group"
            style={{
              backgroundColor: "#1E1E1E",
              border: "1px solid #333333",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${network.primaryColor}20` }}
              >
                <Building2 size={22} color={network.primaryColor} strokeWidth={2} />
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
                style={{
                  backgroundColor: network.isActive
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(107, 114, 128, 0.15)",
                  color: network.isActive ? "#10B981" : "#6B7280",
                }}
              >
                {network.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <h3
              className="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              {network.name}
            </h3>
            <p className="text-sm" style={{ color: "#666666" }}>
              {network.venueCount} venue{network.venueCount !== 1 ? "s" : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
