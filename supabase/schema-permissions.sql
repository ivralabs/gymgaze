-- GymGaze Permissions Schema
-- Adds permissions JSONB column to profiles + expands role options

-- Add permissions column (array of allowed nav slugs)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT NULL;

-- Expand role CHECK constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'owner', 'manager', 'sales', 'viewer', 'custom'));
