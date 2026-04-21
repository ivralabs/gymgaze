import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Phone, Mail, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#D4FF4F", bg: "rgba(212,255,79,0.1)" },
  inactive: { label: "Inactive", color: "#909090", bg: "rgba(102,102,102,0.15)" },
  coming_soon: { label: "Coming Soon", color: "#A3A3A3", bg: "rgba(163,163,163,0.15)" },
};

export default async function NetworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: networkId } = await params;
  const supabase = await createClient();

  const { data: network } = await supabase
    .from("gym_brands")
    .select("id, name, primary_color, is_active, contact_name, contact_email, contact_phone")
    .eq("id", networkId)
    .maybeSingle();

  if (!network) notFound();

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city, status, screens(id)")
    .eq("gym_brand_id", networkId)
    .order("name");

  const venueRows = venues ?? [];

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/networks"
          className="p-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.10)", color: "#A3A3A3" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            {network.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#909090" }}>
            Network ID: {networkId}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brand info card */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
            >
              <Building2 size={22} color="#D4FF4F" strokeWidth={2} />
            </div>
            <div>
              <h2
                className="text-base font-semibold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                {network.name}
              </h2>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: network.is_active !== false ? "rgba(212,255,79,0.1)" : "rgba(102,102,102,0.15)",
                  color: network.is_active !== false ? "#D4FF4F" : "#909090",
                }}
              >
                {network.is_active !== false ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {network.contact_name && (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                >
                  <User size={14} color="#909090" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#909090" }}>Contact</p>
                  <p className="text-sm text-white">{network.contact_name}</p>
                </div>
              </div>
            )}

            {network.contact_email && (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                >
                  <Mail size={14} color="#909090" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#909090" }}>Email</p>
                  <p className="text-sm text-white">{network.contact_email}</p>
                </div>
              </div>
            )}

            {network.contact_phone && (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                >
                  <Phone size={14} color="#909090" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#909090" }}>Phone</p>
                  <p className="text-sm text-white">{network.contact_phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Venues list */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} color="#D4FF4F" strokeWidth={2} />
                <h3
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "Inter Tight, sans-serif" }}
                >
                  Venues ({venueRows.length})
                </h3>
              </div>
              <Link
                href="/admin/venues/new"
                className="text-xs font-medium"
                style={{ color: "#D4FF4F" }}
              >
                Add venue
              </Link>
            </div>

            {venueRows.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm" style={{ color: "#909090" }}>
                No venues linked to this network yet.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
                    {["Venue", "City", "Screens", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "#909090" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {venueRows.map((venue, idx) => {
                    const status = statusConfig[venue.status] ?? statusConfig.inactive;
                    const screenCount = Array.isArray(venue.screens) ? venue.screens.length : 0;
                    return (
                      <tr
                        key={venue.id}
                        style={{
                          borderTop: idx >= 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
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
                          {venue.city}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>
                          {screenCount}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
