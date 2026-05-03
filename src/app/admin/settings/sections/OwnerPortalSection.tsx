"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard } from "lucide-react";
import Toast, { useToast } from "@/components/gymgaze/Toast";

const GLASS_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#D4FF4F",
};

type OwnerWidgets = {
  revenue_summary: boolean;
  health_score: boolean;
  campaign_activity: boolean;
  photo_compliance: boolean;
  monthly_report: boolean;
};

const WIDGET_LIST: { key: keyof OwnerWidgets; label: string; description: string }[] = [
  { key: "revenue_summary", label: "Revenue Summary", description: "Monthly rental + revenue share totals" },
  { key: "health_score", label: "Venue Health Score", description: "Composite score per venue (contract + photos + revenue)" },
  { key: "campaign_activity", label: "Campaign Activity", description: "Active and upcoming campaigns at their venues" },
  { key: "photo_compliance", label: "Photo Compliance", description: "Submission rate and approval status" },
  { key: "monthly_report", label: "Monthly Report Download", description: "PDF report of the previous month" },
];

const DEFAULT_WIDGETS: OwnerWidgets = {
  revenue_summary: true,
  health_score: true,
  campaign_activity: true,
  photo_compliance: true,
  monthly_report: false,
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        backgroundColor: on ? "#D4FF4F" : "rgba(255,255,255,0.12)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background-color 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: on ? "23px" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          backgroundColor: on ? "#0A0A0A" : "#555",
          transition: "left 0.2s",
          display: "block",
        }}
      />
    </button>
  );
}

export default function OwnerPortalSection() {
  const [widgets, setWidgets] = useState<OwnerWidgets>(DEFAULT_WIDGETS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetch("/api/settings/portal-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.owner_widgets) setWidgets({ ...DEFAULT_WIDGETS, ...data.owner_widgets });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/portal-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_widgets: widgets }),
      });
      if (res.ok) {
        showToast("Owner portal settings saved", "success");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch {
      showToast("Failed to save settings", "error");
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "rgba(212,255,79,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LayoutDashboard size={20} color="#D4FF4F" />
        </div>
        <div>
          <div style={SECTION_LABEL}>Portal Control</div>
          <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
            Owner Dashboard Visibility
          </h2>
        </div>
      </div>

      <div style={{ ...GLASS_CARD, marginBottom: "24px" }}>
        {!loaded ? (
          <div style={{ padding: "24px", color: "#999", fontSize: "14px" }}>Loading...</div>
        ) : (
          <div>
            {WIDGET_LIST.map((widget, i) => (
              <div
                key={widget.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px",
                  borderBottom: i < WIDGET_LIST.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div style={{ flex: 1, marginRight: "16px" }}>
                  <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "14px" }}>{widget.label}</div>
                  <div style={{ color: "#999", fontSize: "13px", marginTop: "2px" }}>{widget.description}</div>
                </div>
                <Toggle
                  on={widgets[widget.key]}
                  onChange={(v) => setWidgets((prev) => ({ ...prev, [widget.key]: v }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          disabled={saving || !loaded}
          style={{
            backgroundColor: saving ? "#555" : "#D4FF4F",
            color: "#0A0A0A",
            borderRadius: "12px",
            padding: "10px 28px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: saving ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
    </div>
  );
}
