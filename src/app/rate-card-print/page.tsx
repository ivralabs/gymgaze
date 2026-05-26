export const dynamic = "force-dynamic";

import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import RateCardPrint from "./RateCardPrint";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function RateCardPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const svc = serviceClient();

  const [{ data: venues }, { data: pricingTiers }] = await Promise.all([
    svc
      .from("venues")
      .select(
        "id, name, city, province, active_members, monthly_entries, cover_image_url, operating_hours, latitude, longitude, screens(id, is_active, slots_7sec, slots_15sec, location_in_venue, size_inches)"
      )
      .order("name"),
    svc
      .from("pricing_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const selectedVenueIds = params.venues ? params.venues.split(",").filter(Boolean) : [];
  const allVenues = venues ?? [];
  const filteredVenues =
    selectedVenueIds.length > 0
      ? allVenues.filter((v) => selectedVenueIds.includes(v.id))
      : allVenues;

  const clientLat = params.clientLat ? parseFloat(params.clientLat) : null;
  const clientLng = params.clientLng ? parseFloat(params.clientLng) : null;

  return (
    <RateCardPrint
      venues={filteredVenues}
      pricingTiers={pricingTiers ?? []}
      cpm={parseFloat(params.cpm ?? "85")}
      weeks={parseInt(params.weeks ?? "4")}
      clientName={params.client ?? ""}
      flightStart={params.start ?? ""}
      flightEnd={params.end ?? ""}
      groupByCity={params.groupByCity === "true"}
      clientLat={clientLat}
      clientLng={clientLng}
      clientAddress={params.clientAddress ?? ""}
    />
  );
}
