"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Image, DollarSign, LogOut, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/venues", label: "Venues", icon: MapPin },
  { href: "/portal/photos", label: "Photos", icon: Image },
  { href: "/portal/revenue", label: "Revenue", icon: DollarSign },
];

export default function PortalLayout({
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
    <div style={{ backgroundColor: "#F9FAFB", minHeight: "100vh" }}>
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
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--brand-primary, #FF6B35)" }}
            >
              <Zap size={18} color="#FFFFFF" strokeWidth={2.5} />
            </div>
            <span
              className="text-base font-bold"
              style={{
                fontFamily: "Inter Tight, sans-serif",
                color: "#111827",
              }}
            >
              GymGaze
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                  style={{
                    color: isActive ? "#FF6B35" : "#6B7280",
                    backgroundColor: isActive ? "rgba(255,107,53,0.08)" : "transparent",
                  }}
                >
                  <Icon size={16} strokeWidth={2} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{ color: "#9CA3AF" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
            }}
          >
            <LogOut size={16} strokeWidth={2} />
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
