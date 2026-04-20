import { Building2, MapPin, Megaphone, DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";

const statTiles = [
  {
    label: "Total Networks",
    value: "12",
    sub: "+2 this month",
    icon: Building2,
    color: "#FF6B35",
  },
  {
    label: "Total Venues",
    value: "48",
    sub: "Across 8 cities",
    icon: MapPin,
    color: "#3B82F6",
  },
  {
    label: "Active Campaigns",
    value: "7",
    sub: "3 ending soon",
    icon: Megaphone,
    color: "#10B981",
  },
  {
    label: "Revenue MTD",
    value: "R 124,500",
    sub: "+18% vs last month",
    icon: DollarSign,
    color: "#F59E0B",
  },
];

const pendingPhotos = [
  { id: "1", venue: "FitZone Sandton", uploadedBy: "John M.", month: "Apr 2026", date: "2026-04-18" },
  { id: "2", venue: "PowerGym Rosebank", uploadedBy: "Sarah K.", month: "Apr 2026", date: "2026-04-17" },
  { id: "3", venue: "IronHouse Cape Town", uploadedBy: "Mike T.", month: "Apr 2026", date: "2026-04-16" },
  { id: "4", venue: "Peak Performance Durban", uploadedBy: "Lisa R.", month: "Apr 2026", date: "2026-04-15" },
];

export default function AdminDashboard() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "Inter Tight, sans-serif" }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666666" }}>
          Overview of your GymGaze platform
        </p>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className="rounded-xl p-6"
              style={{
                backgroundColor: "#1E1E1E",
                border: "1px solid #333333",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>
                  {tile.label}
                </span>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${tile.color}20` }}
                >
                  <Icon size={18} color={tile.color} strokeWidth={2} />
                </div>
              </div>
              <div
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
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
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #333333" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: "#2A2A2A", borderBottom: "1px solid #333333" }}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} color="#F59E0B" strokeWidth={2} />
            <h2
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Pending Photo Approvals
            </h2>
          </div>
          <a
            href="/admin/photos"
            className="text-xs font-medium transition-colors duration-150"
            style={{ color: "#FF6B35" }}
          >
            View all
          </a>
        </div>

        <div style={{ backgroundColor: "#1E1E1E" }}>
          {pendingPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              className="flex items-center justify-between px-6 py-4"
              style={{
                borderBottom: idx < pendingPhotos.length - 1 ? "1px solid #2A2A2A" : "none",
              }}
            >
              <div>
                <p className="text-sm font-medium text-white">{photo.venue}</p>
                <p className="text-xs mt-0.5" style={{ color: "#666666" }}>
                  Uploaded by {photo.uploadedBy} &middot; {photo.month}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs"
                  style={{ color: "#666666" }}
                >
                  {photo.date}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 rounded-lg transition-colors duration-150"
                    style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                    title="Approve"
                  >
                    <CheckCircle2 size={14} color="#10B981" strokeWidth={2} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg transition-colors duration-150"
                    style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                    title="Reject"
                  >
                    <XCircle size={14} color="#EF4444" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
