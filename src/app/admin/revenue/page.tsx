import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, TrendingUp } from "lucide-react";

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA")}`;
}

function getLastSixMonths() {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const label = d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
    months.push({ key, label });
  }
  return months;
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const months = getLastSixMonths();
  const selectedMonth = sp.month ?? months[0].key;

  const { data: revenueEntries } = await supabase
    .from("revenue_entries")
    .select("id, venue_id, month, rental_zar, revenue_share_zar, notes, entered_by, venues(name, city), profiles(full_name)")
    .eq("month", selectedMonth)
    .order("created_at", { ascending: false });

  const rows = revenueEntries ?? [];

  const totalRental = rows.reduce((s, r) => s + (r.rental_zar ?? 0), 0);
  const totalRevShare = rows.reduce((s, r) => s + (r.revenue_share_zar ?? 0), 0);
  const totalCombined = totalRental + totalRevShare;

  const kpis = [
    { label: "TOTAL RENTAL", value: formatCurrency(totalRental), sub: "This month" },
    { label: "TOTAL REVENUE SHARE", value: formatCurrency(totalRevShare), sub: "This month" },
    { label: "TOTAL COMBINED", value: formatCurrency(totalCombined), sub: "This month", highlight: true },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            Revenue
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666666" }}>
            Track rental and revenue share by venue and month
          </p>
        </div>
        <Link
          href="/admin/revenue/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
          style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", height: "44px" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Log Revenue
        </Link>
      </div>

      {/* Month pill selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {months.map((m) => {
          const isSelected = m.key === selectedMonth;
          return (
            <Link
              key={m.key}
              href={`/admin/revenue?month=${m.key}`}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150"
              style={{
                backgroundColor: isSelected ? "#D4FF4F" : "#141414",
                color: isSelected ? "#0A0A0A" : "#A3A3A3",
                border: `1px solid ${isSelected ? "#D4FF4F" : "#2A2A2A"}`,
              }}
            >
              {m.label}
            </Link>
          );
        })}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl p-6"
            style={{
              backgroundColor: kpi.highlight ? "rgba(212,255,79,0.06)" : "#141414",
              border: `1px solid ${kpi.highlight ? "rgba(212,255,79,0.2)" : "#2A2A2A"}`,
            }}
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#666666" }}>
              {kpi.label}
            </p>
            <p
              className="text-3xl font-bold tabular-nums mb-1"
              style={{
                fontFamily: "Inter Tight, sans-serif",
                letterSpacing: "-0.02em",
                color: kpi.highlight ? "#D4FF4F" : "#FFFFFF",
              }}
            >
              {kpi.value}
            </p>
            <p className="text-xs" style={{ color: "#666666" }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #2A2A2A" }}>
        {rows.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16"
            style={{ backgroundColor: "#141414" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
            >
              <TrendingUp size={22} color="#D4FF4F" strokeWidth={1.5} />
            </div>
            <p className="text-white font-medium mb-1">No revenue entries</p>
            <p className="text-sm" style={{ color: "#666666" }}>
              No entries recorded for this month yet.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#141414" }}>
                {["Venue", "Month", "Rental (ZAR)", "Rev Share (ZAR)", "Total", "Entered By"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#666666", borderBottom: "1px solid #2A2A2A" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const venue = row.venues as { name?: string; city?: string } | null;
                const enteredBy = row.profiles as { full_name?: string } | null;
                const monthLabel = row.month
                  ? new Date(row.month.slice(0, 7) + "-01").toLocaleDateString("en-ZA", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—";
                const total = (row.rental_zar ?? 0) + (row.revenue_share_zar ?? 0);
                return (
                  <tr
                    key={row.id}
                    style={{ backgroundColor: "#141414", borderTop: "1px solid #2A2A2A" }}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{venue?.name ?? "—"}</p>
                      {venue?.city && (
                        <p className="text-xs" style={{ color: "#666666" }}>{venue.city}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm tabular-nums" style={{ color: "#A3A3A3" }}>
                      {monthLabel}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono tabular-nums" style={{ color: "#A3A3A3" }}>
                      {formatCurrency(row.rental_zar ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono tabular-nums" style={{ color: "#A3A3A3" }}>
                      {formatCurrency(row.revenue_share_zar ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-semibold tabular-nums" style={{ color: "#D4FF4F" }}>
                      {formatCurrency(total)}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>
                      {enteredBy?.full_name ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
