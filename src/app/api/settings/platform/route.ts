import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return defaults if no row exists yet
    const defaults = {
      id: 1,
      platform_name: "GymGaze",
      support_email: "",
      default_gym_revenue_split: 30,
      invoice_prefix: "GG-",
      fy_start_month: 1,
      logo_url: null,
      accent_color: "#D4FF4F",
      portal_domain: "partners.gymgaze.co.za",
      welcome_message: "",
      ga4_measurement_id: "",
    };

    return NextResponse.json(data ?? defaults);
  } catch (err) {
    console.error("[GET /api/settings/platform]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { error } = await supabase
      .from("platform_settings")
      .upsert({ id: 1, ...body, updated_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/settings/platform]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
