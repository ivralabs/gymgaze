import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }

  if (!["admin", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Use Supabase Auth admin invite — sends a magic-link email to the invitee
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://gymgaze.vercel.app"}/admin`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create a profile row so the team table shows the invite immediately
  if (data?.user?.id) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: null,
      role,
      suspended: false,
    }, { onConflict: "id" });
  }

  return NextResponse.json({ success: true });
}
