"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Info } from "lucide-react";
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

type Preferences = {
  photo_submitted: boolean;
  photo_approved: boolean;
  photo_rejected: boolean;
  campaign_live: boolean;
  campaign_ended: boolean;
  revenue_added: boolean;
  portal_login: boolean;
};

const NOTIFICATION_LIST: { key: keyof Preferences; label: string; description: string }[] = [
  { key: "photo_submitted", label: "New Photo Submitted", description: "A manager has submitted a proof-of-display photo" },
  { key: "photo_approved", label: "Photo Approved", description: "A photo submission was approved" },
  { key: "photo_rejected", label: "Photo Rejected", description: "A photo submission was rejected" },
  { key: "campaign_live", label: "Campaign Goes Live", description: "A campaign has started running at venues" },
  { key: "campaign_ended", label: "Campaign Ends", description: "A campaign has reached its end date" },
  { key: "revenue_added", label: "Revenue Entry Added", description: "A new revenue record has been logged" },
  { key: "portal_login", label: "New Partner Portal Login", description: "An owner or manager has logged into the portal" },
];

const DEFAULTS: Preferences = {
  photo_submitted: true,
  photo_approved: false,
  photo_rejected: true,
  campaign_live: true,
  campaign_ended: false,
  revenue_added: false,
  portal_login: true,
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

export default function NotificationsSection() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setPrefs({ ...DEFAULTS, ...data });
        }
        setLoaded(true);
        hasLoaded.current = true;
      })
      .catch(() => {
        setLoaded(true);
        hasLoaded.current = true;
      });
  }, []);

  function handleToggle(key: keyof Preferences, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);

    // Debounced auto-save (500ms)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
        .then((r) => {
          if (r.ok) showToast("Notification preferences saved", "success");
          else showToast("Failed to save preferences", "error");
        })
        .catch(() => showToast("Failed to save preferences", "error"));
    }, 500);
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
          <Bell size={20} color="#D4FF4F" />
        </div>
        <div>
          <div style={SECTION_LABEL}>Alerts</div>
          <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
            Notification Centre
          </h2>
        </div>
      </div>

      {/* Info callout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          borderRadius: "12px",
          backgroundColor: "rgba(96,165,250,0.08)",
          border: "1px solid rgba(96,165,250,0.2)",
          marginBottom: "20px",
        }}
      >
        <Info size={16} color="#60A5FA" strokeWidth={2} />
        <span style={{ color: "#60A5FA", fontSize: "13px", fontWeight: 500 }}>
          Notifications are in-app only. Email delivery coming soon.
        </span>
      </div>

      <div style={GLASS_CARD}>
        {!loaded ? (
          <div style={{ padding: "24px", color: "#999", fontSize: "14px" }}>Loading...</div>
        ) : (
          <div>
            {NOTIFICATION_LIST.map((item, i) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px",
                  borderBottom: i < NOTIFICATION_LIST.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div style={{ flex: 1, marginRight: "16px" }}>
                  <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "14px" }}>{item.label}</div>
                  <div style={{ color: "#999", fontSize: "13px", marginTop: "2px" }}>{item.description}</div>
                </div>
                <Toggle
                  on={prefs[item.key]}
                  onChange={(v) => handleToggle(item.key, v)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
    </div>
  );
}
