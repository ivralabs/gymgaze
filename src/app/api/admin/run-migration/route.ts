// One-shot migration runner — admin only, safe to call multiple times (idempotent SQL)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const MIGRATION_SQL = `
-- Audience demographics on gym_brands
ALTER TABLE gym_brands
  ADD COLUMN IF NOT EXISTS audience_male_pct integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_female_pct integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_age_18_24 integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_age_25_34 integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_age_35_44 integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_age_45_plus integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avg_dwell_minutes integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS audience_notes text DEFAULT NULL;

-- Shareable insight links
CREATE TABLE IF NOT EXISTS insight_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'GymGaze Network Insights',
  network_ids uuid[] DEFAULT NULL,
  pin_hash text DEFAULT NULL,
  expires_at timestamptz DEFAULT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  last_viewed_at timestamptz DEFAULT NULL,
  view_count integer DEFAULT 0
);
`;

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Run DDL via service client with pg_net or direct SQL RPC if available
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Try running each statement via rpc
  const { error } = await service.rpc("exec_migration", { sql: MIGRATION_SQL }).single();

  if (error) {
    // If exec_migration doesn't exist, return the SQL for manual run
    return NextResponse.json({
      error: "Auto-migration unavailable. Run this SQL in your Supabase SQL Editor:",
      sql: MIGRATION_SQL,
    }, { status: 422 });
  }

  return NextResponse.json({ ok: true, message: "Migration applied successfully" });
}
