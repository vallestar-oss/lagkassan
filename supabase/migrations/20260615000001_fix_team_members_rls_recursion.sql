-- =============================================================================
-- Fix: infinite recursion in team_members RLS policies
--
-- Root cause: the SELECT, INSERT, and DELETE policies on team_members all
-- contain subqueries that read from team_members, which triggers the same
-- policies again → infinite recursion.
--
-- Fix: a SECURITY DEFINER function reads team_members without activating
-- RLS, breaking the cycle. All affected policies are rebuilt to call it.
-- =============================================================================

-- ─── Helper: membership check (bypasses RLS) ─────────────────────────────────
-- p_team_id : the team to check
-- p_roles   : optional allowlist of roles; null means any role is accepted
create or replace function public.is_team_member(
  p_team_id uuid,
  p_roles    text[] default null
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from team_members
    where team_id = p_team_id
      and user_id = auth.uid()
      and (p_roles is null or role = any(p_roles))
  );
$$;

-- ─── Rebuild team_members policies ───────────────────────────────────────────
drop policy if exists "team_members: team read"   on team_members;
drop policy if exists "team_members: owner insert" on team_members;
drop policy if exists "team_members: owner delete" on team_members;

-- Members can see all rows for their own teams.
create policy "team_members: team read"
  on team_members for select
  using (is_team_member(team_id));

-- Allow inserting self (first row when creating a team) OR if already an owner.
create policy "team_members: owner insert"
  on team_members for insert
  with check (
    user_id = auth.uid()
    or is_team_member(team_id, array['owner'])
  );

create policy "team_members: owner delete"
  on team_members for delete
  using (is_team_member(team_id, array['owner']));

-- ─── Rebuild teams policies ───────────────────────────────────────────────────
-- These also query team_members. Once team_members has RLS active,
-- the subquery inside a teams policy would re-enter the team_members policies.
-- Using the same SECURITY DEFINER function avoids that secondary recursion.
drop policy if exists "teams: member read"  on teams;
drop policy if exists "teams: owner update" on teams;

create policy "teams: member read"
  on teams for select
  using (is_team_member(id));

create policy "teams: owner update"
  on teams for update
  using (is_team_member(id, array['owner']));

-- =============================================================================
-- Verify: run after applying
--   select schemaname, tablename, policyname, cmd
--   from pg_policies
--   where tablename in ('teams', 'team_members')
--   order by tablename, policyname;
-- =============================================================================
