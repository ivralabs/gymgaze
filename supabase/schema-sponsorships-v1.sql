-- GymGaze Widget Sponsorships
-- Brands can sponsor system widgets (News, Sports, Weather) across the network or per city
-- One active sponsor per widget type per coverage scope (unique index enforces this)

CREATE TABLE IF NOT EXISTS sponsorships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name        TEXT NOT NULL,
  contact_name      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  widget_type       TEXT NOT NULL CHECK (widget_type IN ('news', 'sports', 'weather', 'bundle')),
  coverage          TEXT NOT NULL DEFAULT 'network' CHECK (coverage IN ('network', 'city')),
  city              TEXT,                                  -- only if coverage = 'city'
  billing_period    TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'weekly')),
  rate              NUMERIC(10,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'draft')),
  start_date        DATE NOT NULL,
  end_date          DATE,                                  -- NULL = open-ended
  logo_url          TEXT,
  brand_colour      TEXT DEFAULT '#FF6B35',
  tagline           TEXT,                                  -- "Brought to you by [Brand]"
  amount_collected  NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only ONE active sponsor per widget type per coverage scope
-- (coverage='city' scoped by city value, coverage='network' global)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sponsorships_active_widget
  ON sponsorships(widget_type, coverage, city)
  WHERE status = 'active';

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_sponsorships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sponsorships_updated_at ON sponsorships;
CREATE TRIGGER trg_sponsorships_updated_at
  BEFORE UPDATE ON sponsorships
  FOR EACH ROW EXECUTE FUNCTION update_sponsorships_updated_at();

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_widget_type ON sponsorships(widget_type);
CREATE INDEX IF NOT EXISTS idx_sponsorships_start_date ON sponsorships(start_date);
