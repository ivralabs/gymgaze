-- ============================================================
-- GymGaze — Landlords / Rental Fees schema
-- ⚠️  MLU: Run this in Supabase SQL Editor (NOT via migrations)
-- ============================================================

-- ── Part 1: Add rental columns to venues ──────────────────────────────────────

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS rental_fee_monthly  numeric   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rental_payment_cycle text     DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS rental_start_date   date,
  ADD COLUMN IF NOT EXISTS rental_escalation_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rental_notes        text,
  ADD COLUMN IF NOT EXISTS rental_bank_details jsonb,
  ADD COLUMN IF NOT EXISTS rental_updated_at   timestamptz;

-- ── Part 2: Seed the 14 Edge Fitness venues with agreed rental tiers ──────────
-- Tier 1 — Premium (R 2 500/mo): high-traffic flagship venues
UPDATE venues SET rental_fee_monthly = 2500, rental_updated_at = now()
  WHERE name IN ('Sunnyside','Walmer','Linton Grange','Kloof','Greenacres');

-- Tier 2 — Standard+ (R 2 200/mo)
UPDATE venues SET rental_fee_monthly = 2200, rental_updated_at = now()
  WHERE name IN ('Spruitview','Jeffreys Bay');

-- Tier 3 — Strand (R 2 400/mo)
UPDATE venues SET rental_fee_monthly = 2400, rental_updated_at = now()
  WHERE name = 'Strand';

-- Tier 4 — Mid (R 1 800/mo)
UPDATE venues SET rental_fee_monthly = 1800, rental_updated_at = now()
  WHERE name IN ('Walker Drive','Quigney');

-- Tier 5 — Lower-mid (R 1 700/mo)
UPDATE venues SET rental_fee_monthly = 1700, rental_updated_at = now()
  WHERE name = 'Rivonia';

-- Tier 6 — Standard (R 1 500/mo)
UPDATE venues SET rental_fee_monthly = 1500, rental_updated_at = now()
  WHERE name = 'Beacon Bay';

-- Tier 7 — Entry (R 1 300/mo)
UPDATE venues SET rental_fee_monthly = 1300, rental_updated_at = now()
  WHERE name IN ('Gonubie','Grabouw');

-- ── Part 3: Update Edge Fitness proposal — flip revenue split ─────────────────
-- 70% GymGaze / 30% Edge Fitness
UPDATE partnership_proposals
SET
  revenue_split_partner_pct  = 30,
  revenue_split_gymgaze_pct  = 70,
  updated_at                 = now()
WHERE
  network_id = (SELECT id FROM gym_networks WHERE slug = 'edge-fitness')
  AND title = 'Strategic Media Partnership v1';

-- ── Part 4: Distribute 94 screens across 14 EF venues by walk-in traffic ──────
--
--   Premium (20k+ walk-ins):  Sunnyside, Walmer, Linton Grange, Kloof, Greenacres → 8 each = 40
--   Standard+ (17k+):         Spruitview, Jeffreys Bay, Strand, Walker Drive      → 7 each = 28
--   Standard (< 17k):         Quigney                                             → 6 each =  6
--   Entry:                    Rivonia, Beacon Bay, Gonubie, Grabouw               → 5 each = 20
--   TOTAL: 40 + 28 + 6 + 20 = 94 ✓
--
UPDATE partnership_proposal_venues
SET screens_planned = 8
WHERE venue_id IN (SELECT id FROM venues WHERE name IN ('Sunnyside','Walmer','Linton Grange','Kloof','Greenacres'));

UPDATE partnership_proposal_venues
SET screens_planned = 7
WHERE venue_id IN (SELECT id FROM venues WHERE name IN ('Spruitview','Jeffreys Bay','Strand','Walker Drive'));

UPDATE partnership_proposal_venues
SET screens_planned = 6
WHERE venue_id IN (SELECT id FROM venues WHERE name = 'Quigney');

UPDATE partnership_proposal_venues
SET screens_planned = 5
WHERE venue_id IN (SELECT id FROM venues WHERE name IN ('Rivonia','Beacon Bay','Gonubie','Grabouw'));

-- ── Verification queries (optional — run to confirm) ─────────────────────────
-- SELECT name, rental_fee_monthly FROM venues WHERE rental_fee_monthly > 0 ORDER BY rental_fee_monthly DESC;
-- SELECT SUM(rental_fee_monthly) AS total_monthly_bill FROM venues WHERE rental_fee_monthly > 0;
-- SELECT revenue_split_partner_pct, revenue_split_gymgaze_pct FROM partnership_proposals WHERE title = 'Strategic Media Partnership v1';
-- SELECT v.name, ppv.screens_planned FROM partnership_proposal_venues ppv JOIN venues v ON v.id = ppv.venue_id ORDER BY ppv.screens_planned DESC;
-- SELECT SUM(screens_planned) AS total_screens FROM partnership_proposal_venues ppv JOIN venues v ON v.id = ppv.venue_id;
