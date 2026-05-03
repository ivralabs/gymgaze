"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Megaphone,
  DollarSign,
  BarChart3,
  Image,
  Settings,
  Zap,
  LogOut,
  Menu,
  X,
  Lightbulb,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/networks", icon: Building2, label: "Networks" },
  { href: "/admin/venues", icon: MapPin, label: "Venues" },
  { href: "/admin/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/admin/revenue", icon: DollarSign, label: "Revenue" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/photos", icon: Image, label: "Photos" },
  { href: "/admin/insights", icon: Lightbulb, label: "Insights" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

function NavContent({
  pathname,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
              style={{
                color: isActive ? "#D4FF4F" : "#A3A3A3",
                backgroundColor: isActive ? "rgba(212,255,79,0.08)" : "transparent",
                boxShadow: isActive ? "inset 3px 0 0 rgba(212,255,79,0.15)" : "none",
                background: isActive
                  ? "linear-gradient(90deg, rgba(212,255,79,0.12) 0%, rgba(212,255,79,0.04) 100%)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(212,255,79,0.04)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#A3A3A3";
                }
              }}
            >
              <Icon size={18} color={isActive ? "#D4FF4F" : "#909090"} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 mt-4"
          style={{ color: "#909090" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#909090";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
        >
          <LogOut size={18} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  const logoArea = (
    <div
      className="flex items-center gap-3 px-6 py-5 flex-shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
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
  );

  return (
    <>
      {/* ── Desktop sidebar (md+) ── */}
      <aside
        className="hidden md:flex glass-sidebar flex-col h-full dark-scroll overflow-y-auto"
        style={{ width: "240px", minWidth: "240px", willChange: "transform" }}
      >
        {logoArea}
        <NavContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile top bar ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          height: "60px",
          background: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#D4FF4F" }}
          >
            <Zap size={14} color="#0A0A0A" strokeWidth={2.5} />
          </div>
          <span
            className="text-sm font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.01em" }}
          >
            GymGaze
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: "rgba(255,255,255,0.06)" }}
          aria-label="Open menu"
        >
          <Menu size={20} color="#FFFFFF" strokeWidth={2} />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <div
        className="md:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col glass-sidebar dark-scroll overflow-y-auto transition-transform duration-300"
        style={{
          width: "280px",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          willChange: "transform",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#D4FF4F" }}
            >
              <Zap size={14} color="#0A0A0A" strokeWidth={2.5} />
            </div>
            <span
              className="text-sm font-bold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.01em" }}
            >
              GymGaze
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)" }}
            aria-label="Close menu"
          >
            <X size={18} color="#FFFFFF" strokeWidth={2} />
          </button>
        </div>

        <NavContent
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </>
  );
}
