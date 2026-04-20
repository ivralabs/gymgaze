"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Megaphone,
  DollarSign,
  Image,
  Settings,
  Zap,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/networks", icon: Building2, label: "Networks" },
  { href: "/admin/venues", icon: MapPin, label: "Venues" },
  { href: "/admin/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/admin/revenue", icon: DollarSign, label: "Revenue" },
  { href: "/admin/photos", icon: Image, label: "Photos" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0F0F0F" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col h-full dark-scroll overflow-y-auto"
        style={{
          width: "240px",
          minWidth: "240px",
          backgroundColor: "#1E1E1E",
          borderRight: "1px solid #333333",
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: "1px solid #333333" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#FF6B35" }}
          >
            <Zap size={16} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <span
            className="text-base font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            GymGaze
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{
                  color: isActive ? "#FFFFFF" : "#B3B3B3",
                  backgroundColor: isActive
                    ? "rgba(255, 107, 53, 0.15)"
                    : "transparent",
                  borderLeft: isActive ? "2px solid #FF6B35" : "2px solid transparent",
                }}
              >
                <Icon
                  size={18}
                  color={isActive ? "#FF6B35" : "#666666"}
                  strokeWidth={2}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4" style={{ borderTop: "1px solid #333333" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 mt-4"
            style={{ color: "#666666" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#2A2A2A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#666666";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
            }}
          >
            <LogOut size={18} strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto dark-scroll" style={{ backgroundColor: "#0F0F0F" }}>
        {children}
      </main>
    </div>
  );
}
