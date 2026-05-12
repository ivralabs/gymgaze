import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RateCardClient from "./RateCardClient";

export const metadata = {
  title: "Rate Card | GymGaze Admin",
};

export default async function RateCardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city, province, active_members, monthly_entries, screens(id, is_active)")
    .order("name");

  return <RateCardClient venues={venues ?? []} />;
}
