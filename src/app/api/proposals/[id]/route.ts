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
    .from("partnership_proposals")
    .select(`
      *,
      gym_networks(id, name, slug, logo_url, primary_contact_name, primary_contact_email, primary_contact_phone),
      partnership_proposal_venues(
        id, venue_id, screens_planned, static_sites_planned, monthly_rental_projection,
        venues(id, name, city, province, active_members, monthly_entries)
      )
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServiceClient();
  const body = await req.json();

  // Validate pot-to-credit fields if present
  if (
    "pot_to_credit_pct" in body &&
    body.pot_to_credit_pct !== null &&
    body.pot_to_credit_pct !== undefined
  ) {
    const pct = Number(body.pot_to_credit_pct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return NextResponse.json(
        { error: "pot_to_credit_pct must be between 0 and 100" },
        { status: 400 }
      );
    }
    body.pot_to_credit_pct = pct;
  }
  if ("pot_to_credit_enabled" in body) {
    body.pot_to_credit_enabled = Boolean(body.pot_to_credit_enabled);
  }
  if ("pot_credit_uses" in body && body.pot_credit_uses !== null) {
    if (!Array.isArray(body.pot_credit_uses)) {
      return NextResponse.json(
        { error: "pot_credit_uses must be an array" },
        { status: 400 }
      );
    }
    const allowed = ["top_up_bonus", "cobranded_marketing", "extra_dedicated_slot"];
    const invalid = (body.pot_credit_uses as string[]).filter((u) => !allowed.includes(u));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid pot_credit_uses values: ${invalid.join(", ")}` },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("partnership_proposals")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("partnership_proposals")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
