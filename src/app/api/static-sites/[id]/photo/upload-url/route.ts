import { NextResponse } from "next/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/static-sites/[id]/photo/upload-url
// Body: { ext: string }
// Returns: { token, path, publicUrl }
// Client uploads directly to Supabase Storage via signed URL — bypasses Vercel 4.5MB limit
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const ext = (body.ext as string) || "jpg";

  const svc = serviceClient();
  const { data: site, error: fetchErr } = await svc.from("static_sites").select("id, photo_url").eq("id", id).single();
  if (fetchErr || !site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Clean up old photo if any
  if (site.photo_url) {
    try {
      const oldUrl = new URL(site.photo_url);
      const parts = oldUrl.pathname.split("/object/public/static-site-photos/");
      const oldPath = parts.length > 1 ? parts[1] : null;
      if (oldPath && oldPath.trim().length > 0) {
        await svc.storage.from("static-site-photos").remove([decodeURIComponent(oldPath)]);
      }
    } catch { /* ignore */ }
  }

  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${id}/placement-${Date.now()}.${safeExt}`;

  const { data, error } = await svc.storage.from("static-site-photos").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });

  const { data: { publicUrl } } = svc.storage.from("static-site-photos").getPublicUrl(path);

  return NextResponse.json({
    token: data.token,
    path: data.path,
    publicUrl,
  });
}
