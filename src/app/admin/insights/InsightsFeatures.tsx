"use client";

import { useState, useMemo } from "react";
import { Clock, TrendingUp, BarChart3, Users, Monitor, Calendar } from "lucide-react";

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

export function CampaignImpactEstimator({ totalMembers, totalMonthly, totalScreens }: {
  totalMembers: number; totalMonthly: number; totalScreens: number;
}) {
  const [weeks, setWeeks] = useState("4");
  const [budget, setBudget] = useState("");
  const CPM = 85;

  const weeksNum = parseInt(weeks) || 4;
  const budgetNum = parseFloat(budget.replace(/[^0-9.]/g, "")) || 0;
  const monthlyOts = totalMonthly * totalScreens;
  const weeklyOts = Math.round(monthlyOts / 4.33);
  const campaignImpressions = weeklyOts * weeksNum;
  const estReach = Math.min(totalMembers, Math.round(campaignImpressions / (weeksNum * 1.2)));
  const frequency = estReach > 0 ? (campaignImpressions / estReach).toFixed(1) : "0";
  const suggestedBudget = Math.round((campaignImpressions / 1000) * CPM);
  const budgetImpressions = budgetNum > 0 ? Math.round((budgetNum / CPM) * 1000) : 0;
  const budgetWeeks = weeklyOts > 0 && budgetNum > 0 ? Math.round(budgetImpressions / weeklyOts) : 0;

  const WEEK_OPTIONS = ["2", "4", "8", "12", "16", "24", "52"];

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{ borderRadius: 16 }}>
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} color="#A78BFA" strokeWidth={2} />
          <p className="text-sm font-bold text-white" style={{ fontFamily: "Inter Tight, sans-serif" }}>Campaign Impact Estimator</p>
        </div>
        <p className="text-xs" style={{ color: "#8A8A8A" }}>Project reach, frequency and impressions for any campaign duration</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Duration selector */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Campaign Duration</p>
          <div className="flex gap-2 flex-wrap">
            {WEEK_OPTIONS.map((w) => (
              <button key={w} onClick={() => setWeeks(w)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: weeks === w ? "#A78BFA" : "rgba(255,255,255,0.05)",
                  color: weeks === w ? "#0A0A0A" : "#666",
                  border: weeks === w ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}>
                {w === "52" ? "1 year" : `${w} weeks`}
              </button>
            ))}
          </div>
        </div>

        {/* Projected results */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>Projected Results — {weeksNum} weeks</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Impressions", value: fmt(campaignImpressions), color: "#D4FF4F", icon: Monitor },
              { label: "Unique Reach", value: fmt(estReach), color: "#fff", icon: Users },
              { label: "Avg Frequency", value: `${frequency}×`, color: "#A78BFA", icon: BarChart3 },
              { label: "Suggested Budget", value: fmtR(suggestedBudget), color: "#34D399", icon: TrendingUp },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={11} color="#555" strokeWidth={2} />
                  <p className="text-xs" style={{ color: "#8A8A8A" }}>{label}</p>
                </div>
                <p className="text-lg font-bold tabular-nums" style={{ color, fontFamily: "Inter Tight, sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Optional budget override */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Or enter a specific budget</p>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1" style={{ minWidth: 160 }}>
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#8A8A8A" }}>R</span>
              <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Enter budget"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", outline: "none" }} />
            </div>
            {budgetNum > 0 && (
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: "Impressions", value: fmt(budgetImpressions), color: "#D4FF4F" },
                  { label: "Duration", value: `${budgetWeeks} wks`, color: "#A78BFA" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs" style={{ color: "#8A8A8A" }}>{label}</p>
                    <p className="text-base font-bold tabular-nums" style={{ color, fontFamily: "Inter Tight, sans-serif" }}>{value}</p>
                  </div>
                ))}
              </div>
            )}
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
