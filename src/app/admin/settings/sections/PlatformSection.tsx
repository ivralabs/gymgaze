"use client";

import { useState, useEffect } from "react";
import { Settings, ChevronDown } from "lucide-react";
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

const LOCKED_INPUT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  color: "#999",
  cursor: "not-allowed",
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
  color: "#C8C8C8",
  marginBottom: "8px",
};

type PlatformForm = {
  platform_name: string;
  support_email: string;
  default_gym_revenue_split: number;
  invoice_prefix: string;
  fy_start_month: number;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DEFAULTS: PlatformForm = {
  platform_name: "GymGaze",
  support_email: "",
  default_gym_revenue_split: 30,
  invoice_prefix: "GG-",
  fy_start_month: 1,
};

export default function PlatformSection() {
  const [form, setForm] = useState<PlatformForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetch("/api/settings/platform")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          platform_name: data.platform_name ?? DEFAULTS.platform_name,
          support_email: data.support_email ?? "",
          default_gym_revenue_split: data.default_gym_revenue_split ?? 30,
          invoice_prefix: data.invoice_prefix ?? "GG-",
          fy_start_month: data.fy_start_month ?? 1,
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Platform settings saved", "success");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch {
      showToast("Failed to save settings", "error");
    }
    setSaving(false);
  }

  const set = (key: keyof PlatformForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = key === "default_gym_revenue_split" || key === "fy_start_month"
      ? Number(e.target.value)
      : e.target.value;
    setForm((prev) => ({ ...prev, [key]: val }));
  };

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
          <Settings size={20} color="#D4FF4F" />
        </div>
        <div>
          <div style={SECTION_LABEL}>Configuration</div>
          <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
            Platform Settings
          </h2>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ ...GLASS_CARD, padding: "24px", marginBottom: "24px" }}>
          {!loaded ? (
            <div style={{ color: "#999", fontSize: "14px" }}>Loading...</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Platform Name */}
              <div>
                <label style={FIELD_LABEL}>Platform Name</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={form.platform_name}
                  onChange={set("platform_name")}
                  style={INPUT_STYLE}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                />
              </div>

              {/* Support Email */}
              <div>
                <label style={FIELD_LABEL}>Support Email</label>
                <input
                  type="email"
                  value={form.support_email}
                  onChange={set("support_email")}
                  placeholder="support@gymgaze.co.za"
                  style={INPUT_STYLE}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                />
              </div>

              {/* Currency — locked */}
              <div>
                <label style={FIELD_LABEL}>Default Currency</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value="ZAR (South African Rand)"
                    readOnly
                    style={LOCKED_INPUT_STYLE}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "11px",
                      color: "#8A8A8A",
                      fontWeight: 600,
                    }}
                  >
                    LOCKED
                  </span>
                </div>
              </div>

              {/* Revenue Split */}
              <div>
                <label style={FIELD_LABEL}>Default Gym Revenue Split (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.default_gym_revenue_split}
                  onChange={set("default_gym_revenue_split")}
                  style={INPUT_STYLE}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                />
              </div>

              {/* Invoice Prefix */}
              <div>
                <label style={FIELD_LABEL}>Invoice Prefix</label>
                <input
                  type="text"
                  maxLength={10}
                  value={form.invoice_prefix}
                  onChange={set("invoice_prefix")}
                  placeholder="GG-"
                  style={INPUT_STYLE}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                />
              </div>

              {/* Financial Year Start */}
              <div>
                <label style={FIELD_LABEL}>Financial Year Start</label>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.fy_start_month}
                    onChange={set("fy_start_month")}
                    style={{
                      ...INPUT_STYLE,
                      appearance: "none",
                      WebkitAppearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    color="#666"
                    style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
