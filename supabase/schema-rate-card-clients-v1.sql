-- Rate Card Clients schema v1
-- Saves client location sets + rate card config for quick reloading
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)

CREATE TABLE IF NOT EXISTS rate_card_clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  client_locations jsonb NOT NULL DEFAULT '[]'::jsonb,
  tier          text,
  slot_seconds  integer,
  flight_start  date,
  flight_end    date,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id)
);

-- Prevent duplicate client names (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_card_clients_name_lower
  ON rate_card_clients (lower(name));

CREATE INDEX IF NOT EXISTS idx_rate_card_clients_created_by
  ON rate_card_clients (created_by);

-- RLS
ALTER TABLE rate_card_clients ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read, write, update, delete (single-tenant admin)
CREATE POLICY "authenticated_select" ON rate_card_clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON rate_card_clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update" ON rate_card_clients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete" ON rate_card_clients
  FOR DELETE TO authenticated USING (true);
