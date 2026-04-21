-- GymGaze Schema Migration: Campaigns v2
-- Run this in the Supabase SQL Editor

-- Add new columns to campaigns table for smart campaign builder
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deal_type text DEFAULT 'fixed';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS cpm_rate numeric;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS revenue_share_percent numeric;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS gym_revenue_share_percent numeric;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS advertiser text;

-- Note: advertiser column may already exist — IF NOT EXISTS handles that safely.
-- After running this migration, all new campaign fields will be persisted.
