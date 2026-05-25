-- Static Sites pricing fields migration v1
-- Adds pricing, impressions, and tier classifier to support rate card generation
-- Run this in Supabase SQL Editor

ALTER TABLE static_sites
  ADD COLUMN IF NOT EXISTS price_per_month numeric(10,2),
  ADD COLUMN IF NOT EXISTS monthly_impressions integer,
  ADD COLUMN IF NOT EXISTS pricing_tier text;
