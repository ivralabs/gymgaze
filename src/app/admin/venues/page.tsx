import Link from "next/link";
import { Monitor, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddVenueForm from "./add-venue-form";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  inactive: { label: "Inactive", color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  coming_soon: { label: "Coming Soon", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
};

export default async function VenuesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city, status, screens(id), gym_brands(name)")
    .order("name");

  // Get last photo date per venue
  const { data: lastPhotos } = await supabase
    .from("venue_photos")
    .select("venue_id, created_at")
    .order("created_at", { ascending: false });

  const lastPhotoMap: Record<string, string> = {};
  for (const p of lastPhotos ?? []) {
    if (!lastPhotoMap[p.venue_id]) {
      lastPhotoMap[p.venue_id] = p.created_at?.slice(0, 10) ?? "";
    }
  }

  // Fetch brands for the add form
  const { data: brands } = await supabase
    .from("gym_brands")
    .select("id, name")
    .order("name");

  const rows = venues ?? [];

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
            {rows.length} venue{rows.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <AddVenueForm brands={brands ?? []} />
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
            {rows.map((venue, idx) => {
              const status = statusConfig[venue.status] ?? statusConfig.inactive;
              const brand = venue.gym_brands as { name?: string } | null;
              const screenCount = Array.isArray(venue.screens) ? venue.screens.length : 0;
              const lastPhoto = lastPhotoMap[venue.id] ?? null;
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
                    {brand?.name ?? "—"}
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
                        {screenCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon size={14} color="#666666" strokeWidth={2} />
                      <span className="text-sm" style={{ color: lastPhoto ? "#B3B3B3" : "#444444" }}>
                        {lastPhoto ?? "Never"}
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
