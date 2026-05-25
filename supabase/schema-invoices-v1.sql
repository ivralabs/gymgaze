-- GymGaze Invoicing System — v1
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,          -- e.g. GG-2026-001
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  advertiser text NOT NULL,
  advertiser_email text,
  line_items jsonb NOT NULL DEFAULT '[]',       -- [{description, qty, unit_price, total}]
  subtotal_zar integer NOT NULL DEFAULT 0,
  tax_zar integer NOT NULL DEFAULT 0,           -- 15% VAT
  total_zar integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  paid_date date,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role all invoices"
  ON invoices FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated read invoices"
  ON invoices FOR SELECT
  USING (auth.role() = 'authenticated');
