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
          className="text-2xl font-bold"
          style={{ fontFamily: "Inter Tight, sans-serif", color: "#111827" }}
        >
          Manager Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          {venueName}
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
            {tasks.map((task, idx) => (
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
