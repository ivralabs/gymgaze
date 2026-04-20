import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
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
            style={{ fontFamily: "Inter Tight, sans-serif" }}
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
          const color = network.primary_color ?? "#FF6B35";
          const venueCount = Array.isArray(network.venues) ? network.venues.length : 0;
          const isActive = network.is_active !== false;
          return (
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
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Building2 size={22} color={color} strokeWidth={2} />
                </div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(107, 114, 128, 0.15)",
                    color: isActive ? "#10B981" : "#6B7280",
                  }}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <h3
                className="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors"
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
