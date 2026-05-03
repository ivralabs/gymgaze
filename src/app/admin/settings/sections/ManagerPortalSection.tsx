"use client";

import { useState, useEffect } from "react";
import { UserCheck } from "lucide-react";
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

type ManagerSections = {
  photo_upload: boolean;
  screen_info: boolean;
  venue_stats: boolean;
  contact_support: boolean;
};

const SECTION_LIST: { key: keyof ManagerSections; label: string; description: string }[] = [
  { key: "photo_upload", label: "Photo Upload", description: "Allow managers to submit monthly proof-of-display photos" },
  { key: "screen_info", label: "Screen Info", description: "Show screen specs and locations at their venue" },
  { key: "venue_stats", label: "Venue Stats", description: "Show active members, daily/weekly/monthly entries" },
  { key: "contact_support", label: "Contact Support", description: "Show a support contact button" },
];

const DEFAULT_SECTIONS: ManagerSections = {
  photo_upload: true,
  screen_info: true,
  venue_stats: true,
  contact_support: true,
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

export default function ManagerPortalSection() {
  const [sections, setSections] = useState<ManagerSections>(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetch("/api/settings/portal-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.manager_sections) setSections({ ...DEFAULT_SECTIONS, ...data.manager_sections });
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
        body: JSON.stringify({ manager_sections: sections }),
      });
      if (res.ok) {
        showToast("Manager portal settings saved", "success");
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
          <UserCheck size={20} color="#D4FF4F" />
        </div>
        <div>
          <div style={SECTION_LABEL}>Portal Control</div>
          <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
            Manager Dashboard Visibility
          </h2>
        </div>
      </div>

      <div style={{ ...GLASS_CARD, marginBottom: "24px" }}>
        {!loaded ? (
          <div style={{ padding: "24px", color: "#999", fontSize: "14px" }}>Loading...</div>
        ) : (
          <div>
            {SECTION_LIST.map((section, i) => (
              <div
                key={section.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px",
                  borderBottom: i < SECTION_LIST.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div style={{ flex: 1, marginRight: "16px" }}>
                  <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "14px" }}>{section.label}</div>
                  <div style={{ color: "#999", fontSize: "13px", marginTop: "2px" }}>{section.description}</div>
                </div>
                <Toggle
                  on={sections[section.key]}
                  onChange={(v) => setSections((prev) => ({ ...prev, [section.key]: v }))}
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
