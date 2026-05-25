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

export type CampaignContact = {
  id: string;
  client_name: string | null;
  client_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string | null;
  total_value: number | null;
  created_at: string;
};

export type AggregatedContact = {
  contact_email: string;
  contact_name: string | null;
  contact_phone: string | null;
  client_name: string | null;
  client_type: string | null;
  campaign_count: number;
  total_value: number;
  campaigns: CampaignContact[];
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

  // Fetch contacts (from campaigns)
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, client_name, client_type, contact_name, contact_email, contact_phone, status, total_value, created_at")
    .order("created_at", { ascending: false });

  const raw = (campaigns ?? []) as CampaignContact[];

  // Deduplicate by contact_email
  const emailMap = new Map<string, AggregatedContact>();
  const noEmailList: AggregatedContact[] = [];

  for (const c of raw) {
    const email = c.contact_email?.trim().toLowerCase() ?? null;
    if (!email) {
      noEmailList.push({
        contact_email: "",
        contact_name: c.contact_name,
        contact_phone: c.contact_phone,
        client_name: c.client_name,
        client_type: c.client_type,
        campaign_count: 1,
        total_value: Number(c.total_value) || 0,
        campaigns: [c],
      });
      continue;
    }
    if (emailMap.has(email)) {
      const existing = emailMap.get(email)!;
      existing.campaign_count += 1;
      existing.total_value += Number(c.total_value) || 0;
      existing.campaigns.push(c);
    } else {
      emailMap.set(email, {
        contact_email: email,
        contact_name: c.contact_name,
        contact_phone: c.contact_phone,
        client_name: c.client_name,
        client_type: c.client_type,
        campaign_count: 1,
        total_value: Number(c.total_value) || 0,
        campaigns: [c],
      });
    }
  }

  const contacts: AggregatedContact[] = [
    ...Array.from(emailMap.values()),
    ...noEmailList,
  ];

  return <PipelineClient deals={deals} contacts={contacts} />;
}
