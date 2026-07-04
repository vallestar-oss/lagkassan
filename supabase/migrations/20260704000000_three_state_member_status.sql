-- =============================================================================
-- Three-state member payment status: unpaid | reported_paid | confirmed_paid
--
-- Today collection_members.status is 'pending' | 'paid', and 'paid' is set the
-- moment ANYONE (the member via the public link, or the treasurer manually)
-- writes a 'paid' payment row. That conflates two very different facts:
--   - a member self-reporting "I paid via Swish/bank" (unverified by Lagkassan)
--   - the treasurer confirming they actually saw the money land
--
-- This migration:
--   1. Renames the states: 'pending' -> 'unpaid', 'paid' -> either
--      'reported_paid' or 'confirmed_paid', backfilled from payment_method
--      (manual = treasurer recorded it directly = confirmed; card/swish =
--      member self-reported = reported, needs confirmation).
--   2. Updates the sync trigger so future payment inserts follow the same
--      rule instead of collapsing everything to 'paid'.
--   3. Adds an UPDATE policy so owner/treasurer can confirm/revert a status
--      directly on collection_members (previously no UPDATE policy existed;
--      all writes went through the payments trigger).
-- =============================================================================

-- ─── Step 1: drop the old check constraint so backfill can write new values ──
alter table collection_members
  drop constraint if exists collection_members_status_check;

-- ─── Step 2: backfill existing rows ──────────────────────────────────────────
-- 'paid' rows backed by a manual (treasurer-recorded) payment become
-- confirmed; everything else that was 'paid' was a self-report, unconfirmed.
update collection_members cm
set status = 'confirmed_paid'
where cm.status = 'paid'
  and exists (
    select 1 from payments p
    where p.collection_member_id = cm.id
      and p.status = 'paid'
      and p.payment_method = 'manual'
  );

update collection_members cm
set status = 'reported_paid'
where cm.status = 'paid';

update collection_members
set status = 'unpaid'
where status = 'pending';

-- ─── Step 3: new check constraint + default ──────────────────────────────────
alter table collection_members
  alter column status set default 'unpaid';

alter table collection_members
  add constraint collection_members_status_check
    check (status in ('unpaid', 'reported_paid', 'confirmed_paid'));

-- ─── Step 4: update the payments -> collection_members sync trigger ─────────
-- A 'paid' payment inserted with payment_method='manual' means the treasurer
-- recorded it themselves (e.g. cash) — treat as confirmed immediately.
-- Any other 'paid' payment (card/swish, the public self-report flow) only
-- moves the member to 'reported_paid' — it still requires treasurer
-- confirmation. Non-'paid' payment writes never downgrade an already
-- confirmed member.
create or replace function sync_collection_member_paid()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.collection_member_id is not null then
    update collection_members
      set status = case
        when new.status = 'paid' and new.payment_method = 'manual' then 'confirmed_paid'
        when new.status = 'paid' then 'reported_paid'
        when status = 'confirmed_paid' then 'confirmed_paid'
        else 'unpaid'
      end
      where id = new.collection_member_id;
  end if;
  return new;
end;
$$;

-- ─── Step 5: allow owner/treasurer to confirm/revert a member's status ──────
-- Mirrors the existing "treasurer insert"/"treasurer delete" policies on this
-- table. Needed so confirmMemberPayment/revertMemberPayment can UPDATE
-- collection_members directly instead of going through the payments trigger.
drop policy if exists "collection_members: treasurer update" on collection_members;
create policy "collection_members: treasurer update"
  on collection_members for update
  using (
    exists (
      select 1 from collections c
      join team_members tm on tm.team_id = c.team_id
      where c.id = collection_members.collection_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'treasurer')
    )
  );

-- =============================================================================
-- Verify after applying:
--   select status, count(*) from collection_members group by status;
--   -- expect only: unpaid, reported_paid, confirmed_paid
--
--   select policyname, cmd from pg_policies
--   where tablename = 'collection_members' order by policyname;
--   -- expect an update policy "collection_members: treasurer update" alongside
--   -- the existing team read / treasurer insert / treasurer delete policies
-- =============================================================================
