"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PhotoApprovalButtons({ photoId }: { photoId: string }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    await fetch(`/api/photos/${photoId}/approve`, { method: "POST" });
    setDone(true);
    setLoading(false);
    window.location.reload();
  }

  async function handleReject() {
    setLoading(true);
    await fetch(`/api/photos/${photoId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Rejected from dashboard" }),
    });
    setDone(true);
    setLoading(false);
    window.location.reload();
  }

  if (done) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
        style={{
          backgroundColor: "rgba(212,255,79,0.1)",
          color: "#D4FF4F",
          border: "1px solid rgba(212,255,79,0.2)",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <CheckCircle2 size={13} strokeWidth={2} />
        Approve
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
        style={{
          backgroundColor: "rgba(239,68,68,0.1)",
          color: "#EF4444",
          border: "1px solid rgba(239,68,68,0.2)",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <XCircle size={13} strokeWidth={2} />
        Reject
      </button>
    </div>
  );
}
