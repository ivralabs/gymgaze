export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import NewProposalClient from "./NewProposalClient";

export default async function NewProposalPage() {
  const supabase = await createServiceClient();

  const [{ data: networks }, { data: venues }] = await Promise.all([
    supabase.from("gym_networks").select("id, name, slug, logo_url").order("name"),
    supabase
      .from("venues")
      .select("id, name, city, province, active_members, gym_brand_id")
      .order("name"),
  ]);

  return (
    <NewProposalClient
      networks={networks ?? []}
      venues={venues ?? []}
    />
  );
}
