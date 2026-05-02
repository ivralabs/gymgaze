import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, city, region, status, active_members, gym_brand_id, gym_brands(name, primary_color)")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const payload: Record<string, unknown> = {};

  if (body.name) payload.name = body.name;
  if (body.city) payload.city = body.city;
  if (body.address !== undefined) payload.address = body.address;
  if (body.gym_brand_id !== undefined) payload.gym_brand_id = body.gym_brand_id;
  if (body.status) payload.status = body.status;
  if (body.region !== undefined) payload.region = body.region;

  // Foot traffic
  if (body.daily_entries != null) payload.daily_entries = body.daily_entries;
  if (body.weekly_entries != null) payload.weekly_entries = body.weekly_entries;
  if (body.monthly_entries != null) payload.monthly_entries = body.monthly_entries;

  // Operating hours — stored as JSONB
  if (body.operating_hours != null) payload.operating_hours = body.operating_hours;

  // Operational details (schema-venues-v2.sql migration)
  if (body.manager_name) payload.manager_name = body.manager_name;
  if (body.manager_phone) payload.manager_phone = body.manager_phone;
  if (body.screen_count != null) payload.screen_count = body.screen_count;
  if (body.capacity != null) payload.capacity = body.capacity;
  if (body.province) payload.province = body.province;

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
