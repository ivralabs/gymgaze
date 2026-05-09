import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const {
    label,
    venue_id,
    location_in_venue,
    size_inches,
    orientation,
    resolution,
    notes,
  } = body;

  const updates: Record<string, unknown> = {};
  if (label !== undefined) updates.label = label;
  if (venue_id !== undefined) updates.venue_id = venue_id;
  if (location_in_venue !== undefined) updates.location_in_venue = location_in_venue;
  if (size_inches !== undefined) updates.size_inches = size_inches;
  if (orientation !== undefined) updates.orientation = orientation;
  if (resolution !== undefined) updates.resolution = resolution;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("screens")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
