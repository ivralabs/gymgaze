"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, FileText, Image, DollarSign, BarChart2, Plus } from "lucide-react";

type Tab = "overview" | "screens" | "contract" | "photos" | "revenue";

const mockVenue = {
  id: "1",
  name: "FitZone Sandton",
  brand: "FitZone Group",
  city: "Sandton",
  region: "Gauteng",
  address: "Sandton City, 5th Floor, Sandton, 2196",
  status: "active",
  activeMembers: 3420,
  dailyEntries: 285,
  weeklyEntries: 1890,
  monthlyEntries: 7340,
};

const mockScreens = [
  { id: "1", label: "Main Entrance", size: 55, resolution: "1920x1080", orientation: "landscape", isActive: true },
  { id: "2", label: "Cardio Floor", size: 43, resolution: "1920x1080", orientation: "landscape", isActive: true },
  { id: "3", label: "Reception", size: 32, resolution: "1920x1080", orientation: "portrait", isActive: true },
  { id: "4", label: "Locker Room", size: 24, resolution: "1280x720", orientation: "landscape", isActive: false },
];

const mockRevenue = [
  { month: "Apr 2026", rental: 4500, revenueShare: 1200 },
  { month: "Mar 2026", rental: 4500, revenueShare: 980 },
  { month: "Feb 2026", rental: 4500, revenueShare: 1100 },
  { month: "Jan 2026", rental: 4500, revenueShare: 850 },
];

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "screens", label: "Screens", icon: Monitor },
  { id: "contract", label: "Contract", icon: FileText },
  { id: "photos", label: "Photos", icon: Image },
  { id: "revenue", label: "Revenue", icon: DollarSign },
];

export default function VenueDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
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
            {mockVenue.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#666666" }}>
            {mockVenue.brand} &middot; {mockVenue.city}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid #333333" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150"
            style={{
              color: activeTab === id ? "#FF6B35" : "#666666",
              borderBottom: activeTab === id ? "2px solid #FF6B35" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Active Members", value: mockVenue.activeMembers.toLocaleString() },
            { label: "Daily Entries", value: mockVenue.dailyEntries.toLocaleString() },
            { label: "Weekly Entries", value: mockVenue.weeklyEntries.toLocaleString() },
            { label: "Monthly Entries", value: mockVenue.monthlyEntries.toLocaleString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-6"
              style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#666666" }}>
                {stat.label}
              </p>
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                {stat.value}
              </p>
            </div>
          ))}

          <div
            className="col-span-2 lg:col-span-4 rounded-xl p-6"
            style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
          >
            <h3
              className="text-sm font-semibold text-white mb-3"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Venue Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p style={{ color: "#666666" }}>Address</p>
                <p className="text-white mt-0.5">{mockVenue.address}</p>
              </div>
              <div>
                <p style={{ color: "#666666" }}>Region</p>
                <p className="text-white mt-0.5">{mockVenue.region}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "screens" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "#FF6B35" }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Screen
            </button>
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #333333" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#2A2A2A" }}>
                  {["Label", "Size", "Resolution", "Orientation", "Status"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockScreens.map((screen, idx) => (
                  <tr
                    key={screen.id}
                    style={{ backgroundColor: "#1E1E1E", borderTop: idx > 0 ? "1px solid #2A2A2A" : "none" }}
                  >
                    <td className="px-6 py-4 text-sm text-white">{screen.label}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#B3B3B3" }}>{screen.size}&quot;</td>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: "#B3B3B3" }}>{screen.resolution}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#B3B3B3" }}>{screen.orientation}</td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
                        style={{
                          backgroundColor: screen.isActive ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)",
                          color: screen.isActive ? "#10B981" : "#6B7280",
                        }}
                      >
                        {screen.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "contract" && (
        <div
          className="rounded-xl p-6 max-w-lg"
          style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
        >
          <h3
            className="text-sm font-semibold text-white mb-4"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Contract Details
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "#666666" }}>Start Date</span>
              <span className="text-white">2025-01-01</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#666666" }}>End Date</span>
              <span className="text-white">2026-12-31</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#666666" }}>Monthly Rental</span>
              <span className="text-white font-mono">R 4,500</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#666666" }}>Revenue Share</span>
              <span className="text-white font-mono">15%</span>
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2" style={{ color: "#B3B3B3" }}>
              Contract Document
            </label>
            <div
              className="flex items-center justify-center rounded-lg p-6"
              style={{ border: "2px dashed #333333" }}
            >
              <div className="text-center">
                <FileText size={28} color="#444444" strokeWidth={1.5} className="mx-auto mb-2" />
                <p className="text-sm" style={{ color: "#666666" }}>
                  Upload contract PDF
                </p>
                <input type="file" accept=".pdf" className="hidden" id="contract-upload" />
                <label
                  htmlFor="contract-upload"
                  className="mt-3 inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium cursor-pointer"
                  style={{ backgroundColor: "#2A2A2A", color: "#B3B3B3" }}
                >
                  Choose file
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "photos" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-video rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#2A2A2A", border: "1px solid #333333" }}
              >
                <Image size={24} color="#444444" strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "revenue" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #333333" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#2A2A2A" }}>
                {["Month", "Rental (ZAR)", "Revenue Share (ZAR)", "Total"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockRevenue.map((row, idx) => (
                <tr
                  key={row.month}
                  style={{ backgroundColor: "#1E1E1E", borderTop: idx > 0 ? "1px solid #2A2A2A" : "none" }}
                >
                  <td className="px-6 py-4 text-sm text-white">{row.month}</td>
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: "#B3B3B3" }}>
                    R {row.rental.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: "#B3B3B3" }}>
                    R {row.revenueShare.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-medium text-white">
                    R {(row.rental + row.revenueShare).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
