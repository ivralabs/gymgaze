"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PhotoApprovalButtons({ photoId }: { photoId: string }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function approve() {
    setLoading(true);
    await fetch(`/api/photos/${photoId}/approve`, { method: "POST" });
    setDone(true);
    setLoading(false);
  }

  async function reject() {
    setLoading(true);
    await fetch(`/api/photos/${photoId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Rejected from dashboard" }),
    });
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return <span className="text-xs" style={{ color: "#666666" }}>Done</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={approve}
        disabled={loading}
        className="p-1.5 rounded-lg transition-colors duration-150"
        style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
        title="Approve"
      >
        <CheckCircle2 size={14} color="#10B981" strokeWidth={2} />
      </button>
      <button
        onClick={reject}
        disabled={loading}
        className="p-1.5 rounded-lg transition-colors duration-150"
        style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
        title="Reject"
      >
        <XCircle size={14} color="#EF4444" strokeWidth={2} />
      </button>
    </div>
  );
}
