import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = getService();

  const { data, error } = await supabase
    .from("venues")
    .select(
      "id, name, city, province, monthly_entries, active_members, " +
      "rental_fee_monthly, rental_payment_cycle, rental_start_date, " +
      "rental_escalation_pct, rental_notes, rental_bank_details, rental_updated_at, " +
      "current_occupancy_pct, occupancy_updated_at"
    )
    .order("city", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
