import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function hashPin(pin: string): string {
  let hash = 0;
  const salt = "gymgaze-insights-2026";
  const str = salt + pin;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function POST(request: NextRequest) {
  const { token, pin } = await request.json();

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: link } = await service
    .from("insight_links")
    .select("pin_hash, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!link) return NextResponse.json({ ok: false }, { status: 404 });
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ ok: false, expired: true }, { status: 410 });
  }

  const correct = hashPin(String(pin)) === link.pin_hash;
  return NextResponse.json({ ok: correct });
}
