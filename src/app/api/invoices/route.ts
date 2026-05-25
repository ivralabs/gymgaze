import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Auto-generate next invoice number ────────────────────────────────────────
async function nextInvoiceNumber(supabase: ReturnType<typeof getService>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GG-${year}-`;

  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return `${prefix}001`;

  const parts = data.invoice_number.split("-");
  const last = parseInt(parts[parts.length - 1] ?? "0", 10);
  const next = String(last + 1).padStart(3, "0");
  return `${prefix}${next}`;
}

// ─── GET /api/invoices ─────────────────────────────────────────────────────────
export async function GET() {
  const supabase = getService();

  const { data, error } = await supabase
    .from("invoices")
    .select("*, campaigns(id, client_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-mark overdue: status='sent' AND due_date < today
  const today = new Date().toISOString().slice(0, 10);
  const overdueIds = (data ?? [])
    .filter((inv) => inv.status === "sent" && inv.due_date < today)
    .map((inv) => inv.id as string);

  if (overdueIds.length > 0) {
    await supabase
      .from("invoices")
      .update({ status: "overdue" })
      .in("id", overdueIds);
    // Reflect in returned data
    data?.forEach((inv) => {
      if (overdueIds.includes(inv.id as string)) inv.status = "overdue";
    });
  }

  return NextResponse.json(data ?? []);
}

// ─── POST /api/invoices ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = getService();

  const body = await req.json();
  const {
    campaign_id,
    advertiser,
    advertiser_email,
    line_items,
    subtotal_zar,
    tax_zar,
    total_zar,
    status,
    issued_date,
    due_date,
    notes,
    created_by,
  } = body;

  if (!advertiser) {
    return NextResponse.json({ error: "advertiser is required" }, { status: 400 });
  }
  if (!due_date) {
    return NextResponse.json({ error: "due_date is required" }, { status: 400 });
  }

  const invoice_number = await nextInvoiceNumber(supabase);

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      invoice_number,
      campaign_id: campaign_id ?? null,
      advertiser,
      advertiser_email: advertiser_email ?? null,
      line_items: line_items ?? [],
      subtotal_zar: subtotal_zar ?? 0,
      tax_zar: tax_zar ?? 0,
      total_zar: total_zar ?? 0,
      status: status ?? "draft",
      issued_date: issued_date ?? new Date().toISOString().slice(0, 10),
      due_date,
      notes: notes ?? null,
      created_by: created_by ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
