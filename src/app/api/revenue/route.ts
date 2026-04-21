import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("revenue_entries")
    .select("*, venues(name, city)")
    .order("month", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { venue_id, month, rental_zar, revenue_share_zar, notes } = body;

  if (!venue_id || !month) {
    return NextResponse.json(
      { error: "venue_id and month are required" },
      { status: 400 }
    );
  }

  const monthDate = month.includes("-01") ? month : `${month}-01`;

  const { data, error } = await supabase
    .from("revenue_entries")
    .upsert(
      {
        venue_id,
        month: monthDate,
        rental_zar: rental_zar ? parseInt(rental_zar) : 0,
        revenue_share_zar: revenue_share_zar ? parseInt(revenue_share_zar) : 0,
        notes: notes || null,
        entered_by: user.id,
      },
      { onConflict: "venue_id,month" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
