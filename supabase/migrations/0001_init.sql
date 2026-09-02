-- Playbook storage.
--
-- Two tables. The domain objects go in as JSONB exactly as the app defines
-- them, so the shape of a Project can change without a migration. Postgres
-- owns identity, ownership, and access; the app owns the shape.
--
-- Every row belongs to exactly one user, and row-level security is what
-- enforces that - not application code.

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  -- Project ids are derived from the goal, so two users can independently
  -- arrive at the same one. Ownership is part of the key.
  id         text        not null,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists projects_user_updated_idx
  on public.projects (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- You can only ever see or touch your own rows. There is no policy that would
-- let one account read another's, so a bug in the app cannot leak data.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own projects" on public.projects;
create policy "own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
