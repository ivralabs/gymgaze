export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PipelineClient from "./PipelineClient";

export const metadata = {
  title: "Pipeline | GymGaze Admin",
};

export type PipelineDeal = {
  id: string;
  created_by: string | null;
  client_name: string;
  client_type: "agency" | "direct" | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  estimated_value: number | null;
  stage: "prospect" | "proposal_sent" | "negotiating" | "closed_won" | "closed_lost";
  notes: string | null;
  expected_close_date: string | null;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string | null;
};

export default async function PipelinePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawDeals } = await supabase
    .from("pipeline_deals")
    .select("*, profiles(id, full_name)")
    .order("created_at", { ascending: false });

  // Flatten creator name
  const deals: PipelineDeal[] = (rawDeals ?? []).map((d) => {
    const p = d.profiles as { id: string; full_name: string | null } | null;
    return {
      id: d.id,
      created_by: d.created_by,
      client_name: d.client_name,
      client_type: d.client_type,
      contact_name: d.contact_name,
      contact_email: d.contact_email,
      contact_phone: d.contact_phone,
      estimated_value: d.estimated_value ? Number(d.estimated_value) : null,
      stage: d.stage,
      notes: d.notes,
      expected_close_date: d.expected_close_date,
      campaign_id: d.campaign_id,
      created_at: d.created_at,
      updated_at: d.updated_at,
      creator_name: p?.full_name ?? null,
    };
  });

  return <PipelineClient deals={deals} />;
}
