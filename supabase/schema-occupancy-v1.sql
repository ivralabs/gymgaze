-- ─────────────────────────────────────────────────────────────────────────────
-- schema-occupancy-v1.sql
-- Occupancy floor + rental pot tracker for partnership proposals
--
-- Run this in the Supabase SQL Editor (once only).
-- ─────────────────────────────────────────────────────────────────────────────

-- Add occupancy floor + grace policy fields to partnership_proposals
ALTER TABLE partnership_proposals
  ADD COLUMN IF NOT EXISTS occupancy_floor_pct    numeric DEFAULT 35,
  ADD COLUMN IF NOT EXISTS occupancy_measurement  text    DEFAULT 'per_venue'
    CHECK (occupancy_measurement IN ('per_venue','network_wide')),
  ADD COLUMN IF NOT EXISTS rental_pot_enabled     boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS grace_period_description text;

-- Set Edge Fitness proposal defaults
UPDATE partnership_proposals
SET occupancy_floor_pct    = 35,
    occupancy_measurement  = 'per_venue',
    rental_pot_enabled     = true,
    updated_at             = now()
WHERE network_id = (SELECT id FROM gym_networks WHERE slug = 'edge-fitness');

-- Track current occupancy per venue (for the pot calculation)
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS current_occupancy_pct  numeric     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS occupancy_updated_at   timestamptz;

-- Occupancy log table — single row per venue per month (for history)
CREATE TABLE IF NOT EXISTS venue_occupancy_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id         uuid        REFERENCES venues(id) ON DELETE CASCADE,
  month            date        NOT NULL, -- first of month
  occupancy_pct    numeric     NOT NULL,
  rental_owed      numeric     NOT NULL DEFAULT 0,   -- rental_fee_monthly if occupancy >= floor, else 0
  rental_potential numeric     NOT NULL DEFAULT 0,   -- always rental_fee_monthly (goes to pot if below floor)
  notes            text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(venue_id, month)
);

ALTER TABLE venue_occupancy_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "occupancy_auth_crud" ON venue_occupancy_log
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_occupancy_venue ON venue_occupancy_log(venue_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_month  ON venue_occupancy_log(month);
