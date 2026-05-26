import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const supabase = getService();

  type VenueRow = {
    name: string;
    city: string | null;
    province: string | null;
    monthly_entries: number | null;
    active_members: number | null;
    rental_fee_monthly: number | null;
    rental_payment_cycle: string | null;
    rental_start_date: string | null;
    rental_escalation_pct: number | null;
    rental_notes: string | null;
  };

  const { data, error } = await supabase
    .from("venues")
    .select(
      "name, city, province, monthly_entries, active_members, " +
      "rental_fee_monthly, rental_payment_cycle, rental_start_date, " +
      "rental_escalation_pct, rental_notes"
    )
    .order("city", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as unknown as VenueRow[];

  // CSV header
  const header = [
    "Venue",
    "City",
    "Province",
    "Monthly Walk-Ins",
    "Members",
    "Rental Fee (ZAR)",
    "Cycle",
    "Start Date",
    "Escalation %",
    "Notes",
  ].join(",");

  const lines = rows.map((r) =>
    [
      escapeCsv(r.name),
      escapeCsv(r.city),
      escapeCsv(r.province),
      escapeCsv(r.monthly_entries),
      escapeCsv(r.active_members),
      escapeCsv(r.rental_fee_monthly ?? 0),
      escapeCsv(r.rental_payment_cycle ?? "monthly"),
      escapeCsv(r.rental_start_date ?? ""),
      escapeCsv(r.rental_escalation_pct ?? 0),
      escapeCsv(r.rental_notes ?? ""),
    ].join(",")
  );

  const csv = [header, ...lines].join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="landlords-${today}.csv"`,
    },
  });
}
