import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // User is authenticated — check role and send to correct dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  const ADMIN_SIDE_ROLES = ["admin", "sales", "viewer", "custom"];

  if (role && ADMIN_SIDE_ROLES.includes(role)) {
    redirect("/admin/dashboard");
  } else {
    redirect("/portal/dashboard");
  }
}
