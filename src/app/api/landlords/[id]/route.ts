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

  // Build update payload — only whitelisted keys
  const update: Partial<Record<AllowedKey, unknown>> & { rental_updated_at: string } = {
    rental_updated_at: new Date().toISOString(),
  };
  for (const key of allowed) {
    if (key in body) {
      update[key] = body[key] === "" ? null : body[key];
    }
  }

  const { data, error } = await supabase
    .from("venues")
    .update(update)
    .eq("id", id)
    .select(
      "id, name, city, province, monthly_entries, active_members, " +
      "rental_fee_monthly, rental_payment_cycle, rental_start_date, " +
      "rental_escalation_pct, rental_notes, rental_bank_details, rental_updated_at"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
