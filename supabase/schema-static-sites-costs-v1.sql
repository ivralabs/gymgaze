ALTER TABLE static_sites
  ADD COLUMN IF NOT EXISTS production_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS flighting_fee numeric(10,2);
