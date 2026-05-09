import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sponsorships")
    .select(`
      id,
      brand_name,
      contact_name,
      contact_email,
      contact_phone,
      widget_type,
      coverage,
      city,
      billing_period,
      rate,
      status,
      start_date,
      end_date,
      logo_url,
      brand_colour,
      tagline,
      amount_collected,
      notes,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    brand_name: string;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    widget_type: string;
    coverage?: string;
    city?: string | null;
    billing_period?: string;
    rate: number;
    status?: string;
    start_date: string;
    end_date?: string | null;
    logo_url?: string | null;
    brand_colour?: string;
    tagline?: string | null;
    amount_collected?: number;
    notes?: string | null;
  };

  if (!body.brand_name?.trim()) {
    return NextResponse.json({ error: "brand_name is required" }, { status: 400 });
  }
  if (!body.widget_type) {
    return NextResponse.json({ error: "widget_type is required" }, { status: 400 });
  }
  if (!body.start_date) {
    return NextResponse.json({ error: "start_date is required" }, { status: 400 });
  }
  if (body.rate == null || body.rate < 0) {
    return NextResponse.json({ error: "rate must be a positive number" }, { status: 400 });
  }

  const payload = {
    brand_name:       body.brand_name.trim(),
    contact_name:     body.contact_name ?? null,
    contact_email:    body.contact_email ?? null,
    contact_phone:    body.contact_phone ?? null,
    widget_type:      body.widget_type,
    coverage:         body.coverage ?? "network",
    city:             body.coverage === "city" ? (body.city ?? null) : null,
    billing_period:   body.billing_period ?? "monthly",
    rate:             body.rate,
    status:           body.status ?? "active",
    start_date:       body.start_date,
    end_date:         body.end_date ?? null,
    logo_url:         body.logo_url ?? null,
    brand_colour:     body.brand_colour ?? "#FF6B35",
    tagline:          body.tagline ?? null,
    amount_collected: body.amount_collected ?? 0,
    notes:            body.notes ?? null,
  };

  const { data, error } = await supabase
    .from("sponsorships")
    .insert(payload)
    .select()
    .single();

  if (error) {
    // Unique constraint violation = double-booking
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A sponsorship for this widget type and coverage is already active." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
