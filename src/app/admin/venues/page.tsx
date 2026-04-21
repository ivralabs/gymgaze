import Link from "next/link";
import { Monitor, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddVenueForm from "./add-venue-form";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#D4FF4F", bg: "rgba(212,255,79,0.1)" },
  inactive: { label: "Inactive", color: "#909090", bg: "rgba(102,102,102,0.15)" },
  coming_soon: { label: "Coming Soon", color: "#A3A3A3", bg: "rgba(163,163,163,0.15)" },
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
            Venues
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>All gym locations across your network</p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <AddVenueForm brands={brands ?? []} />
          </div>
        </div>
      </div>

      <div
        className="glass-card rounded-2xl overflow-hidden"
        style={{ borderRadius: 16 }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(20,20,20,0.6)" }}>
              {["Venue", "Network", "City", "Status", "Screens", "Last Photo", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#909090", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-sm"
                  style={{ color: "#909090" }}
                >
                  No venues yet. Add your first venue to get started.
                </td>
              </tr>
            ) : (
              rows.map((venue, idx) => {
                const status = statusConfig[venue.status] ?? statusConfig.inactive;
                const brand = venue.gym_brands as { name?: string } | null;
                const screenCount = Array.isArray(venue.screens) ? venue.screens.length : 0;
                const lastPhoto = lastPhotoMap[venue.id] ?? null;
                return (
                  <tr
                    key={venue.id}
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/venues/${venue.id}`}
                        className="text-sm font-medium text-white hover:text-[#D4FF4F] transition-colors"
                      >
                        {venue.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>
                      {brand?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>
                      {venue.city}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{ backgroundColor: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Monitor size={14} color="#909090" strokeWidth={2} />
                        <span className="text-sm" style={{ color: "#A3A3A3" }}>
                          {screenCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon size={14} color="#909090" strokeWidth={2} />
                        <span className="text-sm" style={{ color: lastPhoto ? "#A3A3A3" : "#444444" }}>
                          {lastPhoto ?? "Never"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/venues/${venue.id}`}
                        className="text-xs font-medium"
                        style={{ color: "#D4FF4F" }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
