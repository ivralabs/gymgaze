-- GymGaze: Extend screens table with location, specs, and Cuecast status fields
-- Run this migration in your Supabase SQL editor

ALTER TABLE screens ADD COLUMN IF NOT EXISTS location_in_venue TEXT;
-- values: 'lobby' | 'gym_floor' | 'cardio_area' | 'change_rooms' | 'reception' | 'other'

ALTER TABLE screens ADD COLUMN IF NOT EXISTS size_inches INTEGER;

ALTER TABLE screens ADD COLUMN IF NOT EXISTS orientation TEXT DEFAULT 'landscape';
-- values: 'landscape' | 'portrait'

ALTER TABLE screens ADD COLUMN IF NOT EXISTS resolution TEXT;
-- e.g. '1920x1080'

ALTER TABLE screens ADD COLUMN IF NOT EXISTS cuecast_status TEXT DEFAULT 'unpaired';
-- values: 'unpaired' | 'online' | 'offline'

ALTER TABLE screens ADD COLUMN IF NOT EXISTS cuecast_last_seen TIMESTAMPTZ;

ALTER TABLE screens ADD COLUMN IF NOT EXISTS cuecast_player_token TEXT;

ALTER TABLE screens ADD COLUMN IF NOT EXISTS notes TEXT;
