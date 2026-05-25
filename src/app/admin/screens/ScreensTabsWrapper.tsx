"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  screensContent: ReactNode;
  staticSitesContent: ReactNode;
};

function ScreensTabsInner({ screensContent, staticSitesContent }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Tab state is driven by ?tab=static-sites|screens in the URL (default screens)
  const tabParam = searchParams.get("tab");
  const initialTab: "screens" | "static-sites" =
    tabParam === "static-sites" ? "static-sites" : "screens";
  const [activeTab, setActiveTab] = useState<"screens" | "static-sites">(initialTab);

  // Sync state if the query param changes (e.g. back/forward, deep link)
  useEffect(() => {
    const next = tabParam === "static-sites" ? "static-sites" : "screens";
    setActiveTab(next);
  }, [tabParam]);

  // Backwards compatibility: also honour #static-sites hash on initial load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if ((hash === "static-sites" || hash === "screens") && hash !== tabParam) {
      // Migrate the hash into a query param so refresh + share work too
      router.replace(`${pathname}?tab=${hash}`);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTab = (tab: "screens" | "static-sites") => {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`);
  };

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
          onClick={() => selectTab("screens")}
          className="text-sm transition-colors"
          style={activeTab === "screens" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          Digital Screens
        </button>
        <button
          onClick={() => selectTab("static-sites")}
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

export default function ScreensTabsWrapper(props: Props) {
  return (
    <Suspense fallback={null}>
      <ScreensTabsInner {...props} />
    </Suspense>
  );
}
