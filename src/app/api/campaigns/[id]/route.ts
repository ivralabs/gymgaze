import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      campaign_venues(id, venue_id, slot_count, venues(id, name, city, status))
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { venue_ids, ...rest } = body as {
    venue_ids?: string[];
    client_name?: string;
    client_type?: string;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    format?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    total_value?: number;
    amount_collected?: number;
    notes?: string | null;
  };

  // Build update payload (only include provided fields)
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const allowed = [
    "client_name", "client_type", "contact_name", "contact_email",
    "contact_phone", "format", "status", "start_date", "end_date",
    "total_value", "amount_collected", "notes",
  ] as const;

  for (const key of allowed) {
    if (key in rest) update[key] = (rest as Record<string, unknown>)[key];
  }

  const { data: updated, error } = await supabase
    .from("campaigns")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // If venue_ids provided, replace all venue associations
  if (venue_ids !== undefined) {
    // Delete existing
    await supabase.from("campaign_venues").delete().eq("campaign_id", id);

    // Insert new
    if (venue_ids.length > 0) {
      const junctions = venue_ids.map((vid) => ({
        campaign_id: id,
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
  }

  return NextResponse.json(updated);
}
