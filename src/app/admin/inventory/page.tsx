import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch campaigns for the booking modal dropdown
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, advertiser, start_date, end_date")
    .order("created_at", { ascending: false });

  return <InventoryClient campaigns={campaigns ?? []} />;
}
