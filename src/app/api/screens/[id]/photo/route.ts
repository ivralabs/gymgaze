import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as serviceClient } from "@supabase/supabase-js";

function service() {
  return serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/screens/[id]/photo — upload screen placement photo
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const svc = service();

  // Get current photo to delete if replacing
  const { data: screen } = await svc.from("screens").select("photo_url").eq("id", id).single();
  if (screen?.photo_url) {
    const url = new URL(screen.photo_url);
    const path = url.pathname.split("/object/public/screen-photos/")[1];
    if (path) await svc.storage.from("screen-photos").remove([path]);
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${id}/placement-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await svc.storage.from("screen-photos").upload(storagePath, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = svc.storage.from("screen-photos").getPublicUrl(storagePath);

  const { error: dbErr } = await svc.from("screens").update({ photo_url: publicUrl }).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ photo_url: publicUrl });
}

// DELETE /api/screens/[id]/photo — remove screen photo
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const svc = service();
  const { data: screen } = await svc.from("screens").select("photo_url").eq("id", id).single();
  if (screen?.photo_url) {
    const url = new URL(screen.photo_url);
    const path = url.pathname.split("/object/public/screen-photos/")[1];
    if (path) await svc.storage.from("screen-photos").remove([path]);
  }
  await svc.from("screens").update({ photo_url: null }).eq("id", id);
  return NextResponse.json({ ok: true });
}
