import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PortalNav from "./portal-nav";

export default async function PortalLayout({
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

  // Role guard: admins should never be in the portal
  const { data: roleProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleProfile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  let brandName = "GymGaze";
  let brandLogoUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("gym_brand_id")
      .eq("id", user.id)
      .single();

    if (profile?.gym_brand_id) {
      const { data: brand } = await supabase
        .from("gym_brands")
        .select("name, logo_url")
        .eq("id", profile.gym_brand_id)
        .single();

      if (brand) {
        brandName = brand.name ?? "GymGaze";
        brandLogoUrl = brand.logo_url ?? null;
      }
    }
  }

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }}>
      {/* Top nav */}
      <header
        className="sticky top-0 z-10"
        style={{
          backgroundColor: "#141414",
          borderBottom: "1px solid #2A2A2A",
          height: "72px",
        }}
      >
        <div className="flex items-center justify-between h-full px-6 max-w-7xl mx-auto">
          {/* Brand logo */}
          <div className="flex items-center gap-3">
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt={brandName}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#D4FF4F" }}
              >
                <Zap size={18} color="#0A0A0A" strokeWidth={2.5} />
              </div>
            )}
            <span
              className="text-base font-bold text-white"
              style={{
                fontFamily: "Inter Tight, sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              {brandName}
            </span>
          </div>

          {/* Nav + logout (client component for active state + logout) */}
          <PortalNav />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
