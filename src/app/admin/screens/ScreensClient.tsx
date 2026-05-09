"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Monitor,
  Plus,
  ExternalLink,
  Edit2,
  X,
  Filter,
} from "lucide-react";
import { timeAgo } from "@/lib/time";
import AddScreenModal from "./AddScreenModal";

interface VenueRow {
  id: string;
  name: string;
  city: string | null;
}

interface ScreenRow {
  id: string;
  label: string;
  location_in_venue: string | null;
  size_inches: number | null;
  orientation: string | null;
  resolution: string | null;
  is_active: boolean | null;
  cuecast_status: string | null;
  cuecast_last_seen: string | null;
  cuecast_player_token: string | null;
  notes: string | null;
  created_at: string;
  venue_id: string | null;
  venues: { id: string; name: string; city: string | null } | null;
}

interface Props {
  screens: ScreenRow[];
  venues: VenueRow[];
}

const LOCATION_LABELS: Record<string, string> = {
  lobby: "Lobby",
  gym_floor: "Gym Floor",
  cardio_area: "Cardio Area",
  change_rooms: "Change Rooms",
  reception: "Reception",
  other: "Other",
};

function LocationBadge({ location }: { location: string | null }) {
  if (!location) return <span style={{ color: "#666" }}>—</span>;
  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: "rgba(212,255,79,0.10)",
        color: "#D4FF4F",
        border: "1px solid rgba(212,255,79,0.15)",
      }}
    >
      {LOCATION_LABELS[location] ?? location}
    </span>
  );
}

function CuecastBadge({ status }: { status: string | null }) {
  const s = status ?? "unpaired";
  if (s === "online") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ backgroundColor: "rgba(74,222,128,0.12)", color: "#4ADE80" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Online
      </span>
    );
  }
  if (s === "offline") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ backgroundColor: "rgba(248,113,113,0.12)", color: "#F87171" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Offline
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: "rgba(63,63,70,0.6)", color: "#A1A1AA" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
      Unpaired
    </span>
  );
}

export default function ScreensClient({ screens, venues }: Props) {
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orientationFilter, setOrientationFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [localScreens, setLocalScreens] = useState<ScreenRow[]>(screens);

  const filtered = localScreens.filter((s) => {
    if (venueFilter !== "all" && s.venue_id !== venueFilter) return false;
    const status = s.cuecast_status ?? "unpaired";
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (
      orientationFilter !== "all" &&
      (s.orientation ?? "landscape") !== orientationFilter
    )
      return false;
    return true;
  });

  function handleScreenAdded(newScreen: ScreenRow) {
    setLocalScreens((prev) => [newScreen, ...prev]);
    setShowAddModal(false);
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#C8C8C8",
    outline: "none",
  } as React.CSSProperties;

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} color="#666" strokeWidth={2} />

          {/* Venue filter */}
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs"
            style={inputStyle}
          >
            <option value="all">All venues</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.city ? ` · ${v.city}` : ""}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs"
            style={inputStyle}
          >
            <option value="all">All statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="unpaired">Unpaired</option>
          </select>

          {/* Orientation filter */}
          <select
            value={orientationFilter}
            onChange={(e) => setOrientationFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs"
            style={inputStyle}
          >
            <option value="all">All orientations</option>
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>

          {/* Clear filters */}
          {(venueFilter !== "all" ||
            statusFilter !== "all" ||
            orientationFilter !== "all") && (
            <button
              onClick={() => {
                setVenueFilter("all");
                setStatusFilter("all");
                setOrientationFilter("all");
              }}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs"
              style={{ background: "rgba(255,255,255,0.05)", color: "#A1A1AA" }}
            >
              <X size={12} strokeWidth={2} />
              Clear
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A", height: "44px" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Screen
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20"
            style={{ color: "#B0B0B0" }}
          >
            <Monitor
              size={40}
              strokeWidth={1.2}
              color="#333"
              className="mb-4"
            />
            <p className="text-base font-medium text-white mb-1">
              No screens added yet.
            </p>
            <p className="text-sm mb-5" style={{ color: "#888" }}>
              Add your first screen to get started.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Screen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {[
                    "Venue",
                    "Screen",
                    "Location",
                    "Specs",
                    "Status",
                    "Last Seen",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#B0B0B0" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((screen, idx) => (
                  <tr
                    key={screen.id}
                    className="group"
                    style={{
                      borderTop:
                        idx > 0
                          ? "1px solid rgba(255,255,255,0.06)"
                          : "none",
                      background: "transparent",
                    }}
                  >
                    {/* Venue */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">
                        {screen.venues?.name ?? "—"}
                      </p>
                      {screen.venues?.city && (
                        <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                          {screen.venues.city}
                        </p>
                      )}
                    </td>

                    {/* Screen name */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-white font-medium">
                        {screen.label}
                      </p>
                    </td>

                    {/* Location badge */}
                    <td className="px-5 py-4">
                      <LocationBadge location={screen.location_in_venue} />
                    </td>

                    {/* Specs */}
                    <td className="px-5 py-4">
                      <p className="text-xs" style={{ color: "#C8C8C8" }}>
                        {[
                          screen.size_inches ? `${screen.size_inches}"` : null,
                          screen.orientation
                            ? screen.orientation.charAt(0).toUpperCase() +
                              screen.orientation.slice(1)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                      {screen.resolution && (
                        <p
                          className="text-xs font-mono mt-0.5"
                          style={{ color: "#888" }}
                        >
                          {screen.resolution}
                        </p>
                      )}
                    </td>

                    {/* Cuecast status */}
                    <td className="px-5 py-4">
                      <CuecastBadge status={screen.cuecast_status} />
                    </td>

                    {/* Last seen */}
                    <td className="px-5 py-4 text-xs" style={{ color: "#888" }}>
                      {timeAgo(screen.cuecast_last_seen)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/screens/${screen.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "#C8C8C8",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <ExternalLink size={12} strokeWidth={2} />
                          View
                        </Link>
                        <Link
                          href={`/admin/screens/${screen.id}?edit=true`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "#C8C8C8",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <Edit2 size={12} strokeWidth={2} />
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Screen Modal */}
      {showAddModal && (
        <AddScreenModal
          venues={venues}
          onClose={() => setShowAddModal(false)}
          onAdded={handleScreenAdded}
        />
      )}
    </>
  );
}
