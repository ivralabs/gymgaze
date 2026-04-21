"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Zap, Copy, RefreshCw, CheckCircle, X } from "lucide-react";
import Toast, { useToast } from "@/components/gymgaze/Toast";

const GLASS_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  padding: "12px 16px",
  color: "#FFFFFF",
  outline: "none",
  width: "100%",
  fontSize: "14px",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#D4FF4F",
};

const FIELD_LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#A3A3A3",
  marginBottom: "8px",
};

const WEBHOOK_EVENTS = [
  { key: "photo.submitted", label: "Photo Submitted" },
  { key: "photo.approved", label: "Photo Approved" },
  { key: "campaign.started", label: "Campaign Started" },
  { key: "venue.created", label: "Venue Created" },
  { key: "revenue.added", label: "Revenue Added" },
];

export default function IntegrationsSection() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [ga4Id, setGa4Id] = useState("");
  const [ga4Error, setGa4Error] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [savingGa4, setSavingGa4] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetch("/api/settings/integrations")
      .then((r) => r.json())
      .then((data) => {
        setWebhookUrl(data.webhook_url ?? "");
        setWebhookEvents(data.webhook_events ?? []);
        setGa4Id(data.ga4_measurement_id ?? "");
      })
      .catch(() => {});
  }, []);

  function copyApiKey() {
    navigator.clipboard.writeText("gg_live_placeholder_key").then(() => {
      showToast("API key copied to clipboard", "success");
    });
  }

  async function handleSaveWebhook() {
    setSavingWebhook(true);
    try {
      const res = await fetch("/api/settings/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: webhookUrl, webhook_events: webhookEvents }),
      });
      if (res.ok) showToast("Webhook saved", "success");
      else showToast("Failed to save webhook", "error");
    } catch {
      showToast("Failed to save webhook", "error");
    }
    setSavingWebhook(false);
  }

  function handleGa4Change(v: string) {
    setGa4Id(v);
    if (v && !v.startsWith("G-")) {
      setGa4Error('Measurement ID must start with "G-"');
    } else {
      setGa4Error("");
    }
  }

  async function handleSaveGa4() {
    if (ga4Error || (ga4Id && !ga4Id.startsWith("G-"))) return;
    setSavingGa4(true);
    try {
      const res = await fetch("/api/settings/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ga4_measurement_id: ga4Id }),
      });
      if (res.ok) showToast("Google Analytics ID saved", "success");
      else showToast("Failed to save GA4 ID", "error");
    } catch {
      showToast("Failed to save GA4 ID", "error");
    }
    setSavingGa4(false);
  }

  function toggleEvent(key: string) {
    setWebhookEvents((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  }

  const ga4Connected = ga4Id.startsWith("G-") && ga4Id.length > 3;

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
          <Zap size={20} color="#D4FF4F" />
        </div>
        <div>
          <div style={SECTION_LABEL}>Developer</div>
          <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
            API &amp; Integrations
          </h2>
        </div>
      </div>

      {/* API Key Card */}
      <div style={{ ...GLASS_CARD, padding: "24px", marginBottom: "16px" }}>
        <div style={{ ...SECTION_LABEL, marginBottom: "16px" }}>API Key</div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              flex: 1,
              minWidth: "200px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "12px 16px",
              fontFamily: "monospace",
              fontSize: "14px",
              color: "#A3A3A3",
              letterSpacing: "0.05em",
            }}
          >
            gg_live_••••••••••••••••
          </div>
          <button
            onClick={copyApiKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#FFFFFF",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <Copy size={14} />
            Copy
          </button>
          <button
            onClick={() => setShowRegenConfirm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#EF4444",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
        </div>
        <div style={{ fontSize: "12px", color: "#555", marginTop: "12px" }}>
          Use this key to authenticate API requests. Keep it secret.
        </div>
      </div>

      {/* Webhook Card */}
      <div style={{ ...GLASS_CARD, padding: "24px", marginBottom: "16px" }}>
        <div style={{ ...SECTION_LABEL, marginBottom: "16px" }}>Webhook</div>

        <div style={{ marginBottom: "16px" }}>
          <label style={FIELD_LABEL}>Webhook URL (HTTPS only)</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhooks/gymgaze"
            style={INPUT_STYLE}
            onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={FIELD_LABEL}>Events to send</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {WEBHOOK_EVENTS.map((event) => (
              <label
                key={event.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={webhookEvents.includes(event.key)}
                  onChange={() => toggleEvent(event.key)}
                  style={{ accentColor: "#D4FF4F", width: "15px", height: "15px" }}
                />
                <span style={{ color: "#FFFFFF", fontSize: "13px" }}>{event.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => showToast("Webhook test sent", "success")}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#A3A3A3",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Test Webhook
          </button>
          <button
            onClick={handleSaveWebhook}
            disabled={savingWebhook}
            style={{
              backgroundColor: savingWebhook ? "#555" : "#D4FF4F",
              color: "#0A0A0A",
              borderRadius: "10px",
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: savingWebhook ? "not-allowed" : "pointer",
              border: "none",
            }}
          >
            {savingWebhook ? "Saving..." : "Save Webhook"}
          </button>
        </div>
      </div>

      {/* Google Analytics Card */}
      <div style={{ ...GLASS_CARD, padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={SECTION_LABEL}>Google Analytics</div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: "20px",
              backgroundColor: ga4Connected ? "rgba(212,255,79,0.12)" : "rgba(255,255,255,0.06)",
              color: ga4Connected ? "#D4FF4F" : "#666",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {ga4Connected && <CheckCircle size={12} />}
            {ga4Connected ? "Connected" : "Not configured"}
          </span>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={FIELD_LABEL}>GA4 Measurement ID</label>
          <input
            type="text"
            value={ga4Id}
            onChange={(e) => handleGa4Change(e.target.value)}
            placeholder="G-XXXXXXXXXX"
            style={{ ...INPUT_STYLE, borderColor: ga4Error ? "rgba(239,68,68,0.5)" : undefined }}
            onFocus={(e) => (e.target.style.borderColor = ga4Error ? "rgba(239,68,68,0.5)" : "rgba(212,255,79,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = ga4Error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.10)")}
          />
          {ga4Error && (
            <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "6px" }}>{ga4Error}</div>
          )}
        </div>

        <button
          onClick={handleSaveGa4}
          disabled={savingGa4 || !!ga4Error}
          style={{
            backgroundColor: savingGa4 || ga4Error ? "#555" : "#D4FF4F",
            color: "#0A0A0A",
            borderRadius: "10px",
            padding: "10px 20px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: savingGa4 || ga4Error ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          {savingGa4 ? "Saving..." : "Save GA4 ID"}
        </button>
      </div>

      {/* Regenerate Confirm Modal */}
      {showRegenConfirm &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) => e.target === e.currentTarget && setShowRegenConfirm(false)}
          >
            <div style={{ ...GLASS_CARD, padding: "32px", width: "400px", maxWidth: "90vw", position: "relative" }}>
              <button
                onClick={() => setShowRegenConfirm(false)}
                style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "#666", cursor: "pointer" }}
              >
                <X size={20} />
              </button>

              <div style={{ color: "#EF4444", fontWeight: 700, fontSize: "18px", marginBottom: "12px" }}>
                Regenerate API Key?
              </div>
              <p style={{ color: "#A3A3A3", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                This will immediately invalidate your current API key. Any integrations using it will stop working until updated.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowRegenConfirm(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#A3A3A3",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    showToast("API key regenerated (stub)", "success");
                    setShowRegenConfirm(false);
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    backgroundColor: "#EF4444",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  Yes, Regenerate
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
    </div>
  );
}
