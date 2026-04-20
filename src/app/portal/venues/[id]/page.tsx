import Link from "next/link";
import { ArrowLeft, MapPin, Users, Activity, Monitor, Image } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA")}`;
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verify ownership: profile must have gym_brand_id matching this venue's brand
  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_brand_id, role")
    .eq("id", user.id)
    .single();

  // Fetch venue
  const { data: venue, error } = await supabase
    .from("venues")
    .select("*, gym_brands(name, primary_color), screens(id)")
    .eq("id", id)
    .single();

  if (error || !venue) notFound();

  // Check owner has access (skip for admin)
  if (profile?.role !== "admin" && venue.gym_brand_id !== profile?.gym_brand_id) {
    redirect("/portal/dashboard");
  }

  const primaryColor = venue.gym_brands?.primary_color ?? "#FF6B35";

  // Fetch approved photos
  const { data: photos } = await supabase
    .from("venue_photos")
    .select("id, storage_path, month, created_at")
    .eq("venue_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);

  // Get signed URLs for approved photos
  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (p) => {
      const { data } = await supabase.storage
        .from("venue-photos")
        .createSignedUrl(p.storage_path, 3600);
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  // Revenue last 12 months
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const startMonth = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: revenueRows } = await supabase
    .from("revenue_entries")
    .select("amount, month")
    .eq("venue_id", id)
    .gte("month", startMonth)
    .order("month", { ascending: false });

  const revenue = revenueRows ?? [];
  const totalRevenue = revenue.reduce((s, r) => s + (r.amount ?? 0), 0);

  const screenCount = venue.screens?.length ?? 0;

  const operatingHours = venue.operating_hours
    ? typeof venue.operating_hours === "string"
      ? venue.operating_hours
      : JSON.stringify(venue.operating_hours)
    : "Not set";

  return (
    <div>
      {/* Back + header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/portal/dashboard"
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", color: "#6B7280" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
          >
            {venue.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {venue.gym_brands?.name} &middot; {venue.city}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Venue details */}
        <div
          className="lg:col-span-2 rounded-xl p-6"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-5"
            style={{ color: "#9CA3AF" }}
          >
            Venue Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs" style={{ color: "#9CA3AF" }}>Address</dt>
              <dd className="text-sm font-medium mt-0.5" style={{ color: "#111827" }}>
                {venue.address ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "#9CA3AF" }}>City</dt>
              <dd className="text-sm font-medium mt-0.5" style={{ color: "#111827" }}>
                {venue.city ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "#9CA3AF" }}>Operating Hours</dt>
              <dd className="text-sm font-medium mt-0.5" style={{ color: "#111827" }}>
                {operatingHours}
              </dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "#9CA3AF" }}>Status</dt>
              <dd className="text-sm font-medium mt-0.5 capitalize" style={{ color: "#111827" }}>
                {venue.status ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div
            className="rounded-xl p-5 flex items-center gap-4"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}1A` }}
            >
              <Users size={18} color={primaryColor} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Active Members</p>
              <p
                className="text-xl font-bold"
                style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
              >
                {(venue.active_members ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className="rounded-xl p-5 flex items-center gap-4"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(59,130,246,0.1)" }}
            >
              <Activity size={18} color="#3B82F6" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Monthly Entries</p>
              <p
                className="text-xl font-bold"
                style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
              >
                {(venue.monthly_entries ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className="rounded-xl p-5 flex items-center gap-4"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
            >
              <Monitor size={18} color="#059669" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Screens</p>
              <p
                className="text-xl font-bold"
                style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
              >
                {screenCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue history */}
      <div
        className="rounded-xl overflow-hidden mb-8"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #F3F4F6" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
          >
            Revenue History (Last 12 Months)
          </h2>
          <span className="text-sm font-bold" style={{ color: primaryColor }}>
            {formatCurrency(totalRevenue)} total
          </span>
        </div>
        {revenue.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>
            No revenue entries recorded yet.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB" }}>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                  Month
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((row, idx) => {
                const d = new Date((row.month ?? "").slice(0, 7) + "-01");
                const label = isNaN(d.getTime())
                  ? row.month
                  : d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
                return (
                  <tr
                    key={idx}
                    style={{ borderTop: "1px solid #F3F4F6" }}
                  >
                    <td className="px-6 py-3 text-sm" style={{ color: "#374151" }}>{label}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-right" style={{ color: "#111827" }}>
                      {formatCurrency(row.amount ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Approved photos gallery */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Image size={18} color={primaryColor} strokeWidth={2} />
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
          >
            Approved Photos
          </h2>
        </div>
        {photosWithUrls.length === 0 ? (
          <div
            className="rounded-xl py-12 flex items-center justify-center text-sm"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", color: "#9CA3AF" }}
          >
            No approved photos yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photosWithUrls.map((photo) => (
              <div
                key={photo.id}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}
              >
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt="Venue screen"
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div
                    className="aspect-video flex items-center justify-center"
                    style={{ backgroundColor: "#F3F4F6" }}
                  >
                    <Image size={24} color="#D1D5DB" strokeWidth={1.5} />
                  </div>
                )}
                <div className="px-3 py-2">
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    {photo.month
                      ? new Date(photo.month.slice(0, 7) + "-01").toLocaleDateString("en-ZA", {
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
