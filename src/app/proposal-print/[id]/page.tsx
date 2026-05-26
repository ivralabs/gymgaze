export const dynamic = "force-dynamic";

import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import ProposalPrint, { type Proposal } from "./ProposalPrint";
import { notFound } from "next/navigation";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function ProposalPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const svc = serviceClient();

  const [{ data: proposal }, { data: venues }] = await Promise.all([
    svc
      .from("partnership_proposals")
      .select(`
        *,
        gym_networks(id, name, slug, logo_url, primary_contact_name, primary_contact_email, primary_contact_phone),
        partnership_proposal_venues(
          id, venue_id, screens_planned, static_sites_planned, monthly_rental_projection,
          venues(id, name, city, province, active_members, monthly_entries, rental_fee_monthly, current_occupancy_pct)
        )
      `)
      .eq("id", id)
      .single(),
    svc
      .from("venues")
      .select("id, name, city, province, active_members, monthly_entries, rental_fee_monthly, current_occupancy_pct")
      .order("name"),
  ]);

  if (!proposal) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalised = {
    ...proposal,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gym_networks: Array.isArray((proposal as any).gym_networks)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ((proposal as any).gym_networks[0] ?? null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (proposal as any).gym_networks,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    partnership_proposal_venues: (proposal as any).partnership_proposal_venues ?? [],
  };

  return <ProposalPrint proposal={normalised as Proposal} allVenues={venues ?? []} />;
}
