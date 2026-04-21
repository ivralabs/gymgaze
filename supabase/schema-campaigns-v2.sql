-- GymGaze: Campaign v2 columns
-- Run this in the Supabase SQL Editor

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS deal_type text CHECK (deal_type IN ('fixed', 'cpm', 'share')) DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS cpm_rate numeric,
  ADD COLUMN IF NOT EXISTS revenue_share_percent numeric,
  ADD COLUMN IF NOT EXISTS gym_revenue_share_percent numeric,
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS contact_email text;
