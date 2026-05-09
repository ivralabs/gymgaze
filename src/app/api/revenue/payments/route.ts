import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payments")
    .select("id, source_type, source_id, amount, payment_date, notes, created_at, recorded_by")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with source names by fetching campaign/sponsorship names
  const paymentList = data ?? [];

  const campaignIds = [
    ...new Set(
      paymentList
        .filter((p) => p.source_type === "campaign")
        .map((p) => p.source_id)
    ),
  ];
  const sponsorshipIds = [
    ...new Set(
      paymentList
        .filter((p) => p.source_type === "sponsorship")
        .map((p) => p.source_id)
    ),
  ];

  const [{ data: campaigns }, { data: sponsorships }] = await Promise.all([
    campaignIds.length > 0
      ? supabase
          .from("campaigns")
          .select("id, client_name")
          .in("id", campaignIds)
      : Promise.resolve({ data: [] }),
    sponsorshipIds.length > 0
      ? supabase
          .from("sponsorships")
          .select("id, brand_name")
          .in("id", sponsorshipIds)
      : Promise.resolve({ data: [] }),
  ]);

  const campaignMap = new Map(
    (campaigns ?? []).map((c) => [c.id, c.client_name as string])
  );
  const sponsorshipMap = new Map(
    (sponsorships ?? []).map((s) => [s.id, s.brand_name as string])
  );

  const enriched = paymentList.map((p) => ({
    ...p,
    source_name:
      p.source_type === "campaign"
        ? (campaignMap.get(p.source_id) ?? "—")
        : (sponsorshipMap.get(p.source_id) ?? "—"),
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    source_type: "campaign" | "sponsorship";
    source_id: string;
    amount: number;
    payment_date?: string;
    notes?: string;
  };

  const { source_type, source_id, amount, payment_date, notes } = body;

  if (!source_type || !source_id || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "source_type, source_id, and a positive amount are required" },
      { status: 400 }
    );
  }

  if (source_type !== "campaign" && source_type !== "sponsorship") {
    return NextResponse.json(
      { error: "source_type must be 'campaign' or 'sponsorship'" },
      { status: 400 }
    );
  }

  // Insert payment record
  const { data: payment, error: insertErr } = await supabase
    .from("payments")
    .insert({
      source_type,
      source_id,
      amount,
      payment_date: payment_date ?? new Date().toISOString().slice(0, 10),
      notes: notes ?? null,
      recorded_by: user.id,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  // Update amount_collected on the source table
  const table = source_type === "campaign" ? "campaigns" : "sponsorships";

  const { data: source, error: fetchErr } = await supabase
    .from(table)
    .select("amount_collected")
    .eq("id", source_id)
    .single();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const newCollected = ((source as { amount_collected: number }).amount_collected ?? 0) + amount;

  const { error: updateErr } = await supabase
    .from(table)
    .update({ amount_collected: newCollected })
    .eq("id", source_id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ payment, newCollected }, { status: 201 });
}
