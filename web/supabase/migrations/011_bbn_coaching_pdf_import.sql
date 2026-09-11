-- Requires 010 and the recovered production meal-options schema (see test fixture).
-- No assignments or historical food records are altered by importing.
begin;
create table public.meal_plan_coach_notes (
 version_id uuid primary key references public.meal_plan_versions(id) on delete cascade,
 notes jsonb not null default '[]'::jsonb
);
alter table public.meal_plan_coach_notes enable row level security;
create policy "coach private meal notes" on public.meal_plan_coach_notes for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select,insert,update,delete on public.meal_plan_coach_notes to authenticated;
create policy "coach write private program notes" on public.program_coach_notes for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant insert,update,delete on public.program_coach_notes to authenticated;
create table public.coaching_imports (
 source_id uuid not null, revision integer not null check(revision>0), checksum text not null check(checksum ~ '^[a-f0-9]{64}$'),
 has_workout boolean not null, meal_version_id uuid references public.meal_plan_versions(id),
 created_at timestamptz not null default now(), primary key(source_id,revision)
);
alter table public.coaching_imports enable row level security;
create policy "coach read coaching imports" on public.coaching_imports for select to authenticated using(public.is_admin());
grant select on public.coaching_imports to authenticated;

-- Strict helpers are private; validation happens again inside the transaction.
create function public.bbn_import_fields(v jsonb, keys text[]) returns void language plpgsql set search_path=public as $$
begin
 if jsonb_typeof(v) is distinct from 'object' or not (v ?& keys) or (select count(*) from jsonb_object_keys(v))<>cardinality(keys) then raise exception 'Missing or unsupported meal fields';end if;
end $$;
create function public.bbn_validate_meal_import(doc jsonb) returns void language plpgsql set search_path=public as $$
declare m jsonb;i jsonb;t jsonb;n jsonb;k text;nutrient_value jsonb;cap numeric;
begin
 if doc is null or length(doc::text)>500000 then raise exception 'Invalid meal plan';end if;
 perform bbn_import_fields(doc,array['name','intro','schedule','targets','meals','coach_notes']);
 if jsonb_typeof(doc->'name')<>'string' or length(trim(doc->>'name')) not between 1 and 160 or jsonb_typeof(doc->'intro')<>'string' or length(doc->>'intro')>5000 or jsonb_typeof(doc->'schedule')<>'string' or length(doc->>'schedule')>2000 then raise exception 'Invalid meal name or notes';end if;
 t=doc->'targets';perform bbn_import_fields(t,array['mode','calories','protein_g','carbs_g','fat_g','protein_pct','carbs_pct','fat_pct']);
 if t->>'mode' not in ('grams','percent') then raise exception 'Invalid meal target mode';end if;
 foreach k in array array['calories','protein_g','carbs_g','fat_g','protein_pct','carbs_pct','fat_pct'] loop
  nutrient_value=t->k;cap=case when k like '%pct' then 100 when k='calories' then 20000 else 5000 end;
  if nutrient_value<>'null'::jsonb then
   if jsonb_typeof(nutrient_value)<>'number' then raise exception 'Invalid meal target';end if;
   if (nutrient_value#>>'{}')::numeric not between 0 and cap then raise exception 'Meal target out of range';end if;
  end if;
 end loop;
 if t->>'mode'='percent' and (t->>'protein_pct' is null or t->>'carbs_pct' is null or t->>'fat_pct' is null or abs((t->>'protein_pct')::numeric+(t->>'carbs_pct')::numeric+(t->>'fat_pct')::numeric-100)>0.001) then raise exception 'Percent targets must total 100';end if;
 if jsonb_typeof(doc->'meals')<>'array' or jsonb_array_length(doc->'meals') not between 1 and 30 then raise exception 'Use 1–30 meals';end if;
 for m in select value from jsonb_array_elements(doc->'meals') loop
  perform bbn_import_fields(m,array['name','note','items','options']);
  if jsonb_typeof(m->'name')<>'string' or length(trim(m->>'name')) not between 1 and 160 or jsonb_typeof(m->'note')<>'string' or length(m->>'note')>2000 then raise exception 'Invalid meal';end if;
  if jsonb_typeof(m->'items')<>'array' or jsonb_typeof(m->'options')<>'array' or jsonb_array_length(m->'items')>50 or jsonb_array_length(m->'options')>30 then raise exception 'Invalid meal food list';end if;
  if (jsonb_array_length(m->'items')>0)=(jsonb_array_length(m->'options')>0) then raise exception 'Use foods or complete alternatives per meal';end if;
  for i in select value from jsonb_array_elements(m->'items') loop
   perform bbn_import_fields(i,array['name','portion','calories','protein','carbs','fats']);
   if jsonb_typeof(i->'name')<>'string' or length(trim(i->>'name')) not between 1 and 160 or jsonb_typeof(i->'portion')<>'string' or length(trim(i->>'portion')) not between 1 and 500 then raise exception 'Food name and portion required';end if;
  end loop;
  for i in select value from jsonb_array_elements(m->'options') loop
   perform bbn_import_fields(i,array['text','tag','calories','protein','carbs','fats']);
   if jsonb_typeof(i->'text')<>'string' or length(trim(i->>'text')) not between 1 and 2000 or (i->'tag'<>'null'::jsonb and i->>'tag' not in ('zero_prep','rough_day')) then raise exception 'Invalid meal alternative';end if;
  end loop;
  for i in select value from jsonb_array_elements((m->'items')||(m->'options')) loop
   foreach k in array array['calories','protein','carbs','fats'] loop
    nutrient_value=i->k;cap=case when k='calories' then 20000 else 5000 end;
    if nutrient_value<>'null'::jsonb then
     if jsonb_typeof(nutrient_value)<>'number' then raise exception 'Invalid food nutrient';end if;
     if (nutrient_value#>>'{}')::numeric not between 0 and cap then raise exception 'Food nutrient out of range';end if;
    end if;
   end loop;
  end loop;
 end loop;
 if jsonb_typeof(doc->'coach_notes')<>'array' or jsonb_array_length(doc->'coach_notes')>1000 then raise exception 'Invalid private meal notes';end if;
 for n in select value from jsonb_array_elements(doc->'coach_notes') loop
  perform bbn_import_fields(n,array['meal','text']);
  if jsonb_typeof(n->'text')<>'string' or length(trim(n->>'text')) not between 1 and 2000 then raise exception 'Invalid private note';end if;
  if n->'meal'<>'null'::jsonb and (jsonb_typeof(n->'meal')<>'number' or n->>'meal' !~ '^[0-9]+$' or (n->>'meal')::integer not between 1 and jsonb_array_length(doc->'meals')) then raise exception 'Unknown private note meal';end if;
 end loop;
end $$;

create function public.bbn_import_coaching(p_source_id uuid,p_revision integer,p_checksum text,p_document jsonb,p_meal jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare old coaching_imports;wr jsonb='{}';mp uuid;ver uuid;mid uuid;m jsonb;i jsonb;t jsonb;pos integer=0;ip integer;
begin
 if not public.is_admin() then raise exception 'Coach access required';end if;
 if p_source_id is null or p_revision is null or p_revision<1 or p_checksum is null or p_checksum !~ '^[a-f0-9]{64}$' or (p_document is null and p_meal is null) then raise exception 'Invalid coaching import';end if;
 if p_document is not null then perform bbn_validate_plan(p_document);end if;
 if p_meal is not null then perform bbn_validate_meal_import(p_meal);end if;
 perform pg_advisory_xact_lock(hashtextextended('coaching:'||p_source_id::text||':'||p_revision::text,0));
 select * into old from coaching_imports where source_id=p_source_id and revision=p_revision;
 if found then
  if old.checksum<>p_checksum or old.has_workout<>(p_document is not null) or (old.meal_version_id is not null)<>(p_meal is not null) then raise exception 'This revision already contains different data. Export a new revision.';end if;
  if p_document is not null then wr=bbn_import_workout(p_source_id,p_revision,p_checksum,p_document);end if;
  return wr||jsonb_build_object('versionId',wr->'versionId','mealVersionId',old.meal_version_id,'state',coalesce(wr->>'state','editing'),'reused',true);
 end if;
 if p_document is not null then wr=bbn_import_workout(p_source_id,p_revision,p_checksum,p_document);end if;
 if p_meal is not null then
  t=p_meal->'targets';
  insert into meal_plans(name,is_template,target_mode,target_calories,target_protein_g,target_carbs_g,target_fat_g,target_protein_pct,target_carbs_pct,target_fat_pct)
  values(p_meal->>'name',false,t->>'mode',(t->>'calories')::numeric,(t->>'protein_g')::numeric,(t->>'carbs_g')::numeric,(t->>'fat_g')::numeric,(t->>'protein_pct')::numeric,(t->>'carbs_pct')::numeric,(t->>'fat_pct')::numeric) returning id into mp;
  insert into meal_plan_versions(meal_plan_id,version,intro) values(mp,1,concat_ws(E'\n\n',nullif(p_meal->>'intro',''),case when p_meal->>'schedule'<>'' then 'Schedule: '||(p_meal->>'schedule') end)) returning id into ver;
  insert into meal_plan_coach_notes(version_id,notes) values(ver,p_meal->'coach_notes');
  for m in select value from jsonb_array_elements(p_meal->'meals') loop
   pos=pos+1;insert into meals(version_id,name,note,position) values(ver,m->>'name',m->>'note',pos) returning id into mid;
   ip=0;for i in select value from jsonb_array_elements(m->'items') loop
    ip=ip+1;insert into meal_items(meal_id,name,portion,protein,carbs,fats,calories,position) values(mid,i->>'name',i->>'portion',(i->>'protein')::numeric,(i->>'carbs')::numeric,(i->>'fats')::numeric,(i->>'calories')::numeric,ip);
   end loop;
   ip=0;for i in select value from jsonb_array_elements(m->'options') loop
    ip=ip+1;insert into meal_options(meal_id,text,tag,protein,carbs,fats,calories,position) values(mid,i->>'text',i->>'tag',(i->>'protein')::numeric,(i->>'carbs')::numeric,(i->>'fats')::numeric,(i->>'calories')::numeric,ip);
   end loop;
  end loop;
 end if;
 insert into coaching_imports(source_id,revision,checksum,has_workout,meal_version_id) values(p_source_id,p_revision,p_checksum,p_document is not null,ver);
 return wr||jsonb_build_object('versionId',wr->'versionId','mealVersionId',ver,'state',coalesce(wr->>'state','editing'),'reused',false);
end $$;
revoke all on function bbn_import_fields(jsonb,text[]),bbn_validate_meal_import(jsonb),bbn_import_coaching(uuid,integer,text,jsonb,jsonb) from public,anon;
grant execute on function bbn_import_coaching(uuid,integer,text,jsonb,jsonb) to authenticated;

-- Copy complete version rows atomically, including future presentation fields.
create function public.bbn_assign_meal_copy(p_version uuid,p_client uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare p meal_plans;v meal_plan_versions;m meals;i meal_items;o meal_options;source uuid;nv uuid;nm uuid;client_name text;
begin
 if not public.is_admin() then raise exception 'Coach access required';end if;
 select full_name into client_name from profiles where id=p_client and status='active' and exists(select 1 from user_roles where user_id=p_client and role='client') for update;
 if not found then raise exception 'Active client not found';end if;
 select * into v from meal_plan_versions where id=p_version;
 if not found then raise exception 'Meal plan not found';end if;
 select * into p from meal_plans where id=v.meal_plan_id;
 source=p.id;p.id=gen_random_uuid();p.name=p.name||' · '||split_part(client_name,' ',1);p.source_meal_plan_id=source;p.is_template=false;p.created_at=now();
 insert into meal_plans select (p).*;
 v.id=gen_random_uuid();nv=v.id;v.meal_plan_id=p.id;v.version=1;v.published_at=now();insert into meal_plan_versions select (v).*;
 insert into meal_plan_coach_notes(version_id,notes) select nv,notes from meal_plan_coach_notes where version_id=p_version;
 for m in select * from meals where version_id=p_version order by position,id loop
  source=m.id;m.id=gen_random_uuid();nm=m.id;m.version_id=nv;insert into meals select (m).*;
  for i in select * from meal_items where meal_id=source loop i.id=gen_random_uuid();i.meal_id=nm;insert into meal_items select (i).*;end loop;
  for o in select * from meal_options where meal_id=source loop o.id=gen_random_uuid();o.meal_id=nm;insert into meal_options select (o).*;end loop;
 end loop;
 update meal_plan_assignments set active=false where client_id=p_client and active;
 insert into meal_plan_assignments(client_id,version_id) values(p_client,nv);
 return jsonb_build_object('ok',true,'versionId',nv);
end $$;
create function public.bbn_assign_program_copy(p_version uuid,p_client uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare p programs;v program_versions;d program_days;b day_blocks;e block_exercises;o program_week_overrides;source uuid;nv uuid;nd uuid;nb uuid;ne uuid;client_name text;
begin
 if not public.is_admin() then raise exception 'Coach access required';end if;
 select full_name into client_name from profiles where id=p_client and status='active' and exists(select 1 from user_roles where user_id=p_client and role='client') for update;
 if not found then raise exception 'Active client not found';end if;
 select * into v from program_versions where id=p_version;
 if not found then raise exception 'Program not found';end if;
 -- A newly imported source is only a seed; publish its draft before using Assign Plans.
 if exists(select 1 from workout_imports where version_id=p_version) then raise exception 'Open the imported workout draft and Apply changes before assigning it';end if;
 select * into p from programs where id=v.program_id;
 source=p.id;p.id=gen_random_uuid();p.name=p.name||' · '||split_part(client_name,' ',1);p.source_program_id=source;p.is_template=false;p.created_at=now();insert into programs select (p).*;
 v.id=gen_random_uuid();nv=v.id;v.program_id=p.id;v.version=1;v.published_at=now();insert into program_versions select (v).*;
 insert into program_coach_notes(version_id,notes) select nv,notes from program_coach_notes where version_id=p_version;
 for d in select * from program_days where version_id=p_version loop
  source=d.id;d.id=gen_random_uuid();nd=d.id;d.version_id=nv;insert into program_days select (d).*;
  for b in select * from day_blocks where day_id=source loop
   source=b.id;b.id=gen_random_uuid();nb=b.id;b.day_id=nd;insert into day_blocks select (b).*;
   for e in select * from block_exercises where block_id=source loop
    source=e.id;e.id=gen_random_uuid();ne=e.id;e.block_id=nb;insert into block_exercises select (e).*;
    for o in select * from program_week_overrides where block_exercise_id=source loop o.id=gen_random_uuid();o.block_exercise_id=ne;insert into program_week_overrides select (o).*;end loop;
   end loop;
  end loop;
 end loop;
 update program_assignments set active=false where client_id=p_client and active;
 insert into program_assignments(client_id,version_id) values(p_client,nv);
 return jsonb_build_object('ok',true,'versionId',nv);
end $$;
revoke all on function bbn_assign_meal_copy(uuid,uuid),bbn_assign_program_copy(uuid,uuid) from public,anon;
grant execute on function bbn_assign_meal_copy(uuid,uuid),bbn_assign_program_copy(uuid,uuid) to authenticated;
commit;
