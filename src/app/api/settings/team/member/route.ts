import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/settings/team/member — update role + permissions for a team member
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins can update roles
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Only admins can update roles" }, { status: 403 });
  }

  const body = await request.json();
  const { id, role, permissions } = body;

  if (!id || !role) {
    return NextResponse.json({ error: "id and role are required" }, { status: 400 });
  }

  const validRoles = ["admin", "manager", "sales", "viewer", "custom"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      role,
      // For non-custom roles, clear permissions (use defaults). For custom, save the array.
      permissions: role === "custom" ? (permissions ?? null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/settings/team/member?id=<profile_id> — suspend a member
export async function DELETE(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Only admins can suspend members" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (id === user.id) return NextResponse.json({ error: "Cannot suspend yourself" }, { status: 400 });

  const { error } = await supabase
    .from("profiles")
    .update({ suspended: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
