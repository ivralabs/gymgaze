import { createClient } from "@/lib/supabase/server";
import { createClient as createPureServiceClient } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import StaticSiteDetailClient from "./StaticSiteDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function serviceClient() {
  return createPureServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function StaticSiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const svc = serviceClient();
  const { data: site } = await svc
    .from("static_sites")
    .select("*, venues(id, name, city, province)")
    .eq("id", id)
    .single();

  if (!site) notFound();

  const { data: venues } = await supabase.from("venues").select("id, name, city").order("name");

  return <StaticSiteDetailClient site={site} venues={venues ?? []} />;
}
