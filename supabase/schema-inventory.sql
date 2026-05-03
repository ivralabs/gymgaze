-- GymGaze Inventory Schema
-- Adds slot tracking to screens + screen_bookings junction table

-- Add slot columns to screens table
ALTER TABLE screens
  ADD COLUMN IF NOT EXISTS slots_7sec integer DEFAULT 8,
  ADD COLUMN IF NOT EXISTS slots_15sec integer DEFAULT 4;

-- Screen bookings: which campaign has booked which slots on which screen
CREATE TABLE IF NOT EXISTS screen_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_id uuid REFERENCES screens(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  slots_7sec_used integer DEFAULT 0,
  slots_15sec_used integer DEFAULT 0,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(screen_id, campaign_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_screen_bookings_screen ON screen_bookings(screen_id);
CREATE INDEX IF NOT EXISTS idx_screen_bookings_campaign ON screen_bookings(campaign_id);
