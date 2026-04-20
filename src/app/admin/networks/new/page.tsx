"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewNetworkPage() {
  const [form, setForm] = useState({
    name: "",
    primaryColor: "#FF6B35",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // TODO: POST to /api/networks
    await new Promise((r) => setTimeout(r, 800));
    window.location.href = "/admin/networks";
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/networks"
          className="p-2 rounded-lg transition-colors duration-150"
          style={{ backgroundColor: "#1E1E1E", color: "#B3B3B3" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Add Gym Network
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#666666" }}>
            Register a new gym brand or network
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl p-6 space-y-5"
          style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: "#666666", fontFamily: "Inter Tight, sans-serif" }}
          >
            Brand Details
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
              Network Name *
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
                name="primaryColor"
                type="color"
                value={form.primaryColor}
                onChange={handleChange}
                className="w-12 h-12 rounded-lg cursor-pointer"
                style={{ border: "1px solid #333333", padding: "2px" }}
              />
              <input
                name="primaryColor"
                value={form.primaryColor}
                onChange={handleChange}
                placeholder="#FF6B35"
                className="w-36 rounded-lg px-4 py-3 text-sm font-mono"
                style={{
                  backgroundColor: "#0F0F0F",
                  border: "1px solid #333333",
                  color: "#FFFFFF",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-6 space-y-5 mt-5"
          style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: "#666666", fontFamily: "Inter Tight, sans-serif" }}
          >
            Contact Information
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
              Contact Name
            </label>
            <input
              name="contactName"
              value={form.contactName}
              onChange={handleChange}
              placeholder="Full name"
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
              Email Address
            </label>
            <input
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="contact@gymgroup.co.za"
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
              Phone Number
            </label>
            <input
              name="contactPhone"
              type="tel"
              value={form.contactPhone}
              onChange={handleChange}
              placeholder="+27 11 000 0000"
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: "#0F0F0F",
                border: "1px solid #333333",
                color: "#FFFFFF",
                outline: "none",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Link
            href="/admin/networks"
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{
              backgroundColor: "transparent",
              border: "1px solid #333333",
              color: "#B3B3B3",
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors duration-150"
            style={{ backgroundColor: saving ? "#666666" : "#FF6B35" }}
          >
            <Save size={16} strokeWidth={2} />
            {saving ? "Saving..." : "Save Network"}
          </button>
        </div>
      </form>
    </div>
  );
}
