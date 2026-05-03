"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ImageIcon, Calendar, User } from "lucide-react";

type Photo = {
  id: string;
  storage_path: string;
  month: string | null;
  created_at: string | null;
  venue_id: string;
  uploaded_by: string | null;
  signedUrl: string | null;
  venues: { name?: string } | { name?: string }[] | null;
  profiles: { full_name?: string } | { full_name?: string }[] | null;
};

export default function PhotoApprovalGrid({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setLoading(id);
    const res = await fetch(`/api/photos/${id}/approve`, { method: "POST" });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    }
    setLoading(null);
  }

  async function handleRejectSubmit() {
    if (!rejectTarget) return;
    setLoading(rejectTarget);
    const res = await fetch(`/api/photos/${rejectTarget}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== rejectTarget));
    }
    setRejectTarget(null);
    setRejectReason("");
    setLoading(null);
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {photos.map((photo) => {
          const monthLabel = photo.month
            ? new Date(photo.month.slice(0, 7) + "-01").toLocaleDateString("en-ZA", {
                month: "short",
                year: "numeric",
              })
            : "—";
          const venueObj = Array.isArray(photo.venues) ? photo.venues[0] : photo.venues;
          const profileObj = Array.isArray(photo.profiles) ? photo.profiles[0] : photo.profiles;
          const uploaderName = profileObj?.full_name ?? "Unknown";
          const dateLabel = photo.created_at?.slice(0, 10) ?? "—";
          const venueName = venueObj?.name ?? "Unknown Venue";
          const isLoading = loading === photo.id;

          return (
            <div
              key={photo.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Photo preview */}
              <div
                className="aspect-video flex items-center justify-center overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
              >
                {photo.signedUrl ? (
                  <img
                    src={photo.signedUrl}
                    alt="Venue screen"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={32} color="#444444" strokeWidth={1.5} />
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3
                  className="text-sm font-semibold text-white mb-3"
                  style={{ fontFamily: "Inter Tight, sans-serif" }}
                >
                  {venueName}
                </h3>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} color="#909090" strokeWidth={2} />
                    <span className="text-xs" style={{ color: "#B0B0B0" }}>
                      {monthLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={13} color="#909090" strokeWidth={2} />
                    <span className="text-xs" style={{ color: "#B0B0B0" }}>
                      {uploaderName} &middot; {dateLabel}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(photo.id)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors duration-150"
                    style={{
                      backgroundColor: "rgba(212,255,79,0.1)",
                      color: "#D4FF4F",
                      border: "1px solid rgba(212,255,79,0.2)",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    <CheckCircle2 size={14} strokeWidth={2} />
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectTarget(photo.id)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors duration-150"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.1)",
                      color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.2)",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    <XCircle size={14} strokeWidth={2} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <div
            className="glass-card-elevated w-full max-w-md rounded-2xl p-6"
            style={{ borderRadius: 16 }}
          >
            <h3
              className="text-base font-semibold text-white mb-2"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Reject Photo
            </h3>
            <p className="text-sm mb-4" style={{ color: "#B0B0B0" }}>
              Please provide a reason for rejection so the manager can resubmit.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Photo is blurry, screen not fully visible..."
              className="w-full rounded-xl px-4 py-3 text-sm mb-4 resize-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#FFFFFF",
                outline: "none",
              }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ border: "1px solid #3A3A3A", color: "#C8C8C8" }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
