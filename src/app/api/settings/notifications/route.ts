import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PREFERENCES = {
  photo_submitted: true,
  photo_approved: false,
  photo_rejected: true,
  campaign_live: true,
  campaign_ended: false,
  revenue_added: false,
  portal_login: true,
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("preferences")
      .eq("admin_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.preferences ?? DEFAULT_PREFERENCES);
  } catch (err) {
    console.error("[GET /api/settings/notifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const preferences = await req.json();

    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        admin_id: user.id,
        preferences,
        updated_at: new Date().toISOString(),
      }, { onConflict: "admin_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/settings/notifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
