"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, PauseCircle, PlayCircle, XCircle } from "lucide-react";

interface Props {
  sponsorshipId: string;
  currentStatus: string;
}

export default function SponsorshipActionButtons({ sponsorshipId, currentStatus }: Props) {
  const router = useRouter();

  async function updateStatus(status: string) {
    try {
      const res = await fetch(`/api/sponsorships/${sponsorshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={`/admin/sponsorships/${sponsorshipId}?edit=1`}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: "rgba(255,255,255,0.07)", color: "#C8C8C8", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <Pencil size={14} strokeWidth={2} />
        Edit
      </Link>

      {currentStatus === "active" && (
        <button
          onClick={() => updateStatus("paused")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "rgba(251,191,36,0.08)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.15)" }}
        >
          <PauseCircle size={14} strokeWidth={2} />
          Pause
        </button>
      )}

      {currentStatus === "paused" && (
        <button
          onClick={() => updateStatus("active")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "rgba(74,222,128,0.08)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.15)" }}
        >
          <PlayCircle size={14} strokeWidth={2} />
          Resume
        </button>
      )}

      {(currentStatus === "active" || currentStatus === "paused") && (
        <button
          onClick={() => updateStatus("expired")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "rgba(239,68,68,0.08)", color: "#F87171", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <XCircle size={14} strokeWidth={2} />
          Mark Expired
        </button>
      )}
    </div>
  );
}
