-- =============================================================================
-- SECURITY: lock down anonymous access (fixes pre-pilot audit findings P0 #1–#3)
--
-- Problem found in the pre-pilot QA:
--   #1  The `collections: public slug read` policy (using status = 'active')
--       let the anon role read EVERY active collection — titles, amounts, and
--       payment_instructions (real Swish numbers) — without knowing any slug.
--       RLS cannot require "knows the slug" because the slug filter is applied
--       by the client AFTER the policy; a query with no slug filter returns all
--       rows. Verified live: a single anon REST call dumped every association's
--       Swish number.
--   #2  Same class of leak on `collection_members` — every participant name
--       across all associations was enumerable by the anon role.
--   #3  The `payments: public insert` policy only checked "collection active",
--       not the payment_method/status. A direct REST insert as anon (or any
--       logged-in user) with payment_method='manual', status='paid' makes the
--       sync trigger flip a member straight to 'confirmed_paid' — forging a
--       treasurer confirmation for someone who never paid.
--
-- Fix (this migration):
--   • Revoke ALL direct table privileges from the anon role. The public payment
--     page no longer touches tables directly.
--   • Expose exactly two SECURITY DEFINER functions, each scoped to a single
--     collection the caller must name (by slug / id). These are the only anon
--     read surface, so enumeration is impossible.
--   • Replace the broad payments insert policy with a treasurer-only policy for
--     the authenticated role. The public self-report write path now goes through
--     the submitMockPayment server action using the service-role client (which
--     already validates: collection active, member belongs to collection,
--     member unpaid), so anon needs no insert privilege at all.
--
-- Net effect: anon can read one collection + its members by slug, and can write
-- nothing directly. Treasurer writes stay authenticated + role-checked. This is
-- also the shape the planned Stripe migration wants (see docs/stripe-plan.md):
-- the only privileged writer is server-side.
-- =============================================================================

-- ─── Public read surface: two definer functions, scoped by slug / id ─────────
-- Runs as the function owner, so it bypasses RLS and can also join teams (which
-- anon cannot read) to return the association name in one round-trip.
create or replace function get_public_collection(p_slug text)
returns table (
  id                   uuid,
  team_id              uuid,
  title                text,
  description          text,
  amount               integer,
  deadline             date,
  payment_instructions text,
  group_label          text,
  team_name            text,
  paid_count           bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    c.id, c.team_id, c.title, c.description, c.amount, c.deadline,
    c.payment_instructions, c.group_label,
    t.name as team_name,
    (select count(*) from payments p
      where p.collection_id = c.id and p.status = 'paid') as paid_count
  from collections c
  join teams t on t.id = c.team_id
  where c.slug = p_slug
    and c.status = 'active';
$$;

-- Roster (name + status) for one active collection. No email is returned — the
-- public flow never needs it, and it must never leak.
create or replace function get_public_collection_members(p_collection_id uuid)
returns table (
  id     uuid,
  name   text,
  status text
)
language sql
security definer
stable
set search_path = public
as $$
  select cm.id, cm.name, cm.status
  from collection_members cm
  join collections c on c.id = cm.collection_id
  where cm.collection_id = p_collection_id
    and c.status = 'active'
  order by cm.name asc;
$$;

-- ─── Revoke every direct table privilege from anon ───────────────────────────
-- REVOKE is a no-op if the grant was never present, so this is safe to run
-- regardless of the project's exact prior grant state.
revoke all on table public.collections        from anon;
revoke all on table public.collection_members from anon;
revoke all on table public.payments           from anon;
revoke all on table public.teams              from anon;
revoke all on table public.profiles           from anon;
revoke all on table public.roster_members     from anon;

-- ─── Drop the over-broad public read policies (anon uses the functions now) ──
drop policy if exists "collections: public slug read"        on collections;
drop policy if exists "collection_members: public active read" on collection_members;

-- ─── Grant execute on the scoped read functions ──────────────────────────────
grant execute on function get_public_collection(text)          to anon, authenticated;
grant execute on function get_public_collection_members(uuid)  to anon, authenticated;

-- ─── Replace the payments insert policy: treasurer-only, authenticated ───────
-- The old policy allowed any anon/authenticated caller to insert a 'paid' row
-- (incl. payment_method='manual') for any active collection. Public self-report
-- writes now go through the server action + service-role client, so the only
-- RLS-governed inserts left are treasurer server actions (markMemberPaid),
-- which run as the authenticated treasurer. Uses is_team_member() (SECURITY
-- DEFINER) to avoid re-entering team_members RLS.
drop policy if exists "payments: public insert" on payments;
create policy "payments: treasurer insert"
  on payments for insert to authenticated
  with check (
    exists (
      select 1 from collections c
      where c.id = payments.collection_id
        and c.status = 'active'
        and is_team_member(c.team_id, array['owner', 'treasurer'])
    )
  );

-- =============================================================================
-- Verify after applying:
--   -- anon can no longer enumerate collections (expect: permission denied):
--   --   curl "$URL/rest/v1/collections?select=*" -H "apikey: $ANON" ...
--   -- anon CAN fetch one by slug via the function (expect: one row):
--   --   curl -X POST "$URL/rest/v1/rpc/get_public_collection" \
--   --     -H "apikey: $ANON" -H "Content-Type: application/json" \
--   --     -d '{"p_slug":"<a real slug>"}'
--   select proname, prosecdef from pg_proc
--   where proname in ('get_public_collection','get_public_collection_members');
--   -- expect prosecdef = true for both
--   select policyname, cmd, roles from pg_policies where tablename = 'payments';
--   -- expect: "payments: treasurer insert" (authenticated), team read, treasurer update
-- =============================================================================
