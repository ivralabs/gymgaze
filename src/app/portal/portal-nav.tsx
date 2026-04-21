"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Image, DollarSign, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/venues", label: "Venues", icon: MapPin },
  { href: "/portal/photos", label: "Photos", icon: Image },
  { href: "/portal/revenue", label: "Revenue", icon: DollarSign },
];

export default function PortalNav() {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div className="flex items-center gap-1">
      <nav className="hidden md:flex items-center gap-1 mr-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150"
              style={{
                color: isActive ? "#D4FF4F" : "#A3A3A3",
                backgroundColor: isActive ? "rgba(212,255,79,0.08)" : "transparent",
              }}
            >
              <Icon size={16} strokeWidth={2} color={isActive ? "#D4FF4F" : "#666666"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150"
        style={{ color: "#666666" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1E1E1E";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#666666";
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
        }}
      >
        <LogOut size={16} strokeWidth={2} />
        Sign out
      </button>
    </div>
  );
}
