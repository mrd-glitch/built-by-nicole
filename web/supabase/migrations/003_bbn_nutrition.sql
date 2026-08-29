-- Built by Nicole: meal plans (versioned) + assignments + RLS
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table public.meal_plan_versions (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  version int not null,
  intro text,
  published_at timestamptz,
  pdf_path text,
  pdf_name text,
  unique (meal_plan_id, version)
);
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.meal_plan_versions(id) on delete cascade,
  name text not null,
  note text,
  position int not null default 0
);
create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  portion text not null default '',
  protein numeric, carbs numeric, fats numeric, calories numeric,
  position int not null default 0
);
create table public.meal_plan_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  version_id uuid not null references public.meal_plan_versions(id),
  effective_from date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index one_active_mealplan_per_client on public.meal_plan_assignments (client_id) where active;

alter table public.meal_plans enable row level security;
alter table public.meal_plan_versions enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.meal_plan_assignments enable row level security;

create policy "admin all meal_plans" on public.meal_plans for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all meal_plan_versions" on public.meal_plan_versions for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all meals" on public.meals for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all meal_items" on public.meal_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all meal_plan_assignments" on public.meal_plan_assignments for all using (public.is_admin()) with check (public.is_admin());

create policy "client read own mp assignment" on public.meal_plan_assignments for select using (client_id = auth.uid());
create policy "client read assigned mp versions" on public.meal_plan_versions for select using (
  exists (select 1 from public.meal_plan_assignments a where a.version_id = id and a.client_id = auth.uid())
);
create policy "client read assigned meal_plans" on public.meal_plans for select using (
  exists (select 1 from public.meal_plan_versions v join public.meal_plan_assignments a on a.version_id = v.id
          where v.meal_plan_id = meal_plans.id and a.client_id = auth.uid())
);
create policy "client read assigned meals" on public.meals for select using (
  exists (select 1 from public.meal_plan_assignments a where a.version_id = meals.version_id and a.client_id = auth.uid())
);
create policy "client read assigned meal_items" on public.meal_items for select using (
  exists (select 1 from public.meals m join public.meal_plan_assignments a on a.version_id = m.version_id
          where m.id = meal_items.meal_id and a.client_id = auth.uid())
);
