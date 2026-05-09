-- Media Kit Settings (single-row config)
CREATE TABLE IF NOT EXISTS media_kit_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  tagline       TEXT DEFAULT 'Reach South Africa''s most engaged gym audience.',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Media Kit Enquiries (inbound from /advertise)
CREATE TABLE IF NOT EXISTS media_kit_enquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  company      TEXT,
  email        TEXT NOT NULL,
  phone        TEXT,
  interest     TEXT,        -- 'ad_slots' | 'sponsorship' | 'both'
  budget_range TEXT,
  message      TEXT,
  status       TEXT NOT NULL DEFAULT 'new', -- 'new' | 'contacted' | 'converted' | 'closed'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
