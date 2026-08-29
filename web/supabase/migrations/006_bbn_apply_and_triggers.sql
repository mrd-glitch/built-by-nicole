-- Public intake inserts (server route also validates + rate limits) and
-- notification triggers.

-- Anonymous application submission: insert only, never read back.
create policy "public submit application" on public.applications
  for insert to anon, authenticated
  with check (status = 'new' and invited_user_id is null and decided_at is null);

-- Notify Nicole on new application
create or replace function public.notify_new_application() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (kind, title, body)
  values ('application', 'New application', coalesce(new.answers->>'firstName','Someone') || ' ' || coalesce(new.answers->>'lastName','') || ' applied');
  insert into public.outbox_events (event_key, kind, payload)
  values ('application-' || new.id, 'application_received', jsonb_build_object('application_id', new.id, 'email', new.email))
  on conflict (event_key) do nothing;
  return new;
end $$;
create trigger notify_new_application after insert on public.applications
for each row execute function public.notify_new_application();

-- Notify on new check-in
create or replace function public.notify_new_checkin() returns trigger
language plpgsql security definer set search_path = public as $$
declare cname text;
begin
  select full_name into cname from public.profiles where id = new.client_id;
  insert into public.notifications (kind, client_id, title, body)
  values ('checkin', new.client_id, 'Weekly check-in submitted', coalesce(cname,'A client') || ' checked in at ' || new.dry_weight_lbs || ' lbs');
  insert into public.outbox_events (event_key, kind, payload)
  values ('checkin-' || new.id, 'checkin_received', jsonb_build_object('checkin_id', new.id, 'client_id', new.client_id))
  on conflict (event_key) do nothing;
  return new;
end $$;
create trigger notify_new_checkin after insert on public.checkins
for each row execute function public.notify_new_checkin();

-- Notify on client message
create or replace function public.notify_new_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare cname text;
begin
  if new.sender_id = new.client_id then
    select full_name into cname from public.profiles where id = new.client_id;
    insert into public.notifications (kind, client_id, title, body)
    values ('message', new.client_id, 'New message', coalesce(cname,'A client') || ': ' || left(new.body, 120));
  end if;
  return new;
end $$;
create trigger notify_new_message after insert on public.messages
for each row execute function public.notify_new_message();
