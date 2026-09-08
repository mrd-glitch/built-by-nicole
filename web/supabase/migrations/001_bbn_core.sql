-- Recovered verbatim from production migration 20260828173807 (bbn_core_schema).
-- Built by Nicole: core schema (PLAN.md canonical table list)

-- Roles: locked table, service-role writes only
create table public.user_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('admin','client')),
 created_at timestamptz not null default now()
);
alter table public.user_roles enable row level security;

create or replace function public.get_role() returns text
language sql stable security definer set search_path = public as
$$ select role from public.user_roles where user_id = auth.uid() $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select role from public.user_roles where user_id = auth.uid()) = 'admin', false) $$;

create policy "read own role" on public.user_roles for select using (user_id = auth.uid() or public.is_admin());

-- Profiles
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 first_name text not null default '',
 email text not null default '',
 timezone text not null default 'America/Edmonton',
 status text not null default 'active' check (status in ('active','paused','archived')),
 show_macros boolean not null default false,
 show_calories boolean not null default false,
 food_journal_enabled boolean not null default false,
 start_weight_lbs numeric,
 goal_weight_lbs numeric,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "admin write profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
-- clients may update display fields only, enforced by trigger below
create policy "client update own display" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
 if not public.is_admin() then
 new.status := old.status;
 new.show_macros := old.show_macros;
 new.show_calories := old.show_calories;
 new.food_journal_enabled := old.food_journal_enabled;
 new.email := old.email;
 new.start_weight_lbs := old.start_weight_lbs;
 new.goal_weight_lbs := old.goal_weight_lbs;
 end if;
 return new;
end $$;
create trigger protect_profile_fields before update on public.profiles
for each row execute function public.protect_profile_fields();

-- Applications (public intake)
create table public.applications (
 id uuid primary key default gen_random_uuid(),
 email text not null,
 answers jsonb not null,
 snapshot jsonb,
 status text not null default 'new' check (status in ('new','approved','declined')),
 invited_user_id uuid references auth.users(id),
 created_at timestamptz not null default now(),
 decided_at timestamptz
);
create unique index applications_email_new_uidx on public.applications (lower(email)) where status = 'new';
alter table public.applications enable row level security;
create policy "admin all applications" on public.applications for all using (public.is_admin()) with check (public.is_admin());

-- Exercise library
create table public.exercises (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 youtube_url text,
 cue text,
 image_path text,
 archived boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.exercises enable row level security;
create policy "clients read exercises" on public.exercises for select using (auth.uid() is not null);
create policy "admin write exercises" on public.exercises for all using (public.is_admin()) with check (public.is_admin());
