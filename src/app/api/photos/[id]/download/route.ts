import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch photo record
  const { data: photo, error } = await supabase
    .from("venue_photos")
    .select("storage_path, file_name")
    .eq("id", id)
    .single();

  if (error || !photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Generate a signed URL (1 hour)
  const { data: signed, error: signError } = await supabase.storage
    .from("venue-photos")
    .createSignedUrl(photo.storage_path, 3600, { download: photo.file_name ?? true });

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, file_name: photo.file_name });
}
