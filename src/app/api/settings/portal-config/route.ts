import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portal_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const defaults = {
      id: 1,
      owner_widgets: {
        revenue_summary: true,
        health_score: true,
        campaign_activity: true,
        photo_compliance: true,
        monthly_report: false,
      },
      manager_sections: {
        photo_upload: true,
        screen_info: true,
        venue_stats: true,
        contact_support: true,
      },
    };

    return NextResponse.json(data ?? defaults);
  } catch (err) {
    console.error("[GET /api/settings/portal-config]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { error } = await supabase
      .from("portal_config")
      .upsert({ id: 1, ...body, updated_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/settings/portal-config]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
