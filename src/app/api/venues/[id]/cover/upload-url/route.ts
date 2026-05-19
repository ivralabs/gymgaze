import { NextResponse } from "next/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/venues/[id]/cover/upload-url
// Body: { fileName: string, contentType: string }
// Returns: { token, path, publicUrl }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { fileName, contentType } = await req.json();

  if (!fileName || !contentType) {
    return NextResponse.json({ error: "fileName and contentType required" }, { status: 400 });
  }

  const ext = fileName.split(".").pop() ?? "jpg";
  const storagePath = `${id}/cover-${Date.now()}.${ext}`;

  const svc = serviceClient();

  // Delete old cover if exists (non-blocking — fire and forget)
  svc.from("venues").select("cover_image_url").eq("id", id).single().then(({ data: venue }) => {
    if (venue?.cover_image_url) {
      try {
        const url = new URL(venue.cover_image_url);
        const path = url.pathname.split("/object/public/venue-covers/")[1];
        if (path) svc.storage.from("venue-covers").remove([path]);
      } catch { /* ignore */ }
    }
  });

  const { data, error } = await svc.storage
    .from("venue-covers")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create signed URL" }, { status: 500 });
  }

  const { data: { publicUrl } } = svc.storage.from("venue-covers").getPublicUrl(storagePath);

  return NextResponse.json({ token: data.token, path: storagePath, publicUrl });
}
