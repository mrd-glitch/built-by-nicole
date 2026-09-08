-- Recovered verbatim from production migration 20260828174005 (bbn_programs_workouts).
-- Programs: template -> immutable published version -> days -> blocks -> block_exercises
create table public.programs (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 created_at timestamptz not null default now()
);
create table public.program_versions (
 id uuid primary key default gen_random_uuid(),
 program_id uuid not null references public.programs(id) on delete cascade,
 version int not null,
 published_at timestamptz,
 unique (program_id, version)
);
create table public.program_days (
 id uuid primary key default gen_random_uuid(),
 version_id uuid not null references public.program_versions(id) on delete cascade,
 week int not null,
 day int not null,
 title text not null default 'Full Body',
 position int not null default 0
);
create table public.day_blocks (
 id uuid primary key default gen_random_uuid(),
 day_id uuid not null references public.program_days(id) on delete cascade,
 label text not null,
 rest_note text,
 position int not null default 0
);
create table public.block_exercises (
 id uuid primary key default gen_random_uuid(),
 block_id uuid not null references public.day_blocks(id) on delete cascade,
 exercise_id uuid not null references public.exercises(id),
 exercise_name text not null,
 sets int not null,
 rep_range text not null,
 target_weight_lbs numeric,
 optional boolean not null default false,
 optional_note text,
 position int not null default 0
);
create table public.program_assignments (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.profiles(id) on delete cascade,
 version_id uuid not null references public.program_versions(id),
 start_date date not null default current_date,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create unique index one_active_program_per_client on public.program_assignments (client_id) where active;

create table public.workout_sessions (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.profiles(id) on delete cascade,
 assignment_id uuid not null references public.program_assignments(id) on delete cascade,
 day_id uuid not null references public.program_days(id),
 started_at timestamptz not null default now(),
 finished_at timestamptz
);
create table public.set_entries (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.workout_sessions(id) on delete cascade,
 client_id uuid not null references public.profiles(id) on delete cascade,
 block_exercise_id uuid not null references public.block_exercises(id),
 exercise_id uuid not null references public.exercises(id),
 set_index int not null,
 reps int not null,
 weight_lbs numeric not null,
 unit text not null default 'lbs',
 logged_at timestamptz not null default now(),
 unique (session_id, block_exercise_id, set_index)
);

alter table public.programs enable row level security;
alter table public.program_versions enable row level security;
alter table public.program_days enable row level security;
alter table public.day_blocks enable row level security;
alter table public.block_exercises enable row level security;
alter table public.program_assignments enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_entries enable row level security;

create policy "admin all programs" on public.programs for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all program_versions" on public.program_versions for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all program_days" on public.program_days for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all day_blocks" on public.day_blocks for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all block_exercises" on public.block_exercises for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all program_assignments" on public.program_assignments for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all workout_sessions" on public.workout_sessions for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all set_entries" on public.set_entries for all using (public.is_admin()) with check (public.is_admin());

create policy "client read own assignments" on public.program_assignments for select using (client_id = auth.uid());
create policy "client read assigned versions" on public.program_versions for select using (
 exists (select 1 from public.program_assignments a where a.version_id = id and a.client_id = auth.uid())
);
create policy "client read assigned programs" on public.programs for select using (
 exists (select 1 from public.program_versions v join public.program_assignments a on a.version_id = v.id
 where v.program_id = programs.id and a.client_id = auth.uid())
);
create policy "client read assigned days" on public.program_days for select using (
 exists (select 1 from public.program_assignments a where a.version_id = program_days.version_id and a.client_id = auth.uid())
);
create policy "client read assigned blocks" on public.day_blocks for select using (
 exists (select 1 from public.program_days d join public.program_assignments a on a.version_id = d.version_id
 where d.id = day_blocks.day_id and a.client_id = auth.uid())
);
create policy "client read assigned block_exercises" on public.block_exercises for select using (
 exists (select 1 from public.day_blocks b join public.program_days d on d.id = b.day_id
 join public.program_assignments a on a.version_id = d.version_id
 where b.id = block_exercises.block_id and a.client_id = auth.uid())
);

create or replace function public.is_active_client() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select status = 'active' from public.profiles where id = auth.uid()), false) $$;

create policy "client own sessions" on public.workout_sessions for select using (client_id = auth.uid());
create policy "client insert sessions" on public.workout_sessions for insert with check (client_id = auth.uid() and public.is_active_client());
create policy "client update own sessions" on public.workout_sessions for update using (client_id = auth.uid());
create policy "client own set_entries" on public.set_entries for select using (client_id = auth.uid());
create policy "client insert set_entries" on public.set_entries for insert with check (client_id = auth.uid() and public.is_active_client());
create policy "client update own set_entries" on public.set_entries for update using (client_id = auth.uid());
