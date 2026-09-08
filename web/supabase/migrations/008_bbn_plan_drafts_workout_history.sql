-- Verified against production schema via read-only catalog inspection, 2026-09-08.
-- Apply only after local review. Existing assignments, sessions and set entries are retained.
begin;
create table public.program_drafts (
 id uuid primary key default gen_random_uuid(),
 source_version_id uuid not null references public.program_versions(id),
 source_assignment_id uuid references public.program_assignments(id),
 document jsonb not null,
 revision integer not null default 1,
 state text not null default 'editing' check(state in ('editing','applied','discarded')),
 result jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index one_editing_draft_per_version on public.program_drafts(source_version_id) where state='editing';
alter table public.program_drafts enable row level security;
-- Writes go through validated RPCs, including for coaches.
create policy "coach read drafts" on public.program_drafts for select to authenticated using(public.is_admin());
grant select on public.program_drafts to authenticated;

alter table public.workout_sessions add column program_week integer check(program_week between 1 and 52);
alter table public.workout_sessions add column prescription_snapshot jsonb;
create unique index one_workout_per_plan_week_day on public.workout_sessions(client_id,assignment_id,day_id,program_week) where program_week is not null;
create index workout_history_client_time on public.workout_sessions(client_id,started_at desc,id desc);
-- Do not backfill prescriptions: the original targets of older sessions are unknown.

create function public.bbn_plan_document(p_version uuid) returns jsonb
language sql stable security definer set search_path=public as $$
 select jsonb_build_object('name',p.name,'description',coalesce(p.description,''),'weeks',p.weeks::text,'days',coalesce((
  select jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'blocks',coalesce((
   select jsonb_agg(jsonb_build_object('id',b.id,'label',b.label,'rest',coalesce(b.rest_note,''),'exercises',coalesce((
    select jsonb_agg(jsonb_build_object('id',e.id,'exerciseId',e.exercise_id,'name',e.exercise_name,'sets',e.sets::text,'reps',e.rep_range,'weight',coalesce(e.target_weight_lbs::text,''),'instructions',coalesce(e.directions,''),'optional',e.optional,'optionalNote',coalesce(e.optional_note,''),'overrides',coalesce((
     select jsonb_object_agg(o.week::text,jsonb_build_object('sets',coalesce(o.sets::text,''),'reps',coalesce(o.rep_range,''),'weight',coalesce(o.target_weight_lbs::text,''))) from program_week_overrides o where o.block_exercise_id=e.id
    ),'{}'::jsonb)) order by e.position,e.id) from block_exercises e where e.block_id=b.id
   ),'[]'::jsonb)) order by b.position,b.id) from day_blocks b where b.day_id=d.id
  ),'[]'::jsonb)) order by d.position,d.day,d.id) from program_days d where d.version_id=v.id
 ),'[]'::jsonb)) from program_versions v join programs p on p.id=v.program_id where v.id=p_version;
$$;

create function public.bbn_validate_plan(p_doc jsonb) returns void
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

create function public.bbn_open_plan_draft(p_version_id uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r program_drafts;assignment uuid;doc jsonb;
begin
 if not public.is_admin() then raise exception 'Coach access required';end if;
 perform 1 from program_versions where id=p_version_id for update;if not found then raise exception 'Program not found';end if;
 select * into r from program_drafts where source_version_id=p_version_id and state='editing';
 if not found then
  if (select count(*) from program_assignments where version_id=p_version_id and active)>1 then raise exception 'This is a shared version. Assign a private copy before editing it.';end if;
  select a.id into assignment from program_assignments a where a.version_id=p_version_id and a.active;
  doc=bbn_plan_document(p_version_id);
  insert into program_drafts(source_version_id,source_assignment_id,document) values(p_version_id,assignment,doc) returning * into r;
 end if;
 return jsonb_build_object('id',r.id,'revision',r.revision,'document',r.document,'sourceAssignmentId',r.source_assignment_id);
end $$;
create function public.bbn_save_plan_draft(p_id uuid,p_revision integer,p_document jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r program_drafts;
begin
 if not public.is_admin() then raise exception 'Coach access required';end if;
 perform bbn_validate_plan(p_document);
 update program_drafts set document=p_document,revision=revision+1,updated_at=now() where id=p_id and revision=p_revision and state='editing' returning * into r;
 if not found then raise exception 'This draft changed in another window. Your edits are still here; open the current draft before applying.';end if;
 return jsonb_build_object('revision',r.revision);
end $$;
create function public.bbn_discard_plan_draft(p_id uuid,p_revision integer) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin() then raise exception 'Coach access required';end if;
 update program_drafts set state='discarded',updated_at=now() where id=p_id and revision=p_revision and state='editing';
 if not found then raise exception 'Draft changed. Refresh before discarding.';end if;
end $$;

create function public.bbn_apply_plan_draft(p_id uuid,p_revision integer,p_client_id uuid default null) returns jsonb
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
    ei=ei+1;insert into block_exercises(block_id,exercise_id,exercise_name,sets,rep_range,target_weight_lbs,optional,optional_note,directions,position)
    values(new_block,(e->>'exerciseId')::uuid,e->>'name',(e->>'sets')::integer,e->>'reps',nullif(e->>'weight','')::numeric,(e->>'optional')::boolean,nullif(e->>'optionalNote',''),nullif(e->>'instructions',''),ei) returning id into new_ex;
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

create function public.bbn_workout_snapshot(p_day uuid,p_week integer) returns jsonb
language sql stable security definer set search_path=public as $$
 select jsonb_build_object('id',d.id,'week',p_week,'day',d.day,'title',d.title,'total_weeks',p.weeks,'day_blocks',coalesce((
  select jsonb_agg(jsonb_build_object('id',b.id,'label',b.label,'rest_note',b.rest_note,'position',b.position,'block_exercises',coalesce((
   select jsonb_agg(jsonb_build_object('id',e.id,'exercise_id',e.exercise_id,'exercise_name',e.exercise_name,'sets',coalesce(o.sets,e.sets),'rep_range',coalesce(o.rep_range,e.rep_range),'target_weight_lbs',coalesce(o.target_weight_lbs,e.target_weight_lbs),'optional',e.optional,'optional_note',e.optional_note,'directions',e.directions,'position',e.position,'exercises',jsonb_build_object('youtube_url',x.youtube_url,'cue',x.cue,'thumb_path',x.thumb_path)) order by e.position,e.id)
   from block_exercises e join exercises x on x.id=e.exercise_id left join program_week_overrides o on o.block_exercise_id=e.id and o.week=p_week where e.block_id=b.id
  ),'[]'::jsonb)) order by b.position,b.id) from day_blocks b where b.day_id=d.id
 ),'[]'::jsonb)) from program_days d join program_versions v on v.id=d.version_id join programs p on p.id=v.program_id where d.id=p_day;
$$;
create function public.bbn_begin_workout(p_day_id uuid,p_assignment_id uuid,p_week integer) returns jsonb
language plpgsql security definer set search_path=public as $$
declare a program_assignments;r workout_sessions;snap jsonb;
begin
 if auth.uid() is null or not public.is_active_client() or public.get_role()<>'client' then raise exception 'Active client access required';end if;
 -- Serialize session creation for this client/day; legacy duplicates remain untouched.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||p_day_id::text||':'||p_week::text,0));
 select * into a from program_assignments where id=p_assignment_id and client_id=auth.uid();
 if not found then raise exception 'Assignment not found';end if;
 if not exists(select 1 from program_days where id=p_day_id and version_id=a.version_id) then raise exception 'Workout does not belong to this assignment';end if;
 select * into r from workout_sessions where client_id=auth.uid() and day_id=p_day_id and assignment_id=a.id and program_week=p_week order by started_at desc,id desc limit 1;
 if not found then
  if not a.active then raise exception 'This program has changed. Open your current workouts.';end if;
  if p_week is null or p_week<1 or p_week>(select p.weeks from programs p join program_versions v on v.program_id=p.id where v.id=a.version_id) then raise exception 'Invalid program week';end if;
  snap=bbn_workout_snapshot(p_day_id,p_week);
  insert into workout_sessions(client_id,assignment_id,day_id,program_week,prescription_snapshot) values(auth.uid(),a.id,p_day_id,p_week,snap) returning * into r;
 end if;
 return jsonb_build_object('id',r.id,'day',coalesce(r.prescription_snapshot,bbn_workout_snapshot(p_day_id,p_week)),'week',r.program_week,'started_at',r.started_at,'finished_at',r.finished_at,'entries',coalesce((select jsonb_agg(jsonb_build_object('block_exercise_id',block_exercise_id,'exercise_id',exercise_id,'set_index',set_index,'reps',reps,'weight_lbs',weight_lbs)) from set_entries where session_id=r.id),'[]'::jsonb));
end $$;
create function public.bbn_save_workout_sets(p_session_id uuid,p_entries jsonb,p_finish boolean default false) returns void
language plpgsql security definer set search_path=public as $$
declare s workout_sessions;e jsonb;prescribed jsonb;rep integer;weight numeric;idx integer;be uuid;ex uuid;
begin
 if auth.uid() is null or not public.is_active_client() or public.get_role()<>'client' then raise exception 'Active client access required';end if;
 select * into s from workout_sessions where id=p_session_id and client_id=auth.uid() for update;
 if not found then raise exception 'Workout session not found';end if;
 if s.finished_at is not null then if p_finish then return;else raise exception 'This workout is already finished';end if;end if;
 if not exists(select 1 from program_assignments a join program_days d on d.version_id=a.version_id where a.id=s.assignment_id and a.client_id=auth.uid() and d.id=s.day_id) then raise exception 'Invalid workout assignment';end if;
 if jsonb_typeof(p_entries) is distinct from 'array' or jsonb_array_length(p_entries)>3000 then raise exception 'Invalid set entries';end if;
 for e in select value from jsonb_array_elements(p_entries) loop
  if coalesce(e->>'reps','') !~ '^[0-9]+$' or coalesce(e->>'weight_lbs','') !~ '^[0-9]+(\.[0-9]+)?$' or coalesce(e->>'set_index','') !~ '^[0-9]+$' then raise exception 'Reps, weight and set number must be valid numbers';end if;
  rep=(e->>'reps')::integer;weight=(e->>'weight_lbs')::numeric;idx=(e->>'set_index')::integer;be=(e->>'block_exercise_id')::uuid;ex=(e->>'exercise_id')::uuid;
  if rep not between 0 and 1000 or weight not between 0 and 3000 or idx not between 0 and 29 then raise exception 'Invalid reps, weight or set number';end if;
  if not exists(select 1 from block_exercises x join day_blocks b on b.id=x.block_id where x.id=be and x.exercise_id=ex and b.day_id=s.day_id) then raise exception 'Exercise does not belong to this workout';end if;
  if s.prescription_snapshot is not null then
   select x into prescribed from jsonb_array_elements(s.prescription_snapshot->'day_blocks') b,jsonb_array_elements(b->'block_exercises') x where x->>'id'=be::text and x->>'exercise_id'=ex::text;
   if prescribed is null or idx>=(prescribed->>'sets')::integer then raise exception 'Set is outside the prescribed workout';end if;
  end if;
  insert into set_entries(session_id,client_id,block_exercise_id,exercise_id,set_index,reps,weight_lbs,unit)
   values(s.id,auth.uid(),be,ex,idx,rep,weight,'lbs')
   on conflict(session_id,block_exercise_id,set_index) do update set reps=excluded.reps,weight_lbs=excluded.weight_lbs,logged_at=now();
 end loop;
 if p_finish then update workout_sessions set finished_at=now() where id=s.id;end if;
end $$;

-- Close the old direct-write route around the ownership and relationship checks.
drop policy "client insert sessions" on public.workout_sessions;
drop policy "client update own sessions" on public.workout_sessions;
drop policy "client insert set_entries" on public.set_entries;
drop policy "client update own set_entries" on public.set_entries;

-- Published, assigned prescriptions are immutable even through old builder actions.
create function public.bbn_guard_assigned_prescription() returns trigger
language plpgsql security definer set search_path=public as $$
declare row_data jsonb;v_version uuid;v_program uuid;
begin
 if tg_table_name='programs' and tg_op='UPDATE' and (to_jsonb(new)-'is_template')=(to_jsonb(old)-'is_template') then return new;end if;
 for row_data in select value from jsonb_array_elements(case tg_op when 'INSERT' then jsonb_build_array(to_jsonb(new)) when 'DELETE' then jsonb_build_array(to_jsonb(old)) else jsonb_build_array(to_jsonb(old),to_jsonb(new)) end) loop
  v_version=null;v_program=null;
  case tg_table_name
  when 'programs' then v_program=(row_data->>'id')::uuid;
  when 'program_versions' then v_version=(row_data->>'id')::uuid;
  when 'program_days' then v_version=(row_data->>'version_id')::uuid;
  when 'day_blocks' then select d.version_id into v_version from program_days d where d.id=(row_data->>'day_id')::uuid;
  when 'block_exercises' then select d.version_id into v_version from day_blocks b join program_days d on d.id=b.day_id where b.id=(row_data->>'block_id')::uuid;
  when 'program_week_overrides' then select d.version_id into v_version from block_exercises e join day_blocks b on b.id=e.block_id join program_days d on d.id=b.day_id where e.id=(row_data->>'block_exercise_id')::uuid;
  end case;
  if exists(select 1 from program_assignments a join program_versions v on v.id=a.version_id where a.version_id=v_version or v.program_id=v_program) then raise exception 'Assigned plans are read-only. Edit a draft and apply changes instead.';end if;
 end loop;
 return case when tg_op='DELETE' then old else new end;
end $$;
create trigger guard_assigned_program before update or delete on programs for each row execute function bbn_guard_assigned_prescription();
create trigger guard_assigned_version before update or delete on program_versions for each row execute function bbn_guard_assigned_prescription();
create trigger guard_assigned_days before insert or update or delete on program_days for each row execute function bbn_guard_assigned_prescription();
create trigger guard_assigned_blocks before insert or update or delete on day_blocks for each row execute function bbn_guard_assigned_prescription();
create trigger guard_assigned_exercises before insert or update or delete on block_exercises for each row execute function bbn_guard_assigned_prescription();
create trigger guard_assigned_overrides before insert or update or delete on program_week_overrides for each row execute function bbn_guard_assigned_prescription();

revoke all on function bbn_plan_document(uuid),bbn_validate_plan(jsonb),bbn_workout_snapshot(uuid,integer),bbn_guard_assigned_prescription() from public,anon,authenticated;
revoke all on function bbn_open_plan_draft(uuid),bbn_save_plan_draft(uuid,integer,jsonb),bbn_discard_plan_draft(uuid,integer),bbn_apply_plan_draft(uuid,integer,uuid),bbn_begin_workout(uuid,uuid,integer),bbn_save_workout_sets(uuid,jsonb,boolean) from public,anon;
grant execute on function bbn_open_plan_draft(uuid),bbn_save_plan_draft(uuid,integer,jsonb),bbn_discard_plan_draft(uuid,integer),bbn_apply_plan_draft(uuid,integer,uuid),bbn_begin_workout(uuid,uuid,integer),bbn_save_workout_sets(uuid,jsonb,boolean) to authenticated;
create function public.bbn_client_workout(p_week integer default null,p_day integer default 1) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare a program_assignments;p programs;v_week integer;v_day program_days;s workout_sessions;related uuid[];progress jsonb;days jsonb;total integer;
begin
 if auth.uid() is null or not public.is_active_client() or public.get_role()<>'client' then raise exception 'Active client access required';end if;
 select * into a from program_assignments where client_id=auth.uid() and active;
 if not found then return null;end if;
 select pr.* into p from programs pr join program_versions v on v.program_id=pr.id where v.id=a.version_id;
 with recursive lineage as (
  select id,source_program_id,array[id] visited from programs where id=p.id
  union all select pr.id,pr.source_program_id,l.visited||pr.id from programs pr join lineage l on pr.id=l.source_program_id where not pr.id=any(l.visited)
 ) select array_agg(pa.id) into related from program_assignments pa join program_versions pv on pv.id=pa.version_id
 where pa.client_id=auth.uid() and pa.start_date=a.start_date and pa.created_at<=a.created_at and pv.program_id in(select id from lineage);
 select greatest(p.weeks,coalesce(max(program_week),1)) into total from workout_sessions where client_id=auth.uid() and assignment_id=any(related);
 v_week=coalesce(p_week,least(p.weeks,greatest(1,((current_date-a.start_date)/7)+1)));
 if v_week not between 1 and total or p_day not between 1 and 14 then raise exception 'Choose a week and day in this plan';end if;
 select * into v_day from program_days where version_id=a.version_id and day=p_day order by position,id limit 1;
 select * into s from workout_sessions where client_id=auth.uid() and assignment_id=any(related) and program_week=v_week
 and (prescription_snapshot->>'day')::integer=p_day order by started_at desc,id desc limit 1;
 if v_day.id is null and s.id is null then raise exception 'Workout day not found';end if;
 select coalesce(jsonb_agg(jsonb_build_object('week',program_week,'day',(prescription_snapshot->>'day')::integer,'completed',finished_at is not null) order by started_at desc,id desc),'[]'::jsonb) into progress
 from workout_sessions where client_id=auth.uid() and assignment_id=any(related) and program_week is not null and prescription_snapshot is not null;
 select jsonb_agg(jsonb_build_object('day',number,'title',title) order by number) into days from (
  select distinct on (number) number,title from (
   select d.day number,d.title,0 priority from program_days d where d.version_id=a.version_id
   union all select (ws.prescription_snapshot->>'day')::integer,ws.prescription_snapshot->>'title',1 from workout_sessions ws
   where ws.client_id=auth.uid() and ws.assignment_id=any(related) and ws.program_week=v_week and ws.prescription_snapshot is not null
  ) choices order by number,priority desc
 ) labels;
 return jsonb_build_object('name',p.name,'weeks',total,'currentWeek',least(p.weeks,greatest(1,((current_date-a.start_date)/7)+1)),
 'legacySessions',coalesce((select jsonb_agg(jsonb_build_object('id',ws.id,'dayId',ws.day_id,'startedAt',ws.started_at) order by ws.started_at desc) from workout_sessions ws where ws.client_id=auth.uid() and ws.program_week is null and ws.finished_at is null),'[]'::jsonb),
 'selectedWeek',v_week,'selectedDay',p_day,'days',days,'progress',progress,'assignmentId',coalesce(s.assignment_id,a.id),
 'day',coalesce(s.prescription_snapshot,bbn_workout_snapshot(v_day.id,v_week)),
 'session',case when s.id is null then null else jsonb_build_object('id',s.id,'day',s.prescription_snapshot,'week',s.program_week,'started_at',s.started_at,'finished_at',s.finished_at,
 'entries',coalesce((select jsonb_agg(jsonb_build_object('block_exercise_id',block_exercise_id,'exercise_id',exercise_id,'set_index',set_index,'reps',reps,'weight_lbs',weight_lbs)) from set_entries where session_id=s.id),'[]'::jsonb)) end);
end $$;
revoke all on function bbn_client_workout(integer,integer) from public,anon;
grant execute on function bbn_client_workout(integer,integer) to authenticated;

commit;
