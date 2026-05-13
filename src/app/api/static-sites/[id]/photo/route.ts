import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const svc = serviceClient();
  const { data: site } = await svc.from("static_sites").select("photo_url").eq("id", id).single();
  if (site?.photo_url) {
    const url = new URL(site.photo_url);
    const path = url.pathname.split("/object/public/static-site-photos/")[1];
    if (path) await svc.storage.from("static-site-photos").remove([path]);
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
  await svc.from("static_sites").update({ photo_url: publicUrl }).eq("id", id);

  return NextResponse.json({ photo_url: publicUrl });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = serviceClient();
  const { data: site } = await svc.from("static_sites").select("photo_url").eq("id", id).single();
  if (site?.photo_url) {
    const url = new URL(site.photo_url);
    const path = url.pathname.split("/object/public/static-site-photos/")[1];
    if (path) await svc.storage.from("static-site-photos").remove([path]);
  }
  await svc.from("static_sites").update({ photo_url: null }).eq("id", id);
  return NextResponse.json({ ok: true });
}
