-- =============================================================================
-- Lagkassan — Supabase schema
-- Run this in: Supabase Dashboard > SQL Editor > New query > Run
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Helper: generate a short URL-safe slug ──────────────────────────────────
-- Produces 8-char random strings (a-z, 0-9) for shareable collection URLs.
create or replace function generate_slug(length int default 8)
returns text
language plpgsql
as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i int;
begin
  for i in 1..length loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- One row per auth.users entry. Created automatically via trigger on signup.
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  created_at  timestamptz default now() not null
);

-- Auto-create a profile row whenever a new user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Teams (sports clubs / associations) ─────────────────────────────────────
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz default now() not null
);

-- ─── Team members ─────────────────────────────────────────────────────────────
-- role: owner    = created the team, full control
--       treasurer = can create and manage collections
--       member    = read-only access (future)
create table if not exists team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member'
               check (role in ('owner', 'treasurer', 'member')),
  created_at timestamptz default now() not null,
  unique (team_id, user_id)
);

-- ─── Collections (payment campaigns) ─────────────────────────────────────────
-- amount stored in öre (1/100 SEK) to avoid floating-point errors.
-- 19900 öre = 199 kr. Always display as amount / 100.
create table if not exists collections (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  created_by  uuid not null references auth.users(id),
  title       text not null,
  description text,
  amount      integer not null check (amount > 0),  -- öre
  deadline    date,
  slug        text unique not null default generate_slug(),
  status      text not null default 'active'
                check (status in ('active', 'closed', 'draft')),
  created_at  timestamptz default now() not null
);

-- ─── Collection members ───────────────────────────────────────────────────────
-- People the treasurer expects to pay. Can be imported by the treasurer.
-- These are NOT auth users — they're just names/emails the treasurer tracks.
create table if not exists collection_members (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  name          text not null,
  email         text,
  created_at    timestamptz default now() not null
);

-- ─── Payments ─────────────────────────────────────────────────────────────────
-- One row per payment attempt. Anyone with the URL can create a pending row.
-- payment_method: 'card' (Stripe), 'swish' (Phase 2), 'manual' (treasurer marks paid)
-- stripe_payment_intent_id: null until Stripe is connected (mocked payments use null)
create table if not exists payments (
  id                       uuid primary key default gen_random_uuid(),
  collection_id            uuid not null references collections(id) on delete cascade,
  collection_member_id     uuid references collection_members(id) on delete set null,
  payer_name               text not null,
  payer_email              text,
  amount                   integer not null check (amount > 0),  -- öre
  status                   text not null default 'pending'
                             check (status in ('pending', 'paid', 'failed')),
  payment_method           text not null default 'card'
                             check (payment_method in ('card', 'swish', 'manual')),
  stripe_payment_intent_id text,
  paid_at                  timestamptz,
  created_at               timestamptz default now() not null
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table profiles         enable row level security;
alter table teams            enable row level security;
alter table team_members     enable row level security;
alter table collections      enable row level security;
alter table collection_members enable row level security;
alter table payments         enable row level security;

-- ── profiles ──
-- Users can read and update only their own profile.
create policy "profiles: own read"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on profiles for update
  using (auth.uid() = id);

-- ── teams ──
-- A user can see a team only if they are a member of it.
create policy "teams: member read"
  on teams for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
    )
  );

-- Any authenticated user can create a team.
create policy "teams: authenticated create"
  on teams for insert
  with check (auth.uid() is not null);

-- Only the team owner can update the team.
create policy "teams: owner update"
  on teams for update
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
        and team_members.role = 'owner'
    )
  );

-- ── team_members ──
-- Members can see who else is in their teams.
create policy "team_members: team read"
  on team_members for select
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
    )
  );

-- Team owner can add/remove members.
create policy "team_members: owner insert"
  on team_members for insert
  with check (
    -- allow inserting self (when creating a team, you add yourself as owner)
    user_id = auth.uid()
    or
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.role = 'owner'
    )
  );

create policy "team_members: owner delete"
  on team_members for delete
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.role = 'owner'
    )
  );

-- ── collections ──
-- Team members can read collections belonging to their teams.
create policy "collections: team read"
  on collections for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = collections.team_id
        and team_members.user_id = auth.uid()
    )
  );

-- PUBLIC: anyone can read an active collection by slug (for the payment page).
-- We add a second policy using security definer function to allow anon access.
create policy "collections: public slug read"
  on collections for select
  using (status = 'active');

-- Treasurers and owners can create collections.
create policy "collections: treasurer insert"
  on collections for insert
  with check (
    exists (
      select 1 from team_members
      where team_members.team_id = collections.team_id
        and team_members.user_id = auth.uid()
        and team_members.role in ('owner', 'treasurer')
    )
  );

-- Treasurers and owners can update their team's collections.
create policy "collections: treasurer update"
  on collections for update
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = collections.team_id
        and team_members.user_id = auth.uid()
        and team_members.role in ('owner', 'treasurer')
    )
  );

-- ── collection_members ──
-- Team members can see and manage members of their collections.
create policy "collection_members: team read"
  on collection_members for select
  using (
    exists (
      select 1 from collections c
      join team_members tm on tm.team_id = c.team_id
      where c.id = collection_members.collection_id
        and tm.user_id = auth.uid()
    )
  );

create policy "collection_members: treasurer insert"
  on collection_members for insert
  with check (
    exists (
      select 1 from collections c
      join team_members tm on tm.team_id = c.team_id
      where c.id = collection_members.collection_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'treasurer')
    )
  );

create policy "collection_members: treasurer delete"
  on collection_members for delete
  using (
    exists (
      select 1 from collections c
      join team_members tm on tm.team_id = c.team_id
      where c.id = collection_members.collection_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'treasurer')
    )
  );

-- ── payments ──
-- PUBLIC INSERT: anyone (even unauthenticated) can submit a payment for an active collection.
-- This is the core mechanic — payers don't need an account.
create policy "payments: public insert"
  on payments for insert
  with check (
    exists (
      select 1 from collections
      where collections.id = payments.collection_id
        and collections.status = 'active'
    )
  );

-- Team members can read payments for their collections.
create policy "payments: team read"
  on payments for select
  using (
    exists (
      select 1 from collections c
      join team_members tm on tm.team_id = c.team_id
      where c.id = payments.collection_id
        and tm.user_id = auth.uid()
    )
  );

-- Treasurers can update payment status (e.g., mark as paid manually).
create policy "payments: treasurer update"
  on payments for update
  using (
    exists (
      select 1 from collections c
      join team_members tm on tm.team_id = c.team_id
      where c.id = payments.collection_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'treasurer')
    )
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_team_members_user_id    on team_members(user_id);
create index if not exists idx_team_members_team_id    on team_members(team_id);
create index if not exists idx_collections_team_id     on collections(team_id);
create index if not exists idx_collections_slug        on collections(slug);
create index if not exists idx_collection_members_col  on collection_members(collection_id);
create index if not exists idx_payments_collection_id  on payments(collection_id);
create index if not exists idx_payments_status         on payments(status);

-- =============================================================================
-- Done. Verify with:
--   select table_name from information_schema.tables
--   where table_schema = 'public'
--   order by table_name;
-- Expected: collection_members, collections, payments, profiles, team_members, teams
-- =============================================================================
