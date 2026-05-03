"use client";

import { useState, useMemo } from "react";
import { Clock, TrendingUp, BarChart3, Users, Monitor, Calendar, Eye } from "lucide-react";

type Venue = {
  id: string; name: string; city: string | null; province: string | null;
  active_members: number | null; monthly_entries: number | null;
  operating_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  created_at?: string;
  gym_brand_id?: string | null;
};
type Screen = { id: string; venue_id: string; is_active: boolean | null };

function fmt(n: number) { return n.toLocaleString("en-ZA"); }
function fmtR(n: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);
}

// ─── 1. Foot Traffic by Day/Time ─────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Gym traffic weight by day (industry pattern)
const DAY_WEIGHT: Record<string, number> = {
  Monday: 1.0, Tuesday: 0.85, Wednesday: 0.90, Thursday: 0.85,
  Friday: 0.75, Saturday: 1.15, Sunday: 0.60,
};

// Traffic weight by hour block
function hourWeight(hour: number): number {
  if (hour >= 5  && hour < 7)  return 0.6;  // Early birds
  if (hour >= 7  && hour < 9)  return 1.0;  // Morning peak
  if (hour >= 9  && hour < 12) return 0.7;  // Mid-morning
  if (hour >= 12 && hour < 14) return 0.8;  // Lunch
  if (hour >= 14 && hour < 17) return 0.5;  // Quiet afternoon
  if (hour >= 17 && hour < 20) return 1.0;  // Evening peak
  if (hour >= 20 && hour < 22) return 0.6;  // Late
  return 0.1;
}

function parseHour(t: string): number {
  return parseInt(t.split(":")[0]);
}

export function FootTrafficHeatmap({ venues }: { venues: Venue[] }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Build day → open hours summary across all venues
  const dayData = useMemo(() => {
    return DAYS.map((day) => {
      const openVenues = venues.filter((v) => {
        const h = v.operating_hours?.[day];
        return h && !h.closed;
      });
      const avgOpen = openVenues.length > 0
        ? openVenues.reduce((s, v) => s + parseHour(v.operating_hours![day].open), 0) / openVenues.length
        : 6;
      const avgClose = openVenues.length > 0
        ? openVenues.reduce((s, v) => s + parseHour(v.operating_hours![day].close), 0) / openVenues.length
        : 20;
      const weight = DAY_WEIGHT[day] ?? 0.8;
      const totalMembers = venues.reduce((s, v) => s + (v.active_members ?? 0), 0);
      const estDailyVisits = Math.round((totalMembers * 0.15) * weight); // ~15% visit on any given day
      return { day, openVenues: openVenues.length, avgOpen, avgClose, weight, estDailyVisits };
    });
  }, [venues]);

  // Hour blocks for selected day
  const hourBlocks = useMemo(() => {
    if (!selectedDay) return [];
    const dayInfo = dayData.find((d) => d.day === selectedDay);
    if (!dayInfo) return [];
    const blocks = [];
    for (let h = 5; h <= 21; h++) {
      const openCount = venues.filter((v) => {
        const hrs = v.operating_hours?.[selectedDay];
        if (!hrs || hrs.closed) return false;
        return parseHour(hrs.open) <= h && parseHour(hrs.close) > h;
      }).length;
      if (openCount === 0) continue;
      const weight = hourWeight(h) * dayInfo.weight;
      const estVisits = Math.round((dayInfo.estDailyVisits * weight) / 8);
      blocks.push({ hour: h, label: h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`, weight, estVisits, openCount });
    }
    return blocks;
  }, [selectedDay, dayData, venues]);

  const maxWeight = Math.max(...(hourBlocks.map((b) => b.weight)), 1);

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={16} color="#D4FF4F" strokeWidth={2} />
          <p className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Foot Traffic by Day & Time</p>
        </div>
        <p className="text-xs" style={{ color: "#8A8A8A" }}>Peak visit windows based on operating hours and gym attendance patterns</p>
      </div>

      <div className="p-5">
        {/* Day selector */}
        <div className="grid grid-cols-7 gap-1 mb-5">
          {dayData.map((d, i) => {
            const isSelected = selectedDay === d.day;
            const intensity = d.weight;
            return (
              <button
                key={d.day}
                onClick={() => setSelectedDay(isSelected ? null : d.day)}
                className="flex flex-col items-center rounded-xl py-2.5 px-1 transition-all"
                style={{
                  background: isSelected ? "#D4FF4F" : `rgba(212,255,79,${intensity * 0.12})`,
                  border: `1px solid ${isSelected ? "#D4FF4F" : `rgba(212,255,79,${intensity * 0.25})`}`,
                }}
              >
                <span className="text-xs font-bold" style={{ color: isSelected ? "#0A0A0A" : "#A3A3A3" }}>{DAY_SHORT[i]}</span>
                <span className="text-xs mt-0.5 tabular-nums" style={{ color: isSelected ? "#0A0A0A" : "#555" }}>{fmt(d.estDailyVisits)}</span>
                <span className="text-xs" style={{ color: isSelected ? "#0A0A0A55" : "#444" }}>{d.openVenues}v</span>
              </button>
            );
          })}
        </div>

        {/* Hour breakdown */}
        {selectedDay && hourBlocks.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>{selectedDay} — Hourly Traffic</p>
            <div className="space-y-1.5">
              {hourBlocks.map((block) => {
                const pct = (block.weight / maxWeight) * 100;
                const isPeak = block.weight >= 0.9;
                return (
                  <div key={block.hour} className="flex items-center gap-3">
                    <span className="text-xs w-10 flex-shrink-0 text-right" style={{ color: "#8A8A8A" }}>{block.label}</span>
                    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                      <div style={{ width: `${pct}%`, height: 6, background: isPeak ? "#D4FF4F" : "#D4FF4F66", borderRadius: 99, transition: "width 0.4s" }} />
                    </div>
                    <div className="text-right flex-shrink-0" style={{ minWidth: 80 }}>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: isPeak ? "#D4FF4F" : "#A3A3A3" }}>~{fmt(block.estVisits)} visits</span>
                      {isPeak && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(212,255,79,0.12)", color: "#D4FF4F" }}>Peak</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: "#999" }}>Estimates based on industry attendance patterns. {hourBlocks[0]?.openCount} venue{hourBlocks[0]?.openCount !== 1 ? "s" : ""} open on {selectedDay}.</p>
          </div>
        )}

        {!selectedDay && (
          <p className="text-sm text-center py-4" style={{ color: "#8A8A8A" }}>Tap a day to see the hourly traffic breakdown</p>
        )}
      </div>
    </div>
  );
}

// ─── 2. Campaign Impact Estimator ─────────────────────────────────────────────

export function CampaignImpactEstimator({ venues, screens }: {
  venues: Venue[]; screens: Screen[];
}) {
  const [unit, setUnit] = useState<"days" | "weeks" | "months">("weeks");
  const [duration, setDuration] = useState("4");
  const [budget, setBudget] = useState("");
  const [cpm, setCpm] = useState("85");
  const [editingCpm, setEditingCpm] = useState(false);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [venuePickerOpen, setVenuePickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const CPM = parseFloat(cpm) || 85;

  // Filter to selected venues or all
  const activeVenues = selectedVenues.length > 0
    ? venues.filter((v) => selectedVenues.includes(v.id))
    : venues;
  const activeScreens = screens.filter((s) => activeVenues.some((v) => v.id === s.venue_id));
  const totalMembers = activeVenues.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalMonthly = activeVenues.reduce((s, v) => s + (v.monthly_entries ?? 0), 0);
  const totalScreens = activeScreens.length > 0 ? activeScreens.length : activeVenues.length;

  function toggleVenue(id: string) {
    setSelectedVenues((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  const [resetFlash, setResetFlash] = useState(false);

  function resetAll() {
    setUnit("weeks");
    setDuration("4");
    setBudget("");
    setCpm("85");
    setEditingCpm(false);
    setSelectedVenues([]);
    setVenuePickerOpen(false);
    setCopied(false);
    setResetFlash(true);
    setTimeout(() => setResetFlash(false), 800);
  }

  const byProvince = venues.reduce((acc, v) => {
    const prov = v.province ?? "Other";
    if (!acc[prov]) acc[prov] = [];
    acc[prov].push(v);
    return acc;
  }, {} as Record<string, Venue[]>);

  const UNIT_OPTIONS: Record<"days" | "weeks" | "months", { values: string[]; label: (v: string) => string }> = {
    days:   { values: ["1", "3", "5", "7", "14", "30"], label: (v) => `${v}d` },
    weeks:  { values: ["1", "2", "4", "8", "12", "24", "52"], label: (v) => v === "52" ? "1yr" : `${v}w` },
    months: { values: ["1", "2", "3", "6", "9", "12", "24"], label: (v) => `${v}mo` },
  };

  const durationNum = parseInt(duration) || 1;
  const durationInWeeks = unit === "days" ? durationNum / 7 : unit === "months" ? durationNum * 4.33 : durationNum;
  const durationLabel = unit === "days"
    ? `${durationNum} day${durationNum !== 1 ? "s" : ""}`
    : unit === "months"
    ? `${durationNum} month${durationNum !== 1 ? "s" : ""}`
    : durationNum === 52 ? "1 year" : `${durationNum} week${durationNum !== 1 ? "s" : ""}`;

  const budgetNum = parseFloat(budget.replace(/[^0-9.]/g, "")) || 0;
  const monthlyOts = totalMonthly * totalScreens;
  const weeklyOts = Math.round(monthlyOts / 4.33);

  // Duration-based
  const durationImpressions = Math.round(weeklyOts * durationInWeeks);
  const durationReach = Math.min(totalMembers, Math.round(durationImpressions / Math.max(durationInWeeks * 1.2, 0.1)));
  const durationFrequency = durationReach > 0 ? (durationImpressions / durationReach).toFixed(1) : "0";
  const suggestedBudget = Math.round((durationImpressions / 1000) * CPM);
  const durationCpr = durationReach > 0 ? (suggestedBudget / durationReach).toFixed(2) : "0";

  // Budget-based
  const budgetImpressions = budgetNum > 0 ? Math.round((budgetNum / CPM) * 1000) : 0;
  const budgetReach = budgetNum > 0 ? Math.min(totalMembers, Math.round(budgetImpressions / Math.max(durationInWeeks * 1.2, 0.1))) : 0;
  const budgetFrequency = budgetReach > 0 ? (budgetImpressions / budgetReach).toFixed(1) : "0";
  const budgetDurationWeeks = weeklyOts > 0 && budgetNum > 0 ? budgetImpressions / weeklyOts : 0;
  const budgetDurationDisplay = unit === "days"
    ? `${Math.round(budgetDurationWeeks * 7)}d`
    : unit === "months"
    ? `${(budgetDurationWeeks / 4.33).toFixed(1)}mo`
    : `${Math.round(budgetDurationWeeks)}w`;
  const budgetCpr = budgetReach > 0 ? (budgetNum / budgetReach).toFixed(2) : "0";

  // Active values
  const campaignImpressions = budgetNum > 0 ? budgetImpressions : durationImpressions;
  const estReach = budgetNum > 0 ? budgetReach : durationReach;
  const frequency = budgetNum > 0 ? budgetFrequency : durationFrequency;
  const cpr = budgetNum > 0 ? budgetCpr : durationCpr;
  const activeLabel = budgetNum > 0 ? `R${fmt(budgetNum)} budget` : durationLabel;
  const isBudgetMode = budgetNum > 0;

  function copySummary() {
    const venueList = selectedVenues.length > 0
      ? activeVenues.map((v) => v.name).join(", ")
      : `All ${venues.length} venues`;
    const text = [
      `GymGaze Campaign Estimate`,
      `─────────────────────────`,
      `Scope: ${venueList}`,
      `Duration: ${isBudgetMode ? budgetDurationDisplay : durationLabel}`,
      `${isBudgetMode ? `Budget: R${fmt(budgetNum)}` : `Suggested Budget: R${fmt(suggestedBudget)}`}`,
      ``,
      `Total Impressions: ${fmt(campaignImpressions)}`,
      `Unique Reach: ${fmt(estReach)}`,
      `Avg Frequency: ${frequency}×`,
      `Cost Per Reach: R${cpr}`,
      `CPM: R${CPM}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#fff", borderRadius: 12, padding: "10px 14px",
    fontSize: 13, outline: "none", width: "100%",
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} color="#A78BFA" strokeWidth={2} />
            <p className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Campaign Impact Estimator</p>
          </div>
          <p className="text-xs" style={{ color: "#8A8A8A" }}>Project reach, frequency and impressions for any campaign</p>
        </div>
        <button onClick={resetAll} className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 transition-all" style={{ background: resetFlash ? "rgba(212,255,79,0.10)" : "rgba(255,255,255,0.05)", color: resetFlash ? "#D4FF4F" : "#8A8A8A", border: `1px solid ${resetFlash ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.08)"}` }}>
          {resetFlash ? "✓ Reset" : "Reset"}
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Gyms in Scope ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#999" }}>Gyms in Scope</p>
            {selectedVenues.length > 0 && (
              <button onClick={() => setSelectedVenues([])} className="text-xs" style={{ color: "#D4FF4F" }}>Show all</button>
            )}
          </div>
          <button
            onClick={() => setVenuePickerOpen((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${selectedVenues.length > 0 ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.10)"}` }}
          >
            <span style={{ color: selectedVenues.length > 0 ? "#D4FF4F" : "#C8C8C8" }}>
              {selectedVenues.length === 0 ? `All ${venues.length} venues` : `${selectedVenues.length} venue${selectedVenues.length !== 1 ? "s" : ""} selected`}
            </span>
            <span style={{ color: "#777", fontSize: 11 }}>{venuePickerOpen ? "▲" : "▼"}</span>
          </button>

          {venuePickerOpen && (
            <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.10)", background: "#141414", maxHeight: 260, overflowY: "auto" }}>
              <div className="flex gap-2 px-3 py-2 sticky top-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#141414" }}>
                <button onClick={() => setSelectedVenues(venues.map((v) => v.id))} className="text-xs px-3 py-1 rounded-lg" style={{ background: "rgba(212,255,79,0.08)", color: "#D4FF4F" }}>Select All</button>
                <button onClick={() => setSelectedVenues([])} className="text-xs px-3 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "#C8C8C8" }}>Clear</button>
                <button onClick={() => setVenuePickerOpen(false)} className="text-xs px-3 py-1 rounded-lg ml-auto" style={{ background: "rgba(255,255,255,0.04)", color: "#8A8A8A" }}>Done</button>
              </div>
              {Object.entries(byProvince).sort().map(([prov, provVenues]) => (
                <div key={prov}>
                  <div className="px-3 py-1.5 sticky" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "#141414" }}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#777" }}>{prov}</span>
                  </div>
                  {provVenues.map((v) => {
                    const sel = selectedVenues.includes(v.id);
                    return (
                      <button key={v.id} onClick={() => toggleVenue(v.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all" style={{ background: sel ? "rgba(212,255,79,0.06)" : "transparent" }}>
                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ border: `1.5px solid ${sel ? "#D4FF4F" : "#444"}`, background: sel ? "#D4FF4F" : "transparent" }}>
                          {sel && <span style={{ fontSize: 9, fontWeight: 900, color: "#0A0A0A" }}>✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: sel ? "#D4FF4F" : "#C8C8C8" }}>{v.name}</p>
                          <p className="text-xs" style={{ color: "#777" }}>{v.city} · {(v.active_members ?? 0).toLocaleString("en-ZA")} members</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {selectedVenues.length > 0 && !venuePickerOpen && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {activeVenues.map((v) => (
                <span key={v.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(212,255,79,0.08)", border: "1px solid rgba(212,255,79,0.2)", color: "#D4FF4F" }}>
                  {v.name}
                  <button onClick={() => toggleVenue(v.id)} style={{ color: "#D4FF4F99", lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Campaign Duration ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Campaign Duration</p>
          <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "inline-flex" }}>
            {(["days", "weeks", "months"] as const).map((u) => (
              <button key={u} onClick={() => { setUnit(u); setDuration(UNIT_OPTIONS[u].values[2]); }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{ background: unit === u ? "rgba(255,255,255,0.10)" : "transparent", color: unit === u ? "#fff" : "#777" }}>
                {u}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {UNIT_OPTIONS[unit].values.map((v) => (
              <button key={v} onClick={() => setDuration(v)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: duration === v ? "#A78BFA" : "rgba(255,255,255,0.05)",
                  color: duration === v ? "#0A0A0A" : "#999",
                  border: duration === v ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}>
                {UNIT_OPTIONS[unit].label(v)}
              </button>
            ))}
          </div>
        </div>

        {/* ── CPM Rate ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#999" }}>CPM Rate</p>
            <button onClick={() => setEditingCpm((p) => !p)} className="text-xs" style={{ color: "#D4FF4F" }}>
              {editingCpm ? "Done" : "Edit"}
            </button>
          </div>
          {editingCpm ? (
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#8A8A8A" }}>R</span>
              <input value={cpm} onChange={(e) => setCpm(e.target.value.replace(/[^0-9.]/g, ""))} style={{ ...inputStyle, paddingLeft: 28 }} placeholder="85" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-sm font-bold text-white">R{cpm || "85"}</span>
              <span className="text-xs" style={{ color: "#8A8A8A" }}>per 1,000 impressions</span>
              {cpm !== "85" && <span className="text-xs ml-auto" style={{ color: "#F59E0B" }}>Custom rate</span>}
            </div>
          )}
        </div>

        {/* ── Budget input ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Campaign Budget (optional)</p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#8A8A8A" }}>R</span>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Enter budget to override duration"
                className="w-full text-sm text-white"
                style={{ ...inputStyle, paddingLeft: 28, border: `1px solid ${budgetNum > 0 ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.10)"}` }}
              />
            </div>
            {budgetNum > 0 && (
              <button onClick={() => setBudget("")} className="text-xs px-3 py-2.5 rounded-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>
                Clear
              </button>
            )}
          </div>
          <p className="text-xs mt-1.5" style={{ color: "#666" }}>
            {budgetNum > 0 ? `Budget mode — results show what R${fmt(budgetNum)} delivers` : `Duration mode — results show projections for ${durationLabel}`}
          </p>
        </div>

        {/* ── Results ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#999" }}>Results</p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: isBudgetMode ? "rgba(212,255,79,0.10)" : "rgba(167,139,250,0.10)", color: isBudgetMode ? "#D4FF4F" : "#A78BFA" }}>
                {activeLabel}
              </span>
              <button
                onClick={copySummary}
                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg transition-all"
                style={{ background: copied ? "rgba(212,255,79,0.12)" : "rgba(255,255,255,0.05)", color: copied ? "#D4FF4F" : "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {copied ? "✓ Copied" : "Copy summary"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Total Impressions", value: fmt(campaignImpressions), color: "#D4FF4F", icon: Monitor },
              { label: "Unique Reach",      value: fmt(estReach),            color: "#fff",    icon: Users },
              { label: "Avg Frequency",     value: `${frequency}×`,          color: "#A78BFA", icon: BarChart3 },
              { label: "Cost Per Reach",    value: `R${cpr}`,                color: "#34D399", icon: TrendingUp },
              { label: isBudgetMode ? "Est. Duration" : "Suggested Budget",
                value: isBudgetMode ? budgetDurationDisplay : fmtR(suggestedBudget),
                color: "#F59E0B", icon: Calendar },
              { label: "Weekly OTS",        value: fmt(weeklyOts),           color: "#60A5FA", icon: Eye },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-xl p-3 transition-all" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${isBudgetMode ? "rgba(212,255,79,0.10)" : "rgba(255,255,255,0.06)"}` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={11} color="#8A8A8A" strokeWidth={2} />
                  <p className="text-xs" style={{ color: "#8A8A8A" }}>{label}</p>
                </div>
                <p className="text-lg font-bold tabular-nums" style={{ color, fontFamily: "Inter Tight, sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 3. Network Growth Timeline ───────────────────────────────────────────────

export function NetworkGrowthTimeline({ venues, screens }: { venues: Venue[]; screens: Screen[] }) {
  // All venues created same day — show current state + projected growth milestones
  const totalMembers = venues.reduce((s, v) => s + (v.active_members ?? 0), 0);
  const totalScreens = screens.length;

  // Build projected milestones: 6M, 12M, 18M, 24M
  const growthRate = 0.25; // 25% projected quarterly growth
  const milestones = [
    { label: "Today", venues: venues.length, members: totalMembers, screens: totalScreens, months: 0, actual: true },
    { label: "3 Months", venues: Math.round(venues.length * 1.3), members: Math.round(totalMembers * 1.25), screens: Math.round(totalScreens * 1.3), months: 3, actual: false },
    { label: "6 Months", venues: Math.round(venues.length * 1.7), members: Math.round(totalMembers * 1.55), screens: Math.round(totalScreens * 1.7), months: 6, actual: false },
    { label: "12 Months", venues: Math.round(venues.length * 2.5), members: Math.round(totalMembers * 2.2), screens: Math.round(totalScreens * 2.5), months: 12, actual: false },
    { label: "24 Months", venues: Math.round(venues.length * 4.0), members: Math.round(totalMembers * 3.5), screens: Math.round(totalScreens * 4.0), months: 24, actual: false },
  ];

  const maxVenues = milestones[milestones.length - 1].venues;

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={16} color="#60A5FA" strokeWidth={2} />
          <p className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Network Growth</p>
        </div>
        <p className="text-xs" style={{ color: "#8A8A8A" }}>Current footprint and projected expansion milestones</p>
      </div>

      <div className="p-5">
        {/* Timeline */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-4 top-4 bottom-4 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />

          <div className="space-y-4">
            {milestones.map((m, i) => (
              <div key={m.label} className="flex items-start gap-4 relative">
                {/* Dot */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{
                    background: m.actual ? "#D4FF4F" : i === 1 ? "rgba(212,255,79,0.15)" : "rgba(255,255,255,0.05)",
                    border: m.actual ? "none" : `1px solid ${i === 1 ? "rgba(212,255,79,0.3)" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  {m.actual
                    ? <span style={{ fontSize: 10, fontWeight: 900, color: "#0A0A0A" }}>NOW</span>
                    : <span style={{ fontSize: 10, color: "#8A8A8A" }}>{m.months}m</span>
                  }
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-bold" style={{ color: m.actual ? "#D4FF4F" : "#A3A3A3", fontFamily: "Inter Tight, sans-serif" }}>{m.label}</p>
                    {!m.actual && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", color: "#8A8A8A" }}>Projected</span>}
                  </div>

                  {/* Mini stat row */}
                  <div className="flex gap-4 flex-wrap mb-2">
                    {[
                      { label: "Venues", value: m.venues },
                      { label: "Members", value: m.members },
                      { label: "Screens", value: m.screens },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs" style={{ color: "#8A8A8A" }}>{label}</p>
                        <p className="text-sm font-bold text-white tabular-nums" style={{ fontFamily: "Inter Tight, sans-serif" }}>{fmt(value)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Venue bar */}
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, maxWidth: 300 }}>
                    <div style={{
                      width: `${(m.venues / maxVenues) * 100}%`, height: 4,
                      background: m.actual ? "#D4FF4F" : "rgba(212,255,79,0.3)",
                      borderRadius: 99, transition: "width 0.5s"
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs mt-4" style={{ color: "#999" }}>Projections based on 25–30% quarterly growth. Actual results depend on expansion pace.</p>
      </div>
    </div>
  );
}
