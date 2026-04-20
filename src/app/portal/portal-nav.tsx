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

export default function PortalNav({ primaryColor }: { primaryColor: string }) {
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{
                color: isActive ? primaryColor : "#6B7280",
                backgroundColor: isActive ? `${primaryColor}14` : "transparent",
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

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
  );
}
