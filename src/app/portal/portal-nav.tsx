"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, MapPin, Image, DollarSign, LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/venues", label: "Venues", icon: MapPin },
  { href: "/portal/manager", label: "Manager", icon: Image },
];

export default function PortalNav() {
  const pathname = usePathname();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
        <nav className="flex items-center gap-1 mr-2">
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
                <Icon size={16} strokeWidth={2} color={isActive ? "#D4FF4F" : "#909090"} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150"
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
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl"
        style={{ background: "rgba(255,255,255,0.06)" }}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} color="#FFFFFF" strokeWidth={2} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="md:hidden fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{
          width: "260px",
          background: "#111",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="text-sm font-semibold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Menu</span>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
            aria-label="Close menu"
          >
            <X size={16} color="#fff" strokeWidth={2} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{
                  color: isActive ? "#D4FF4F" : "#A3A3A3",
                  background: isActive
                    ? "linear-gradient(90deg, rgba(212,255,79,0.12) 0%, rgba(212,255,79,0.04) 100%)"
                    : "transparent",
                }}
              >
                <Icon size={18} color={isActive ? "#D4FF4F" : "#909090"} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium mt-4 transition-colors duration-150"
            style={{ color: "#909090" }}
          >
            <LogOut size={18} strokeWidth={2} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
