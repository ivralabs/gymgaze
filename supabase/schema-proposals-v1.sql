-- ─────────────────────────────────────────────────────────────────────────────
-- GymGaze Partnership Proposals Schema — v1
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. gym_networks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gym_networks (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  slug                  text UNIQUE NOT NULL,
  logo_url              text,
  primary_contact_name  text,
  primary_contact_email text,
  primary_contact_phone text,
  notes                 text,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE gym_networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_networks_auth_crud"
  ON gym_networks
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_gym_networks_slug ON gym_networks(slug);

-- ── 2. partnership_proposals ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partnership_proposals (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id                  uuid REFERENCES gym_networks(id) ON DELETE CASCADE,
  title                       text NOT NULL,
  version                     int DEFAULT 1,
  status                      text DEFAULT 'draft'
                              CHECK (status IN ('draft','sent','accepted','rejected','expired')),

  -- Revenue split
  revenue_split_partner_pct   numeric DEFAULT 70,
  revenue_split_gymgaze_pct   numeric DEFAULT 30,

  -- Deal terms
  grace_period_months         int DEFAULT 2,
  dedicated_slots_count       int DEFAULT 1,
  dedicated_slot_seconds      int DEFAULT 7,

  -- Inclusions / exclusions
  sponsorships_excluded        boolean DEFAULT true,
  static_sites_included        boolean DEFAULT true,
  digital_screens_included     boolean DEFAULT true,
  advertiser_exclusions        text[],
  data_sharing_required        boolean DEFAULT true,
  proof_of_flight_required     boolean DEFAULT true,

  -- Commercials
  payment_cycle               text DEFAULT 'monthly',
  reporting_cadence           text DEFAULT 'monthly',
  cpm_benchmark               numeric DEFAULT 85,

  -- Dates
  flight_start                date,
  flight_end                  date,
  expires_at                  date,

  -- Misc
  cover_image_url             text,
  notes                       text,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now(),
  created_by                  uuid REFERENCES auth.users(id)
);

ALTER TABLE partnership_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partnership_proposals_auth_crud"
  ON partnership_proposals
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_partnership_proposals_network_id ON partnership_proposals(network_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_partnership_proposals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_partnership_proposals_updated_at
  BEFORE UPDATE ON partnership_proposals
  FOR EACH ROW EXECUTE FUNCTION update_partnership_proposals_updated_at();

-- ── 3. partnership_proposal_venues ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partnership_proposal_venues (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id                 uuid REFERENCES partnership_proposals(id) ON DELETE CASCADE,
  venue_id                    uuid REFERENCES venues(id) ON DELETE CASCADE,
  screens_planned             int DEFAULT 2,
  static_sites_planned        int DEFAULT 0,
  monthly_rental_projection   numeric,
  UNIQUE(proposal_id, venue_id)
);

ALTER TABLE partnership_proposal_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partnership_proposal_venues_auth_crud"
  ON partnership_proposal_venues
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_ppv_proposal_id ON partnership_proposal_venues(proposal_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA — Edge Fitness
-- ─────────────────────────────────────────────────────────────────────────────

-- Insert Edge Fitness network
INSERT INTO gym_networks (name, slug, primary_contact_name, primary_contact_email)
VALUES ('Edge Fitness', 'edge-fitness', NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Insert the Edge Fitness partnership proposal
-- (links to the gym_networks row we just inserted)
INSERT INTO partnership_proposals (
  network_id,
  title,
  version,
  status,
  revenue_split_partner_pct,
  revenue_split_gymgaze_pct,
  grace_period_months,
  dedicated_slots_count,
  dedicated_slot_seconds,
  sponsorships_excluded,
  static_sites_included,
  digital_screens_included,
  data_sharing_required,
  proof_of_flight_required,
  cpm_benchmark,
  payment_cycle,
  reporting_cadence
)
SELECT
  gn.id,
  'Strategic Media Partnership v1',
  1,
  'draft',
  70,
  30,
  2,
  1,
  7,
  true,
  true,
  true,
  true,
  true,
  85,
  'monthly',
  'monthly'
FROM gym_networks gn
WHERE gn.slug = 'edge-fitness'
ON CONFLICT DO NOTHING;

-- Link all Edge Fitness venues to the proposal
-- Edge Fitness venues share a gym_brand where name = 'Edge Fitness'
-- (adjust the brand name filter if it differs in your data)
INSERT INTO partnership_proposal_venues (proposal_id, venue_id, screens_planned, static_sites_planned)
SELECT
  pp.id AS proposal_id,
  v.id  AS venue_id,
  2     AS screens_planned,
  0     AS static_sites_planned
FROM partnership_proposals pp
JOIN gym_networks gn ON gn.id = pp.network_id
JOIN gym_brands gb ON lower(gb.name) LIKE '%edge%'
JOIN venues v ON v.gym_brand_id = gb.id
WHERE gn.slug = 'edge-fitness'
  AND pp.title = 'Strategic Media Partnership v1'
ON CONFLICT (proposal_id, venue_id) DO NOTHING;
