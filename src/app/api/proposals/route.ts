import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("partnership_proposals")
    .select(`
      *,
      gym_networks(id, name, slug, logo_url),
      partnership_proposal_venues(id, venue_id, screens_planned, static_sites_planned, monthly_rental_projection)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const body = await req.json();
  const { venue_ids, ...rest } = body as {
    venue_ids?: string[];
    [key: string]: unknown;
  };

  const { data, error } = await supabase
    .from("partnership_proposals")
    .insert(rest)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Link venues if provided
  if (venue_ids && venue_ids.length > 0) {
    const junctions = venue_ids.map((vid) => ({
      proposal_id: data.id,
      venue_id: vid,
      screens_planned: 2,
      static_sites_planned: 0,
    }));
    const { error: jErr } = await supabase
      .from("partnership_proposal_venues")
      .insert(junctions);
    if (jErr) return NextResponse.json({ error: jErr.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
