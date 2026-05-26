import { NextResponse } from "next/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/rate-card-clients — list all saved clients ordered by name
export async function GET() {
  const svc = serviceClient();
  const { data, error } = await svc
    .from("rate_card_clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/rate-card-clients — create or upsert (by name, case-insensitive)
export async function POST(req: Request) {
  const body = await req.json();
  const { name, client_locations, tier, slot_seconds, flight_start, flight_end, notes } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const svc = serviceClient();

  // Check if a record with this name already exists (case-insensitive)
  const { data: existing } = await svc
    .from("rate_card_clients")
    .select("id")
    .ilike("name", name.trim())
    .maybeSingle();

  const payload = {
    name: name.trim(),
    client_locations: client_locations ?? [],
    tier: tier ?? null,
    slot_seconds: slot_seconds ?? null,
    flight_start: flight_start || null,
    flight_end: flight_end || null,
    notes: notes ?? null,
    updated_at: new Date().toISOString(),
  };

  let data;
  let error;

  if (existing?.id) {
    // Update existing
    ({ data, error } = await svc
      .from("rate_card_clients")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single());
  } else {
    // Insert new
    ({ data, error } = await svc
      .from("rate_card_clients")
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: existing?.id ? 200 : 201 });
}
