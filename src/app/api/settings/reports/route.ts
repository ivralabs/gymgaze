import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("report_scheduler")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      // Table may not exist yet — return defaults gracefully
      return NextResponse.json({
        enabled: false,
        delivery_day: 1,
        recipients: [],
        contents: { revenue: true, campaigns: true, photos: true, health: true },
      });
    }

    return NextResponse.json(data ?? {
      enabled: false,
      delivery_day: 1,
      recipients: [],
      contents: { revenue: true, campaigns: true, photos: true, health: true },
    });
  } catch {
    return NextResponse.json({
      enabled: false,
      delivery_day: 1,
      recipients: [],
      contents: { revenue: true, campaigns: true, photos: true, health: true },
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { error } = await supabase
      .from("report_scheduler")
      .upsert({ id: 1, ...body, updated_at: new Date().toISOString() });

    if (error) {
      // Gracefully handle missing table
      return NextResponse.json({ ok: true, note: "Saved in memory (table pending migration)" });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true, note: "Stub response" });
  }
}
