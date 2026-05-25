"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type Props = {
  screensContent: ReactNode;
  staticSitesContent: ReactNode;
};

export default function ScreensTabsWrapper({ screensContent, staticSitesContent }: Props) {
  const [activeTab, setActiveTab] = useState<"screens" | "static-sites">("screens");

  // Honour deep-link hashes: #static-sites or #screens
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "static-sites" || hash === "screens") {
        setActiveTab(hash);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const TAB_ACTIVE: React.CSSProperties = {
    color: "#D4FF4F",
    borderBottom: "2px solid #D4FF4F",
    paddingBottom: "10px",
    fontWeight: 600,
  };
  const TAB_INACTIVE: React.CSSProperties = {
    color: "#A3A3A3",
    borderBottom: "2px solid transparent",
    paddingBottom: "10px",
    fontWeight: 500,
  };

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex items-center gap-6 px-4 md:px-8 pt-4 md:pt-8"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={() => {
            setActiveTab("screens");
            if (typeof window !== "undefined") history.replaceState(null, "", "#screens");
          }}
          className="text-sm transition-colors"
          style={activeTab === "screens" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          Digital Screens
        </button>
        <button
          onClick={() => {
            setActiveTab("static-sites");
            if (typeof window !== "undefined") history.replaceState(null, "", "#static-sites");
          }}
          className="text-sm transition-colors"
          style={activeTab === "static-sites" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          Static Sites
        </button>
      </div>

      {/* Content */}
      {activeTab === "screens" ? screensContent : staticSitesContent}
    </div>
  );
}
