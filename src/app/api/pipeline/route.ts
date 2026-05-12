import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("pipeline_deals")
    .select("*, profiles(id, full_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    client_name,
    client_type,
    contact_name,
    contact_email,
    contact_phone,
    estimated_value,
    stage,
    expected_close_date,
    notes,
  } = body;

  if (!client_name) {
    return NextResponse.json({ error: "client_name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pipeline_deals")
    .insert({
      created_by: user.id,
      client_name,
      client_type: client_type ?? "direct",
      contact_name: contact_name || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      estimated_value: estimated_value ? Number(estimated_value) : null,
      stage: stage ?? "prospect",
      expected_close_date: expected_close_date || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
