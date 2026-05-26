import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = getService();
  const body = await req.json();

  const allowed = [
    "rental_fee_monthly",
    "rental_payment_cycle",
    "rental_start_date",
    "rental_escalation_pct",
    "rental_notes",
    "rental_bank_details",
    "current_occupancy_pct",
  ] as const;

  type AllowedKey = typeof allowed[number];

  // Validate rental_fee_monthly
  if (
    "rental_fee_monthly" in body &&
    (typeof body.rental_fee_monthly !== "number" || body.rental_fee_monthly < 0)
  ) {
    return NextResponse.json(
      { error: "rental_fee_monthly must be a number ≥ 0" },
      { status: 400 }
    );
  }

  // Validate current_occupancy_pct
  if (
    "current_occupancy_pct" in body &&
    (typeof body.current_occupancy_pct !== "number" ||
      body.current_occupancy_pct < 0 ||
      body.current_occupancy_pct > 100)
  ) {
    return NextResponse.json(
      { error: "current_occupancy_pct must be a number between 0 and 100" },
      { status: 400 }
    );
  }

  // Build update payload — only whitelisted keys
  const update: Partial<Record<AllowedKey, unknown>> & {
    rental_updated_at: string;
    occupancy_updated_at?: string;
  } = {
    rental_updated_at: new Date().toISOString(),
  };
  for (const key of allowed) {
    if (key in body) {
      update[key] = body[key] === "" ? null : body[key];
    }
  }
  // Auto-stamp occupancy_updated_at when occupancy is patched
  if ("current_occupancy_pct" in body) {
    update.occupancy_updated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("venues")
    .update(update)
    .eq("id", id)
    .select(
      "id, name, city, province, monthly_entries, active_members, " +
      "rental_fee_monthly, rental_payment_cycle, rental_start_date, " +
      "rental_escalation_pct, rental_notes, rental_bank_details, rental_updated_at, " +
      "current_occupancy_pct, occupancy_updated_at"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
