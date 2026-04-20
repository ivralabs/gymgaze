import { Building2, MapPin, Megaphone, DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PhotoApprovalButtons from "./photo-approval-buttons";

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA")}`;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

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
    .select("amount")
    .gte("month", `${currentMonth}-01`);
  const revenueMTD = (revenueRows ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);

  // Pending photos — last 5
  const { data: pendingPhotos } = await supabase
    .from("venue_photos")
    .select("id, venue_id, month, created_at, uploaded_by, venues(name), profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const statTiles = [
    {
      label: "Total Networks",
      value: String(networksCount ?? 0),
      sub: "Registered brands",
      icon: Building2,
      color: "#FF6B35",
    },
    {
      label: "Total Venues",
      value: String(venuesCount ?? 0),
      sub: "Active venues",
      icon: MapPin,
      color: "#3B82F6",
    },
    {
      label: "Active Campaigns",
      value: String(campaignsCount ?? 0),
      sub: "Running now",
      icon: Megaphone,
      color: "#10B981",
    },
    {
      label: "Revenue MTD",
      value: formatCurrency(revenueMTD),
      sub: now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" }),
      icon: DollarSign,
      color: "#F59E0B",
    },
  ];

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
          {!pendingPhotos || pendingPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 size={32} color="#10B981" strokeWidth={1.5} className="mb-2" />
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
