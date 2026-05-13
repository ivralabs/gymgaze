-- schema-gallery-v1.sql
-- Adds photo_type to venue_photos to distinguish showcase/gallery from proof-of-flight
-- Run this in Supabase SQL editor before deploying the gallery feature

ALTER TABLE venue_photos
  ADD COLUMN IF NOT EXISTS photo_type text DEFAULT 'proof_of_flight'
    CHECK (photo_type IN ('proof_of_flight', 'showcase'));

CREATE INDEX IF NOT EXISTS idx_venue_photos_type ON venue_photos(venue_id, photo_type);

-- Update any existing rows to be explicitly proof_of_flight
UPDATE venue_photos SET photo_type = 'proof_of_flight' WHERE photo_type IS NULL;
