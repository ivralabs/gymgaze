export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import InvoicePrintView from "./InvoicePrintView";
import type { LineItem } from "../../InvoicesTab";

export type InvoiceDetail = {
  id: string;
  invoice_number: string;
  campaign_id: string | null;
  advertiser: string;
  advertiser_email: string | null;
  line_items: LineItem[];
  subtotal_zar: number;
  tax_zar: number;
  total_zar: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  campaigns: { id: string; client_name: string | null } | null;
};

export const metadata = { title: "Invoice · GymGaze" };

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("invoices")
    .select("*, campaigns(id, client_name)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  return <InvoicePrintView invoice={data as InvoiceDetail} />;
}
