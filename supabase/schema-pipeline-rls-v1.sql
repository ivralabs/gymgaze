-- Pipeline RLS policies
-- Run this if RLS is enabled on pipeline_deals and you need row-level access control.
-- NOTE: The API routes use the service role key which bypasses RLS,
-- so this is only needed if you ever query pipeline_deals from the client directly.

-- Enable RLS (safe to run even if already enabled)
alter table pipeline_deals enable row level security;

-- Allow authenticated users to read all deals
create policy if not exists "Authenticated users can read pipeline_deals"
  on pipeline_deals for select
  to authenticated
  using (true);

-- Allow authenticated users to insert deals
create policy if not exists "Authenticated users can insert pipeline_deals"
  on pipeline_deals for insert
  to authenticated
  with check (true);

-- Allow authenticated users to update deals
create policy if not exists "Authenticated users can update pipeline_deals"
  on pipeline_deals for update
  to authenticated
  using (true);
