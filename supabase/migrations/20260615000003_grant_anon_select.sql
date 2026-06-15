-- Grant SELECT on public-facing tables to the anon and authenticated roles.
-- Supabase applies these automatically for Dashboard-created tables, but not
-- for tables created via SQL migrations. RLS controls row visibility; grants
-- control whether the role can query the table at all.

-- anon: only what the public payment page needs
grant select on table public.collections         to anon;
grant select on table public.collection_members  to anon;
grant select on table public.payments            to anon;

-- authenticated: everything dashboard users need
grant select on table public.collections         to authenticated;
grant select on table public.collection_members  to authenticated;
grant select on table public.payments            to authenticated;
grant select on table public.teams               to authenticated;
grant select on table public.team_members        to authenticated;
grant select on table public.profiles            to authenticated;
grant select on table public.roster_members      to authenticated;

-- authenticated also needs to write
grant insert, update on table public.collections        to authenticated;
grant insert, update on table public.collection_members to authenticated;
grant insert, update on table public.payments           to authenticated;
grant insert        on table public.teams               to authenticated;
grant insert, delete on table public.team_members       to authenticated;
grant update        on table public.profiles            to authenticated;
grant insert, update, delete on table public.roster_members to authenticated;
