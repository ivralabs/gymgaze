import { NextResponse } from "next/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const svc = serviceClient();

  // Verify the static site exists
  const { data: site, error: fetchErr } = await svc.from("static_sites").select("id, photo_url").eq("id", id).single();
  if (fetchErr || !site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete old photo if replacing
  if (site.photo_url) {
    try {
      const url = new URL(site.photo_url);
      const path = url.pathname.split("/object/public/static-site-photos/")[1];
      if (path) await svc.storage.from("static-site-photos").remove([path]);
    } catch { /* ignore cleanup errors */ }
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${id}/placement-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await svc.storage.from("static-site-photos").upload(storagePath, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = svc.storage.from("static-site-photos").getPublicUrl(storagePath);

  const { error: dbErr } = await svc.from("static_sites").update({ photo_url: publicUrl }).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ photo_url: publicUrl });
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
  await svc.from("static_sites").update({ photo_url: null }).eq("id", id);
  return NextResponse.json({ ok: true });
}
