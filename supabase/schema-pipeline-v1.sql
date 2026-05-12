-- Pipeline v1 migration
-- Run this in Supabase SQL editor or via migration tooling

-- Add created_by to campaigns if not present
alter table campaigns add column if not exists created_by uuid references profiles(id) on delete set null;

-- Pipeline deals table
create table if not exists pipeline_deals (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id) on delete set null,
  client_name text not null,
  client_type text check (client_type in ('agency', 'direct')) default 'direct',
  contact_name text,
  contact_email text,
  contact_phone text,
  estimated_value numeric(12,2),
  stage text not null default 'prospect' check (stage in ('prospect', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost')),
  notes text,
  expected_close_date date,
  campaign_id uuid references campaigns(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists pipeline_deals_stage_idx on pipeline_deals(stage);
create index if not exists pipeline_deals_created_by_idx on pipeline_deals(created_by);
