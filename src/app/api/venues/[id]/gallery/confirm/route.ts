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

// POST /api/venues/[id]/gallery/confirm
// Body: { publicUrl, path, fileName, fileSize, areaTag }
// Saves the DB row after direct browser-to-Supabase upload completes.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check to get the user ID for uploaded_by
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { publicUrl, path, fileName, fileSize, areaTag = "other" } = await req.json();

  if (!publicUrl || !path) {
    return NextResponse.json({ error: "publicUrl and path required" }, { status: 400 });
  }

  const svc = serviceClient();
  const { data: row, error } = await svc
    .from("venue_photos")
    .insert({
      venue_id: id,
      storage_path: path,
      uploaded_by: user.id,
      file_name: fileName ?? null,
      file_size_bytes: fileSize ?? null,
      area_tag: areaTag,
      photo_type: "showcase",
      month: null,
      status: "approved",
    })
    .select("id, storage_path, file_name, file_size_bytes, area_tag, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ...row, signedUrl: publicUrl }, { status: 201 });
}
