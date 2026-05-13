import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import VenueDetailTabs from "./VenueDetailTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("*, gym_brands(name, logo_url)")
    .eq("id", id)
    .maybeSingle();

  if (!venue) notFound();

  const [
    { data: screens },
    { data: contract },
    { data: revenue },
    { data: photos },
  ] = await Promise.all([
    supabase.from("screens").select("*").eq("venue_id", id).order("created_at", { ascending: false }),
    supabase.from("contracts").select("*").eq("venue_id", id).maybeSingle(),
    supabase
      .from("revenue_entries")
      .select("*")
      .eq("venue_id", id)
      .order("month", { ascending: false })
      .limit(12),
    supabase
      .from("venue_photos")
      .select("*")
      .eq("venue_id", id)
      .order("created_at", { ascending: false }),
  ]);

  // Use public URLs — venue-photos bucket is public
  const photosWithUrls = (photos ?? []).map((photo) => {
    const { data: { publicUrl } } = supabase.storage
      .from("venue-photos")
      .getPublicUrl(photo.storage_path);
    return { ...photo, signedUrl: publicUrl };
  });

  return (
    <VenueDetailTabs
      venue={venue}
      screens={screens ?? []}
      contract={contract ?? null}
      revenue={revenue ?? []}
      photos={photosWithUrls}
      venueId={id}
    />
  );
}
