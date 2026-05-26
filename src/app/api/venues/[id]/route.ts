import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*, gym_brands(name, primary_color), screens(*), contracts(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Use service client for writes to bypass RLS
  const supabase = serviceClient();
  const body = await request.json();

  // Whitelist allowed fields (including lat/lng)
  const allowed = [
    "name", "city", "province", "address", "region", "status",
    "active_members", "daily_entries", "weekly_entries", "monthly_entries",
    "capacity", "manager_name", "manager_phone", "operating_hours",
    "brand_code", "metro_code", "venue_code",
    "latitude", "longitude",
  ];

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      patch[key] = body[key];
    }
  }

  const { data, error } = await supabase
    .from("venues")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
