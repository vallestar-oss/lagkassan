-- =============================================================================
-- Database-level guard against duplicate payments per collection member.
--
-- The app has a pre-check (read member.status before inserting), but that races:
-- two concurrent payers/treasurer clicks can both pass the check and insert two
-- 'paid' rows for the same member. This partial unique index makes the database
-- the real guard — the second 'paid' insert fails with a unique violation
-- (SQLSTATE 23505), which the server actions translate into a friendly
-- "redan betalat" message instead of a 500.
--
-- Scope: only 'paid' rows, only when collection_member_id is set. Free-form
-- payments (collection_member_id is null) and 'pending'/'failed' rows are
-- unaffected — a member may have many pending attempts but at most one paid.
-- =============================================================================

-- ─── Step 1: deduplicate existing 'paid' rows ────────────────────────────────
-- A partial unique index cannot be created while duplicates exist. Keep the
-- earliest 'paid' payment per member (the first real payment) and remove the
-- surplus duplicates that predate this guard.
delete from payments p
using (
  select id,
         row_number() over (
           partition by collection_member_id
           order by created_at asc, id asc
         ) as rn
  from payments
  where status = 'paid'
    and collection_member_id is not null
) d
where p.id = d.id
  and d.rn > 1;

-- ─── Step 2: enforce at most one paid payment per member ─────────────────────
create unique index if not exists idx_one_paid_per_member
  on payments (collection_member_id)
  where status = 'paid' and collection_member_id is not null;

-- =============================================================================
-- Verify after applying:
--   -- the index exists and is partial:
--   select indexname, indexdef from pg_indexes
--   where tablename = 'payments' and indexname = 'idx_one_paid_per_member';
--
--   -- no member has more than one paid row:
--   select collection_member_id, count(*)
--   from payments
--   where status = 'paid' and collection_member_id is not null
--   group by collection_member_id having count(*) > 1;
--   -- expect: 0 rows
-- =============================================================================
