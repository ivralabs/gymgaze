"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type Brand = { id: string; name: string };

export default function AddVenueForm({ brands }: { brands: Brand[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    gym_brand_id: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          city: form.city,
          address: form.address || null,
          gym_brand_id: form.gym_brand_id || null,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create venue");
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
        Add Venue
      </button>

      {open && (
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
                Add Venue
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
                  Venue Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. FitZone Sandton"
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
                  City *
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Sandton"
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
                  Address
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
                  Network
                </label>
                <select
                  name="gym_brand_id"
                  value={form.gym_brand_id}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={inputStyle}
                >
                  <option value="">Select network...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={inputStyle}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="coming_soon">Coming Soon</option>
                </select>
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
                  {saving ? "Creating..." : "Create Venue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
