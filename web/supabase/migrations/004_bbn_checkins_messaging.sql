-- Built by Nicole: check-ins, food journal, messaging, notifications, outbox + RLS
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  iso_week text not null,
  dry_weight_lbs numeric not null,
  meal_rating int not null check (meal_rating between 1 and 5),
  meal_note text not null default '',
  fitness_rating int not null check (fitness_rating between 1 and 5),
  fitness_note text not null default '',
  comments text not null default '',
  proud text,
  excited text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (client_id, iso_week)
);
create table public.checkin_photos (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  pose text not null check (pose in ('front','side','back')),
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (checkin_id, pose)
);
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  meal_label text not null default '',
  note text not null default '',
  storage_path text,
  created_at timestamptz not null default now()
);
create table public.daily_ratings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  rating_date date not null default current_date,
  rating int not null check (rating between 1 and 5),
  unique (client_id, rating_date)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null default '',
  created_at timestamptz not null default now(),
  read_by_admin boolean not null default false,
  read_by_client boolean not null default false
);
create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('checkin','message','application')),
  client_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
create table public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.checkins enable row level security;
alter table public.checkin_photos enable row level security;
alter table public.food_logs enable row level security;
alter table public.daily_ratings enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.outbox_events enable row level security;

create policy "admin all checkins" on public.checkins for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all checkin_photos" on public.checkin_photos for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all food_logs" on public.food_logs for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all daily_ratings" on public.daily_ratings for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all messages" on public.messages for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all message_attachments" on public.message_attachments for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all notifications" on public.notifications for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all outbox" on public.outbox_events for all using (public.is_admin()) with check (public.is_admin());

create policy "client own checkins read" on public.checkins for select using (client_id = auth.uid());
create policy "client insert checkins" on public.checkins for insert with check (client_id = auth.uid() and public.is_active_client());
create policy "client update own checkins" on public.checkins for update using (client_id = auth.uid());
create policy "client own checkin_photos" on public.checkin_photos for select using (client_id = auth.uid());
create policy "client insert checkin_photos" on public.checkin_photos for insert with check (client_id = auth.uid() and public.is_active_client());
create policy "client own food_logs" on public.food_logs for select using (client_id = auth.uid());
create policy "client insert food_logs" on public.food_logs for insert with check (client_id = auth.uid() and public.is_active_client());
create policy "client delete own food_logs" on public.food_logs for delete using (client_id = auth.uid());
create policy "client own daily_ratings" on public.daily_ratings for all using (client_id = auth.uid()) with check (client_id = auth.uid());
create policy "client own messages read" on public.messages for select using (client_id = auth.uid());
create policy "client send messages" on public.messages for insert with check (client_id = auth.uid() and sender_id = auth.uid() and public.is_active_client());
create policy "client own attachments" on public.message_attachments for select using (client_id = auth.uid());
create policy "client add attachments" on public.message_attachments for insert with check (client_id = auth.uid());
