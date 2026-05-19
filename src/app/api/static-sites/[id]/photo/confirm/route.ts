import { NextResponse } from "next/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/static-sites/[id]/photo/confirm
// Body: { publicUrl: string }
// Updates the static_sites.photo_url after a direct browser upload completes
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const publicUrl = body.publicUrl as string;

  if (!publicUrl) return NextResponse.json({ error: "publicUrl required" }, { status: 400 });

  const svc = serviceClient();
  const { error } = await svc.from("static_sites").update({ photo_url: publicUrl }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ photo_url: publicUrl });
}
