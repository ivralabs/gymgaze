import Link from "next/link";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddNetworkForm from "./add-network-form";

export default async function NetworksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: networks } = await supabase
    .from("gym_brands")
    .select(
      `
      id, name, is_active, contact_name, contact_email,
      venues(
        id, name, status, active_members,
        contracts(monthly_rental_zar, revenue_share_percent),
        revenue_entries(rental_zar, revenue_share_zar, month),
        venue_photos(id, status, month)
      )
    `
    )
    .order("name");

  const rows = networks ?? [];

  // Current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  function computeStats(network: (typeof rows)[number]) {
    const venues = Array.isArray(network.venues) ? network.venues : [];
    const venueCount = venues.length;

    const totalMembers = venues.reduce((sum, v) => sum + (v.active_members ?? 0), 0);

    const mtdRevenue = venues.reduce((sum, v) => {
      const entries = Array.isArray(v.revenue_entries) ? v.revenue_entries : [];
      return (
        sum +
        entries
          .filter((e) => e.month === currentMonth)
          .reduce((s, e) => s + (e.rental_zar ?? 0) + (e.revenue_share_zar ?? 0), 0)
      );
    }, 0);

    const allPhotos = venues.flatMap((v) =>
      Array.isArray(v.venue_photos) ? v.venue_photos : []
    );
    const totalPhotos = allPhotos.length;
    const approvedPhotos = allPhotos.filter((p) => p.status === "approved").length;
    const photoCompliance =
      totalPhotos > 0 ? Math.round((approvedPhotos / totalPhotos) * 100) : 0;

    // Health score
    const venuesWithContracts = venues.filter(
      (v) => Array.isArray(v.contracts) && v.contracts.length > 0
    ).length;
    const contractPct = venueCount > 0 ? (venuesWithContracts / venueCount) * 100 : 0;
    const healthScore = Math.min(
      100,
      Math.round(
        contractPct * 0.4 + photoCompliance * 0.4 + (mtdRevenue > 0 ? 20 : 0)
      )
    );

    return { venueCount, totalMembers, mtdRevenue, photoCompliance, healthScore };
  }

  function healthColor(score: number) {
    if (score >= 80) return "#D4FF4F";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
  }

  function formatRevenue(amount: number) {
    return `R ${amount.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
  }

  return (
    <div className="p-8">
      {/* Hero Panel */}
      <div
        className="glass-panel relative overflow-hidden rounded-2xl mb-8"
        style={{ borderRadius: 16 }}
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
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            Manage gym brand partners — track health, revenue and compliance
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <div className="relative">
              <AddNetworkForm />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rows.map((network) => {
          const { venueCount, totalMembers, mtdRevenue, photoCompliance, healthScore } =
            computeStats(network);
          const isActive = network.is_active !== false;
          const hColor = healthColor(healthScore);

          return (
            <Link
              key={network.id}
              href={`/admin/networks/${network.id}`}
              className="glass-card block rounded-2xl p-6 transition-all duration-150 group hover:border-white/20"
              style={{ borderRadius: 16, textDecoration: "none" }}
            >
              {/* Top row: icon + health score */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
                >
                  <Building2 size={22} color="#D4FF4F" strokeWidth={2} />
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${hColor}18`,
                    color: hColor,
                    border: `1px solid ${hColor}40`,
                  }}
                >
                  Score: {healthScore}
                </span>
              </div>

              {/* Brand name */}
              <h3
                className="text-base font-bold text-white mb-2"
                style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700 }}
              >
                {network.name}
              </h3>

              {/* Active/Inactive pill */}
              <span
                className="inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-4"
                style={{
                  backgroundColor: isActive
                    ? "rgba(212,255,79,0.1)"
                    : "rgba(102, 102, 102, 0.15)",
                  color: isActive ? "#D4FF4F" : "#909090",
                }}
              >
                {isActive ? "Active" : "Inactive"}
              </span>

              {/* Stats row */}
              <div
                className="flex items-center gap-0 mb-4"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 8,
                  padding: "10px 0",
                }}
              >
                {[
                  { label: "Venues", value: venueCount.toString() },
                  {
                    label: "Members",
                    value: totalMembers.toLocaleString("en-ZA"),
                  },
                  { label: "MTD", value: formatRevenue(mtdRevenue) },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className="flex-1 text-center"
                    style={{
                      borderRight:
                        i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                    }}
                  >
                    <div
                      className="text-sm font-bold text-white"
                      style={{ fontFamily: "Inter Tight, sans-serif" }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs" style={{ color: "#666", marginTop: 2 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Photo compliance bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: "#A3A3A3" }}>
                    Photo compliance
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "#D4FF4F" }}>
                    {photoCompliance}%
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 4,
                    height: 4,
                  }}
                >
                  <div
                    style={{
                      background: "#D4FF4F",
                      width: `${photoCompliance}%`,
                      borderRadius: 4,
                      height: 4,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>

              {/* Footer: contact */}
              {(network.contact_name || network.contact_email) && (
                <div
                  className="flex items-center gap-1.5 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="min-w-0">
                    {network.contact_name && (
                      <p className="text-xs truncate" style={{ color: "#666" }}>
                        {network.contact_name}
                      </p>
                    )}
                    {network.contact_email && (
                      <p className="text-xs truncate" style={{ color: "#555" }}>
                        {network.contact_email}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
