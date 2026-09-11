-- Extends verified release 008. Existing session snapshots are never rewritten.
-- Labels follow set numbers across weekly count overrides. Missing new sets are working sets.
begin;
alter table public.block_exercises add column set_types jsonb not null default '[]'::jsonb
 constraint valid_set_types check (jsonb_typeof(set_types)='array' and jsonb_array_length(set_types)<=30 and set_types <@ '["warmup","working"]'::jsonb);

create or replace function public.bbn_plan_document(p_version uuid) returns jsonb
language sql stable security definer set search_path=public as $$
 select jsonb_build_object('name',p.name,'description',coalesce(p.description,''),'weeks',p.weeks::text,'days',coalesce((
  select jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'blocks',coalesce((
   select jsonb_agg(jsonb_build_object('id',b.id,'label',b.label,'rest',coalesce(b.rest_note,''),'exercises',coalesce((
    select jsonb_agg(jsonb_build_object('id',e.id,'exerciseId',e.exercise_id,'name',e.exercise_name,'setTypes',e.set_types,'sets',e.sets::text,'reps',e.rep_range,'weight',coalesce(e.target_weight_lbs::text,''),'instructions',coalesce(e.directions,''),'optional',e.optional,'optionalNote',coalesce(e.optional_note,''),'overrides',coalesce((
     select jsonb_object_agg(o.week::text,jsonb_build_object('sets',coalesce(o.sets::text,''),'reps',coalesce(o.rep_range,''),'weight',coalesce(o.target_weight_lbs::text,''))) from program_week_overrides o where o.block_exercise_id=e.id
    ),'{}'::jsonb)) order by e.position,e.id) from block_exercises e where e.block_id=b.id
   ),'[]'::jsonb)) order by b.position,b.id) from day_blocks b where b.day_id=d.id
  ),'[]'::jsonb)) order by d.position,d.day,d.id) from program_days d where d.version_id=v.id
 ),'[]'::jsonb)) from program_versions v join programs p on p.id=v.program_id where v.id=p_version;
$$;

create or replace function public.bbn_validate_plan(p_doc jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare d jsonb;b jsonb;e jsonb;o record;pr jsonb;n integer;seen text[]='{}';
begin
 if jsonb_typeof(p_doc) is distinct from 'object' or length(p_doc::text)>500000 then raise exception 'Invalid plan document';end if;
 if coalesce(length(trim(p_doc->>'name')),0) not between 1 and 160 or coalesce(p_doc->>'weeks','') !~ '^[0-9]+$' then raise exception 'Plan name and weeks are required';end if;
 if (p_doc->>'weeks')::integer not between 1 and 52 or coalesce(length(p_doc->>'description'),0)>5000 then raise exception 'Invalid program length or description';end if;
 if jsonb_typeof(p_doc->'days') is distinct from 'array' or jsonb_array_length(p_doc->'days') not between 1 and 14 then raise exception 'Use 1–14 workout days';end if;
 for d in select value from jsonb_array_elements(p_doc->'days') loop
  if coalesce(length(trim(d->>'title')),0) not between 1 and 160 or jsonb_typeof(d->'blocks') is distinct from 'array' then raise exception 'Invalid workout day';end if;
  if jsonb_array_length(d->'blocks')>100 then raise exception 'Too many exercise blocks';end if;
  for b in select value from jsonb_array_elements(d->'blocks') loop
   if jsonb_typeof(b->'exercises') is distinct from 'array' or jsonb_array_length(b->'exercises') not between 1 and 30 or length(coalesce(b->>'rest',''))>2000 then raise exception 'Invalid exercise block';end if;
   for e in select value from jsonb_array_elements(b->'exercises') loop
    if e->>'id'=any(seen) then raise exception 'Duplicate exercise row';end if;seen=array_append(seen,e->>'id');
    if coalesce(length(trim(e->>'name')),0) not between 1 and 160 or length(coalesce(e->>'instructions',''))>2000 or length(coalesce(e->>'optionalNote',''))>2000 then raise exception 'Invalid exercise name or instructions';end if;
    if not exists(select 1 from exercises where id=(e->>'exerciseId')::uuid) then raise exception 'Exercise not found in library';end if;
    if jsonb_typeof(e->'overrides') is distinct from 'object' or jsonb_typeof(e->'optional') is distinct from 'boolean' then raise exception 'Invalid exercise options';end if;
    if coalesce(e->>'sets','') !~ '^[0-9]+$' or coalesce(length(trim(e->>'reps')),0) not between 1 and 60 then raise exception 'Sets and rep targets are required';end if;
    if (e->>'sets')::integer not between 1 and 30 then raise exception 'Sets must be 1–30';end if;
    if e ? 'setTypes' then
     if jsonb_typeof(e->'setTypes') is distinct from 'array' then raise exception 'Set labels must be a list';end if;
     if jsonb_array_length(e->'setTypes')>30 or not (e->'setTypes' <@ '["warmup","working"]'::jsonb) then raise exception 'Choose Warm-up or Working set for each set';end if;
    end if;
    if coalesce(e->>'weight','')<>'' and ((e->>'weight') !~ '^[0-9]+(\.[0-9]+)?$' or (e->>'weight')::numeric>3000) then raise exception 'Invalid target weight';end if;
    for o in select * from jsonb_each(e->'overrides') loop
     if o.key !~ '^[0-9]+$' or o.key::integer not between 2 and 52 then raise exception 'Invalid override week';end if;
     pr=o.value;
     if coalesce(pr->>'sets','')<>'' and ((pr->>'sets') !~ '^[0-9]+$' or (pr->>'sets')::integer not between 1 and 30) then raise exception 'Invalid weekly sets';end if;
     if length(coalesce(pr->>'reps',''))>60 then raise exception 'Invalid weekly reps';end if;
     if coalesce(pr->>'weight','')<>'' and ((pr->>'weight') !~ '^[0-9]+(\.[0-9]+)?$' or (pr->>'weight')::numeric>3000) then raise exception 'Invalid weekly weight';end if;
    end loop;
   end loop;
  end loop;
 end loop;
end $$;

create or replace function public.bbn_apply_plan_draft(p_id uuid,p_revision integer,p_client_id uuid default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r program_drafts;source_a program_assignments;new_program uuid;new_version uuid;new_day uuid;new_block uuid;new_ex uuid;source_program uuid;target_client uuid;d jsonb;b jsonb;e jsonb;o record;di integer=0;bi integer;ei integer;started date=current_date;
begin
 if not public.is_admin() then raise exception 'Coach access required';end if;
 select * into r from program_drafts where id=p_id for update;
 if not found then raise exception 'Draft not found';end if;
 if r.state='applied' then return r.result;end if;
 if r.state<>'editing' or r.revision<>p_revision then raise exception 'This draft has changed. Reload its saved version before applying.';end if;
 perform bbn_validate_plan(r.document);
 if not exists(select 1 from jsonb_array_elements(r.document->'days') day_item, jsonb_array_elements(day_item->'blocks') block_item, jsonb_array_elements(block_item->'exercises') exercise_item) then raise exception 'Add an exercise before applying';end if;
 select program_id into source_program from program_versions where id=r.source_version_id;
 target_client=p_client_id;
 if r.source_assignment_id is not null then
  select * into source_a from program_assignments where id=r.source_assignment_id;
  target_client=source_a.client_id;
  if p_client_id is not null and p_client_id<>target_client then raise exception 'This draft belongs to another client';end if;
 end if;
 if target_client is not null then
  perform 1 from profiles where id=target_client and status='active' for update;
  if not found or not exists(select 1 from user_roles where user_id=target_client and role='client') then raise exception 'Active client not found';end if;
  if r.source_assignment_id is not null then
   perform 1 from program_assignments where id=r.source_assignment_id and active and version_id=r.source_version_id and client_id=target_client for update;
   if not found then raise exception 'The client’s assignment changed. The draft is preserved; review the current assignment before applying.';end if;
   started=source_a.start_date;
  end if;
 end if;
 insert into programs(name,description,weeks,days_per_week,is_template,source_program_id)
 values(r.document->>'name',nullif(r.document->>'description',''),(r.document->>'weeks')::integer,jsonb_array_length(r.document->'days'),target_client is null,source_program) returning id into new_program;
 insert into program_versions(program_id,version) values(new_program,1) returning id into new_version;
 for d in select value from jsonb_array_elements(r.document->'days') loop
  di=di+1;insert into program_days(version_id,week,day,title,position) values(new_version,1,di,d->>'title',di) returning id into new_day;
  bi=0;
  for b in select value from jsonb_array_elements(d->'blocks') loop
   bi=bi+1;insert into day_blocks(day_id,label,rest_note,position) values(new_day,coalesce(b->>'label',''),nullif(b->>'rest',''),bi) returning id into new_block;
   ei=0;
   for e in select value from jsonb_array_elements(b->'exercises') loop
    ei=ei+1;insert into block_exercises(block_id,exercise_id,exercise_name,sets,rep_range,target_weight_lbs,optional,optional_note,directions,position,set_types)
    values(new_block,(e->>'exerciseId')::uuid,e->>'name',(e->>'sets')::integer,e->>'reps',nullif(e->>'weight','')::numeric,(e->>'optional')::boolean,nullif(e->>'optionalNote',''),nullif(e->>'instructions',''),ei,coalesce(e->'setTypes','[]'::jsonb)) returning id into new_ex;
    for o in select * from jsonb_each(e->'overrides') loop
     insert into program_week_overrides(block_exercise_id,week,sets,rep_range,target_weight_lbs) values(new_ex,o.key::integer,nullif(o.value->>'sets','')::integer,nullif(o.value->>'reps',''),nullif(o.value->>'weight','')::numeric);
    end loop;
   end loop;
  end loop;
 end loop;
 update program_versions set published_at=now() where id=new_version;
 if target_client is not null then
  update program_assignments set active=false where client_id=target_client and active;
  insert into program_assignments(client_id,version_id,start_date) values(target_client,new_version,started);
 else
  -- Replace the library listing only; old metadata and prescriptions remain intact.
  update programs set is_template=false where id=source_program;
 end if;
 update program_drafts set state='applied',updated_at=now(),result=jsonb_build_object('versionId',new_version,'clientId',target_client) where id=p_id returning * into r;
 return r.result;
end $$;

create or replace function public.bbn_workout_snapshot(p_day uuid,p_week integer) returns jsonb
language sql stable security definer set search_path=public as $$
 select jsonb_build_object('id',d.id,'week',p_week,'day',d.day,'title',d.title,'total_weeks',p.weeks,'day_blocks',coalesce((
  select jsonb_agg(jsonb_build_object('id',b.id,'label',b.label,'rest_note',b.rest_note,'position',b.position,'block_exercises',coalesce((
   select jsonb_agg(jsonb_build_object('id',e.id,'exercise_id',e.exercise_id,'exercise_name',e.exercise_name,'set_types',(select jsonb_agg(coalesce(e.set_types->>i,'working') order by i) from generate_series(0,coalesce(o.sets,e.sets)-1) i),'sets',coalesce(o.sets,e.sets),'rep_range',coalesce(o.rep_range,e.rep_range),'target_weight_lbs',coalesce(o.target_weight_lbs,e.target_weight_lbs),'optional',e.optional,'optional_note',e.optional_note,'directions',e.directions,'position',e.position,'exercises',jsonb_build_object('youtube_url',x.youtube_url,'cue',x.cue,'thumb_path',x.thumb_path)) order by e.position,e.id)
   from block_exercises e join exercises x on x.id=e.exercise_id left join program_week_overrides o on o.block_exercise_id=e.id and o.week=p_week where e.block_id=b.id
  ),'[]'::jsonb)) order by b.position,b.id) from day_blocks b where b.day_id=d.id
 ),'[]'::jsonb)) from program_days d join program_versions v on v.id=d.version_id join programs p on p.id=v.program_id where d.id=p_day;
$$;
-- CREATE OR REPLACE preserves the existing function grants and ownership checks.
revoke all on function bbn_plan_document(uuid),bbn_validate_plan(jsonb),bbn_workout_snapshot(uuid,integer) from public,anon,authenticated;
revoke all on function bbn_apply_plan_draft(uuid,integer,uuid) from public,anon;
grant execute on function bbn_apply_plan_draft(uuid,integer,uuid) to authenticated;
commit;
