"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Props = {
  campaignsContent: ReactNode;
  sponsorshipsContent: ReactNode;
};

export default function CampaignsTabsWrapper({ campaignsContent, sponsorshipsContent }: Props) {
  const [activeTab, setActiveTab] = useState<"campaigns" | "sponsorships">("campaigns");

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
          onClick={() => setActiveTab("campaigns")}
          className="text-sm transition-colors"
          style={activeTab === "campaigns" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          Ad Campaigns
        </button>
        <button
          onClick={() => setActiveTab("sponsorships")}
          className="text-sm transition-colors"
          style={activeTab === "sponsorships" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          Sponsorships
        </button>
      </div>

      {/* Content */}
      {activeTab === "campaigns" ? campaignsContent : sponsorshipsContent}
    </div>
  );
}
