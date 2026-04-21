import Link from "next/link";
import { Camera, BarChart2, Clock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ManagerPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("venue_id")
    .eq("id", user.id)
    .single();

  const venueId = profile?.venue_id;
  let venueName = "Your Venue";

  if (venueId) {
    const { data: venue } = await supabase
      .from("venues")
      .select("name")
      .eq("id", venueId)
      .single();
    venueName = venue?.name ?? "Your Venue";
  }

  // Check if photos uploaded this month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  let photosUploadedThisMonth = false;

  if (venueId) {
    const { count } = await supabase
      .from("venue_photos")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", venueId)
      .gte("created_at", currentMonthStart);
    photosUploadedThisMonth = (count ?? 0) > 0;
  }

  const monthLabel = now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

  const tasks = [
    {
      id: "photos",
      type: "photo",
      label: `Upload ${monthLabel} photos`,
      dueDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-30`,
      done: photosUploadedThisMonth,
    },
    {
      id: "stats",
      type: "stats",
      label: `Update member count for ${monthLabel}`,
      dueDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-30`,
      done: false,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}
        >
          Manager Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666666" }}>
          {venueName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1 space-y-4">
          <Link
            href="/portal/manager/upload"
            className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-150 group"
            style={{
              backgroundColor: "#141414",
              border: "1px solid #2A2A2A",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
            >
              <Camera size={22} color="#D4FF4F" strokeWidth={2} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                Upload Photos
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#666666" }}>
                Submit screen photos for this month
              </p>
            </div>
          </Link>

          <Link
            href="/portal/manager/venue"
            className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-150"
            style={{
              backgroundColor: "#141414",
              border: "1px solid #2A2A2A",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(212,255,79,0.08)" }}
            >
              <BarChart2 size={22} color="#D4FF4F" strokeWidth={2} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "Inter Tight, sans-serif" }}
              >
                Update Stats
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#666666" }}>
                Update member counts and entries
              </p>
            </div>
          </Link>
        </div>

        {/* Tasks */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#141414", border: "1px solid #2A2A2A" }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid #2A2A2A" }}
          >
            <h2
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "Inter Tight, sans-serif" }}
            >
              Pending Tasks
            </h2>
          </div>
          <div>
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-6 py-4"
                style={{
                  borderTop: idx > 0 ? "1px solid #2A2A2A" : "none",
                  opacity: task.done ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: task.done
                        ? "rgba(212,255,79,0.1)"
                        : "rgba(163,163,163,0.1)",
                    }}
                  >
                    {task.done ? (
                      <CheckCircle2 size={16} color="#D4FF4F" strokeWidth={2} />
                    ) : (
                      <Clock size={16} color="#A3A3A3" strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: task.done ? "#666666" : "#FFFFFF",
                        textDecoration: task.done ? "line-through" : "none",
                      }}
                    >
                      {task.label}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs mt-0.5" style={{ color: "#666666" }}>
                        Due {task.dueDate}
                      </p>
                    )}
                  </div>
                </div>
                {!task.done && (
                  <Link
                    href={task.type === "photo" ? "/portal/manager/upload" : "/portal/manager/venue"}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "#D4FF4F", color: "#0A0A0A" }}
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
