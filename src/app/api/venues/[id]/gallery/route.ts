import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/venues/[id]/gallery — fetch showcase photos for a venue
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("venue_photos")
    .select("id, storage_path, file_name, file_size_bytes, area_tag, created_at")
    .eq("venue_id", id)
    .eq("photo_type", "showcase")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate signed URLs
  const withUrls = await Promise.all(
    (data ?? []).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from("venue-photos")
        .createSignedUrl(photo.storage_path, 3600);
      return { ...photo, signedUrl: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json(withUrls);
}

// POST /api/venues/[id]/gallery — upload a showcase photo
// Expects multipart/form-data: file (File), area_tag (optional string)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins can upload showcase photos
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

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("venue-photos")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: row, error: dbError } = await supabase
    .from("venue_photos")
    .insert({
      venue_id: id,
      storage_path: storagePath,
      uploaded_by: user.id,
      file_name: file.name,
      file_size_bytes: file.size,
      area_tag: areaTag,
      photo_type: "showcase",
      // proof_of_flight fields — set nulls for showcase
      month: null,
      status: "approved", // showcase photos don't need approval
    })
    .select("id, storage_path, file_name, file_size_bytes, area_tag, created_at")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Return signed URL too
  const { data: signed } = await supabase.storage
    .from("venue-photos")
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json({ ...row, signedUrl: signed?.signedUrl ?? null }, { status: 201 });
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

  // Fetch the row to get storage_path
  const { data: photo } = await supabase
    .from("venue_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("venue_id", id)
    .eq("photo_type", "showcase")
    .single();

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from storage
  await supabase.storage.from("venue-photos").remove([photo.storage_path]);

  // Delete DB row
  await supabase.from("venue_photos").delete().eq("id", photoId);

  return NextResponse.json({ ok: true });
}
