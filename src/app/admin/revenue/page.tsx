export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RevenueClient from "./RevenueClient";

export const metadata = { title: "Revenue · GymGaze Admin" };

export type CampaignRow = {
  id: string;
  client_name: string | null;
  format: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  total_value: number;
  amount_collected: number;
  campaign_venues: { id: string }[];
};

export type SponsorshipRow = {
  id: string;
  brand_name: string;
  widget_type: string;
  coverage: string;
  city: string | null;
  billing_period: string;
  rate: number;
  amount_collected: number;
  status: string;
  start_date: string;
  end_date: string | null;
};

export type PaymentRow = {
  id: string;
  source_type: string;
  source_id: string;
  source_name: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
};

export default async function RevenuePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Campaigns with venue counts
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      "id, client_name, format, status, start_date, end_date, total_value, amount_collected, campaign_venues(id)"
    )
    .order("start_date", { ascending: false });

  // Sponsorships
  const { data: sponsorships } = await supabase
    .from("sponsorships")
    .select(
      "id, brand_name, widget_type, coverage, city, billing_period, rate, amount_collected, status, start_date, end_date"
    )
    .order("start_date", { ascending: false });

  // Summary stats
  const allCampaigns = (campaigns ?? []) as CampaignRow[];
  const allSponsorships = (sponsorships ?? []) as SponsorshipRow[];

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const totalBilled =
    allCampaigns.reduce((s, c) => s + (c.total_value ?? 0), 0) +
    allSponsorships.reduce((s, sp) => s + (sp.rate ?? 0), 0);

  const totalCollected =
    allCampaigns.reduce((s, c) => s + (c.amount_collected ?? 0), 0) +
    allSponsorships.reduce((s, sp) => s + (sp.amount_collected ?? 0), 0);

  const outstanding = totalBilled - totalCollected;

  const thisMonthRevenue =
    allCampaigns
      .filter(
        (c) =>
          c.start_date &&
          c.end_date &&
          c.start_date <= thisMonthEnd &&
          c.end_date >= thisMonthStart
      )
      .reduce((s, c) => s + (c.total_value ?? 0), 0) +
    allSponsorships
      .filter((sp) => {
        const end = sp.end_date ?? "9999-12-31";
        return sp.start_date <= thisMonthEnd && end >= thisMonthStart;
      })
      .reduce((s, sp) => s + (sp.rate ?? 0), 0);

  const mrr = allSponsorships
    .filter((sp) => sp.status === "active")
    .reduce(
      (s, sp) => s + (sp.billing_period === "weekly" ? sp.rate * 4.33 : sp.rate),
      0
    );

  // Payments (with enriched names)
  const { data: rawPayments } = await supabase
    .from("payments")
    .select("id, source_type, source_id, amount, payment_date, notes, created_at")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const payments = rawPayments ?? [];

  // Enrich payment source names
  const campaignIds = [
    ...new Set(
      payments
        .filter((p) => p.source_type === "campaign")
        .map((p) => p.source_id as string)
    ),
  ];
  const sponsorshipIds = [
    ...new Set(
      payments
        .filter((p) => p.source_type === "sponsorship")
        .map((p) => p.source_id as string)
    ),
  ];

  const [{ data: cNames }, { data: sNames }] = await Promise.all([
    campaignIds.length > 0
      ? supabase
          .from("campaigns")
          .select("id, client_name")
          .in("id", campaignIds)
      : Promise.resolve({ data: [] }),
    sponsorshipIds.length > 0
      ? supabase
          .from("sponsorships")
          .select("id, brand_name")
          .in("id", sponsorshipIds)
      : Promise.resolve({ data: [] }),
  ]);

  const cMap = new Map((cNames ?? []).map((c) => [c.id, c.client_name as string]));
  const sMap = new Map((sNames ?? []).map((s) => [s.id, s.brand_name as string]));

  const enrichedPayments: PaymentRow[] = payments.map((p) => ({
    ...p,
    source_name:
      p.source_type === "campaign"
        ? (cMap.get(p.source_id as string) ?? "—")
        : (sMap.get(p.source_id as string) ?? "—"),
  }));

  return (
    <RevenueClient
      campaigns={allCampaigns}
      sponsorships={allSponsorships}
      payments={enrichedPayments}
      summary={{
        totalBilled,
        totalCollected,
        outstanding,
        thisMonthRevenue,
        mrr,
      }}
    />
  );
}
