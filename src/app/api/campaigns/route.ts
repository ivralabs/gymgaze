import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, campaign_venues(venue_id, venues(name, city))")
    .order("start_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { venue_ids, ...rest } = body;

  // Build campaign payload — only include known columns
  // Base columns (always exist per schema.sql)
  const campaign: Record<string, unknown> = {};
  if (rest.name) campaign.name = rest.name;
  if (rest.advertiser !== undefined) campaign.advertiser = rest.advertiser;
  if (rest.start_date) campaign.start_date = rest.start_date;
  if (rest.end_date) campaign.end_date = rest.end_date;
  if (rest.amount_charged_zar !== undefined) campaign.amount_charged_zar = rest.amount_charged_zar;
  if (rest.notes !== undefined) campaign.notes = rest.notes;

  // Extended columns (added via schema-campaigns-v2.sql migration)
  // Wrapped defensively — if migration hasn't run, Supabase will return error
  // and the main insert will still fail gracefully
  if (rest.deal_type !== undefined) campaign.deal_type = rest.deal_type;
  if (rest.cpm_rate !== undefined) campaign.cpm_rate = rest.cpm_rate;
  if (rest.revenue_share_percent !== undefined) campaign.revenue_share_percent = rest.revenue_share_percent;
  if (rest.gym_revenue_share_percent !== undefined) campaign.gym_revenue_share_percent = rest.gym_revenue_share_percent;
  if (rest.contact_person !== undefined) campaign.contact_person = rest.contact_person;
  if (rest.contact_email !== undefined) campaign.contact_email = rest.contact_email;

  // Insert campaign
  const { data: campaignData, error: campaignError } = await supabase
    .from("campaigns")
    .insert(campaign)
    .select()
    .single();

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 400 });
  }

  // Link venues if provided
  if (venue_ids && Array.isArray(venue_ids) && venue_ids.length > 0) {
    const junctions = venue_ids.map((vid: string) => ({
      campaign_id: campaignData.id,
      venue_id: vid,
    }));

    const { error: junctionError } = await supabase
      .from("campaign_venues")
      .insert(junctions);

    if (junctionError) {
      return NextResponse.json(
        { error: junctionError.message },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(campaignData, { status: 201 });
}
