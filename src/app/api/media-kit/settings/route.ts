import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = await createServiceClient();
  const { data, error } = await service
    .from("media_kit_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? {});
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    tagline?: string;
  };

  const service = await createServiceClient();

  // Upsert: check if a row exists
  const { data: existing } = await service
    .from("media_kit_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  let result;
  if (existing?.id) {
    result = await service
      .from("media_kit_settings")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await service
      .from("media_kit_settings")
      .insert(body)
      .select()
      .single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

  return NextResponse.json(result.data);
}
