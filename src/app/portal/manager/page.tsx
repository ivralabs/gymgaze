import Link from "next/link";
import { Camera, BarChart2, Clock, CheckCircle2 } from "lucide-react";

const pendingTasks = [
  { id: "1", type: "photo", label: "Upload April 2026 photos", dueDate: "2026-04-30", done: false },
  { id: "2", type: "stats", label: "Update member count for April", dueDate: "2026-04-30", done: false },
  { id: "3", type: "photo", label: "Upload March 2026 photos", dueDate: null, done: true },
];

export default function ManagerPage() {
  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
        >
          Manager Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          FitZone Sandton
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1 space-y-4">
          <Link
            href="/portal/manager/upload"
            className="flex items-center gap-4 p-5 rounded-xl transition-all duration-150 group"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255,107,53,0.1)" }}
            >
              <Camera size={22} color="#FF6B35" strokeWidth={2} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
              >
                Upload Photos
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                Submit screen photos for this month
              </p>
            </div>
          </Link>

          <Link
            href="/portal/manager/venue"
            className="flex items-center gap-4 p-5 rounded-xl transition-all duration-150"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(59,130,246,0.1)" }}
            >
              <BarChart2 size={22} color="#3B82F6" strokeWidth={2} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
              >
                Update Stats
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                Update member counts and entries
              </p>
            </div>
          </Link>
        </div>

        {/* Tasks */}
        <div
          className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid #F3F4F6" }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
            >
              Pending Tasks
            </h2>
          </div>
          <div>
            {pendingTasks.map((task, idx) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-6 py-4"
                style={{
                  borderTop: idx > 0 ? "1px solid #F3F4F6" : "none",
                  opacity: task.done ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: task.done
                        ? "rgba(5,150,105,0.1)"
                        : "rgba(245,158,11,0.1)",
                    }}
                  >
                    {task.done ? (
                      <CheckCircle2 size={16} color="#059669" strokeWidth={2} />
                    ) : (
                      <Clock size={16} color="#D97706" strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: task.done ? "#9CA3AF" : "#111827",
                        textDecoration: task.done ? "line-through" : "none",
                      }}
                    >
                      {task.label}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                        Due {task.dueDate}
                      </p>
                    )}
                  </div>
                </div>
                {!task.done && (
                  <Link
                    href={task.type === "photo" ? "/portal/manager/upload" : "/portal/manager/venue"}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: "rgba(255,107,53,0.1)", color: "#FF6B35" }}
                  >
                    Do it
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
