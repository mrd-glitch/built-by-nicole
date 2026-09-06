-- Builder v3: chronological prescriptions, unique positions, and transactional
-- block/exercise mutations (one round-trip, serialized per day via row lock).

alter table public.block_exercises add column if not exists created_at timestamptz not null default now();
create index if not exists block_exercises_exercise_created_idx on public.block_exercises (exercise_id, created_at desc);

-- Positions must be unique among siblings; the RPCs below allocate them under a lock.
create unique index if not exists day_blocks_day_position_key on public.day_blocks (day_id, position);
create unique index if not exists block_exercises_block_position_key on public.block_exercises (block_id, position);

-- Add an exercise to a day as its own block, prefilled from Nicole's most recent prescription.
create or replace function public.bbn_add_exercise_to_day(p_day_id uuid, p_exercise_id uuid, p_exercise_name text)
returns table (block_id uuid, be_id uuid, out_position int, sets int, rep_range text, target_weight_lbs numeric)
language plpgsql security invoker set search_path = public as $$
declare
  v_pos int; v_block uuid; v_be uuid; v_sets int; v_reps text; v_w numeric;
begin
  perform 1 from program_days where id = p_day_id for update;
  if not found then raise exception 'Day not found'; end if;
  select coalesce(max(b.position), 0) + 1 into v_pos from day_blocks b where b.day_id = p_day_id;
  select be.sets, be.rep_range, be.target_weight_lbs into v_sets, v_reps, v_w
    from block_exercises be where be.exercise_id = p_exercise_id
    order by be.created_at desc, be.id desc limit 1;
  insert into day_blocks (day_id, label, position) values (p_day_id, v_pos || ')', v_pos) returning id into v_block;
  insert into block_exercises (block_id, exercise_id, exercise_name, position, sets, rep_range, target_weight_lbs)
    values (v_block, p_exercise_id, p_exercise_name, 1, coalesce(v_sets, 3), coalesce(v_reps, '8-10'), v_w)
    returning id into v_be;
  return query select v_block, v_be, v_pos, coalesce(v_sets, 3), coalesce(v_reps, '8-10'), v_w;
end $$;

-- Superset: move an exercise into another block of the same day; drop the source block if it empties.
create or replace function public.bbn_move_exercise_to_block(p_be_id uuid, p_target_block uuid)
returns int
language plpgsql security invoker set search_path = public as $$
declare
  v_src uuid; v_src_day uuid; v_day uuid; v_pos int;
begin
  select b.day_id into v_day from day_blocks b where b.id = p_target_block;
  if v_day is null then raise exception 'Target block not found'; end if;
  -- Lock the day first, THEN read the exercise's current block, so concurrent
  -- moves/splits of the same exercise serialize on a fresh view.
  perform 1 from program_days where id = v_day for update;
  select be.block_id, b.day_id into v_src, v_src_day
    from block_exercises be join day_blocks b on b.id = be.block_id where be.id = p_be_id;
  if v_src is null then raise exception 'Exercise not found'; end if;
  if v_src_day <> v_day then raise exception 'Cannot move an exercise to a different day'; end if;
  if v_src = p_target_block then return (select be.position from block_exercises be where be.id = p_be_id); end if;
  select coalesce(max(be.position), 0) + 1 into v_pos from block_exercises be where be.block_id = p_target_block;
  update block_exercises set block_id = p_target_block, position = v_pos where id = p_be_id;
  delete from day_blocks b where b.id = v_src and not exists (select 1 from block_exercises be where be.block_id = v_src);
  return v_pos;
end $$;

-- Split an exercise out of a superset into its own new block at the end of the day.
create or replace function public.bbn_split_exercise_out(p_be_id uuid)
returns table (block_id uuid, out_position int)
language plpgsql security invoker set search_path = public as $$
declare
  v_src uuid; v_day uuid; v_pos int; v_block uuid;
begin
  select b.day_id into v_day
    from block_exercises be join day_blocks b on b.id = be.block_id where be.id = p_be_id;
  if v_day is null then raise exception 'Exercise not found'; end if;
  perform 1 from program_days where id = v_day for update;
  -- Re-read the source block under the lock (a concurrent split may have moved it).
  select be.block_id into v_src from block_exercises be where be.id = p_be_id;
  if (select count(*) from block_exercises be where be.block_id = v_src) = 1 then
    return query select v_src, (select b.position from day_blocks b where b.id = v_src); -- already alone; nothing to split
    return;
  end if;
  select coalesce(max(b.position), 0) + 1 into v_pos from day_blocks b where b.day_id = v_day;
  insert into day_blocks (day_id, label, position) values (v_day, v_pos || ')', v_pos) returning id into v_block;
  update block_exercises set block_id = v_block, position = 1 where id = p_be_id;
  if not found then raise exception 'Exercise disappeared during split'; end if; -- rolls back the new block
  delete from day_blocks b where b.id = v_src and not exists (select 1 from block_exercises be where be.block_id = v_src);
  return query select v_block, v_pos;
end $$;

-- Remove an exercise; its block goes too if it empties. Same per-day lock as the other mutations.
create or replace function public.bbn_remove_exercise(p_be_id uuid)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_src uuid; v_day uuid;
begin
  select b.day_id into v_day
    from block_exercises be join day_blocks b on b.id = be.block_id where be.id = p_be_id;
  if v_day is null then return; end if; -- already gone
  perform 1 from program_days where id = v_day for update;
  select be.block_id into v_src from block_exercises be where be.id = p_be_id;
  delete from block_exercises where id = p_be_id;
  delete from day_blocks b where b.id = v_src and not exists (select 1 from block_exercises be where be.block_id = v_src);
end $$;

grant execute on function public.bbn_add_exercise_to_day(uuid, uuid, text) to authenticated;
grant execute on function public.bbn_move_exercise_to_block(uuid, uuid) to authenticated;
grant execute on function public.bbn_split_exercise_out(uuid) to authenticated;
grant execute on function public.bbn_remove_exercise(uuid) to authenticated;
