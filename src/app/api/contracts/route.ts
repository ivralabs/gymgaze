import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("*, venues(name, city)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  // Contracts schema: venue_id, document_url, start_date, end_date,
  //   monthly_rental_zar, revenue_share_percent, notes
  const payload: Record<string, unknown> = {};

  if (!body.venue_id) {
    return NextResponse.json({ error: "venue_id is required" }, { status: 400 });
  }

  payload.venue_id = body.venue_id;

  if (body.start_date) payload.start_date = body.start_date;
  if (body.end_date) payload.end_date = body.end_date;
  if (body.monthly_rental_zar !== undefined && body.monthly_rental_zar !== null) {
    payload.monthly_rental_zar = body.monthly_rental_zar;
  }
  if (body.revenue_share_percent !== undefined && body.revenue_share_percent !== null) {
    payload.revenue_share_percent = body.revenue_share_percent;
  }
  if (body.notes) payload.notes = body.notes;

  const { data, error } = await supabase
    .from("contracts")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
