-- =============================================================================
-- Payment status timestamps on collection_members
--
-- Adds three columns so organizers can see when a member reported payment and
-- when the organizer confirmed it:
--   reported_at  — set by the trigger when status → reported_paid
--   confirmed_at — set by the trigger (manual) or by confirmMemberPayment
--   confirmed_by — uuid of the organizer who confirmed; set in server actions
--
-- The trigger is updated to fill reported_at / confirmed_at automatically so
-- the anonymous public flow (submitMockPayment) gets reported_at without
-- needing UPDATE rights on collection_members.
--
-- confirmed_by is intentionally NOT set in the trigger because SECURITY
-- DEFINER context makes auth.uid() unreliable for the caller's identity;
-- server actions (confirmMemberPayment, markMemberPaid) set it explicitly.
-- =============================================================================

-- ─── Step 1: add new columns ──────────────────────────────────────────────
alter table collection_members
  add column if not exists reported_at  timestamptz null,
  add column if not exists confirmed_at timestamptz null,
  add column if not exists confirmed_by uuid         null;

-- ─── Step 2: rewrite the sync trigger to carry timestamps ─────────────────
create or replace function sync_collection_member_paid()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.collection_member_id is not null then
    update collection_members
      set
        status = case
          when new.status = 'paid' and new.payment_method = 'manual' then 'confirmed_paid'
          when new.status = 'paid'                                    then 'reported_paid'
          when status = 'confirmed_paid'                              then 'confirmed_paid'
          else 'unpaid'
        end,
        -- Set reported_at the first time a member self-reports (card/swish).
        -- Do not overwrite if already set (idempotent re-runs).
        reported_at = case
          when new.status = 'paid' and new.payment_method != 'manual'
            then coalesce(reported_at, now())
          else reported_at
        end,
        -- Set confirmed_at when the treasurer records manually (manual method).
        -- confirmMemberPayment (direct update) sets this via the server action.
        confirmed_at = case
          when new.status = 'paid' and new.payment_method = 'manual'
            then coalesce(confirmed_at, now())
          else confirmed_at
        end
      where id = new.collection_member_id;
  end if;
  return new;
end;
$$;

-- =============================================================================
-- Verify after applying:
--   \d collection_members
--   -- expect columns: reported_at, confirmed_at, confirmed_by
--
--   select id, status, reported_at, confirmed_at, confirmed_by
--   from collection_members limit 5;
--   -- existing rows will have null timestamps (no backfill needed — they
--   -- predate the feature and organizers will see the badge without a date)
-- =============================================================================
