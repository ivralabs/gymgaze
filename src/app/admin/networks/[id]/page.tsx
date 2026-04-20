import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Phone, Mail, User } from "lucide-react";

const mockNetwork = {
  id: "1",
  name: "FitZone Group",
  primaryColor: "#FF6B35",
  contactName: "James Dube",
  contactEmail: "james@fitzone.co.za",
  contactPhone: "+27 11 555 1234",
  isActive: true,
};

const mockVenues = [
  { id: "1", name: "FitZone Sandton", city: "Sandton", status: "active", screensCount: 4 },
  { id: "2", name: "FitZone Rosebank", city: "Rosebank", status: "active", screensCount: 3 },
  { id: "3", name: "FitZone Midrand", city: "Midrand", status: "inactive", screensCount: 2 },
  { id: "4", name: "FitZone Fourways", city: "Fourways", status: "coming_soon", screensCount: 0 },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  inactive: { label: "Inactive", color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  coming_soon: { label: "Coming Soon", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
};

export default function NetworkDetailPage({ params }: { params: { id: string } }) {
  const network = mockNetwork;

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/networks"
          className="p-2 rounded-lg"
          style={{ backgroundColor: "#1E1E1E", color: "#B3B3B3" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            {network.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#666666" }}>
            Network ID: {params.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brand info card */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${network.primaryColor}20` }}
            >
              <Building2 size={22} color={network.primaryColor} strokeWidth={2} />
            </div>
            <div>
              <h2
                className="text-base font-semibold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                {network.name}
              </h2>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor: network.isActive ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)",
                  color: network.isActive ? "#10B981" : "#6B7280",
                }}
              >
                {network.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#2A2A2A" }}
              >
                <User size={14} color="#666666" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#666666" }}>Contact</p>
                <p className="text-sm text-white">{network.contactName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#2A2A2A" }}
              >
                <Mail size={14} color="#666666" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#666666" }}>Email</p>
                <p className="text-sm text-white">{network.contactEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#2A2A2A" }}
              >
                <Phone size={14} color="#666666" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#666666" }}>Phone</p>
                <p className="text-sm text-white">{network.contactPhone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${network.primaryColor}30` }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: network.primaryColor }}
                />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#666666" }}>Brand Color</p>
                <p className="text-sm font-mono text-white">{network.primaryColor}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Venues list */}
        <div className="lg:col-span-2">
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #333333" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ backgroundColor: "#2A2A2A", borderBottom: "1px solid #333333" }}
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} color="#FF6B35" strokeWidth={2} />
                <h3
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "Inter Tight, sans-serif" }}
                >
                  Venues ({mockVenues.length})
                </h3>
              </div>
              <Link
                href="/admin/venues/new"
                className="text-xs font-medium"
                style={{ color: "#FF6B35" }}
              >
                Add venue
              </Link>
            </div>

            <table className="w-full" style={{ backgroundColor: "#1E1E1E" }}>
              <thead>
                <tr style={{ backgroundColor: "#2A2A2A" }}>
                  {["Venue", "City", "Screens", "Status"].map((h) => (
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
                        {venue.city}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "#B3B3B3" }}>
                        {venue.screensCount}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
                          style={{ backgroundColor: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
