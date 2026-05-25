-- =============================================
-- GymGaze: Per-user configurable sales target
-- Run in: Supabase Dashboard > SQL Editor
-- Project: wegqfhqopkrrofsuoufz
-- =============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sales_target integer DEFAULT 50000;
