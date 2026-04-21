import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("api_credentials")
      .select("api_key_prefix, webhook_url, webhook_events, ga4_measurement_id")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({
        api_key_prefix: null,
        webhook_url: "",
        webhook_events: [],
        ga4_measurement_id: "",
      });
    }

    return NextResponse.json(data ?? {
      api_key_prefix: null,
      webhook_url: "",
      webhook_events: [],
      ga4_measurement_id: "",
    });
  } catch (err) {
    console.error("[GET /api/settings/integrations]", err);
    return NextResponse.json({ api_key_prefix: null, webhook_url: "", webhook_events: [], ga4_measurement_id: "" });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { error } = await supabase
      .from("api_credentials")
      .upsert({ id: 1, ...body, updated_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/settings/integrations]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
