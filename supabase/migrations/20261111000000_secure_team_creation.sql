-- =============================================================================
-- Secure team creation: close the "join any team as owner" hole
--
-- Problem: the team_members INSERT policy allowed `user_id = auth.uid()` for
-- ANY team and ANY role. It was meant for "add yourself as owner of the team
-- you just created", but any signed-in user (including an anonymous guest)
-- could insert themselves as 'owner' of someone else's team. The team id was
-- obtainable by anyone holding a payment link, because get_public_collection
-- returned team_id.
--
-- This migration:
--   1. Adds create_team(): creates the team and its owner row in ONE
--      transaction (also fixes the non-atomic two-insert flow in createTeam).
--   2. Restricts team_members inserts to existing owners of that team.
--   3. Drops the direct "any authenticated user can insert a team" policy —
--      all team creation now goes through create_team().
--   4. Stops returning team_id from the public get_public_collection().
--
-- Safe to run on a live project: the app falls back to the old flow only
-- while create_team() does not exist yet.
-- =============================================================================

-- ─── 1. Atomic team creation ─────────────────────────────────────────────────
create or replace function public.create_team(
  p_name        text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_team_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'team name is required' using errcode = '22023';
  end if;

  insert into teams (name, description)
  values (btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''))
  returning id into v_team_id;

  insert into team_members (team_id, user_id, role)
  values (v_team_id, v_user_id, 'owner');

  return v_team_id;
end;
$$;

revoke all on function public.create_team(text, text) from public, anon;
grant execute on function public.create_team(text, text) to authenticated;

-- ─── 2. Only existing owners may add team members ────────────────────────────
drop policy if exists "team_members: owner insert" on team_members;
create policy "team_members: owner insert"
  on team_members for insert
  with check (is_team_member(team_id, array['owner']));

-- ─── 3. No direct team inserts — use create_team() ───────────────────────────
drop policy if exists "teams: authenticated create" on teams;

-- ─── 4. Public collection lookup without team_id ─────────────────────────────
-- The return type changes, so the function must be dropped and recreated.
drop function if exists public.get_public_collection(text);

create function public.get_public_collection(p_slug text)
returns table (
  id                   uuid,
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
    c.id, c.title, c.description, c.amount, c.deadline,
    c.payment_instructions, c.group_label,
    t.name as team_name,
    (select count(*) from payments p
      where p.collection_id = c.id and p.status = 'paid') as paid_count
  from collections c
  join teams t on t.id = c.team_id
  where c.slug = p_slug
    and c.status = 'active';
$$;

grant execute on function public.get_public_collection(text) to anon, authenticated;

-- =============================================================================
-- Verify after applying:
--   select policyname, cmd, with_check from pg_policies
--   where tablename in ('teams', 'team_members') order by tablename, policyname;
--   -- expect: no "teams: authenticated create"; "team_members: owner insert"
--   -- checks is_team_member(team_id, ARRAY['owner'])
--
--   select proname from pg_proc where proname in ('create_team', 'get_public_collection');
-- =============================================================================
