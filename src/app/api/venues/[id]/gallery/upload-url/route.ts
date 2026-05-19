import { NextResponse } from "next/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/venues/[id]/gallery/upload-url
// Body: { fileName: string, contentType: string, areaTag?: string }
// Returns: { token, path, publicUrl, areaTag }
// Middleware already enforces /admin/* auth — no extra auth check needed here.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { fileName, contentType, areaTag = "other" } = await req.json();

  if (!fileName || !contentType) {
    return NextResponse.json({ error: "fileName and contentType required" }, { status: 400 });
  }

  const ext = fileName.split(".").pop() ?? "jpg";
  const storagePath = `${id}/showcase/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const svc = serviceClient();
  const { data, error } = await svc.storage
    .from("venue-photos")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create signed URL" }, { status: 500 });
  }

  const { data: { publicUrl } } = svc.storage
    .from("venue-photos")
    .getPublicUrl(storagePath);

  return NextResponse.json({
    token: data.token,
    path: storagePath,
    publicUrl,
    areaTag,
  });
}
