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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            Gym Networks
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666666" }}>
            {rows.length} network{rows.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <AddNetworkForm />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rows.map((network) => {
          const venueCount = Array.isArray(network.venues) ? network.venues.length : 0;
          const isActive = network.is_active !== false;
          return (
            <Link
              key={network.id}
              href={`/admin/networks/${network.id}`}
              className="block rounded-2xl p-6 transition-colors duration-150 group"
              style={{
                backgroundColor: "#141414",
                border: "1px solid #2A2A2A",
              }}
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
                    color: isActive ? "#D4FF4F" : "#666666",
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
              <p className="text-sm" style={{ color: "#666666" }}>
                {venueCount} venue{venueCount !== 1 ? "s" : ""}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
