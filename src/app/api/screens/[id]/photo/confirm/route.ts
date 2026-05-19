import { NextResponse } from "next/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/screens/[id]/photo/confirm
// Body: { publicUrl: string }
// Saves photo_url to DB after direct upload completes.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { publicUrl } = await req.json();

  if (!publicUrl) {
    return NextResponse.json({ error: "publicUrl required" }, { status: 400 });
  }

  const svc = serviceClient();
  const { error } = await svc.from("screens").update({ photo_url: publicUrl }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ photo_url: publicUrl });
}
