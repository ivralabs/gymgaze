export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient as createServiceClient } from "@supabase/supabase-js";
import LandlordsClient, { type LandlordVenue } from "./LandlordsClient";

export const metadata = {
  title: "Landlords & Rentals | GymGaze Admin",
};

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function LandlordsPage() {
  const supabase = getService();

  // Gracefully handle the case where the columns don't exist yet (SQL not run)
  let venues: LandlordVenue[] = [];
  try {
    const { data, error } = await supabase
      .from("venues")
      .select(
        "id, name, city, province, monthly_entries, active_members, " +
        "rental_fee_monthly, rental_payment_cycle, rental_start_date, " +
        "rental_escalation_pct, rental_notes, rental_bank_details, rental_updated_at"
      )
      .order("city", { ascending: true })
      .order("name", { ascending: true });

    if (!error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      venues = ((data ?? []) as unknown as LandlordVenue[]);
    }
    // If error (columns don't exist), venues remains [] — UI shows migration notice
  } catch {
    // silently swallow — show migration notice in UI
  }

  return <LandlordsClient initialVenues={venues} />;
}
