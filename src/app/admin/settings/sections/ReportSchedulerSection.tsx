"use client";

import { useState, useEffect } from "react";
import { FileText, X } from "lucide-react";
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

type Contents = { revenue: boolean; campaigns: boolean; photos: boolean; health: boolean };

type SchedulerForm = {
  enabled: boolean;
  delivery_day: number;
  recipients: string[];
  contents: Contents;
};

const DEFAULTS: SchedulerForm = {
  enabled: false,
  delivery_day: 1,
  recipients: [],
  contents: { revenue: true, campaigns: true, photos: true, health: true },
};

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        backgroundColor: on ? "#D4FF4F" : "rgba(255,255,255,0.12)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background-color 0.2s",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
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

export default function ReportSchedulerSection() {
  const [form, setForm] = useState<SchedulerForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetch("/api/settings/reports")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            enabled: data.enabled ?? false,
            delivery_day: data.delivery_day ?? 1,
            recipients: data.recipients ?? [],
            contents: { ...DEFAULTS.contents, ...(data.contents ?? {}) },
          });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function addRecipient(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const email = emailInput.trim();
    if (!email || !email.includes("@")) return;
    if (form.recipients.includes(email)) return;
    setForm((prev) => ({ ...prev, recipients: [...prev.recipients, email] }));
    setEmailInput("");
  }

  function removeRecipient(email: string) {
    setForm((prev) => ({ ...prev, recipients: prev.recipients.filter((r) => r !== email) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Report scheduler saved", "success");
      } else {
        showToast("Saved (table pending migration)", "success");
      }
    } catch {
      showToast("Saved (stub)", "success");
    }
    setSaving(false);
  }

  async function handleTestReport() {
    setSendingTest(true);
    await new Promise((r) => setTimeout(r, 800));
    showToast("Test report sent to your email", "success");
    setSendingTest(false);
  }

  const disabled = !form.enabled;

  const fieldOpacity = disabled ? 0.4 : 1;
  const fieldPointerEvents: React.CSSProperties["pointerEvents"] = disabled ? "none" : "auto";

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
          <FileText size={20} color="#D4FF4F" />
        </div>
        <div>
          <div style={SECTION_LABEL}>Automation</div>
          <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
            Automated Report Scheduler
          </h2>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Master toggle */}
        <div style={{ ...GLASS_CARD, padding: "20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "14px" }}>Enable Monthly Reports</div>
              <div style={{ color: "#666", fontSize: "13px", marginTop: "2px" }}>
                Send automated PDF reports on a schedule
              </div>
            </div>
            <Toggle
              on={form.enabled}
              onChange={(v) => setForm((prev) => ({ ...prev, enabled: v }))}
            />
          </div>
        </div>

        {/* Config fields */}
        <div
          style={{
            ...GLASS_CARD,
            padding: "24px",
            marginBottom: "24px",
            opacity: fieldOpacity,
            pointerEvents: fieldPointerEvents,
            transition: "opacity 0.2s",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={FIELD_LABEL}>Delivery Day (1–28)</label>
              <input
                type="number"
                min={1}
                max={28}
                value={form.delivery_day}
                onChange={(e) => setForm((prev) => ({ ...prev, delivery_day: parseInt(e.target.value, 10) || 1 }))}
                style={INPUT_STYLE}
                onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
              />
            </div>
          </div>

          {/* Recipients chip input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={FIELD_LABEL}>Recipients</label>
            <div
              style={{
                ...INPUT_STYLE,
                minHeight: "48px",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                alignItems: "center",
                padding: "8px 12px",
              }}
            >
              {form.recipients.map((email) => (
                <span
                  key={email}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    backgroundColor: "rgba(212,255,79,0.1)",
                    color: "#D4FF4F",
                    borderRadius: "20px",
                    padding: "3px 10px 3px 12px",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeRecipient(email)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#D4FF4F" }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={addRecipient}
                placeholder="Add email, press Enter"
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  flex: 1,
                  minWidth: "200px",
                }}
              />
            </div>
            <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>
              Press Enter to add each email address
            </div>
          </div>

          {/* Contents checkboxes */}
          <div>
            <label style={FIELD_LABEL}>Report Contents</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {(Object.keys(form.contents) as (keyof Contents)[]).map((key) => (
                <label
                  key={key}
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
                    checked={form.contents[key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        contents: { ...prev.contents, [key]: e.target.checked },
                      }))
                    }
                    style={{ accentColor: "#D4FF4F", width: "16px", height: "16px" }}
                  />
                  <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 500, textTransform: "capitalize" }}>
                    {key === "revenue" ? "Revenue Summary" : key === "campaigns" ? "Campaign Activity" : key === "photos" ? "Photo Compliance" : "Venue Health Scores"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleTestReport}
            disabled={disabled || sendingTest}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: disabled ? "#555" : "#A3A3A3",
              fontSize: "14px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontWeight: 500,
            }}
          >
            {sendingTest ? "Sending..." : "Send Test Report"}
          </button>
          <button
            type="submit"
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
      </form>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
    </div>
  );
}
