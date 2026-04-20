import Link from "next/link";
import { LayoutDashboard, MapPin, ImageIcon, DollarSign, LogOut, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PortalNav from "./portal-nav";

const navItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/portal/venues", label: "Venues", icon: "MapPin" },
  { href: "/portal/photos", label: "Photos", icon: "Image" },
  { href: "/portal/revenue", label: "Revenue", icon: "DollarSign" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let brandName = "GymGaze";
  let brandLogoUrl: string | null = null;
  let primaryColor = "#FF6B35";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("gym_brand_id")
      .eq("id", user.id)
      .single();

    if (profile?.gym_brand_id) {
      const { data: brand } = await supabase
        .from("gym_brands")
        .select("name, logo_url, primary_color")
        .eq("id", profile.gym_brand_id)
        .single();

      if (brand) {
        brandName = brand.name ?? "GymGaze";
        brandLogoUrl = brand.logo_url ?? null;
        primaryColor = brand.primary_color ?? "#FF6B35";
      }
    }
  }

  return (
    <div
      style={
        { backgroundColor: "#F9FAFB", minHeight: "100vh", "--brand-primary": primaryColor } as React.CSSProperties
      }
    >
      {/* Top nav */}
      <header
        className="sticky top-0 z-10"
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
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
                style={{ backgroundColor: primaryColor }}
              >
                <Zap size={18} color="#FFFFFF" strokeWidth={2.5} />
              </div>
            )}
            <span
              className="text-base font-bold"
              style={{
                fontFamily: "Inter Tight, sans-serif",
                color: "#111827",
              }}
            >
              {brandName}
            </span>
          </div>

          {/* Nav + logout (client component for active state + logout) */}
          <PortalNav primaryColor={primaryColor} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
