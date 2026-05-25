export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import InvoicePrintView from "./InvoicePrintView";
import type { InvoiceDetail } from "./types";
export type { InvoiceDetail } from "./types";

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
