-- GymGaze: Venue v2 extended columns
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/wegqfhqopkrrofsuoufz/sql)
-- These columns are used by the Add Venue drawer form

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS manager_name text,
  ADD COLUMN IF NOT EXISTS manager_phone text,
  ADD COLUMN IF NOT EXISTS cover_photo_url text;
