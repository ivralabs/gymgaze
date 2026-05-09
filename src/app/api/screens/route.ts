import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const {
    venue_id,
    label,
    location_in_venue,
    size_inches,
    resolution,
    orientation,
    notes,
  } = body;

  if (!venue_id || !label) {
    return NextResponse.json({ error: "venue_id and label are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("screens")
    .insert({
      venue_id,
      label,
      location_in_venue: location_in_venue || null,
      size_inches: size_inches ? parseFloat(size_inches) : null,
      resolution: resolution || null,
      orientation: orientation || "landscape",
      notes: notes || null,
      cuecast_status: "unpaired",
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
