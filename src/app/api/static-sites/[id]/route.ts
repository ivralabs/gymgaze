import { NextResponse } from "next/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const svc = serviceClient();
  const { data, error } = await svc.from("static_sites").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = serviceClient();
  const { data: site } = await svc.from("static_sites").select("photo_url").eq("id", id).single();
  if (site?.photo_url) {
    try {
      const url = new URL(site.photo_url);
      const path = url.pathname.split("/object/public/static-site-photos/")[1];
      if (path) await svc.storage.from("static-site-photos").remove([path]);
    } catch { /* ignore */ }
  }
  await svc.from("static_sites").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
