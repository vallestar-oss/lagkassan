-- =============================================================================
-- Roster members + collection_member paid-status
--
-- Adds:
--   1. roster_members  — a team-level list of people the treasurer tracks
--                        (players/parents). NOT Lagkassan accounts.
--   2. collection_members.status — 'pending' | 'paid', so each collection
--                        carries its own snapshot of who has paid.
--   3. A public SELECT policy on collection_members (active collections only)
--      so the payment page can show the name list + status to anon visitors.
--   4. A SECURITY DEFINER trigger that keeps collection_members.status in sync
--      with linked payments — so anonymous payers never need UPDATE rights on
--      collection_members (they only INSERT a payment, as today).
--
-- RLS note: every team-scoped policy reuses is_team_member() (SECURITY DEFINER)
-- so no policy ever queries the table it protects. This is the same pattern
-- that fixed the earlier "infinite recursion" bug — do not inline a
-- `select ... from team_members` into these policies.
-- =============================================================================

-- ─── roster_members ──────────────────────────────────────────────────────────
create table if not exists roster_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  name       text not null,
  phone      text,
  created_at timestamptz default now() not null
);

alter table roster_members enable row level security;

-- Any team member can read their team's roster.
drop policy if exists "roster_members: team read" on roster_members;
create policy "roster_members: team read"
  on roster_members for select
  using (is_team_member(team_id));

-- Owners and treasurers can add / edit / remove roster members.
drop policy if exists "roster_members: manage insert" on roster_members;
create policy "roster_members: manage insert"
  on roster_members for insert
  with check (is_team_member(team_id, array['owner', 'treasurer']));

drop policy if exists "roster_members: manage update" on roster_members;
create policy "roster_members: manage update"
  on roster_members for update
  using (is_team_member(team_id, array['owner', 'treasurer']));

drop policy if exists "roster_members: manage delete" on roster_members;
create policy "roster_members: manage delete"
  on roster_members for delete
  using (is_team_member(team_id, array['owner', 'treasurer']));

create index if not exists idx_roster_members_team_id on roster_members(team_id);

-- ─── collection_members.status ────────────────────────────────────────────────
alter table collection_members
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'paid'));

create index if not exists idx_collection_members_status on collection_members(status);

-- PUBLIC: anyone with the link can read the expected-payer list (name + status)
-- of an active collection. Email stays null in this flow, so no email is exposed.
-- The subquery hits `collections` (which has its own public-active read policy),
-- never collection_members itself → no recursion.
drop policy if exists "collection_members: public active read" on collection_members;
create policy "collection_members: public active read"
  on collection_members for select
  using (
    exists (
      select 1 from collections
      where collections.id = collection_members.collection_id
        and collections.status = 'active'
    )
  );

-- ─── Keep collection_members.status in sync with payments ─────────────────────
-- Runs as the function owner (SECURITY DEFINER), so it updates the member row
-- regardless of who triggered the payment — anonymous payers need no UPDATE
-- policy on collection_members. Fires on the mock "pay" insert and on the
-- treasurer's manual "mark paid" update.
create or replace function sync_collection_member_paid()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.collection_member_id is not null then
    update collection_members
      set status = case when new.status = 'paid' then 'paid' else 'pending' end
      where id = new.collection_member_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_payment_sync_member on payments;
create trigger on_payment_sync_member
  after insert or update of status on payments
  for each row execute function sync_collection_member_paid();

-- =============================================================================
-- Verify after applying:
--   select tablename, policyname, cmd from pg_policies
--   where tablename in ('roster_members', 'collection_members')
--   order by tablename, policyname;
--
--   select column_name from information_schema.columns
--   where table_name = 'collection_members' order by column_name;
--   -- expect: collection_id, created_at, email, id, name, status
-- =============================================================================
