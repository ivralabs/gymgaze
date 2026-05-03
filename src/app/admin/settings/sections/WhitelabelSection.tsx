"use client";

import { useState, useEffect, useRef } from "react";
import { Paintbrush, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
  color: "#C8C8C8",
  marginBottom: "8px",
};

type WhitelabelForm = {
  logo_url: string;
  accent_color: string;
  portal_domain: string;
  welcome_message: string;
};

const DEFAULTS: WhitelabelForm = {
  logo_url: "",
  accent_color: "#D4FF4F",
  portal_domain: "partners.gymgaze.co.za",
  welcome_message: "",
};

export default function WhitelabelSection() {
  const supabase = createClient();
  const [form, setForm] = useState<WhitelabelForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetch("/api/settings/platform")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          logo_url: data.logo_url ?? "",
          accent_color: data.accent_color ?? "#D4FF4F",
          portal_domain: data.portal_domain ?? "partners.gymgaze.co.za",
          welcome_message: data.welcome_message ?? "",
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo must be under 2MB", "error");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo/platform-logo.${ext}`;
      const { error } = await supabase.storage
        .from("platform-assets")
        .upload(path, file, { upsert: true });

      if (error) {
        showToast("Failed to upload logo", "error");
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("platform-assets")
          .getPublicUrl(path);
        setForm((prev) => ({ ...prev, logo_url: publicUrl }));
        showToast("Logo uploaded", "success");
      }
    } catch {
      showToast("Upload failed", "error");
    }
    setUploading(false);
  }

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
        showToast("White-label settings saved", "success");
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
          <Paintbrush size={20} color="#D4FF4F" />
        </div>
        <div>
          <div style={SECTION_LABEL}>Branding</div>
          <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
            White-Label Portal Builder
          </h2>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          {/* Left: Form */}
          <div style={{ ...GLASS_CARD, padding: "24px" }}>
            <div style={{ ...SECTION_LABEL, marginBottom: "20px" }}>Customisation</div>

            {/* Logo Upload */}
            <div style={{ marginBottom: "20px" }}>
              <label style={FIELD_LABEL}>Logo (PNG / SVG, max 2MB)</label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  ...INPUT_STYLE,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  color: form.logo_url ? "#D4FF4F" : "#666",
                }}
              >
                <Upload size={16} color="#666" />
                <span style={{ fontSize: "13px" }}>
                  {uploading ? "Uploading..." : form.logo_url ? "Logo uploaded" : "Click to upload logo"}
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/svg+xml"
                onChange={handleLogoUpload}
                style={{ display: "none" }}
              />
            </div>

            {/* Accent Colour */}
            <div style={{ marginBottom: "20px" }}>
              <label style={FIELD_LABEL}>Primary Accent Colour</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, accent_color: e.target.value }))}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    padding: "2px",
                  }}
                />
                <input
                  type="text"
                  value={form.accent_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, accent_color: e.target.value }))}
                  placeholder="#D4FF4F"
                  style={{ ...INPUT_STYLE, flex: 1 }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                />
              </div>
            </div>

            {/* Portal Domain — display only */}
            <div style={{ marginBottom: "20px" }}>
              <label style={FIELD_LABEL}>Portal Domain</label>
              <input
                type="text"
                value={form.portal_domain}
                readOnly
                style={{ ...INPUT_STYLE, color: "#999", cursor: "not-allowed" }}
              />
              <div style={{ fontSize: "11px", color: "#8A8A8A", marginTop: "6px" }}>
                Contact support to change your portal domain
              </div>
            </div>

            {/* Welcome Message */}
            <div>
              <label style={FIELD_LABEL}>Welcome Message (max 200 chars)</label>
              <textarea
                value={form.welcome_message}
                onChange={(e) => setForm((prev) => ({ ...prev, welcome_message: e.target.value }))}
                maxLength={200}
                rows={3}
                placeholder="Welcome to your GymGaze partner portal."
                style={{
                  ...INPUT_STYLE,
                  resize: "none",
                  lineHeight: "1.5",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
              />
              <div style={{ fontSize: "11px", color: "#8A8A8A", marginTop: "4px", textAlign: "right" }}>
                {form.welcome_message.length}/200
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div style={{ ...GLASS_CARD, padding: "24px", display: "flex", flexDirection: "column" }}>
            <div style={{ ...SECTION_LABEL, marginBottom: "20px" }}>Live Preview</div>

            {/* Portal header mock */}
            <div
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                background: "rgba(10,10,10,0.8)",
                border: "1px solid rgba(255,255,255,0.06)",
                flex: 1,
              }}
            >
              {/* Accent strip */}
              <div
                style={{
                  height: "4px",
                  backgroundColor: form.accent_color || "#D4FF4F",
                  transition: "background-color 0.2s",
                }}
              />

              {/* Header */}
              <div
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logo_url}
                    alt="Portal logo"
                    style={{ height: "36px", width: "auto", objectFit: "contain" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      backgroundColor: form.accent_color || "#D4FF4F",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ color: "#0A0A0A", fontWeight: 800, fontSize: "14px" }}>G</span>
                  </div>
                )}
                <div>
                  <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "15px" }}>Partner Portal</div>
                  <div style={{ color: "#999", fontSize: "12px" }}>{form.portal_domain || "partners.gymgaze.co.za"}</div>
                </div>
              </div>

              {/* Welcome */}
              <div style={{ padding: "20px 24px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    color: form.accent_color || "#D4FF4F",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "8px",
                  }}
                >
                  Welcome
                </div>
                <p style={{ color: "#C8C8C8", fontSize: "14px", lineHeight: "1.5" }}>
                  {form.welcome_message || "Welcome to your GymGaze partner portal."}
                </p>
              </div>

              {/* Mock nav items */}
              <div style={{ padding: "0 16px 20px" }}>
                {["Dashboard", "Revenue", "Photos", "Reports"].map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      color: "#8A8A8A",
                      fontSize: "13px",
                      marginBottom: "2px",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
