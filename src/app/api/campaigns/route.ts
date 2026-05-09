import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `
      id,
      client_name,
      client_type,
      contact_name,
      contact_email,
      contact_phone,
      format,
      status,
      start_date,
      end_date,
      total_value,
      amount_collected,
      notes,
      created_at,
      campaign_venues(id, venue_id, slot_count)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { venue_ids, ...rest } = body as {
    venue_ids?: string[];
    client_name: string;
    client_type?: string;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    format: string;
    status?: string;
    start_date: string;
    end_date: string;
    total_value?: number;
    amount_collected?: number;
    notes?: string | null;
  };

  // Build campaign payload
  const campaign: Record<string, unknown> = {
    client_name:      rest.client_name,
    client_type:      rest.client_type ?? "agency",
    format:           rest.format,
    status:           rest.status ?? "draft",
    start_date:       rest.start_date,
    end_date:         rest.end_date,
    total_value:      rest.total_value ?? 0,
    amount_collected: rest.amount_collected ?? 0,
  };

  if (rest.contact_name  !== undefined) campaign.contact_name  = rest.contact_name;
  if (rest.contact_email !== undefined) campaign.contact_email = rest.contact_email;
  if (rest.contact_phone !== undefined) campaign.contact_phone = rest.contact_phone;
  if (rest.notes         !== undefined) campaign.notes         = rest.notes;

  const { data: campaignData, error: campaignError } = await supabase
    .from("campaigns")
    .insert(campaign)
    .select()
    .single();

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 400 });
  }

  // Link venues
  if (venue_ids && venue_ids.length > 0) {
    const junctions = venue_ids.map((vid) => ({
      campaign_id: campaignData.id,
      venue_id: vid,
      slot_count: 1,
    }));

    const { error: junctionError } = await supabase
      .from("campaign_venues")
      .insert(junctions);

    if (junctionError) {
      return NextResponse.json({ error: junctionError.message }, { status: 400 });
    }
  }

  return NextResponse.json(campaignData, { status: 201 });
}
