-- GymGaze Photos v2 Migration
-- Adds area_tag, file_name, file_size_bytes to venue_photos

ALTER TABLE venue_photos
  ADD COLUMN IF NOT EXISTS area_tag text DEFAULT 'other'
    CHECK (area_tag IN ('gym_floor', 'reception', 'changerooms', 'equipment', 'outdoor', 'other')),
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint;

-- Index for filtering by area
CREATE INDEX IF NOT EXISTS idx_venue_photos_area_tag ON venue_photos(area_tag);
CREATE INDEX IF NOT EXISTS idx_venue_photos_venue_status ON venue_photos(venue_id, status);
