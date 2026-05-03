import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/inventory/bookings — create or update a booking
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { screen_id, campaign_id, slots_7sec_used, slots_15sec_used, start_date, end_date, notes } = body;

  if (!screen_id || !campaign_id) {
    return NextResponse.json({ error: "screen_id and campaign_id are required" }, { status: 400 });
  }

  // Check slot availability
  const { data: screen } = await supabase
    .from("screens")
    .select("slots_7sec, slots_15sec")
    .eq("id", screen_id)
    .single();

  if (screen) {
    const { data: existingBookings } = await supabase
      .from("screen_bookings")
      .select("slots_7sec_used, slots_15sec_used, campaign_id")
      .eq("screen_id", screen_id);

    const otherBookings = (existingBookings ?? []).filter((b) => b.campaign_id !== campaign_id);
    const used7 = otherBookings.reduce((s, b) => s + (b.slots_7sec_used ?? 0), 0);
    const used15 = otherBookings.reduce((s, b) => s + (b.slots_15sec_used ?? 0), 0);

    const want7 = slots_7sec_used ?? 0;
    const want15 = slots_15sec_used ?? 0;

    if (used7 + want7 > (screen.slots_7sec ?? 8)) {
      return NextResponse.json(
        { error: `Only ${(screen.slots_7sec ?? 8) - used7} × 7.5sec slots available` },
        { status: 409 }
      );
    }
    if (used15 + want15 > (screen.slots_15sec ?? 4)) {
      return NextResponse.json(
        { error: `Only ${(screen.slots_15sec ?? 4) - used15} × 15sec slots available` },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("screen_bookings")
    .upsert(
      {
        screen_id,
        campaign_id,
        slots_7sec_used: slots_7sec_used ?? 0,
        slots_15sec_used: slots_15sec_used ?? 0,
        start_date: start_date ?? null,
        end_date: end_date ?? null,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "screen_id,campaign_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/inventory/bookings?id=<booking_id>
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Booking id required" }, { status: 400 });
  }

  const { error } = await supabase.from("screen_bookings").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
