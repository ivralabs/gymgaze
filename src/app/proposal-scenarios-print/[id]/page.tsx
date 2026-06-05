export const dynamic = "force-dynamic";

import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import ProposalScenariosPrint, {
  type ScenariosProposal,
  type ScenariosVenueRow,
  type StaticSiteRow,
} from "./ProposalScenariosPrint";
import { notFound } from "next/navigation";

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function ProposalScenariosPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const svc = serviceClient();

  // Fetch proposal with venue joins
  const { data: rawProposal } = await svc
    .from("partnership_proposals")
    .select(`
      id, title, version, status,
      revenue_split_partner_pct, revenue_split_gymgaze_pct,
      cpm_benchmark, occupancy_floor_pct, created_at,
      gym_networks(id, name, slug, logo_url),
      partnership_proposal_venues(
        id, venue_id, screens_planned,
        venues(id, name, city, province, rental_fee_monthly, active_members)
      )
    `)
    .eq("id", id)
    .single();

  if (!rawProposal) notFound();

  // Normalise Supabase embedded relation (may be object or array)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = rawProposal as any;
  const proposal: ScenariosProposal = {
    id: raw.id,
    title: raw.title,
    version: raw.version,
    status: raw.status,
    revenue_split_partner_pct: raw.revenue_split_partner_pct,
    revenue_split_gymgaze_pct: raw.revenue_split_gymgaze_pct,
    cpm_benchmark: raw.cpm_benchmark,
    occupancy_floor_pct: raw.occupancy_floor_pct ?? 35,
    created_at: raw.created_at,
    gym_networks: Array.isArray(raw.gym_networks)
      ? (raw.gym_networks[0] ?? null)
      : raw.gym_networks,
    partnership_proposal_venues: (raw.partnership_proposal_venues ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pv: any): ScenariosVenueRow => ({
        id: pv.id,
        venue_id: pv.venue_id,
        screens_planned: pv.screens_planned,
        venues: Array.isArray(pv.venues) ? (pv.venues[0] ?? null) : pv.venues,
      })
    ),
  };

  // Collect all venue IDs in this proposal
  const venueIds = proposal.partnership_proposal_venues
    .map((pv) => pv.venue_id)
    .filter(Boolean);

  // Fetch static sites for all proposal venues
  let staticSites: StaticSiteRow[] = [];
  if (venueIds.length > 0) {
    const { data: sites } = await svc
      .from("static_sites")
      .select("id, venue_id, label, price_per_month")
      .in("venue_id", venueIds)
      .not("price_per_month", "is", null);
    staticSites = (sites ?? []) as StaticSiteRow[];
  }

  return (
    <ProposalScenariosPrint
      proposal={proposal}
      staticSites={staticSites}
    />
  );
}
