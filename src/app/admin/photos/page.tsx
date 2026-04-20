"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Image, Calendar, User } from "lucide-react";

const mockPendingPhotos = [
  { id: "1", venue: "FitZone Sandton", venueId: "1", month: "Apr 2026", uploader: "John M.", date: "2026-04-18", storageUrl: null },
  { id: "2", venue: "PowerGym Rosebank", venueId: "2", month: "Apr 2026", uploader: "Sarah K.", date: "2026-04-17", storageUrl: null },
  { id: "3", venue: "IronHouse Cape Town", venueId: "3", month: "Apr 2026", uploader: "Mike T.", date: "2026-04-16", storageUrl: null },
  { id: "4", venue: "Peak Durban North", venueId: "4", month: "Apr 2026", uploader: "Lisa R.", date: "2026-04-15", storageUrl: null },
  { id: "5", venue: "SweatBox Pretoria", venueId: "5", month: "Apr 2026", uploader: "Dan P.", date: "2026-04-14", storageUrl: null },
  { id: "6", venue: "CrossFit Hub JHB", venueId: "6", month: "Apr 2026", uploader: "Amy S.", date: "2026-04-13", storageUrl: null },
];

export default function PhotosPage() {
  const [photos, setPhotos] = useState(mockPendingPhotos);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleApprove(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function handleRejectSubmit() {
    if (!rejectTarget) return;
    setPhotos((prev) => prev.filter((p) => p.id !== rejectTarget));
    setRejectTarget(null);
    setRejectReason("");
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "Inter Tight, sans-serif" }}
        >
          Photo Approvals
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666666" }}>
          {photos.length} photo{photos.length !== 1 ? "s" : ""} pending review
        </p>
      </div>

      {photos.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
        >
          <CheckCircle2 size={40} color="#10B981" strokeWidth={1.5} className="mb-4" />
          <p className="text-white font-medium">All caught up!</p>
          <p className="text-sm mt-1" style={{ color: "#666666" }}>
            No photos pending approval
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
            >
              {/* Photo preview */}
              <div
                className="aspect-video flex items-center justify-center"
                style={{ backgroundColor: "#2A2A2A" }}
              >
                <Image size={32} color="#444444" strokeWidth={1.5} />
              </div>

              {/* Info */}
              <div className="p-4">
                <h3
                  className="text-sm font-semibold text-white mb-3"
                  style={{ fontFamily: "Inter Tight, sans-serif" }}
                >
                  {photo.venue}
                </h3>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} color="#666666" strokeWidth={2} />
                    <span className="text-xs" style={{ color: "#666666" }}>
                      {photo.month}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={13} color="#666666" strokeWidth={2} />
                    <span className="text-xs" style={{ color: "#666666" }}>
                      {photo.uploader} &middot; {photo.date}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(photo.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150"
                    style={{
                      backgroundColor: "rgba(16,185,129,0.15)",
                      color: "#10B981",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    <CheckCircle2 size={14} strokeWidth={2} />
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectTarget(photo.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.1)",
                      color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <XCircle size={14} strokeWidth={2} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-md rounded-xl p-6"
            style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
          >
            <h3
              className="text-base font-semibold text-white mb-2"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Reject Photo
            </h3>
            <p className="text-sm mb-4" style={{ color: "#666666" }}>
              Please provide a reason for rejection so the manager can resubmit.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Photo is blurry, screen not fully visible..."
              className="w-full rounded-lg px-4 py-3 text-sm mb-4 resize-none"
              style={{
                backgroundColor: "#0F0F0F",
                border: "1px solid #333333",
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
                className="px-4 py-2 rounded-lg text-sm"
                style={{ border: "1px solid #333333", color: "#B3B3B3" }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
