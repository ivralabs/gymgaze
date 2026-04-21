import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated — send to login
  if (!user) {
    redirect("/auth/login");
  }

  // Role guard: only admins allowed here
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/portal/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "transparent" }}>
      {/* Sidebar (client component for active state + logout) */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto dark-scroll" style={{ backgroundColor: "transparent" }}>
        {children}
      </main>
    </div>
  );
}
