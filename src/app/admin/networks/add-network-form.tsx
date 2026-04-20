"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function AddNetworkForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", primary_color: "#FF6B35" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors duration-150"
        style={{ backgroundColor: "#FF6B35" }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Add Network
      </button>

      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-md rounded-xl p-6"
            style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className="text-base font-semibold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                Add Network
              </h3>
              <button onClick={() => setOpen(false)}>
                <X size={18} color="#666666" strokeWidth={2} />
              </button>
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-lg mb-4 text-sm"
                style={{
                  backgroundColor: "rgba(220,38,38,0.1)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  color: "#EF4444",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
                  Brand Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. FitZone Group"
                  className="w-full rounded-lg px-4 py-3 text-sm"
                  style={{
                    backgroundColor: "#0F0F0F",
                    border: "1px solid #333333",
                    color: "#FFFFFF",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    name="primary_color"
                    type="color"
                    value={form.primary_color}
                    onChange={handleChange}
                    className="w-12 h-10 rounded cursor-pointer"
                    style={{ border: "1px solid #333333", backgroundColor: "transparent" }}
                  />
                  <input
                    name="primary_color"
                    type="text"
                    value={form.primary_color}
                    onChange={handleChange}
                    placeholder="#FF6B35"
                    className="flex-1 rounded-lg px-4 py-3 text-sm"
                    style={{
                      backgroundColor: "#0F0F0F",
                      border: "1px solid #333333",
                      color: "#FFFFFF",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ border: "1px solid #333333", color: "#B3B3B3" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: saving ? "#555" : "#FF6B35" }}
                >
                  {saving ? "Creating..." : "Create Network"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
