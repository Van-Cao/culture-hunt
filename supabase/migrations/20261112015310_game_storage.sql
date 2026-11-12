-- Two application tables. Supabase manages auth.users and storage separately.
begin;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'Nhà thám hiểm'
    check (char_length(btrim(nickname)) between 1 and 40),
  total_points integer not null default 0 check (total_points >= 0),
  merged_into uuid references public.users(id),
  created_at timestamptz not null default now(),
  check (merged_into is null or merged_into <> id)
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  place_id text not null check (place_id ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
  place_name text not null check (char_length(place_name) between 1 and 200),
  status text not null default 'checked_in' check (status in ('checked_in', 'completed')),
  -- Snapshot is supplied by the validated vision backend, never by a player.
  -- It contains answer keys and must never be selected by a browser.
  quizzes jsonb not null check (jsonb_typeof(quizzes) = 'array'),
  progress jsonb not null default '{}'::jsonb check (jsonb_typeof(progress) = 'object'),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, place_id),
  check ((status = 'completed') = (completed_at is not null))
);
create index checkins_user_history_idx on public.checkins(user_id, created_at desc);
create index users_merged_into_idx on public.users(merged_into) where merged_into is not null;

alter table public.users enable row level security;
alter table public.checkins enable row level security;
revoke all on public.users, public.checkins from anon, authenticated;
grant select (id, nickname, total_points, created_at) on public.users to authenticated;
grant select (id, user_id, place_id, place_name, status, progress, photo_path,
  created_at, updated_at, completed_at) on public.checkins to authenticated;
grant all on public.users, public.checkins to service_role;

create policy users_read_own on public.users for select to authenticated
  using (id = (select auth.uid()));
create policy checkins_read_own on public.checkins for select to authenticated
  using (user_id = (select auth.uid()));

-- Every mutating function is SECURITY INVOKER and executable by service_role
-- only. The Next.js backend verifies the user's Supabase token before calling.
create function public.game_is_completed(p_quizzes jsonb, p_progress jsonb)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select jsonb_array_length(p_quizzes) > 0 and not exists (
    select 1 from jsonb_array_elements(p_quizzes) q
    where coalesce((p_progress -> (q->>'id') ->> 'attempted')::boolean, false) = false
  );
$$;

create function public.game_refresh_total(p_user_id uuid)
returns integer language plpgsql security invoker set search_path = '' as $$
declare v_total integer;
begin
  select coalesce(sum(
    150 * (select count(*) from jsonb_each(c.progress) entry
           where entry.value->>'correct_at' is not null)
    + case when c.status = 'completed' then 100 else 0 end
  ), 0)::integer into v_total from public.checkins c where c.user_id = p_user_id;
  update public.users set total_points = v_total where id = p_user_id;
  return v_total;
end;
$$;

create function public.game_ensure_player(p_user_id uuid, p_nickname text default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_user public.users;
begin
  if p_nickname is not null and char_length(btrim(p_nickname)) not between 1 and 40 then
    raise exception 'INVALID_NICKNAME';
  end if;
  insert into public.users(id, nickname)
    values (p_user_id, coalesce(btrim(p_nickname), 'Nhà thám hiểm'))
    on conflict (id) do nothing;
  select * into v_user from public.users where id = p_user_id for update;
  if v_user.merged_into is not null then raise exception 'PLAYER_MERGED'; end if;
  if p_nickname is not null then
    update public.users set nickname = btrim(p_nickname) where id = p_user_id returning * into v_user;
  end if;
  return to_jsonb(v_user);
end;
$$;

create function public.game_record_scan(
  p_user_id uuid, p_place_id text, p_place_name text, p_quizzes jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_checkin public.checkins; v_quiz jsonb; v_user public.users;
begin
  select * into v_user from public.users where id = p_user_id for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  if v_user.merged_into is not null then raise exception 'PLAYER_MERGED'; end if;
  if jsonb_typeof(p_quizzes) is distinct from 'array' then raise exception 'INVALID_QUIZZES'; end if;
  if jsonb_array_length(p_quizzes) not between 1 and 50 then raise exception 'INVALID_QUIZZES'; end if;
  for v_quiz in select value from jsonb_array_elements(p_quizzes) loop
    if jsonb_typeof(v_quiz->'id') is distinct from 'string'
      or not (v_quiz->>'id' ~ '^[a-z0-9][a-z0-9_-]{0,79}$')
      or jsonb_typeof(v_quiz->'question') is distinct from 'string'
      or char_length(v_quiz->>'question') not between 1 and 2000
      or jsonb_typeof(v_quiz->'options') is distinct from 'array'
      or jsonb_typeof(v_quiz->'correctIndex') is distinct from 'number'
      or not (v_quiz->>'correctIndex' ~ '^[0-3]$') then raise exception 'INVALID_QUIZZES'; end if;
    if jsonb_array_length(v_quiz->'options') <> 4 or exists (
      select 1 from jsonb_array_elements(v_quiz->'options') option
      where jsonb_typeof(option) <> 'string' or char_length(option #>> '{}') not between 1 and 1000
    ) then raise exception 'INVALID_QUIZZES'; end if;
  end loop;
  if (select count(distinct q->>'id') from jsonb_array_elements(p_quizzes) q)
     <> jsonb_array_length(p_quizzes) then raise exception 'INVALID_QUIZZES'; end if;
  insert into public.checkins(user_id, place_id, place_name, quizzes)
    values (p_user_id, p_place_id, p_place_name, p_quizzes)
    on conflict (user_id, place_id) do nothing;
  select * into v_checkin from public.checkins where user_id = p_user_id and place_id = p_place_id;
  return to_jsonb(v_checkin);
end;
$$;

create function public.game_record_answer(
  p_user_id uuid, p_place_id text, p_mission_id text, p_choice integer
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_user public.users; v_checkin public.checkins; v_quiz jsonb; v_previous jsonb;
  v_progress jsonb; v_correct boolean; v_complete boolean; v_total integer;
begin
  select * into v_user from public.users where id = p_user_id for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  if v_user.merged_into is not null then raise exception 'PLAYER_MERGED'; end if;
  if p_choice is null or p_choice not between 0 and 3 then raise exception 'INVALID_CHOICE'; end if;
  select * into v_checkin from public.checkins where user_id = p_user_id and place_id = p_place_id;
  if not found then raise exception 'CHECKIN_NOT_FOUND'; end if;
  select q into v_quiz from jsonb_array_elements(v_checkin.quizzes) q where q->>'id' = p_mission_id;
  if v_quiz is null then raise exception 'MISSION_NOT_FOUND'; end if;
  v_correct := (v_quiz->>'correctIndex')::integer = p_choice;
  v_previous := coalesce(v_checkin.progress->p_mission_id, '{}'::jsonb);
  v_progress := v_checkin.progress || jsonb_build_object(p_mission_id, jsonb_build_object(
    'attempted', true,
    'attempts', coalesce((v_previous->>'attempts')::integer, 0) + 1,
    'last_choice', p_choice,
    'first_attempted_at', coalesce((v_previous->>'first_attempted_at')::timestamptz, now()),
    'last_answered_at', now(),
    'correct_at', coalesce((v_previous->>'correct_at')::timestamptz,
      case when v_correct then now() else null end)
  ));
  v_complete := public.game_is_completed(v_checkin.quizzes, v_progress);
  update public.checkins set progress = v_progress, updated_at = now(),
    status = case when v_complete then 'completed' else 'checked_in' end,
    completed_at = case when v_complete then coalesce(completed_at, now()) else null end
    where id = v_checkin.id returning * into v_checkin;
  v_total := public.game_refresh_total(p_user_id);
  return jsonb_build_object('correct', v_correct, 'pointsAwarded', v_total - v_user.total_points,
    'totalPoints', v_total, 'checkin', to_jsonb(v_checkin));
end;
$$;

create function public.game_set_photo(p_user_id uuid, p_place_id text, p_photo_path text)
returns text language plpgsql security invoker set search_path = '' as $$
declare v_user public.users; v_previous text;
begin
  select * into v_user from public.users where id = p_user_id for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  if v_user.merged_into is not null then raise exception 'PLAYER_MERGED'; end if;
  if p_photo_path is null or not starts_with(p_photo_path, p_user_id::text || '/') then
    raise exception 'INVALID_PHOTO_PATH';
  end if;
  select photo_path into v_previous from public.checkins where user_id = p_user_id and place_id = p_place_id;
  if not found then raise exception 'CHECKIN_NOT_FOUND'; end if;
  update public.checkins set photo_path = p_photo_path, updated_at = now()
    where user_id = p_user_id and place_id = p_place_id;
  return v_previous;
end;
$$;

create function public.game_merge_guest(p_guest_id uuid, p_target_id uuid)
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  v_guest public.users; v_target public.users; v_source public.checkins; v_dest public.checkins;
  v_quizzes jsonb; v_progress jsonb; v_entry record; v_a jsonb; v_b jsonb;
  v_first_correct timestamptz; v_complete boolean;
begin
  if p_guest_id = p_target_id then raise exception 'INVALID_MERGE'; end if;
  -- Every write locks the player first. A merge locks both in UUID order.
  perform id from public.users where id in (p_guest_id, p_target_id) order by id for update;
  select * into v_guest from public.users where id = p_guest_id;
  select * into v_target from public.users where id = p_target_id;
  if v_guest.id is null or v_target.id is null then raise exception 'PLAYER_NOT_FOUND'; end if;
  if v_target.merged_into is not null then raise exception 'PLAYER_MERGED'; end if;
  -- The server verifies BOTH tokens with Auth.getUser and checks guest/account
  -- flags before this service-only call. No direct access to auth.users needed.
  if v_guest.merged_into = p_target_id then return v_target.total_points; end if;
  if v_guest.merged_into is not null then raise exception 'PLAYER_MERGED'; end if;

  for v_source in select * from public.checkins where user_id = p_guest_id loop
    select * into v_dest from public.checkins where user_id = p_target_id and place_id = v_source.place_id;
    if not found then
      update public.checkins set user_id = p_target_id, updated_at = now() where id = v_source.id;
    else
      -- Stable mission IDs are the reward identity, including across locales.
      v_quizzes := v_dest.quizzes || coalesce((select jsonb_agg(q) from jsonb_array_elements(v_source.quizzes) q
        where not exists (select 1 from jsonb_array_elements(v_dest.quizzes) d where d->>'id' = q->>'id')), '[]'::jsonb);
      v_progress := v_dest.progress;
      for v_entry in select key, value from jsonb_each(v_source.progress) loop
        v_a := v_progress->v_entry.key;
        v_b := v_entry.value;
        if v_a is null then v_progress := v_progress || jsonb_build_object(v_entry.key, v_b);
        else
          v_first_correct := least((v_a->>'correct_at')::timestamptz, (v_b->>'correct_at')::timestamptz);
          v_progress := v_progress || jsonb_build_object(v_entry.key, jsonb_build_object(
            'attempted', true,
            'attempts', (v_a->>'attempts')::integer + (v_b->>'attempts')::integer,
            'last_choice', case when (v_a->>'last_answered_at')::timestamptz >= (v_b->>'last_answered_at')::timestamptz
              then (v_a->>'last_choice')::integer else (v_b->>'last_choice')::integer end,
            'first_attempted_at', least((v_a->>'first_attempted_at')::timestamptz, (v_b->>'first_attempted_at')::timestamptz),
            'last_answered_at', greatest((v_a->>'last_answered_at')::timestamptz, (v_b->>'last_answered_at')::timestamptz),
            'correct_at', v_first_correct
          ));
        end if;
      end loop;
      v_complete := public.game_is_completed(v_quizzes, v_progress);
      update public.checkins set quizzes = v_quizzes, progress = v_progress,
        created_at = least(v_dest.created_at, v_source.created_at), updated_at = now(),
        photo_path = coalesce(v_dest.photo_path, v_source.photo_path),
        status = case when v_complete then 'completed' else 'checked_in' end,
        completed_at = case when v_complete then coalesce(least(v_dest.completed_at, v_source.completed_at), now()) else null end
        where id = v_dest.id;
      delete from public.checkins where id = v_source.id;
    end if;
  end loop;
  update public.users set merged_into = p_target_id, total_points = 0 where id = p_guest_id;
  return public.game_refresh_total(p_target_id);
end;
$$;

revoke all on function public.game_is_completed(jsonb,jsonb), public.game_refresh_total(uuid),
  public.game_ensure_player(uuid,text), public.game_record_scan(uuid,text,text,jsonb),
  public.game_record_answer(uuid,text,text,integer), public.game_set_photo(uuid,text,text),
  public.game_merge_guest(uuid,uuid) from public, anon, authenticated;
grant execute on function public.game_is_completed(jsonb,jsonb), public.game_refresh_total(uuid),
  public.game_ensure_player(uuid,text), public.game_record_scan(uuid,text,text,jsonb),
  public.game_record_answer(uuid,text,text,integer), public.game_set_photo(uuid,text,text),
  public.game_merge_guest(uuid,uuid) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('checkin-photos', 'checkin-photos', false, 4194304, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
-- No public storage policies: only the verified backend uploads/signs photos.
do $$ begin
  if exists (select 1 from storage.buckets where id = 'checkin-photos' and public) then
    raise exception 'checkin-photos must be a private bucket';
  end if;
end $$;

commit;
