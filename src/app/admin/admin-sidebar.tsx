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

export default function AdminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <aside
      className="flex flex-col h-full dark-scroll overflow-y-auto"
      style={{
        width: "240px",
        minWidth: "240px",
        backgroundColor: "#141414",
        borderRight: "1px solid #2A2A2A",
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: "1px solid #2A2A2A" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#D4FF4F" }}
        >
          <Zap size={16} color="#0A0A0A" strokeWidth={2.5} />
        </div>
        <span
          className="text-base font-bold text-white"
          style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.01em" }}
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
              style={{
                color: isActive ? "#D4FF4F" : "#A3A3A3",
                backgroundColor: isActive ? "rgba(212,255,79,0.08)" : "transparent",
              }}
            >
              <Icon
                size={18}
                color={isActive ? "#D4FF4F" : "#666666"}
                strokeWidth={2}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4" style={{ borderTop: "1px solid #2A2A2A" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 mt-4"
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
          <LogOut size={18} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
