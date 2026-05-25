import { NextResponse } from "next/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/static-sites?venue_id=xxx — fetch static sites for a venue
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const venueId = searchParams.get("venue_id");

  const svc = serviceClient();
  let query = svc
    .from("static_sites")
    .select("*, venues(id, name, city)")
    .order("created_at", { ascending: false });

  if (venueId) {
    query = query.eq("venue_id", venueId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

// POST /api/static-sites — create a static site
export async function POST(req: Request) {
  const body = await req.json();
  const { venue_id, label, site_type, location_in_venue, width_cm, height_cm, notes, price_per_month, monthly_impressions, pricing_tier, production_cost, flighting_fee } = body;

  if (!venue_id || !label) {
    return NextResponse.json({ error: "venue_id and label are required" }, { status: 400 });
  }

  // Validate pricing fields
  if (price_per_month !== null && price_per_month !== undefined && parseFloat(String(price_per_month)) < 0) {
    return NextResponse.json({ error: "price_per_month must be >= 0" }, { status: 400 });
  }
  if (monthly_impressions !== null && monthly_impressions !== undefined && parseInt(String(monthly_impressions)) < 0) {
    return NextResponse.json({ error: "monthly_impressions must be >= 0" }, { status: 400 });
  }

  const svc = serviceClient();
  const { data, error } = await svc
    .from("static_sites")
    .insert({
      venue_id,
      label,
      site_type: site_type || "poster_frame",
      location_in_venue: location_in_venue || null,
      width_cm: width_cm ? parseInt(String(width_cm)) : null,
      height_cm: height_cm ? parseInt(String(height_cm)) : null,
      notes: notes || null,
      is_active: true,
      price_per_month: price_per_month !== undefined && price_per_month !== null && price_per_month !== "" ? parseFloat(String(price_per_month)) : null,
      monthly_impressions: monthly_impressions !== undefined && monthly_impressions !== null && monthly_impressions !== "" ? parseInt(String(monthly_impressions)) : null,
      pricing_tier: pricing_tier || null,
      production_cost: production_cost !== undefined && production_cost !== null && production_cost !== "" ? parseFloat(String(production_cost)) : null,
      flighting_fee: flighting_fee !== undefined && flighting_fee !== null && flighting_fee !== "" ? parseFloat(String(flighting_fee)) : null,
    })
    .select("*, venues(id, name, city)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
