import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*, gym_brands(name, primary_color)")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  // Only include columns that exist in the venues schema
  // Columns that exist: id, gym_brand_id, name, address, city, region,
  //   operating_hours, active_members, daily_entries, weekly_entries,
  //   monthly_entries, status
  // NOT in schema yet (skip): province, capacity, manager_name, manager_phone,
  //   screen_count, cover_photo_url, opening_hours (text)
  const payload: Record<string, unknown> = {};

  if (body.name) payload.name = body.name;
  if (body.city) payload.city = body.city;
  if (body.address !== undefined) payload.address = body.address;
  if (body.gym_brand_id !== undefined) payload.gym_brand_id = body.gym_brand_id;
  if (body.status) payload.status = body.status;
  if (body.region !== undefined) payload.region = body.region;

  // Foot traffic — columns exist
  if (body.daily_entries !== undefined && body.daily_entries !== null) {
    payload.daily_entries = body.daily_entries;
  }
  if (body.weekly_entries !== undefined && body.weekly_entries !== null) {
    payload.weekly_entries = body.weekly_entries;
  }
  if (body.monthly_entries !== undefined && body.monthly_entries !== null) {
    payload.monthly_entries = body.monthly_entries;
  }

  const { data, error } = await supabase
    .from("venues")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
