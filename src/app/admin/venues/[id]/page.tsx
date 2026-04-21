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

export default function VenueDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const cardStyle = {
    backgroundColor: "#141414",
    border: "1px solid #2A2A2A",
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/venues"
          className="p-2 rounded-xl"
          style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A", color: "#A3A3A3" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            {mockVenue.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#909090" }}>
            {mockVenue.brand} &middot; {mockVenue.city}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid #2A2A2A" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150"
            style={{
              color: activeTab === id ? "#D4FF4F" : "#909090",
              borderBottom: activeTab === id ? "2px solid #D4FF4F" : "2px solid transparent",
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
            { label: "ACTIVE MEMBERS", value: mockVenue.activeMembers.toLocaleString() },
            { label: "DAILY ENTRIES", value: mockVenue.dailyEntries.toLocaleString() },
            { label: "WEEKLY ENTRIES", value: mockVenue.weeklyEntries.toLocaleString() },
            { label: "MONTHLY ENTRIES", value: mockVenue.monthlyEntries.toLocaleString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-6"
              style={cardStyle}
            >
              <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#909090" }}>
                {stat.label}
              </p>
              <p
                className="text-4xl font-bold text-white tabular-nums"
                style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
              >
                {stat.value}
              </p>
            </div>
          ))}

          <div
            className="col-span-2 lg:col-span-4 rounded-2xl p-6"
            style={cardStyle}
          >
            <h3
              className="text-sm font-semibold text-white mb-3"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Venue Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p style={{ color: "#909090" }}>Address</p>
                <p className="text-white mt-0.5">{mockVenue.address}</p>
              </div>
              <div>
                <p style={{ color: "#909090" }}>Region</p>
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", height: "44px" }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Screen
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #2A2A2A" }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#141414", borderBottom: "1px solid #2A2A2A" }}>
                  {["Label", "Size", "Resolution", "Orientation", "Status"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#909090", borderBottom: "1px solid #2A2A2A" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockScreens.map((screen, idx) => (
                  <tr
                    key={screen.id}
                    style={{ backgroundColor: "#141414", borderTop: idx > 0 ? "1px solid #2A2A2A" : "none" }}
                  >
                    <td className="px-6 py-4 text-sm text-white">{screen.label}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>{screen.size}&quot;</td>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: "#A3A3A3" }}>{screen.resolution}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#A3A3A3" }}>{screen.orientation}</td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: screen.isActive ? "rgba(212,255,79,0.1)" : "rgba(102,102,102,0.15)",
                          color: screen.isActive ? "#D4FF4F" : "#909090",
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
          className="rounded-2xl p-6 max-w-lg"
          style={cardStyle}
        >
          <h3
            className="text-sm font-semibold text-white mb-4"
            style={{ fontFamily: "Inter Tight, sans-serif" }}
          >
            Contract Details
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "#909090" }}>Start Date</span>
              <span className="text-white">2025-01-01</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#909090" }}>End Date</span>
              <span className="text-white">2026-12-31</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#909090" }}>Monthly Rental</span>
              <span className="text-white font-mono">R 4,500</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#909090" }}>Revenue Share</span>
              <span className="text-white font-mono">15%</span>
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
              Contract Document
            </label>
            <div
              className="flex items-center justify-center rounded-xl p-6"
              style={{ border: "2px dashed #2A2A2A" }}
            >
              <div className="text-center">
                <FileText size={28} color="#444444" strokeWidth={1.5} className="mx-auto mb-2" />
                <p className="text-sm" style={{ color: "#909090" }}>
                  Upload contract PDF
                </p>
                <input type="file" accept=".pdf" className="hidden" id="contract-upload" />
                <label
                  htmlFor="contract-upload"
                  className="mt-3 inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ backgroundColor: "#1E1E1E", color: "#A3A3A3" }}
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
                className="aspect-video rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
              >
                <Image size={24} color="#444444" strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "revenue" && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #2A2A2A" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#141414" }}>
                {["Month", "Rental (ZAR)", "Revenue Share (ZAR)", "Total"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#909090", borderBottom: "1px solid #2A2A2A" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockRevenue.map((row, idx) => (
                <tr
                  key={row.month}
                  style={{ backgroundColor: "#141414", borderTop: idx > 0 ? "1px solid #2A2A2A" : "none" }}
                >
                  <td className="px-6 py-4 text-sm text-white">{row.month}</td>
                  <td className="px-6 py-4 text-sm font-mono tabular-nums" style={{ color: "#A3A3A3" }}>
                    R {row.rental.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono tabular-nums" style={{ color: "#A3A3A3" }}>
                    R {row.revenueShare.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-semibold tabular-nums" style={{ color: "#D4FF4F" }}>
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
