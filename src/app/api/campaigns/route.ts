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
  const { venue_ids, ...campaign } = body;

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
