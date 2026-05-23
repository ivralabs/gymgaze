import { createClient } from "@/lib/supabase/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import RateCardClient from "./RateCardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Rate Card | GymGaze Admin",
};

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function RateCardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const svc = serviceClient();

  const [{ data: venues }, { data: pricingTiers }] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name, city, province, active_members, monthly_entries, screens(id, is_active)")
      .order("name"),
    svc
      .from("pricing_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return <RateCardClient venues={venues ?? []} pricingTiers={pricingTiers ?? []} />;
}
