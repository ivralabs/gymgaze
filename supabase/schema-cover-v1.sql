-- schema-cover-v1.sql
-- Adds cover_image_url to venues for venue card hero images
ALTER TABLE venues ADD COLUMN IF NOT EXISTS cover_image_url text;
