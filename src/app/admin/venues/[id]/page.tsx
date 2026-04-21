import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import VenueDetailTabs from "./VenueDetailTabs";

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
    supabase.from("screens").select("*").eq("venue_id", id).order("label"),
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

  return (
    <VenueDetailTabs
      venue={venue}
      screens={screens ?? []}
      contract={contract ?? null}
      revenue={revenue ?? []}
      photos={photos ?? []}
    />
  );
}
