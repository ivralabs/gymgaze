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

// POST /api/venues/[id]/cover — upload or replace cover image
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

  // Delete old cover if exists
  const { data: venue } = await svc.from("venues").select("cover_image_url").eq("id", id).single();
  if (venue?.cover_image_url) {
    // Extract path from URL
    const url = new URL(venue.cover_image_url);
    const path = url.pathname.split("/object/public/venue-covers/")[1];
    if (path) await svc.storage.from("venue-covers").remove([path]);
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${id}/cover-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await svc.storage.from("venue-covers").upload(storagePath, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = svc.storage.from("venue-covers").getPublicUrl(storagePath);

  const { error: dbErr } = await svc.from("venues").update({ cover_image_url: publicUrl }).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ cover_image_url: publicUrl });
}

// DELETE /api/venues/[id]/cover — remove cover image
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

  const { data: venue } = await svc.from("venues").select("cover_image_url").eq("id", id).single();
  if (venue?.cover_image_url) {
    const url = new URL(venue.cover_image_url);
    const path = url.pathname.split("/object/public/venue-covers/")[1];
    if (path) await svc.storage.from("venue-covers").remove([path]);
  }

  await svc.from("venues").update({ cover_image_url: null }).eq("id", id);
  return NextResponse.json({ ok: true });
}
