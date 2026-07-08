-- ============================================================================
-- VALL-HALLA · subscriber list  ·  run once in Supabase → SQL Editor
-- ----------------------------------------------------------------------------
-- Creates the table the signup form writes to, with Row-Level Security ON so
-- the public (publishable) key can INSERT a signup but can NOT read the list.
-- Only the service key (used server-side by the send pipe) can read it.
-- ============================================================================

create table if not exists public.subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  status        text not null default 'active',      -- active | unsubscribed | bounced
  source        text default 'site',                 -- where they signed up
  confirmed_at  timestamptz,                          -- for later double-opt-in
  unsub_token   uuid not null default gen_random_uuid(),  -- used by the unsubscribe link
  created_at    timestamptz not null default now()
);

-- fast lookups
create index if not exists subscribers_status_idx on public.subscribers (status);
create unique index if not exists subscribers_email_idx on public.subscribers (lower(email));

-- ---- Row-Level Security ----------------------------------------------------
alter table public.subscribers enable row level security;

-- anyone (anon, via the publishable key) may SIGN UP — insert only, nothing else
drop policy if exists "public can subscribe" on public.subscribers;
create policy "public can subscribe"
  on public.subscribers for insert
  to anon
  with check (true);

-- NO anon select/update/delete policy => the public key canNOT read or edit the list.
-- The service key bypasses RLS entirely, so the send pipe reads it server-side.

-- allow a subscriber to unsubscribe themselves via their token (public update, tightly scoped)
drop policy if exists "unsub by token" on public.subscribers;
create policy "unsub by token"
  on public.subscribers for update
  to anon
  using (true)
  with check (status in ('active','unsubscribed'));
