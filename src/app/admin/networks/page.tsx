import Link from "next/link";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddNetworkForm from "./add-network-form";

export default async function NetworksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: networks, error } = await supabase
    .from("gym_brands")
    .select("id, name, primary_color, is_active, venues(id)")
    .order("name");

  const rows = networks ?? [];

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
            Networks
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Manage gym brands and partners</p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <div className="relative">
              <AddNetworkForm />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rows.map((network) => {
          const venueCount = Array.isArray(network.venues) ? network.venues.length : 0;
          const isActive = network.is_active !== false;
          return (
            <Link
              key={network.id}
              href={`/admin/networks/${network.id}`}
              className="glass-card block rounded-2xl p-6 transition-colors duration-150 group"
              style={{ borderRadius: 16 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
                >
                  <Building2 size={22} color="#D4FF4F" strokeWidth={2} />
                </div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(212,255,79,0.1)"
                      : "rgba(102, 102, 102, 0.15)",
                    color: isActive ? "#D4FF4F" : "#909090",
                  }}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <h3
                className="text-base font-semibold text-white mb-1"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                {network.name}
              </h3>
              <p className="text-sm" style={{ color: "#909090" }}>
                {venueCount} venue{venueCount !== 1 ? "s" : ""}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
