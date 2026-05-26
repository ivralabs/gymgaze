-- Add pot-to-credit settings to partnership_proposals
ALTER TABLE partnership_proposals
  ADD COLUMN IF NOT EXISTS pot_to_credit_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pot_to_credit_pct numeric DEFAULT 25
    CHECK (pot_to_credit_pct >= 0 AND pot_to_credit_pct <= 100),
  ADD COLUMN IF NOT EXISTS pot_credit_uses jsonb DEFAULT '["top_up_bonus","cobranded_marketing","extra_dedicated_slot"]'::jsonb;
