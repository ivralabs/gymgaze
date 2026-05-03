"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Pencil } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  is_active: boolean | null;
}

interface Props {
  brand: Brand;
}

const INPUT: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 12,
  padding: "11px 16px",
  color: "#FFFFFF",
  outline: "none",
  width: "100%",
  fontSize: 14,
};

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "#C8C8C8",
  marginBottom: 6,
};

export default function EditBrandButton({ brand }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state — pre-filled from current brand data
  const [name, setName] = useState(brand.name);
  const [contactName, setContactName] = useState(brand.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(brand.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(brand.contact_phone ?? "");
  const [logoUrl, setLogoUrl] = useState(brand.logo_url ?? "");
  const [isActive, setIsActive] = useState(brand.is_active !== false);

  function handleOpen() {
    // Reset to current brand values each time we open
    setName(brand.name);
    setContactName(brand.contact_name ?? "");
    setContactEmail(brand.contact_email ?? "");
    setContactPhone(brand.contact_phone ?? "");
    setLogoUrl(brand.logo_url ?? "");
    setIsActive(brand.is_active !== false);
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Brand name is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/networks/${brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
          logo_url: logoUrl || null,
          is_active: isActive,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to update brand");
      }

      // Reload to reflect changes
      setOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
        style={{
          background: "rgba(212,255,79,0.08)",
          border: "1px solid rgba(212,255,79,0.2)",
          color: "#D4FF4F",
          cursor: "pointer",
        }}
      >
        <Pencil size={12} strokeWidth={2.5} />
        Edit Brand
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.7)",
                zIndex: 50,
              }}
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <div
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: 480,
                maxWidth: "100vw",
                zIndex: 51,
                display: "flex",
                flexDirection: "column",
                background: "rgba(15,15,15,0.98)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderLeft: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#D4FF4F",
                      marginBottom: 4,
                    }}
                  >
                    Network
                  </p>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      fontFamily: "Inter Tight, sans-serif",
                    }}
                  >
                    Edit Brand
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 8,
                    padding: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={16} color="#909090" strokeWidth={2} />
                </button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                {error && (
                  <div
                    style={{
                      backgroundColor: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#EF4444",
                      borderRadius: 12,
                      padding: "12px 16px",
                      fontSize: 14,
                      marginBottom: 24,
                    }}
                  >
                    {error}
                  </div>
                )}

                <form id="edit-brand-form" onSubmit={handleSubmit}>
                  {/* Brand Name */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={LABEL}>Brand Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Planet Fitness"
                      style={INPUT}
                    />
                  </div>

                  {/* Logo URL */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={LABEL}>Logo URL</label>
                    <input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      style={INPUT}
                    />
                    {logoUrl && (
                      <div style={{ marginTop: 8 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            objectFit: "cover",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      margin: "20px 0",
                    }}
                  />

                  {/* Contact Name */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={LABEL}>Contact Name</label>
                    <input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Primary contact person"
                      style={INPUT}
                    />
                  </div>

                  {/* Contact Email */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={LABEL}>Contact Email</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@brand.co.za"
                      style={INPUT}
                    />
                  </div>

                  {/* Contact Phone */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={LABEL}>Contact Phone</label>
                    <input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+27 ..."
                      style={INPUT}
                    />
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      margin: "20px 0",
                    }}
                  />

                  {/* Active toggle */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div>
                      <p style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 500 }}>
                        Active
                      </p>
                      <p style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
                        Inactive brands are hidden from reporting
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive((v) => !v)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        border: "none",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        backgroundColor: isActive
                          ? "#D4FF4F"
                          : "rgba(255,255,255,0.15)",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 2,
                          left: isActive ? 22 : 2,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          backgroundColor: isActive ? "#0A0A0A" : "#666",
                          transition: "left 0.2s",
                        }}
                      />
                    </button>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  padding: "16px 24px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  background: "rgba(15,15,15,0.98)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 12,
                    fontSize: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#C8C8C8",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-brand-form"
                  disabled={saving}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    border: "none",
                    backgroundColor: saving ? "#555" : "#D4FF4F",
                    color: "#0A0A0A",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "Inter Tight, sans-serif",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
