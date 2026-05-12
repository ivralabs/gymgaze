import RadialProgress from "@/components/gymgaze/RadialProgress";

interface CommissionCardProps {
  campaignCount: number;
  revenueMTD: number;
  target: number;
  month: string;
}

function fmtR(n: number) {
  return `R ${Number(n).toLocaleString("en-ZA")}`;
}

export default function CommissionCard({
  campaignCount,
  revenueMTD,
  target,
  month,
}: CommissionCardProps) {
  const pct = target > 0 ? Math.min(100, Math.round((revenueMTD / target) * 100)) : 0;
  const hitTarget = revenueMTD >= target;

  return (
    <div
      className="glass-card rounded-2xl p-6 mb-6"
      style={{
        borderRadius: 16,
        border: "1px solid rgba(212,255,79,0.15)",
        background: "linear-gradient(135deg, rgba(212,255,79,0.06) 0%, rgba(255,255,255,0.03) 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-widest mb-1"
            style={{ color: "#D4FF4F" }}
          >
            Your Performance — {month}
          </p>
          <h2
            className="text-lg font-bold text-white"
            style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
          >
            {hitTarget ? "Target smashed! 🔥" : "Keep pushing!"}
          </h2>
        </div>
        <RadialProgress value={pct} size={80} label="vs target" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Campaigns */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#999" }}>
            Campaigns MTD
          </p>
          <p
            className="tabular-nums text-white"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "2rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {campaignCount}
          </p>
          <p className="text-xs mt-1.5" style={{ color: "#8A8A8A" }}>this month</p>
        </div>

        {/* Revenue MTD */}
        <div
          className="rounded-xl p-4"
          style={{
            background: hitTarget ? "rgba(74,222,128,0.06)" : "rgba(212,255,79,0.04)",
            border: hitTarget ? "1px solid rgba(74,222,128,0.12)" : "1px solid rgba(212,255,79,0.08)",
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#999" }}>
            Revenue MTD
          </p>
          <p
            className="tabular-nums"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "1.4rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: hitTarget ? "#4ADE80" : "#D4FF4F",
            }}
          >
            {fmtR(revenueMTD)}
          </p>
          <p className="text-xs mt-1.5" style={{ color: "#8A8A8A" }}>of {fmtR(target)} target</p>
        </div>

        {/* Progress */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#999" }}>
            To Target
          </p>
          <p
            className="tabular-nums"
            style={{
              fontFamily: "Inter Tight, sans-serif",
              fontWeight: 800,
              fontSize: "1.4rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: hitTarget ? "#4ADE80" : "#FB923C",
            }}
          >
            {hitTarget ? "Done ✓" : fmtR(Math.max(0, target - revenueMTD))}
          </p>
          <p className="text-xs mt-1.5" style={{ color: "#8A8A8A" }}>
            {hitTarget ? "Target reached" : "remaining"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5 text-xs" style={{ color: "#888" }}>
          <span>Monthly target progress</span>
          <span style={{ color: hitTarget ? "#4ADE80" : "#D4FF4F", fontWeight: 600 }}>{pct}%</span>
        </div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: hitTarget ? "#4ADE80" : "#D4FF4F",
            }}
          />
        </div>
      </div>
    </div>
  );
}
