"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Monitor,
  Megaphone,
  Sparkles,
  DollarSign,
  BarChart3,
  Image,
  Settings,

  LogOut,
  Menu,
  X,
  Lightbulb,
  Layers,
  FileText,
  Calculator,
  TrendingUp,
  Users,
  Handshake,
  Home,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resolvePermissions, type RolePreset, type NavSlug } from "@/lib/permissions";

// ── Nav structure with groups ─────────────────────────────────────────────────

type NavItem = {
  href: string;
  slug: NavSlug;
  icon: React.ElementType;
  label: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "SELL",
    items: [
      { href: "/admin/rate-card",              slug: "rate-card",              icon: Calculator, label: "Rate Card" },
      { href: "/admin/static-sites/rate-card", slug: "static-sites-rate-card", icon: FileText,   label: "Static Sites Rate Card" },
      { href: "/admin/insights",    slug: "insights",    icon: Lightbulb,       label: "Audience & Data" },
      { href: "/admin/media-kit",   slug: "media-kit",   icon: FileText,        label: "Media Kit" },
      { href: "/admin/proposals",   slug: "proposals",   icon: Handshake,       label: "Proposals" },
      { href: "/admin/pipeline",    slug: "pipeline",    icon: TrendingUp,      label: "Pipeline" },
      // contacts merged into Pipeline tab — removed from nav
    ],
  },
  {
    label: "OVERVIEW",
    items: [
      { href: "/admin/dashboard",   slug: "dashboard",   icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/networks",    slug: "networks",    icon: Building2,       label: "Networks" },
    ],
  },
  {
    label: "VENUES & SCREENS",
    items: [
      { href: "/admin/venues",      slug: "venues",      icon: MapPin,          label: "Venues" },
      { href: "/admin/screens",       slug: "screens",       icon: Monitor,  label: "Screens" },
      // static-sites merged into Screens tab — removed from nav
      { href: "/admin/inventory",      slug: "inventory",     icon: Layers,   label: "Availability" },
    ],
  },
  {
    label: "CAMPAIGNS",
    items: [
      { href: "/admin/campaigns",    slug: "campaigns",    icon: Megaphone,  label: "Campaigns" },
      // sponsorships merged into Campaigns tab — removed from nav
    ],
  },
  {
    label: "FINANCE",
    items: [
      { href: "/admin/revenue",    slug: "revenue",    icon: DollarSign, label: "Finance" },
      { href: "/admin/landlords",  slug: "landlords",  icon: Home,       label: "Landlords" },
      // future: { href: "/admin/payouts", slug: "payouts", icon: Banknote, label: "Payouts" },
      // future: { href: "/admin/invoices", slug: "invoices", icon: FileText, label: "Invoices" },
    ],
  },
  {
    label: "REPORTING",
    items: [
      { href: "/admin/analytics",   slug: "analytics",   icon: BarChart3,       label: "Analytics" },
      { href: "/admin/photos",      slug: "photos",      icon: Image,           label: "Proof Of Flight" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { href: "/admin/settings",    slug: "settings",    icon: Settings,        label: "Settings" },
    ],
  },
];

// ── NavContent ─────────────────────────────────────────────────────────────────

function NavContent({
  pathname,
  onNavigate,
  onLogout,
  allowedSlugs,
}: {
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
  allowedSlugs: NavSlug[];
}) {
  // Filter groups — only show groups that have at least one allowed item
  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedSlugs.includes(item.slug)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {/* Group label */}
            <p
              className="px-3 mb-1"
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.25)",
                textTransform: "uppercase",
              }}
            >
              {group.label}
            </p>

            {/* Group items */}
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                    style={{
                      color: isActive ? "#D4FF4F" : "#A3A3A3",
                      background: isActive
                        ? "linear-gradient(90deg, rgba(212,255,79,0.12) 0%, rgba(212,255,79,0.04) 100%)"
                        : "transparent",
                      boxShadow: isActive ? "inset 3px 0 0 rgba(212,255,79,0.15)" : "none",
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
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 mt-4"
          style={{ color: "#B0B0B0" }}
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

// ── AdminSidebar ───────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [allowedSlugs, setAllowedSlugs] = useState<NavSlug[]>([]);
  const [userRole, setUserRole] = useState<RolePreset | null>(null);

  // Load user's permissions on mount
  useEffect(() => {
    async function loadPerms() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, permissions")
        .eq("id", user.id)
        .single();
      if (profile) {
        const role = (profile.role ?? "admin") as RolePreset;
        const slugs = resolvePermissions(role, profile.permissions as NavSlug[] | null);
        setAllowedSlugs(slugs);
        setUserRole(role);
      }
    }
    loadPerms();
  }, []);

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

  const ROLE_COLORS_MAP: Record<string, { bg: string; text: string }> = {
    admin:   { bg: "rgba(212,255,79,0.15)",  text: "#D4FF4F" },
    sales:   { bg: "rgba(251,146,60,0.15)",  text: "#FB923C" },
    manager: { bg: "rgba(96,165,250,0.15)",  text: "#60A5FA" },
    viewer:  { bg: "rgba(167,139,250,0.15)", text: "#A78BFA" },
    finance: { bg: "rgba(52,211,153,0.15)",  text: "#34D399" },
    custom:  { bg: "rgba(244,114,182,0.15)", text: "#F472B6" },
  };
  const roleColor = userRole ? ROLE_COLORS_MAP[userRole] : null;
  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : null;

  const logoArea = (
    <div
      className="flex items-center gap-3 px-6 py-5 flex-shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#D4FF4F" }}
      >
        <span style={{ fontSize: 16, fontWeight: 900, color: "#0A0A0A", fontFamily: "Inter Tight, sans-serif", lineHeight: 1 }}>G</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          className="text-base font-bold text-white"
          style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.01em", lineHeight: 1.2 }}
        >
          GymGaze
        </span>
        {roleLabel && roleColor && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: roleColor.text,
              backgroundColor: roleColor.bg,
              borderRadius: 4,
              padding: "1px 6px",
              display: "inline-block",
              lineHeight: 1.6,
            }}
          >
            {roleLabel}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (md+) ── */}
      <aside
        className="hidden md:flex glass-sidebar flex-col h-full"
        style={{ width: "240px", minWidth: "240px", willChange: "transform" }}
      >
        {logoArea}
        <NavContent pathname={pathname} onLogout={handleLogout} allowedSlugs={allowedSlugs} />
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
            <span style={{ fontSize: 14, fontWeight: 900, color: "#0A0A0A", fontFamily: "Inter Tight, sans-serif", lineHeight: 1 }}>G</span>
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
        className="md:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col glass-sidebar overflow-y-auto transition-transform duration-300"
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
              <span style={{ fontSize: 14, fontWeight: 900, color: "#0A0A0A", fontFamily: "Inter Tight, sans-serif", lineHeight: 1 }}>G</span>
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
          allowedSlugs={allowedSlugs}
        />
      </div>
    </>
  );
}
