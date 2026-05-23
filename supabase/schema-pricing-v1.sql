-- =============================================
-- GymGaze: Configurable CPM Pricing
-- Run in: Supabase Dashboard > SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_key text NOT NULL UNIQUE,      -- e.g. 'starter', 'standard', 'premium'
  label text NOT NULL,                -- Display name e.g. 'Standard 7s'
  cpm_zar integer NOT NULL,           -- CPM in ZAR
  min_spend integer NOT NULL,         -- Minimum spend in ZAR
  duration_sec integer NOT NULL,      -- Ad slot duration in seconds
  description text,                   -- Optional tooltip / description
  color text NOT NULL DEFAULT '#A1A1AA',  -- Accent colour (hex)
  bg text NOT NULL DEFAULT 'rgba(113,113,122,0.18)', -- Background tint
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Seed default tiers
INSERT INTO pricing_tiers (tier_key, label, cpm_zar, min_spend, duration_sec, description, color, bg, sort_order)
VALUES
  ('starter',   'Starter 7s',    35,  1500, 7,  'Self-serve entry tier for small brands',          '#6EE7B7', 'rgba(110,231,183,0.14)', 0),
  ('standard',  'Standard 7s',   65,  2500, 7,  'Agency standard — most booked tier',              '#A1A1AA', 'rgba(113,113,122,0.18)', 1),
  ('premium',   'Premium 15s',   85,  2500, 15, 'Extended exposure with premium placement',         '#FF6B35', 'rgba(255,107,53,0.18)',  2),
  ('prime',     'Prime 15s',     120, 5000, 15, 'High-traffic time slots, guaranteed placement',   '#D4FF4F', 'rgba(212,255,79,0.14)',  3),
  ('spotlight', 'Spotlight 30s', 160, 5000, 30, 'Full takeover — maximum brand visibility',        '#C084FC', 'rgba(168,85,247,0.18)',  4)
ON CONFLICT (tier_key) DO NOTHING;

-- RLS
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pricing_tiers" ON pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Service role write pricing_tiers" ON pricing_tiers FOR ALL USING (auth.role() = 'service_role');
