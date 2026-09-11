-- Additive extension of recovered 008 and local 009. No historic snapshots are rewritten.
begin;
alter table public.program_versions add column explicit_weeks boolean not null default false;
alter table public.program_versions add column week_notes jsonb not null default '{}'::jsonb;
alter table public.program_days add column instructions text not null default '';
alter table public.block_exercises add column set_targets jsonb not null default '[]'::jsonb;
create table public.program_coach_notes (
 version_id uuid primary key references public.program_versions(id),
 notes jsonb not null default '[]'::jsonb
);
alter table public.program_coach_notes enable row level security;
create policy "coach read private program notes" on public.program_coach_notes for select to authenticated using(public.is_admin());
grant select on public.program_coach_notes to authenticated;
create table public.workout_imports (
 source_id uuid not null, revision integer not null check(revision>0), checksum text not null check(checksum ~ '^[a-f0-9]{64}$'),
 version_id uuid not null references public.program_versions(id), draft_id uuid not null references public.program_drafts(id),
 created_at timestamptz not null default now(), primary key(source_id,revision)
);
alter table public.workout_imports enable row level security;
create policy "coach read workout imports" on public.workout_imports for select to authenticated using(public.is_admin());
grant select on public.workout_imports to authenticated;
create or replace function public.bbn_plan_document(p_version uuid) returns jsonb
language sql stable security definer set search_path=public as $$
 select jsonb_build_object('explicitWeeks',v.explicit_weeks,'weekNotes',v.week_notes,'coachNotes',coalesce((select notes from program_coach_notes where version_id=v.id),'[]'::jsonb),'name',p.name,'description',coalesce(p.description,''),'weeks',p.weeks::text,'days',coalesce((
  select jsonb_agg(jsonb_build_object('id',d.id,'week',d.week,'instructions',d.instructions,'title',d.title,'blocks',coalesce((
   select jsonb_agg(jsonb_build_object('id',b.id,'label',b.label,'rest',coalesce(b.rest_note,''),'exercises',coalesce((
    select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',e.id,'exerciseId',e.exercise_id,'name',e.exercise_name,'setTargets',case when jsonb_array_length(e.set_targets)>0 then e.set_targets else null end,'setTypes',e.set_types,'sets',e.sets::text,'reps',e.rep_range,'weight',coalesce(e.target_weight_lbs::text,''),'instructions',coalesce(e.directions,''),'optional',e.optional,'optionalNote',coalesce(e.optional_note,''),'overrides',coalesce((
     select jsonb_object_agg(o.week::text,jsonb_build_object('sets',coalesce(o.sets::text,''),'reps',coalesce(o.rep_range,''),'weight',coalesce(o.target_weight_lbs::text,''))) from program_week_overrides o where o.block_exercise_id=e.id
    ),'{}'::jsonb))) order by e.position,e.id) from block_exercises e where e.block_id=b.id
   ),'[]'::jsonb)) order by b.position,b.id) from day_blocks b where b.day_id=d.id
  ),'[]'::jsonb)) order by d.week,d.position,d.day,d.id) from program_days d where d.version_id=v.id
 ),'[]'::jsonb)) from program_versions v join programs p on p.id=v.program_id where v.id=p_version;
$$;

create or replace function public.bbn_validate_plan(p_doc jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare d jsonb;b jsonb;e jsonb;o record;pr jsonb;n integer;seen text[]='{}';target jsonb;wk integer;cnt integer;explicit boolean;note jsonb;
begin
 if jsonb_typeof(p_doc) is distinct from 'object' or length(p_doc::text)>500000 then raise exception 'Invalid plan document';end if;
 if coalesce(length(trim(p_doc->>'name')),0) not between 1 and 160 or coalesce(p_doc->>'weeks','') !~ '^[0-9]+$' then raise exception 'Plan name and weeks are required';end if;
 if (p_doc->>'weeks')::integer not between 1 and 52 or coalesce(length(p_doc->>'description'),0)>5000 then raise exception 'Invalid program length or description';end if;
 if jsonb_typeof(p_doc->'days') is distinct from 'array' or jsonb_array_length(p_doc->'days') not between 1 and 728 then raise exception 'Use 1–14 workout days per week';end if;
 explicit=coalesce((p_doc->>'explicitWeeks')::boolean,false);
 if not explicit and jsonb_array_length(p_doc->'days')>14 then raise exception 'Use 1–14 workout days';end if;
 if explicit then
  for wk in 1..(p_doc->>'weeks')::integer loop
   select count(*) into cnt from jsonb_array_elements(p_doc->'days') x where (x->>'week')::integer=wk;
   if cnt not between 1 and 14 then raise exception 'Each program week needs 1–14 days';end if;
  end loop;
 end if;
 if p_doc ? 'weekNotes' then
  if jsonb_typeof(p_doc->'weekNotes')<>'object' then raise exception 'Invalid week notes';end if;
  for o in select * from jsonb_each(p_doc->'weekNotes') loop
   if o.key !~ '^[0-9]+$' or o.key::integer not between 1 and (p_doc->>'weeks')::integer or jsonb_typeof(o.value)<>'string' or length(o.value#>>'{}')>2000 then raise exception 'Invalid week notes';end if;
  end loop;
 end if;
 if p_doc ? 'coachNotes' then
  if jsonb_typeof(p_doc->'coachNotes')<>'array' or jsonb_array_length(p_doc->'coachNotes')>1000 then raise exception 'Invalid private notes';end if;
  for note in select value from jsonb_array_elements(p_doc->'coachNotes') loop
   if coalesce(note->>'scope','') not in ('client','plan','week','day','exercise') or coalesce(length(trim(note->>'text')),0) not between 1 and 2000 then raise exception 'Invalid private note';end if;
  end loop;
 end if;
 for d in select value from jsonb_array_elements(p_doc->'days') loop
  if explicit and (coalesce(d->>'week','') !~ '^[0-9]+$' or (d->>'week')::integer not between 1 and (p_doc->>'weeks')::integer) then raise exception 'Invalid workout week';end if;
  if length(coalesce(d->>'instructions',''))>2000 then raise exception 'Day notes are too long';end if;
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
    if e ? 'setTargets' then
     if jsonb_typeof(e->'setTargets')<>'array' or jsonb_array_length(e->'setTargets')<>(e->>'sets')::integer then raise exception 'Each set needs a target row';end if;
     for target in select value from jsonb_array_elements(e->'setTargets') loop
      if coalesce(length(trim(target->>'reps')),0) not between 1 and 60 or length(coalesce(target->>'instructions',''))>2000 then raise exception 'Invalid set target or notes';end if;
      if coalesce(target->>'weight','')<>'' and ((target->>'weight') !~ '^[0-9]+(\.[0-9]+)?$' or (target->>'weight')::numeric>3000) then raise exception 'Invalid set weight';end if;
      if coalesce(target->>'rest','')<>'' and ((target->>'rest') !~ '^[0-9]+$' or (target->>'rest')::numeric>86400) then raise exception 'Invalid set rest';end if;
     end loop;
     if e->'overrides'<>'{}'::jsonb then raise exception 'Individual set targets use explicit weeks';end if;
    end if;
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
declare r program_drafts;source_a program_assignments;new_program uuid;new_version uuid;new_day uuid;new_block uuid;new_ex uuid;source_program uuid;target_client uuid;d jsonb;b jsonb;e jsonb;o record;di integer=0;bi integer;ei integer;started date=current_date;wk integer;day_counts jsonb='{}';max_days integer;
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
 select max(n) into max_days from (select count(*) n from jsonb_array_elements(r.document->'days') x group by coalesce(x->>'week','1')) c;
 insert into programs(name,description,weeks,days_per_week,is_template,source_program_id)
 values(r.document->>'name',nullif(r.document->>'description',''),(r.document->>'weeks')::integer,max_days,target_client is null,source_program) returning id into new_program;
 insert into program_versions(program_id,version,explicit_weeks,week_notes) values(new_program,1,coalesce((r.document->>'explicitWeeks')::boolean,false),coalesce(r.document->'weekNotes','{}'::jsonb)) returning id into new_version;
 insert into program_coach_notes(version_id,notes) values(new_version,coalesce(r.document->'coachNotes','[]'::jsonb));
 for d in select value from jsonb_array_elements(r.document->'days') loop
  wk=case when coalesce((r.document->>'explicitWeeks')::boolean,false) then (d->>'week')::integer else 1 end;di=coalesce((day_counts->>wk::text)::integer,0)+1;day_counts=jsonb_set(day_counts,array[wk::text],to_jsonb(di));insert into program_days(version_id,week,day,title,position,instructions) values(new_version,wk,di,d->>'title',di,coalesce(d->>'instructions','')) returning id into new_day;
  bi=0;
  for b in select value from jsonb_array_elements(d->'blocks') loop
   bi=bi+1;insert into day_blocks(day_id,label,rest_note,position) values(new_day,coalesce(b->>'label',''),nullif(b->>'rest',''),bi) returning id into new_block;
   ei=0;
   for e in select value from jsonb_array_elements(b->'exercises') loop
    ei=ei+1;insert into block_exercises(block_id,exercise_id,exercise_name,sets,rep_range,target_weight_lbs,optional,optional_note,directions,position,set_types,set_targets)
    values(new_block,(e->>'exerciseId')::uuid,e->>'name',(e->>'sets')::integer,e->>'reps',nullif(e->>'weight','')::numeric,(e->>'optional')::boolean,nullif(e->>'optionalNote',''),nullif(e->>'instructions',''),ei,coalesce(e->'setTypes','[]'::jsonb),coalesce(e->'setTargets','[]'::jsonb)) returning id into new_ex;
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
 select jsonb_build_object('intro',coalesce(p.description,''),'week_instructions',coalesce(v.week_notes->>p_week::text,''),'instructions',d.instructions,'id',d.id,'week',p_week,'day',d.day,'title',d.title,'total_weeks',p.weeks,'day_blocks',coalesce((
  select jsonb_agg(jsonb_build_object('id',b.id,'label',b.label,'rest_note',b.rest_note,'position',b.position,'block_exercises',coalesce((
   select jsonb_agg(jsonb_build_object('set_targets',e.set_targets,'id',e.id,'exercise_id',e.exercise_id,'exercise_name',e.exercise_name,'set_types',(select jsonb_agg(coalesce(e.set_types->>i,'working') order by i) from generate_series(0,coalesce(o.sets,e.sets)-1) i),'sets',coalesce(o.sets,e.sets),'rep_range',coalesce(o.rep_range,e.rep_range),'target_weight_lbs',coalesce(o.target_weight_lbs,e.target_weight_lbs),'optional',e.optional,'optional_note',e.optional_note,'directions',e.directions,'position',e.position,'exercises',jsonb_build_object('youtube_url',x.youtube_url,'cue',x.cue,'thumb_path',x.thumb_path)) order by e.position,e.id)
   from block_exercises e join exercises x on x.id=e.exercise_id left join program_week_overrides o on o.block_exercise_id=e.id and o.week=p_week where e.block_id=b.id
  ),'[]'::jsonb)) order by b.position,b.id) from day_blocks b where b.day_id=d.id
 ),'[]'::jsonb)) from program_days d join program_versions v on v.id=d.version_id join programs p on p.id=v.program_id where d.id=p_day;
$$;

create or replace function public.bbn_begin_workout(p_day_id uuid,p_assignment_id uuid,p_week integer) returns jsonb
language plpgsql security definer set search_path=public as $$
declare a program_assignments;r workout_sessions;snap jsonb;
begin
 if auth.uid() is null or not public.is_active_client() or public.get_role()<>'client' then raise exception 'Active client access required';end if;
 -- Serialize session creation for this client/day; legacy duplicates remain untouched.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||p_day_id::text||':'||p_week::text,0));
 select * into a from program_assignments where id=p_assignment_id and client_id=auth.uid();
 if not found then raise exception 'Assignment not found';end if;
 if not exists(select 1 from program_days where id=p_day_id and version_id=a.version_id) then raise exception 'Workout does not belong to this assignment';end if;
 if exists(select 1 from program_versions v join program_days d on d.version_id=v.id where d.id=p_day_id and v.explicit_weeks and d.week<>p_week) then raise exception 'Workout belongs to a different week';end if;
 select * into r from workout_sessions where client_id=auth.uid() and day_id=p_day_id and assignment_id=a.id and program_week=p_week order by started_at desc,id desc limit 1;
 if not found then
  if not a.active then raise exception 'This program has changed. Open your current workouts.';end if;
  if p_week is null or p_week<1 or p_week>(select p.weeks from programs p join program_versions v on v.program_id=p.id where v.id=a.version_id) then raise exception 'Invalid program week';end if;
  snap=bbn_workout_snapshot(p_day_id,p_week);
  insert into workout_sessions(client_id,assignment_id,day_id,program_week,prescription_snapshot) values(auth.uid(),a.id,p_day_id,p_week,snap) returning * into r;
 end if;
 return jsonb_build_object('id',r.id,'day',coalesce(r.prescription_snapshot,bbn_workout_snapshot(p_day_id,p_week)),'week',r.program_week,'started_at',r.started_at,'finished_at',r.finished_at,'entries',coalesce((select jsonb_agg(jsonb_build_object('block_exercise_id',block_exercise_id,'exercise_id',exercise_id,'set_index',set_index,'reps',reps,'weight_lbs',weight_lbs)) from set_entries where session_id=r.id),'[]'::jsonb));
end $$;

create or replace function public.bbn_client_workout(p_week integer default null,p_day integer default 1) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare a program_assignments;p programs;v_week integer;v_day program_days;s workout_sessions;related uuid[];progress jsonb;days jsonb;total integer;explicit boolean;
begin
 if auth.uid() is null or not public.is_active_client() or public.get_role()<>'client' then raise exception 'Active client access required';end if;
 select * into a from program_assignments where client_id=auth.uid() and active;
 if not found then return null;end if;
 select pr.* into p from programs pr join program_versions v on v.program_id=pr.id where v.id=a.version_id;
 select explicit_weeks into explicit from program_versions where id=a.version_id;
 with recursive lineage as (
  select id,source_program_id,array[id] visited from programs where id=p.id
  union all select pr.id,pr.source_program_id,l.visited||pr.id from programs pr join lineage l on pr.id=l.source_program_id where not pr.id=any(l.visited)
 ) select array_agg(pa.id) into related from program_assignments pa join program_versions pv on pv.id=pa.version_id
 where pa.client_id=auth.uid() and pa.start_date=a.start_date and pa.created_at<=a.created_at and pv.program_id in(select id from lineage);
 select greatest(p.weeks,coalesce(max(program_week),1)) into total from workout_sessions where client_id=auth.uid() and assignment_id=any(related);
 v_week=coalesce(p_week,least(p.weeks,greatest(1,((current_date-a.start_date)/7)+1)));
 if v_week not between 1 and total or p_day not between 1 and 14 then raise exception 'Choose a week and day in this plan';end if;
 select * into v_day from program_days where version_id=a.version_id and week=case when explicit then v_week else 1 end and day=p_day order by position,id limit 1;
 select * into s from workout_sessions where client_id=auth.uid() and assignment_id=any(related) and program_week=v_week
 and (prescription_snapshot->>'day')::integer=p_day order by started_at desc,id desc limit 1;
 if v_day.id is null and s.id is null then
  select * into v_day from program_days where version_id=a.version_id and week=case when explicit then v_week else 1 end order by day,position,id limit 1;
  if v_day.id is null then raise exception 'Workout day not found';end if;
  p_day=v_day.day;
  select * into s from workout_sessions where client_id=auth.uid() and assignment_id=any(related) and program_week=v_week and (prescription_snapshot->>'day')::integer=p_day order by started_at desc,id desc limit 1;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('week',program_week,'day',(prescription_snapshot->>'day')::integer,'completed',finished_at is not null) order by started_at desc,id desc),'[]'::jsonb) into progress
 from workout_sessions where client_id=auth.uid() and assignment_id=any(related) and program_week is not null and prescription_snapshot is not null;
 select jsonb_agg(jsonb_build_object('day',number,'title',title) order by number) into days from (
  select distinct on (number) number,title from (
   select d.day number,d.title,0 priority from program_days d where d.version_id=a.version_id and d.week=case when explicit then v_week else 1 end
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
create function public.bbn_import_workout(p_source_id uuid,p_revision integer,p_checksum text,p_document jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare existing workout_imports;draft program_drafts;prog uuid;ver uuid;
begin
 if not public.is_admin() then raise exception 'Coach access required';end if;
 if p_source_id is null or p_revision is null or p_revision<1 or p_checksum is null or p_checksum !~ '^[a-f0-9]{64}$' then raise exception 'Invalid import identity';end if;
 perform bbn_validate_plan(p_document);
 perform pg_advisory_xact_lock(hashtextextended(p_source_id::text||':'||p_revision::text,0));
 select * into existing from workout_imports where source_id=p_source_id and revision=p_revision;
 if found then
  if existing.checksum<>p_checksum then raise exception 'This plan revision was imported with different data. Export a new revision from the skill.';end if;
  select * into draft from program_drafts where id=existing.draft_id;
  if draft.state='applied' then return jsonb_build_object('versionId',draft.result->>'versionId','reused',true,'state','applied');end if;
  if draft.state='editing' then return jsonb_build_object('versionId',existing.version_id,'reused',true,'state','editing');end if;
  ver=existing.version_id;
 else
  insert into programs(name,description,weeks,days_per_week,is_template) values(p_document->>'name','',(p_document->>'weeks')::integer,1,false) returning id into prog;
  insert into program_versions(program_id,version) values(prog,1) returning id into ver;
  insert into program_days(version_id,week,day,title,position) values(ver,1,1,'Imported workout',1);
 end if;
 insert into program_drafts(source_version_id,document) values(ver,p_document) returning * into draft;
 insert into workout_imports(source_id,revision,checksum,version_id,draft_id) values(p_source_id,p_revision,p_checksum,ver,draft.id)
 on conflict(source_id,revision) do update set draft_id=excluded.draft_id;
 return jsonb_build_object('versionId',ver,'reused',false,'state','editing');
end $$;
revoke all on function bbn_import_workout(uuid,integer,text,jsonb) from public,anon;
grant execute on function bbn_import_workout(uuid,integer,text,jsonb) to authenticated;
commit;
