export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ContactsClient from "./ContactsClient";

export const metadata = {
  title: "Contacts | GymGaze Admin",
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

export default async function ContactsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

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
      // No email — treat as unique entry keyed by id
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

  return <ContactsClient contacts={contacts} />;
}
