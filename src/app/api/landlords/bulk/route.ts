import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type BulkUpdateItem = {
  id: string;
  rental_fee_monthly: number;
};

export async function POST(req: NextRequest) {
  const supabase = getService();

  let body: { updates: BulkUpdateItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { updates } = body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "updates array is required and must not be empty" }, { status: 400 });
  }

  // Validate each item
  for (const item of updates) {
    if (!item.id || typeof item.id !== "string") {
      return NextResponse.json({ error: "Each update must have a string id" }, { status: 400 });
    }
    if (typeof item.rental_fee_monthly !== "number" || item.rental_fee_monthly < 0) {
      return NextResponse.json(
        { error: `rental_fee_monthly must be a number ≥ 0 (id: ${item.id})` },
        { status: 400 }
      );
    }
  }

  const now = new Date().toISOString();

  // Run updates sequentially to avoid rate-limit issues on large batches
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const item of updates) {
    const { error } = await supabase
      .from("venues")
      .update({ rental_fee_monthly: item.rental_fee_monthly, rental_updated_at: now })
      .eq("id", item.id);
    results.push({ id: item.id, ok: !error, error: error?.message });
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    return NextResponse.json(
      { ok: false, updated: results.filter((r) => r.ok).length, failed },
      { status: 207 }
    );
  }

  return NextResponse.json({ ok: true, updated: results.length });
}
