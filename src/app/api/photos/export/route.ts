import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venue_id");
  const status = searchParams.get("status") ?? "approved";

  if (!venueId) {
    return NextResponse.json({ error: "venue_id is required" }, { status: 400 });
  }

  // Fetch venue name for zip folder label
  const { data: venue } = await supabase
    .from("venues")
    .select("name")
    .eq("id", venueId)
    .single();

  const venueName = (venue?.name ?? "venue").replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/ /g, "_");

  // Fetch all photos for this venue
  let query = supabase
    .from("venue_photos")
    .select("id, storage_path, file_name, area_tag, month")
    .eq("venue_id", venueId);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: photos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json({ error: "No photos found" }, { status: 404 });
  }

  const zip = new JSZip();
  const root = zip.folder(venueName)!;

  // Download each image and add to zip with structured folders
  const fetches = photos.map(async (photo) => {
    try {
      const { data: signed } = await supabase.storage
        .from("venue-photos")
        .createSignedUrl(photo.storage_path, 300);

      if (!signed?.signedUrl) return;

      const res = await fetch(signed.signedUrl);
      if (!res.ok) return;
      const buffer = await res.arrayBuffer();

      const area = photo.area_tag ?? "other";
      const monthLabel = photo.month
        ? photo.month.slice(0, 7)
        : "unknown-month";
      const fileName = photo.file_name ?? `${photo.id}.jpg`;

      // Folder structure: venuename/area/YYYY-MM/filename
      root
        .folder(area)!
        .folder(monthLabel)!
        .file(fileName, buffer);
    } catch {
      // Skip failed images silently
    }
  });

  await Promise.all(fetches);

  const zipBuffer = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const buffer = Buffer.from(zipBuffer);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${venueName}-photos.zip"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
