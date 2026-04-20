"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewVenuePage() {
  const [form, setForm] = useState({
    name: "",
    gymBrandId: "",
    address: "",
    city: "",
    region: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    window.location.href = "/admin/venues";
  }

  const inputStyle = {
    backgroundColor: "#0F0F0F",
    border: "1px solid #333333",
    color: "#FFFFFF",
    outline: "none",
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/venues"
          className="p-2 rounded-lg"
          style={{ backgroundColor: "#1E1E1E", color: "#B3B3B3" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Add Venue
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#666666" }}>
            Register a new gym venue
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl p-6 space-y-5 mb-5"
          style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#666666" }}
          >
            Venue Details
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
              Venue Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. FitZone Sandton"
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
              Gym Network
            </label>
            <select
              name="gymBrandId"
              value={form.gymBrandId}
              onChange={handleChange}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={inputStyle}
            >
              <option value="">Select a network...</option>
              <option value="1">FitZone Group</option>
              <option value="2">PowerGym SA</option>
              <option value="3">IronHouse Fitness</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
              Street Address
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Main Street"
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
                City *
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                placeholder="Sandton"
                className="w-full rounded-lg px-4 py-3 text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
                Region / Province
              </label>
              <input
                name="region"
                value={form.region}
                onChange={handleChange}
                placeholder="Gauteng"
                className="w-full rounded-lg px-4 py-3 text-sm"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={inputStyle}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/venues"
            className="px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ border: "1px solid #333333", color: "#B3B3B3" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: saving ? "#666666" : "#FF6B35" }}
          >
            <Save size={16} strokeWidth={2} />
            {saving ? "Saving..." : "Save Venue"}
          </button>
        </div>
      </form>
    </div>
  );
}
