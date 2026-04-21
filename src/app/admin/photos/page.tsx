import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PhotoApprovalGrid from "./photo-approval-grid";
import RadialProgress from "@/components/gymgaze/RadialProgress";

export default async function PhotosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: pendingPhotos } = await supabase
    .from("venue_photos")
    .select("id, storage_path, month, created_at, venue_id, uploaded_by, venues(name), profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { count: approvedCount } = await supabase
    .from("venue_photos")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  const { count: totalCount } = await supabase
    .from("venue_photos")
    .select("id", { count: "exact", head: true });

  const approvalRate =
    (totalCount ?? 0) > 0
      ? Math.round(((approvedCount ?? 0) / (totalCount ?? 1)) * 100)
      : 0;

  // Get signed URLs
  const photosWithUrls = await Promise.all(
    (pendingPhotos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("venue-photos")
        .createSignedUrl(photo.storage_path, 3600);
      return { ...photo, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="p-8">
      {/* Hero Panel */}
      <div
        className="relative overflow-hidden rounded-2xl mb-8"
        style={{
          background: "linear-gradient(135deg, #141414 0%, #0F0F0F 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <img
          src="/hero-object.png"
          alt=""
          className="absolute right-0 top-0 h-full w-auto opacity-30 object-cover pointer-events-none select-none"
        />
        <div className="relative z-10 p-8 flex items-center gap-8">
          <div className="flex-1">
            <h1
              style={{
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 800,
                fontSize: "2.5rem",
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              Photo Approvals
            </h1>
            <p style={{ color: "#666", marginTop: "0.5rem" }}>Review venue photo submissions</p>
            <p style={{ color: "#A3A3A3", marginTop: "0.75rem", fontSize: "0.875rem" }}>
              {photosWithUrls.length} photo{photosWithUrls.length !== 1 ? "s" : ""} pending review
            </p>
          </div>
          <div className="flex-shrink-0 hidden sm:block">
            <RadialProgress
              value={approvalRate}
              size={100}
              label="approval"
              sublabel={`${approvedCount ?? 0} of ${totalCount ?? 0}`}
            />
          </div>
        </div>
      </div>

      {photosWithUrls.length === 0 ? (
        <div
          className="glass-card flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ borderRadius: 16 }}
        >
          <CheckCircle2 size={40} color="#D4FF4F" strokeWidth={1.5} className="mb-4" />
          <p className="text-white font-medium">All caught up!</p>
          <p className="text-sm mt-1" style={{ color: "#666666" }}>
            No photos pending approval
          </p>
        </div>
      ) : (
        <PhotoApprovalGrid initialPhotos={photosWithUrls} />
      )}
    </div>
  );
}
