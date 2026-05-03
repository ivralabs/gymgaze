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

  // Belt-and-braces auth check (middleware is primary)
  if (!user) redirect("/auth/login");

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "transparent" }}>
      <AdminSidebar />
      <main
        className="flex-1 overflow-y-auto dark-scroll pt-[60px] md:pt-0"
        style={{ backgroundColor: "transparent" }}
      >
        {children}
      </main>
    </div>
  );
}
