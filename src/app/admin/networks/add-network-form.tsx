"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";

export default function AddNetworkForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", primary_color: "#D4FF4F" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, primary_color: form.primary_color }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create network");
      }
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    outline: "none",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
        style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", height: "44px" }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Add Network
      </button>

      {mounted && open && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className="text-base font-semibold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                Add Network
              </h3>
              <button onClick={() => setOpen(false)}>
                <X size={18} color="#909090" strokeWidth={2} />
              </button>
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl mb-4 text-sm"
                style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#EF4444",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
                  Brand Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. FitZone Group"
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    name="primary_color"
                    type="color"
                    value={form.primary_color}
                    onChange={handleChange}
                    className="w-12 h-10 rounded cursor-pointer"
                    style={{ border: "1px solid #2A2A2A", backgroundColor: "transparent" }}
                  />
                  <input
                    name="primary_color"
                    type="text"
                    value={form.primary_color}
                    onChange={handleChange}
                    placeholder="#D4FF4F"
                    className="flex-1 rounded-xl px-4 py-3 text-sm"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{ border: "1px solid #3A3A3A", color: "#A3A3A3" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{
                    backgroundColor: saving ? "#555" : "#D4FF4F",
                    color: "#0A0A0A",
                  }}
                >
                  {saving ? "Creating..." : "Create Network"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
