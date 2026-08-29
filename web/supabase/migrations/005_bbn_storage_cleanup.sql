-- Built by Nicole: storage buckets + policies, and removal of old champion-toc tables.
-- Old data was backed up to built-by-nicole/docs/champion-toc-db-backup-2026-08-28.json.

-- Private buckets
insert into storage.buckets (id, name, public) values
  ('progress-photos','progress-photos', false),
  ('food-photos','food-photos', false),
  ('meal-pdfs','meal-pdfs', false),
  ('message-photos','message-photos', false)
on conflict (id) do nothing;

-- Owner-prefixed keys: <client_uuid>/... Clients touch only their prefix; admin reads all.
create policy "own prefix read" on storage.objects for select
  using (bucket_id in ('progress-photos','food-photos','message-photos','meal-pdfs')
         and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
create policy "own prefix insert" on storage.objects for insert
  with check (bucket_id in ('progress-photos','food-photos','message-photos')
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own prefix delete" on storage.objects for delete
  using (public.is_admin() or ((storage.foldername(name))[1] = auth.uid()::text
         and bucket_id in ('food-photos')));
create policy "admin write storage" on storage.objects for insert
  with check (public.is_admin());
create policy "admin update storage" on storage.objects for update
  using (public.is_admin());

-- Cleanup: old champion-toc playbook tables (empty / backed up)
drop table if exists public.playbook_corrections cascade;
drop table if exists public.playbook_post_queue cascade;
drop table if exists public.playbook_assets cascade;
drop table if exists public.playbook_reports cascade;
drop table if exists public.playbook_step_state cascade;
drop table if exists public.playbook_runs cascade;
drop table if exists public.follow_ups cascade;
drop table if exists public.cancellations cascade;
drop table if exists public.intros cascade;
drop table if exists public.csv_imports cascade;
drop table if exists public.outreach_log cascade;
drop table if exists public.members cascade;
drop table if exists public.inventory_logs cascade;
drop table if exists public.products cascade;
