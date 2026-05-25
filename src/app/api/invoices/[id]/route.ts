import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── GET /api/invoices/[id] ────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getService();

  const { data, error } = await supabase
    .from("invoices")
    .select("*, campaigns(id, client_name)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// ─── PATCH /api/invoices/[id] ──────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getService();

  const body = await req.json();

  // Strip read-only fields
  const {
    id: _id,
    invoice_number: _num,
    created_at: _ca,
    updated_at: _ua,
    ...updates
  } = body;

  // If marking as paid and no paid_date provided, set today
  if (updates.status === "paid" && !updates.paid_date) {
    updates.paid_date = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
