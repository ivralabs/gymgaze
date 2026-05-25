-- Venue Site ID Codes schema v1
-- Adds structured brand/metro/venue codes to the venues table
-- Used to auto-generate structured Site IDs like EF-BCM-BEA-SL1
-- Run this in Supabase SQL Editor

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS brand_code text,
  ADD COLUMN IF NOT EXISTS metro_code text,
  ADD COLUMN IF NOT EXISTS venue_code text;
