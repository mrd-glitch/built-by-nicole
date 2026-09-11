-- Recovered read-only from production migration bbn_meal_options_daily_weights on 2026-09-08. Test fixture only.
-- PDF-style meal plans: hero/story fields + pick-one options
alter table public.meal_plan_versions
  add column if not exists headline text,
  add column if not exists metric_value text,
  add column if not exists metric_label text,
  add column if not exists metric_note text,
  add column if not exists mission_title text,
  add column if not exists mission_body text,
  add column if not exists callout_title text,
  add column if not exists callout_body text,
  add column if not exists closing_note text;

alter table public.meals add column if not exists chip_text text;

create table public.meal_options (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  position int not null default 0,
  text text not null,
  tag text check (tag in ('zero_prep','rough_day')),
  calories numeric, protein numeric, carbs numeric, fats numeric
);
alter table public.meal_options enable row level security;
create policy "admin all meal_options" on public.meal_options for all using (public.is_admin()) with check (public.is_admin());
create policy "client read assigned meal_options" on public.meal_options for select using (
  exists (select 1 from public.meals m join public.meal_plan_assignments a on a.version_id = m.version_id
          where m.id = meal_options.meal_id and a.client_id = auth.uid())
);

alter table public.meal_checkoffs
  add column if not exists option_id uuid references public.meal_options(id) on delete set null;
alter table public.meal_checkoffs drop constraint if exists meal_checkoffs_status_check;
alter table public.meal_checkoffs add constraint meal_checkoffs_status_check check (status in ('ate_as_written','custom','option'));

-- Daily weigh-ins (per-client toggle, optional to submit)
alter table public.profiles add column if not exists daily_weight_enabled boolean not null default false;

create table public.daily_weights (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  weigh_date date not null default current_date,
  weight_lbs numeric not null,
  created_at timestamptz not null default now(),
  unique (client_id, weigh_date)
);
alter table public.daily_weights enable row level security;
create policy "admin all daily_weights" on public.daily_weights for all using (public.is_admin()) with check (public.is_admin());
create policy "client own daily_weights" on public.daily_weights for all using (client_id = auth.uid()) with check (client_id = auth.uid());