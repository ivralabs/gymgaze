"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  LayoutDashboard,
  UserCheck,
  Settings,
  Paintbrush,
  FileText,
  Bell,
  Zap,
  ClipboardList,
  ChevronDown,
} from "lucide-react";

import TeamSection from "./sections/TeamSection";
import OwnerPortalSection from "./sections/OwnerPortalSection";
import ManagerPortalSection from "./sections/ManagerPortalSection";
import PlatformSection from "./sections/PlatformSection";
import WhitelabelSection from "./sections/WhitelabelSection";
import ReportSchedulerSection from "./sections/ReportSchedulerSection";
import NotificationsSection from "./sections/NotificationsSection";
import IntegrationsSection from "./sections/IntegrationsSection";
import AuditLogSection from "./sections/AuditLogSection";

type TabKey =
  | "team"
  | "owner-portal"
  | "manager-portal"
  | "platform"
  | "whitelabel"
  | "reports"
  | "notifications"
  | "integrations"
  | "audit-log";

const NAV_ITEMS: { key: TabKey; label: string; Icon: React.ElementType }[] = [
  { key: "team", label: "Team & Permissions", Icon: Users },
  { key: "owner-portal", label: "Owner Portal", Icon: LayoutDashboard },
  { key: "manager-portal", label: "Manager Portal", Icon: UserCheck },
  { key: "platform", label: "Platform Settings", Icon: Settings },
  { key: "whitelabel", label: "White-Label", Icon: Paintbrush },
  { key: "reports", label: "Report Scheduler", Icon: FileText },
  { key: "notifications", label: "Notifications", Icon: Bell },
  { key: "integrations", label: "API & Integrations", Icon: Zap },
  { key: "audit-log", label: "Audit Log", Icon: ClipboardList },
];

const SECTION_MAP: Record<TabKey, React.ReactNode> = {
  team: <TeamSection />,
  "owner-portal": <OwnerPortalSection />,
  "manager-portal": <ManagerPortalSection />,
  platform: <PlatformSection />,
  whitelabel: <WhitelabelSection />,
  reports: <ReportSchedulerSection />,
  notifications: <NotificationsSection />,
  integrations: <IntegrationsSection />,
  "audit-log": <AuditLogSection />,
};

function isValidTab(t: string | null): t is TabKey {
  return !!t && NAV_ITEMS.some((n) => n.key === t);
}

export default function SettingsShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    isValidTab(paramTab) ? paramTab : "team"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (isValidTab(t) && t !== activeTab) setActiveTab(t);
  }, [searchParams, activeTab]);

  const navigate = useCallback(
    (key: TabKey) => {
      setActiveTab(key);
      setMobileMenuOpen(false);
      router.push(`/admin/settings?tab=${key}`, { scroll: false });
    },
    [router]
  );

  const activeItem = NAV_ITEMS.find((n) => n.key === activeTab);

  return (
    <div className="p-4 md:p-8" style={{ minHeight: "100vh" }}>
      {/* Page header (mobile only) */}
      <div className="md:hidden mb-4">
        <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#FFFFFF", letterSpacing: "-0.02em" }}>Settings</h1>
        <p style={{ color: "#555", fontSize: "12px", marginTop: 2 }}>Platform configuration</p>
      </div>

      {/* Mobile tab selector */}
      <div className="md:hidden mb-4 relative">
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
        >
          <div className="flex items-center gap-2.5">
            {activeItem && <activeItem.Icon size={16} color="#D4FF4F" strokeWidth={2} />}
            <span>{activeItem?.label}</span>
          </div>
          <ChevronDown size={16} color="#666" style={{ transform: mobileMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
        {mobileMenuOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
          >
            {NAV_ITEMS.map(({ key, label, Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => navigate(key)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
                  style={{
                    color: isActive ? "#D4FF4F" : "#A3A3A3",
                    background: isActive ? "rgba(212,255,79,0.08)" : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <Icon size={15} color={isActive ? "#D4FF4F" : "#555"} strokeWidth={2} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: sidebar + content */}
      <div className="hidden md:flex gap-8" style={{ alignItems: "flex-start" }}>
        {/* Sidebar */}
        <div style={{ width: "220px", flexShrink: 0, position: "sticky", top: "32px", alignSelf: "flex-start" }}>
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: "4px" }}>Settings</h1>
            <p style={{ color: "#555", fontSize: "12px" }}>Platform configuration</p>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {NAV_ITEMS.map(({ key, label, Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => navigate(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
                    borderRadius: "10px", border: "none", cursor: "pointer", textAlign: "left",
                    width: "100%", transition: "background-color 0.15s",
                    backgroundColor: isActive ? "rgba(212,255,79,0.08)" : "transparent",
                    borderLeft: isActive ? "2px solid #D4FF4F" : "2px solid transparent",
                    color: isActive ? "#D4FF4F" : "#666",
                  }}
                >
                  <Icon size={16} color={isActive ? "#D4FF4F" : "#555"} strokeWidth={isActive ? 2.5 : 2} />
                  <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400, color: isActive ? "#D4FF4F" : "#777" }}>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>{SECTION_MAP[activeTab]}</div>
      </div>

      {/* Mobile content */}
      <div className="md:hidden">
        {SECTION_MAP[activeTab]}
      </div>
    </div>
  );
}
