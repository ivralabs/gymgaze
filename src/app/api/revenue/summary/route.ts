import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  // Fetch all campaigns
  const { data: campaigns, error: campaignErr } = await supabase
    .from("campaigns")
    .select("id, total_value, amount_collected, status, start_date, end_date");

  if (campaignErr) {
    return NextResponse.json({ error: campaignErr.message }, { status: 500 });
  }

  // Fetch all sponsorships
  const { data: sponsorships, error: sponsorshipErr } = await supabase
    .from("sponsorships")
    .select("id, rate, amount_collected, status, billing_period, start_date, end_date");

  if (sponsorshipErr) {
    return NextResponse.json({ error: sponsorshipErr.message }, { status: 500 });
  }

  const allCampaigns = campaigns ?? [];
  const allSponsorships = sponsorships ?? [];

  // Total billed = sum of campaign total_value + sum of sponsorship rate
  const campaignBilled = allCampaigns.reduce((s, c) => s + (c.total_value ?? 0), 0);
  const sponsorshipBilled = allSponsorships.reduce((s, sp) => s + (sp.rate ?? 0), 0);
  const totalBilled = campaignBilled + sponsorshipBilled;

  // Total collected
  const campaignCollected = allCampaigns.reduce((s, c) => s + (c.amount_collected ?? 0), 0);
  const sponsorshipCollected = allSponsorships.reduce((s, sp) => s + (sp.amount_collected ?? 0), 0);
  const totalCollected = campaignCollected + sponsorshipCollected;

  // Outstanding
  const outstanding = totalBilled - totalCollected;

  // This month: campaigns + sponsorships active this calendar month
  const thisMonthCampaigns = allCampaigns.filter((c) => {
    if (!c.start_date || !c.end_date) return false;
    return c.start_date <= thisMonthEnd && c.end_date >= thisMonthStart;
  });
  const thisMonthSponsorships = allSponsorships.filter((sp) => {
    if (!sp.start_date) return false;
    const endDate = sp.end_date ?? "9999-12-31";
    return sp.start_date <= thisMonthEnd && endDate >= thisMonthStart;
  });
  const thisMonthRevenue =
    thisMonthCampaigns.reduce((s, c) => s + (c.total_value ?? 0), 0) +
    thisMonthSponsorships.reduce((s, sp) => s + (sp.rate ?? 0), 0);

  // MRR: active sponsorships
  const activeSponsorships = allSponsorships.filter((sp) => sp.status === "active");
  const mrr = activeSponsorships.reduce((s, sp) => {
    const rate = sp.rate ?? 0;
    // Weekly billing: multiply by ~4.33 to get monthly
    return s + (sp.billing_period === "weekly" ? rate * 4.33 : rate);
  }, 0);

  return NextResponse.json({
    totalBilled,
    totalCollected,
    outstanding,
    thisMonthRevenue,
    mrr,
    campaignBilled,
    sponsorshipBilled,
    campaignCollected,
    sponsorshipCollected,
  });
}
