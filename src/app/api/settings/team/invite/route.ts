import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_ROLES = ["admin", "manager", "sales", "viewer", "custom"];

export async function POST(request: Request) {
  const supabase = await createClient();

  // Only logged-in admins can invite
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Only admins can invite team members" }, { status: 403 });
  }

  const body = await request.json();
  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` }, { status: 400 });
  }

  // Use Supabase Auth admin invite — sends a magic-link email
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://gymgaze.vercel.app"}/admin`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create a profile row immediately so the team table reflects the invite
  if (data?.user?.id) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: null,
        role,
        suspended: false,
      },
      { onConflict: "id" }
    );
  }

  return NextResponse.json({ success: true });
}
