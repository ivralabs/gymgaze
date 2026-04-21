import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA")}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CampaignsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, advertiser, start_date, end_date, amount_charged_zar, campaign_venues(id)")
    .order("start_date", { ascending: false });

  const rows = campaigns ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            Campaigns
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666666" }}>
            {rows.length} campaign{rows.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
          style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", height: "44px" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Campaign
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #2A2A2A" }}>
        {rows.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20"
            style={{ backgroundColor: "#141414" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
            >
              <Megaphone size={26} color="#D4FF4F" strokeWidth={1.5} />
            </div>
            <p className="text-white font-medium mb-1">No campaigns yet</p>
            <p className="text-sm mb-5" style={{ color: "#666666" }}>
              Create your first campaign to start tracking advertising.
            </p>
            <Link
              href="/admin/campaigns/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
            >
              <Plus size={16} strokeWidth={2.5} />
              New Campaign
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#141414" }}>
                {["Name", "Advertiser", "Start Date", "End Date", "Amount (ZAR)", "Venues", ""].map((h) => (
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
              {rows.map((campaign, idx) => {
                const venueCount = Array.isArray(campaign.campaign_venues)
                  ? campaign.campaign_venues.length
                  : 0;
                const now = new Date().toISOString().slice(0, 10);
                const isActive =
                  campaign.start_date &&
                  campaign.end_date &&
                  campaign.start_date <= now &&
                  campaign.end_date >= now;
                return (
                  <tr
                    key={campaign.id}
                    style={{
                      backgroundColor: "#141414",
                      borderTop: "1px solid #2A2A2A",
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/campaigns/${campaign.id}`}
                          className="text-sm font-medium text-white hover:text-[#D4FF4F] transition-colors"
                        >
                          {campaign.name}
                        </Link>
                        {isActive && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: "rgba(212,255,79,0.12)", color: "#D4FF4F" }}
                          >
                            Live
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>
                      {campaign.advertiser ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm tabular-nums" style={{ color: "#A3A3A3" }}>
                      {formatDate(campaign.start_date)}
                    </td>
                    <td className="px-6 py-4 text-sm tabular-nums" style={{ color: "#A3A3A3" }}>
                      {formatDate(campaign.end_date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono tabular-nums" style={{ color: "#FFFFFF" }}>
                      {campaign.amount_charged_zar != null
                        ? formatCurrency(campaign.amount_charged_zar)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>
                      {venueCount}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="text-xs font-medium"
                        style={{ color: "#D4FF4F" }}
                      >
                        View →
                      </Link>
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
