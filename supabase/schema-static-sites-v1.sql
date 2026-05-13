-- Static Sites schema v1
-- Tracks physical static advertising installations at each gym venue
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS static_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  site_type text DEFAULT 'poster_frame' CHECK (site_type IN ('poster_frame', 'banner', 'a_frame', 'standee', 'wall_mount', 'window_vinyl', 'other')),
  location_in_venue text,
  width_cm integer,
  height_cm integer,
  is_active boolean DEFAULT true,
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_static_sites_venue ON static_sites(venue_id);
