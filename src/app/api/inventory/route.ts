import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/inventory
// Returns all screens with their venue info, campaign bookings, and slot availability
export async function GET() {
  const supabase = await createClient();

  // Fetch screens with venue + brand info
  const { data: screens, error: screensError } = await supabase
    .from("screens")
    .select(`
      id,
      label,
      size_inches,
      resolution,
      orientation,
      is_active,
      slots_7sec,
      slots_15sec,
      venue_id,
      venues (
        id,
        name,
        city,
        region,
        gym_brand_id,
        gym_brands ( id, name, primary_color )
      )
    `)
    .order("label");

  if (screensError) {
    return NextResponse.json({ error: screensError.message }, { status: 400 });
  }

  // Fetch all screen bookings with campaign info
  const { data: bookings, error: bookingsError } = await supabase
    .from("screen_bookings")
    .select(`
      id,
      screen_id,
      slots_7sec_used,
      slots_15sec_used,
      start_date,
      end_date,
      notes,
      campaigns ( id, name, advertiser, start_date, end_date )
    `);

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 400 });
  }

  // Group bookings by screen_id
  const bookingsByScreen: Record<string, typeof bookings> = {};
  for (const b of bookings ?? []) {
    if (!bookingsByScreen[b.screen_id]) bookingsByScreen[b.screen_id] = [];
    bookingsByScreen[b.screen_id].push(b);
  }

  // Attach bookings + compute availability to each screen
  const inventory = (screens ?? []).map((screen) => {
    const screenBookings = bookingsByScreen[screen.id] ?? [];
    const slots7Total = screen.slots_7sec ?? 8;
    const slots15Total = screen.slots_15sec ?? 4;
    const slots7Used = screenBookings.reduce((sum, b) => sum + (b.slots_7sec_used ?? 0), 0);
    const slots15Used = screenBookings.reduce((sum, b) => sum + (b.slots_15sec_used ?? 0), 0);
    const slots7Available = Math.max(0, slots7Total - slots7Used);
    const slots15Available = Math.max(0, slots15Total - slots15Used);
    const totalSlots = slots7Total + slots15Total;
    const usedSlots = slots7Used + slots15Used;
    const occupancyPct = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

    let status: "available" | "partial" | "full";
    if (occupancyPct === 0) status = "available";
    else if (occupancyPct >= 100) status = "full";
    else status = "partial";

    return {
      ...screen,
      venues: Array.isArray(screen.venues) ? screen.venues[0] : screen.venues,
      slots_7sec_total: slots7Total,
      slots_15sec_total: slots15Total,
      slots_7sec_used: slots7Used,
      slots_15sec_used: slots15Used,
      slots_7sec_available: slots7Available,
      slots_15sec_available: slots15Available,
      occupancy_pct: occupancyPct,
      status,
      bookings: screenBookings,
    };
  });

  return NextResponse.json(inventory);
}
