import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venue_id");
  const status = searchParams.get("status"); // pending | approved | rejected | all

  let query = supabase
    .from("venue_photos")
    .select("*, venues(name, city), profiles(full_name)")
    .order("created_at", { ascending: false });

  if (venueId) {
    query = query.eq("venue_id", venueId);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  } else if (!status) {
    // Default: pending only (admin approval queue behaviour)
    query = query.eq("status", "pending");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
