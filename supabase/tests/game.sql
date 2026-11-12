-- Run only on a disposable local/test database; all test data is rolled back.
begin;
insert into auth.users(id, is_anonymous) values
  ('00000000-0000-4000-8000-000000000001', true),
  ('00000000-0000-4000-8000-000000000002', false),
  ('00000000-0000-4000-8000-000000000003', true);

do $$
declare
  g uuid := '00000000-0000-4000-8000-000000000001';
  a uuid := '00000000-0000-4000-8000-000000000002';
  other_guest uuid := '00000000-0000-4000-8000-000000000003';
  quizzes jsonb := '[
    {"id":"mission-1","question":"Q1","options":["A","B","C","D"],"correctIndex":1},
    {"id":"mission-2","question":"Q2","options":["A","B","C","D"],"correctIndex":2},
    {"id":"mission-3","question":"Q3","options":["A","B","C","D"],"correctIndex":0}
  ]';
  result jsonb; original_id text; total integer; n integer;
begin
  perform public.game_ensure_player(g, 'Khách');
  perform public.game_ensure_player(a, 'Tài khoản');
  perform public.game_ensure_player(other_guest, null);
  result := public.game_record_scan(g, 'palace', 'Dinh Độc Lập', quizzes);
  original_id := result->>'id';
  result := public.game_record_scan(g, 'palace', 'New name', quizzes);
  if result->>'id' <> original_id then raise exception 'Duplicate scan created a new checkin'; end if;
  if result->>'place_name' <> 'Dinh Độc Lập' then raise exception 'Rescan overwrote snapshot'; end if;
  if (select total_points from public.users where id=g) <> 0 then raise exception 'Scan gave XP'; end if;
  result := public.game_record_answer(g, 'palace', 'mission-1', 0);
  if (result->>'correct')::boolean or (result->>'pointsAwarded')::integer <> 0 then raise exception 'Wrong answer awarded XP'; end if;
  if result->'checkin'->'progress'->'mission-1'->>'attempted' <> 'true' then raise exception 'Wrong answer did not advance'; end if;
  perform public.game_record_answer(g, 'palace', 'mission-2', 0);
  result := public.game_record_answer(g, 'palace', 'mission-3', 1);
  if result->'checkin'->>'status' <> 'completed' or (result->>'totalPoints')::integer <> 100 then
    raise exception 'All-wrong completion must give exactly 100 XP';
  end if;
  result := public.game_record_answer(g, 'palace', 'mission-1', 1);
  if (result->>'pointsAwarded')::integer <> 150 then raise exception 'Replay first correct did not earn 150'; end if;
  result := public.game_record_answer(g, 'palace', 'mission-1', 1);
  if (result->>'pointsAwarded')::integer <> 0 then raise exception 'Repeated correct duplicated XP'; end if;
  result := public.game_record_answer(g, 'palace', 'mission-1', 0);
  if (result->>'totalPoints')::integer <> 250 then raise exception 'Wrong replay erased earned XP'; end if;
  begin
    perform public.game_record_answer(g, 'palace', 'mission-4', 0);
    raise exception 'Unknown mission was accepted';
  exception when raise_exception then
    if sqlerrm <> 'MISSION_NOT_FOUND' then raise; end if;
  end;
  begin
    perform public.game_record_answer(g, 'palace', 'mission-2', 4);
    raise exception 'Invalid option accepted';
  exception when raise_exception then
    if sqlerrm <> 'INVALID_CHOICE' then raise; end if;
  end;
  begin
    perform public.game_record_scan(g, 'bad', 'Invalid quiz', '[{"id":"q"}]');
    raise exception 'Invalid quiz accepted';
  exception when raise_exception then
    if sqlerrm <> 'INVALID_QUIZZES' then raise; end if;
  end;
  begin
    perform public.game_set_photo(g, 'palace', a::text || '/photo.jpg');
    raise exception 'Foreign photo path accepted';
  exception when raise_exception then
    if sqlerrm <> 'INVALID_PHOTO_PATH' then raise; end if;
  end;
  perform public.game_set_photo(g, 'palace', g::text || '/photo.jpg');
  perform public.game_record_scan(a, 'palace', 'Dinh Độc Lập', quizzes);
  perform public.game_record_answer(a, 'palace', 'mission-1', 1);
  perform public.game_record_answer(a, 'palace', 'mission-2', 2);
  -- Overlap: guest has q1 + completion; account has q1 + q2. Union = 400.
  total := public.game_merge_guest(g, a);
  if total <> 400 then raise exception 'Merge must deduplicate q1 and completion: %', total; end if;
  if public.game_merge_guest(g, a) <> 400 then raise exception 'Repeated merge duplicated XP'; end if;
  select count(*) into n from public.checkins where user_id=a and place_id='palace';
  if n <> 1 then raise exception 'Merge duplicated destination'; end if;
  if (select photo_path from public.checkins where user_id=a and place_id='palace') is null then
    raise exception 'Merge lost optional photo'; end if;
  if (select count(*) from public.checkins where user_id=g) <> 0 then raise exception 'Guest retained transferred rows'; end if;
  begin
    perform public.game_record_answer(g, 'palace', 'mission-2', 2);
    raise exception 'Merged guest reused old session';
  exception when raise_exception then
    if sqlerrm <> 'PLAYER_MERGED' then raise; end if;
  end;
  begin
    perform public.game_merge_guest(other_guest, g);
    raise exception 'Merged target accepted';
  exception when raise_exception then
    if sqlerrm <> 'PLAYER_MERGED' then raise; end if;
  end;
  begin
    perform public.game_merge_guest(other_guest, other_guest);
    raise exception 'Self merge accepted';
  exception when raise_exception then
    if sqlerrm <> 'INVALID_MERGE' then raise; end if;
  end;
  -- A second place moves from guest to existing account without losing history.
  perform public.game_record_scan(other_guest, 'hcmus', 'KHTN', quizzes);
  perform public.game_record_answer(other_guest, 'hcmus', 'mission-3', 0);
  total := public.game_merge_guest(other_guest, a);
  if total <> 550 then raise exception 'Merge lost new place progress: %', total; end if;
  result := public.game_record_answer(a, 'palace', 'mission-3', 0);
  if (result->>'totalPoints')::integer <> 700 then raise exception 'Cannot earn previously missed question after merge'; end if;
  if (result->>'pointsAwarded')::integer <> 150 then raise exception 'Completion bonus was awarded again'; end if;
  raise notice 'Business assertions passed';
end $$;

set local role service_role;
do $$ begin
  perform public.game_ensure_player('00000000-0000-4000-8000-000000000002', null);
  if public.game_merge_guest('00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002') <> 700 then
    raise exception 'Service role cannot use game functions';
  end if;
end $$;
reset role;

-- Ownership and privileges, using actual PostgreSQL roles and RLS.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
do $$ declare n integer; begin
  select count(id) into n from public.users;
  if n <> 1 then raise exception 'RLS leaked another player'; end if;
  select count(id) into n from public.checkins;
  if n <> 2 then raise exception 'RLS exposed wrong checkins'; end if;
  begin perform quizzes from public.checkins; raise exception 'Answer keys exposed';
  exception when insufficient_privilege then null; end;
  begin update public.users set total_points=999999; raise exception 'Direct score update permitted';
  exception when insufficient_privilege then null; end;
  begin perform public.game_record_answer('00000000-0000-4000-8000-000000000002', 'palace', 'mission-1', 1);
    raise exception 'Browser called service-only function';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform id from public.users; raise exception 'Signed-out role read users';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
