import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PhotoApprovalGrid from "./photo-approval-grid";

export default async function PhotosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: pendingPhotos } = await supabase
    .from("venue_photos")
    .select("id, storage_path, month, created_at, venue_id, uploaded_by, venues(name), profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

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
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "Inter Tight, sans-serif" }}
        >
          Photo Approvals
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666666" }}>
          {photosWithUrls.length} photo{photosWithUrls.length !== 1 ? "s" : ""} pending review
        </p>
      </div>

      {photosWithUrls.length === 0 ? (
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
        <PhotoApprovalGrid initialPhotos={photosWithUrls} />
      )}
    </div>
  );
}
