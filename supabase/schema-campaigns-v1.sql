-- GymGaze: Campaigns v1 — New CPM-based campaign management schema
-- Run this in the Supabase SQL Editor to upgrade the campaigns table

-- Step 1: Add new columns to campaigns (idempotent)
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS client_name       TEXT,
  ADD COLUMN IF NOT EXISTS client_type       TEXT NOT NULL DEFAULT 'agency',
  ADD COLUMN IF NOT EXISTS contact_name      TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone     TEXT,
  ADD COLUMN IF NOT EXISTS format            TEXT,
  ADD COLUMN IF NOT EXISTS status            TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS total_value       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_collected  NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Step 2: Add slot_count to campaign_venues if missing
ALTER TABLE campaign_venues
  ADD COLUMN IF NOT EXISTS slot_count INTEGER NOT NULL DEFAULT 1;

-- Step 3: Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status        ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_venues_campaign ON campaign_venues(campaign_id);

-- Optional: add check constraints if your Postgres version supports it
-- ALTER TABLE campaigns ADD CONSTRAINT chk_client_type CHECK (client_type IN ('agency', 'direct'));
-- ALTER TABLE campaigns ADD CONSTRAINT chk_format CHECK (format IN ('standard_7s', 'premium_15s', 'prime_15s', 'spotlight_30s'));
-- ALTER TABLE campaigns ADD CONSTRAINT chk_status CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'));
