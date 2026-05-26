export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import ProposalsClient from "./ProposalsClient";

export default async function ProposalsPage() {
  const supabase = await createServiceClient();

  const { data: rawProposals } = await supabase
    .from("partnership_proposals")
    .select(`
      id, title, version, status, created_at, updated_at,
      revenue_split_partner_pct, revenue_split_gymgaze_pct, cpm_benchmark,
      gym_networks(id, name, slug, logo_url),
      partnership_proposal_venues(id)
    `)
    .order("created_at", { ascending: false });

  const { data: networks } = await supabase
    .from("gym_networks")
    .select("id, name, slug, logo_url")
    .order("name");

  // Supabase returns joins as arrays in the raw type; normalise to single object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proposals = (rawProposals ?? []).map((p: any) => ({
    ...p,
    gym_networks: Array.isArray(p.gym_networks) ? (p.gym_networks[0] ?? null) : p.gym_networks,
    partnership_proposal_venues: p.partnership_proposal_venues ?? [],
  }));

  return (
    <ProposalsClient
      initialProposals={proposals}
      networks={networks ?? []}
    />
  );
}
