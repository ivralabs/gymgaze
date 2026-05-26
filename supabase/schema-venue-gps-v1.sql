-- Migration: Add GPS coordinates to venues
-- Run this in the Supabase SQL editor

ALTER TABLE venues ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
