import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MonthData {
  month: string; // "YYYY-MM"
  campaigns: number;
  sponsorships: number;
  total: number;
}

export async function GET() {
  const supabase = await createClient();

  // Last 6 months
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  const sixMonthsAgo = months[0] + "-01";

  // Campaigns starting in last 6 months
  const { data: campaigns, error: campaignErr } = await supabase
    .from("campaigns")
    .select("id, total_value, start_date")
    .gte("start_date", sixMonthsAgo);

  if (campaignErr) {
    return NextResponse.json({ error: campaignErr.message }, { status: 500 });
  }

  // Sponsorships starting in last 6 months
  const { data: sponsorships, error: sponsorshipErr } = await supabase
    .from("sponsorships")
    .select("id, rate, start_date")
    .gte("start_date", sixMonthsAgo);

  if (sponsorshipErr) {
    return NextResponse.json({ error: sponsorshipErr.message }, { status: 500 });
  }

  // Build month map
  const monthMap = new Map<string, { campaigns: number; sponsorships: number }>(
    months.map((m) => [m, { campaigns: 0, sponsorships: 0 }])
  );

  for (const c of campaigns ?? []) {
    if (!c.start_date) continue;
    const key = (c.start_date as string).slice(0, 7);
    const prev = monthMap.get(key);
    if (prev) {
      prev.campaigns += c.total_value ?? 0;
    }
  }

  for (const sp of sponsorships ?? []) {
    if (!sp.start_date) continue;
    const key = (sp.start_date as string).slice(0, 7);
    const prev = monthMap.get(key);
    if (prev) {
      prev.sponsorships += sp.rate ?? 0;
    }
  }

  const result: MonthData[] = months.map((m) => {
    const data = monthMap.get(m) ?? { campaigns: 0, sponsorships: 0 };
    // Format as "Jan '25"
    const [year, month] = m.split("-");
    const label = new Date(
      parseInt(year),
      parseInt(month) - 1,
      1
    ).toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
    return {
      month: label,
      campaigns: Math.round(data.campaigns),
      sponsorships: Math.round(data.sponsorships),
      total: Math.round(data.campaigns + data.sponsorships),
    };
  });

  return NextResponse.json(result);
}
