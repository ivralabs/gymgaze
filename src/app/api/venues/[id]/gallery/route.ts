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

// GET /api/venues/[id]/gallery — fetch showcase photos for a venue
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use service client for DB read + signed URL generation (bypasses RLS)
  const svc = serviceClient();

  const { data, error } = await svc
    .from("venue_photos")
    .select("id, storage_path, file_name, file_size_bytes, area_tag, created_at")
    .eq("venue_id", id)
    .eq("photo_type", "showcase")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Use public URLs — bucket is public, no expiry, no CORS issues
  const withUrls = (data ?? []).map((photo) => {
    const { data: { publicUrl } } = svc.storage
      .from("venue-photos")
      .getPublicUrl(photo.storage_path);
    return { ...photo, signedUrl: publicUrl };
  });

  return NextResponse.json(withUrls);
}

// POST /api/venues/[id]/gallery — upload a showcase photo
// Expects multipart/form-data: file (File), area_tag (optional string)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Auth check with regular client (respects session)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const areaTag = (formData.get("area_tag") as string) || "other";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${id}/showcase/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Use PURE service client for storage + DB writes (bypasses RLS — no cookies)
  const service = serviceClient();

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await service.storage
    .from("venue-photos")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: row, error: dbError } = await service
    .from("venue_photos")
    .insert({
      venue_id: id,
      storage_path: storagePath,
      uploaded_by: user.id,
      file_name: file.name,
      file_size_bytes: file.size,
      area_tag: areaTag,
      photo_type: "showcase",
      month: null,
      status: "approved",
    })
    .select("id, storage_path, file_name, file_size_bytes, area_tag, created_at")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const { data: { publicUrl } } = service.storage
    .from("venue-photos")
    .getPublicUrl(storagePath);

  return NextResponse.json({ ...row, signedUrl: publicUrl }, { status: 201 });
}

// DELETE /api/venues/[id]/gallery?photo_id=xxx
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const photoId = searchParams.get("photo_id");
  if (!photoId) return NextResponse.json({ error: "photo_id required" }, { status: 400 });

  // Use PURE service client for deletes (bypasses RLS — no cookies)
  const service = serviceClient();

  const { data: photo } = await service
    .from("venue_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("venue_id", id)
    .eq("photo_type", "showcase")
    .single();

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await service.storage.from("venue-photos").remove([photo.storage_path]);
  await service.from("venue_photos").delete().eq("id", photoId);

  return NextResponse.json({ ok: true });
}
