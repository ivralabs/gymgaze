-- Agency Insights: audience demographics on gym_brands
ALTER TABLE gym_brands
  ADD COLUMN IF NOT EXISTS audience_male_pct integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_female_pct integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_age_18_24 integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_age_25_34 integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_age_35_44 integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audience_age_45_plus integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avg_dwell_minutes integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;

-- Shareable insight links
CREATE TABLE IF NOT EXISTS insight_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'base64url'),
  title text NOT NULL DEFAULT 'GymGaze Network Insights',
  network_ids uuid[] DEFAULT NULL, -- NULL = all networks
  pin text DEFAULT NULL,           -- NULL = open link, otherwise 4-digit PIN hash
  expires_at timestamptz DEFAULT NULL, -- NULL = never
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  last_viewed_at timestamptz DEFAULT NULL,
  view_count integer DEFAULT 0
);

ALTER TABLE insight_links ENABLE ROW LEVEL SECURITY;

-- Admins can manage links
CREATE POLICY "Admins manage insight links"
  ON insight_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public read by token (no auth required) — handled via service role in API
