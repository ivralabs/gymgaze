export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import ProposalDetailClient, { type Proposal } from "./ProposalDetailClient";
import { notFound } from "next/navigation";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const [{ data: rawProposal }, { data: allVenues }] = await Promise.all([
    supabase
      .from("partnership_proposals")
      .select(`
        *,
        gym_networks(id, name, slug, logo_url, primary_contact_name, primary_contact_email, primary_contact_phone),
        partnership_proposal_venues(
          id, venue_id, screens_planned, static_sites_planned, monthly_rental_projection,
          venues(id, name, city, province, active_members)
        )
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("venues")
      .select("id, name, city, province, active_members")
      .order("name"),
  ]);

  if (!rawProposal) notFound();

  // Normalise Supabase join arrays to single objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proposal = {
    ...rawProposal,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gym_networks: Array.isArray((rawProposal as any).gym_networks)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ((rawProposal as any).gym_networks[0] ?? null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (rawProposal as any).gym_networks,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    partnership_proposal_venues: (rawProposal as any).partnership_proposal_venues ?? [],
  };

  return <ProposalDetailClient proposal={proposal as Proposal} allVenues={allVenues ?? []} />;
}
