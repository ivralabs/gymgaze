import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("partnership_proposal_venues")
    .select(`
      *,
      venues(id, name, city, province, active_members, monthly_entries)
    `)
    .eq("proposal_id", id)
    .order("created_at" as never);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("partnership_proposal_venues")
    .insert({ ...body, proposal_id: id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

// Bulk upsert: PATCH with array of venue records
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServiceClient();
  const venues = await req.json() as Array<{
    venue_id: string;
    screens_planned?: number;
    static_sites_planned?: number;
    monthly_rental_projection?: number;
  }>;

  const records = venues.map((v) => ({
    proposal_id: id,
    venue_id: v.venue_id,
    screens_planned: v.screens_planned ?? 2,
    static_sites_planned: v.static_sites_planned ?? 0,
    monthly_rental_projection: v.monthly_rental_projection ?? null,
  }));

  const { data, error } = await supabase
    .from("partnership_proposal_venues")
    .upsert(records, { onConflict: "proposal_id,venue_id" })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
