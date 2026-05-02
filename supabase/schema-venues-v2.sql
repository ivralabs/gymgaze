-- GymGaze Venues v2 Migration
-- Adds operational detail columns to venues table
-- Run in Supabase SQL Editor before Monday 2026-05-05

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS manager_name text,
  ADD COLUMN IF NOT EXISTS manager_phone text,
  ADD COLUMN IF NOT EXISTS screen_count integer,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS province text;

COMMENT ON COLUMN venues.manager_name IS 'Name of the venue manager or primary contact';
COMMENT ON COLUMN venues.manager_phone IS 'Phone number of the venue manager';
COMMENT ON COLUMN venues.screen_count IS 'Number of digital screens at this venue (informational)';
COMMENT ON COLUMN venues.capacity IS 'Max member capacity of the venue';
COMMENT ON COLUMN venues.province IS 'South African province (e.g. Gauteng, Western Cape)';
